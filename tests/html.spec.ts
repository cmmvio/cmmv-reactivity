import { describe, it, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { html } from '../src/directives/html';

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
global.window = window;
global.document = window.document;
global.Text = window.Text;
global.Element = window.Element;

describe('html directive', () => {
    it('should set innerHTML of the element based on the value of get()', () => {
        const mockEl = document.createElement('div');
        const mockGet = vi.fn(() => '<p>Hello World</p>');
        const mockEffect = vi.fn((fn) => fn());

        // @ts-ignore
        html({
            el: mockEl,
            get: mockGet,
            effect: mockEffect,
        });

        expect(mockEl.innerHTML).toBe('<p>Hello World</p>');
    });

    it('should update innerHTML when get() returns a new value', () => {
        const mockEl = document.createElement('div');
        let value = '<p>Hello World</p>';
        const mockGet = vi.fn(() => value);
        const mockEffect = vi.fn((fn) => fn());

        // @ts-ignore
        html({
            el: mockEl,
            get: mockGet,
            effect: mockEffect,
        });

        expect(mockEl.innerHTML).toBe('<p>Hello World</p>');

        value = '<p>Updated Content</p>';
        mockEffect.mock.calls[0][0](); 

        expect(mockEl.innerHTML).toBe('<p>Updated Content</p>');
    });

    it('should call effect to handle reactivity', () => {
        const mockEl = document.createElement('div');
        const mockGet = vi.fn(() => '<p>Reactive Content</p>');
        const mockEffect = vi.fn((fn) => fn());

        // @ts-ignore
        html({
            el: mockEl,
            get: mockGet,
            effect: mockEffect,
        });

        expect(mockEffect).toHaveBeenCalled();
    });
});
