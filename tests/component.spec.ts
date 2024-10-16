import { describe, it, expect, vi } from 'vitest';
import { mountComponent } from '../src/component';
import { createContext } from '../src/context';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
global.window = window;
global.document = window.document;
global.HTMLTemplateElement = window.HTMLTemplateElement;
global.Node = window.Node;
global.Text = window.Text;
global.Element = window.Element;
global.DocumentFragment = window.DocumentFragment;
global.SVGElement = window.SVGElement;
global.DOMParser = window.DOMParser;

describe('mountComponent', () => {
    it('should mount component with correct props', async () => {
        const mockComponent = {
            template: '<div>{{ message }}</div>',
            props: {
                message: { default: 'Hello' }
            },
            data() {
                return {
                counter: 0
                };
            },
            methods: {
                increment() {
                    this.counter++;
                }
            }
        };

        const ctx = createContext();
        ctx.components = {
            'mock-component': mockComponent
        };

        const el = document.createElement('mock-component');
        el.setAttribute(':message', 'message');
        el.setAttribute('ref', 'mock-component');
        ctx.scope = { message: 'Test Message' };
        await mountComponent(ctx, el, 'mock-component', document.body);

        const mountedComponent = ctx.scope.$refs['mock-component'];
        expect(mountedComponent).toBeDefined();
        expect(mountedComponent.$props.message).toBe('Test Message');
    });

    it('should handle slots', async () => {
        const mockComponent = {
            template: '<div><slot></slot></div>',
        };

        const ctx = createContext();
        ctx.components = {
            'mock-component': mockComponent
        };

        const el = document.createElement('mock-component');
        el.setAttribute('ref', 'mock-component');
        el.innerHTML = '<span>Default Slot Content</span>';

        await mountComponent(ctx, el, 'mock-component', document.body);

        const mountedComponent = ctx.scope.$refs['mock-component'];
        expect(mountedComponent).toBeDefined();
        expect(mountedComponent.slots.default.html).toBe('<span>Default Slot Content</span>');
    });

    it('should bind event listeners correctly', async () => {
        const mockComponent = {
            template: '<button @click="increment">{{ counter }}</button>',
            data() {
                return {
                counter: 0
                };
            },
            methods: {
                increment() {
                this.counter++;
                }
            }
        };

        const ctx = createContext();
        ctx.components = {
            'mock-component': mockComponent
        };

        const el = document.createElement('mock-component');
        el.setAttribute('ref', 'mock-component');
        await mountComponent(ctx, el, 'mock-component', document.body);

        const mountedComponent = ctx.scope.$refs['mock-component'];
        const button = mountedComponent.$el;
        
        button.click();

        expect(mountedComponent.counter).toBe(1);
    });
});
