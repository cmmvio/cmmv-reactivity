import { describe, it, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { createApp } from '../src/app';
import { Block } from '../src/block';
import { nextTick } from '../src/scheduler';

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
global.window = window;
global.document = window.document;
global.HTMLTemplateElement = window.HTMLTemplateElement;
global.Node = window.Node;
global.Text = window.Text;
global.Element = window.Element;
global.DocumentFragment = window.DocumentFragment;
global.DOMParser = window.DOMParser;

describe('createApp', () => {
    it('should create an app instance with default context', () => {
        const app = createApp();
        expect(app).toBeTruthy();
    });

    it('should initialize context with initial data', () => {
        const initialData = { data: () => ({ message: 'Hello' }) };
        const app = createApp(initialData);

        expect(app).toBeTruthy();
        expect(app.ctx).toBeDefined();
        expect(app.ctx.scope.message).toEqual('Hello');
    });

    it('should mount app to an existing DOM element', async () => {
        document.body.innerHTML = `<div id="app" scope><p>{{ message }}</p></div>`;
        const initialData = { data: () => ({ message: 'Hello' }) };
        const app = createApp(initialData);

        await app.mount('#app');
        const element = document.querySelector('#app p');
        expect(element?.textContent).toBe('Hello');
    });

    it('should handle mounting multiple scoped roots', async () => {
        document.body.innerHTML = `
            <div id="app1" scope><p>{{ message1 }}</p></div>
            <div id="app2" scope><p>{{ message2 }}</p></div>
        `;
        const initialData = { 
            data: () => ({ message1: 'Hello', message2: 'World' }) 
        };
        const app = createApp(initialData);

        await app.mount();
        const el1 = document.querySelector('#app1 p');
        const el2 = document.querySelector('#app2 p');

        expect(el1?.textContent).toBe('Hello');
        expect(el2?.textContent).toBe('World');
    });

    it('should call lifecycle hooks (created and mounted)', async () => {
        const createdSpy = vi.fn();
        const mountedSpy = vi.fn();

        const initialData = { 
            created: createdSpy, 
            mounted: mountedSpy, 
            data: () => ({ message: 'test' }) 
        };

        const app = createApp(initialData);
        expect(createdSpy).toHaveBeenCalled();

        document.body.innerHTML = `<div id="app" scope></div>`;
        await app.mount('#app');
        expect(mountedSpy).toHaveBeenCalled();
    });

    it('should queue tasks with $nextTick', async () => {
        const initialData = {
            data: () => ({ count: 0 }),
            mounted() {
                this.count++;
                this.$nextTick(() => {
                    expect(this.count).toBe(1);
                });
            }
        };
        const app = createApp(initialData);
        document.body.innerHTML = `<div id="app" scope><p>{{ count }}</p></div>`;
        await app.mount('#app');

        await nextTick(() => {});
    });
});
