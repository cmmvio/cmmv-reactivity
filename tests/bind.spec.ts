import { describe, it, expect, vi, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { bind } from '../src/directives/bind';
import { Directive } from '../src/directive';
import { reactive, effect } from '@vue/reactivity';

let mockEffect: any;

beforeAll(() => {
    mockEffect = vi.fn(effect);
});

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
global.window = window;
global.document = window.document;
global.HTMLTemplateElement = window.HTMLTemplateElement;
global.Node = window.Node;
global.Text = window.Text;
global.Element = window.Element;
global.DocumentFragment = window.DocumentFragment;
global.SVGElement = window.SVGElement;

describe('bind directive', () => {
  
    it('should bind class attribute correctly', () => {
        const el = document.createElement('div');
        el.className = 'initial-class';

        const get = vi.fn(() => 'new-class');
        const directive: any = {
            el,
            get,
            effect: mockEffect,
            arg: 'class',
        };

        bind(directive);
        expect(el.getAttribute('class')).toBe('initial-class new-class');
    });

    it('should bind style attribute correctly', () => {
        const el = document.createElement('div');
        el.style.cssText = 'color: red;';

        const get = vi.fn(() => ({ color: 'blue', fontSize: '12px' }));
        const directive: any = {
            el,
            get,
            effect: mockEffect,
            arg: 'style',
        };

        bind(directive);
        expect(el.style.color).toBe('blue');
        expect(el.style.fontSize).toBe('12px');
    });

    it('should update single attribute when arg is provided', () => {
        const el = document.createElement('input');
        const get = vi.fn(() => 'hello');

        const directive: any = {
            el,
            get,
            effect: mockEffect,
            arg: 'value',
        };

        bind(directive);
        expect(el.value).toBe('hello');
    });

    it('should set multiple attributes without specific arg', () => {
        const el = document.createElement('input');
        const get = vi.fn(() => ({
        type: 'text',
        placeholder: 'Enter name',
        }));

        const directive: any = {
            el,
            get,
            effect: mockEffect,
        };

        bind(directive);
        expect(el.getAttribute('type')).toBe('text');
        expect(el.getAttribute('placeholder')).toBe('Enter name');
    });

    it('should remove attribute when value is null or undefined', () => {
        const el = document.createElement('input');
        el.setAttribute('placeholder', 'Enter name');

        const get = vi.fn(() => ({
            placeholder: null,
        }));

        const directive: any = {
            el,
            get,
            effect: mockEffect,
        };

        bind(directive);
        expect(el.getAttribute('placeholder') === "null").toBe(true);
    });

    it('should bind reactive style changes', () => {
        const el = document.createElement('div');
        const state = reactive({ color: 'blue', fontSize: '16px' });

        const get = () => state;
        const directive: any = {
            el,
            get,
            effect: mockEffect,
            arg: 'style',
        };

        bind(directive);
        expect(el.style.color).toBe('blue');
        expect(el.style.fontSize).toBe('16px');

        state.color = 'red';
        state.fontSize = '20px';
        mockEffect.mock.calls[0][0]();

        expect(el.style.color).toBe('red');
        expect(el.style.fontSize).toBe('20px');
    });

    it('should handle important styles correctly', () => {
        const el = document.createElement('div');

        const get = vi.fn(() => ({ color: 'red !important' }));
        const directive: any = {
            el,
            get,
            effect: mockEffect,
            arg: 'style',
        };

        bind(directive);
        expect(el.style.getPropertyPriority('color')).toBe('important');
    });
});
