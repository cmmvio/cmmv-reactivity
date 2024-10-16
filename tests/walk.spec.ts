import { describe, it, expect, vi, beforeAll } from 'vitest';
import { walk, applyDirectiveBasedOnName, processTextNode, checkAndRemoveAttr } from '../src/walk';
import { JSDOM } from 'jsdom';
import { Context, createContext } from '../src/context';
import { evaluate } from '../src/eval';
import { _if } from '../src/directives/if';
import { _for } from '../src/directives/for';
import { text } from '../src/directives/text';

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
global.window = window;
global.document = window.document;
global.HTMLTemplateElement = window.HTMLTemplateElement;
global.Node = window.Node;
global.Text = window.Text;
global.Element = window.Element;
global.DocumentFragment = window.DocumentFragment;
global.SVGElement = window.SVGElement;

vi.mock('../src/eval', () => ({
  evaluate: vi.fn(),
}));

vi.mock('../src/directives/if', () => ({
  _if: vi.fn(),
}));

vi.mock('../src/directives/for', () => ({
  _for: vi.fn(),
}));

vi.mock('../src/directives/text', () => ({
  text: vi.fn(),
}));

beforeAll(() => {
    // Mock localStorage
    const localStorageMock = (() => {
        let store = {};
        return {
            getItem: (key) => store[key] || null,
            setItem: (key, value) => store[key] = value.toString(),
            removeItem: (key) => delete store[key],
            clear: () => store = {},
        };
    })();    
  
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    // Mock sessionStorage
    const sessionStorageMock = (() => {
        let store = {};
        return {
            getItem: (key) => store[key] || null,
            setItem: (key, value) => store[key] = value.toString(),
            removeItem: (key) => delete store[key],
            clear: () => store = {},
        };
    })();

    Object.defineProperty(window, 'sessionStorage', {
        value: sessionStorageMock,
    });
});

describe('walk utility', () => {
    const mockContext = createContext();

    it('should process element nodes correctly', () => {
        const el = document.createElement('div');
        el.setAttribute('c-if', 'someCondition');
        
        walk(el, mockContext);

        expect(_if).toHaveBeenCalledWith(el, 'someCondition', mockContext);
    });

    it('should handle for loops with c-for', () => {
        const el = document.createElement('div');
        el.setAttribute('c-for', 'item in items');
        
        walk(el, mockContext);

        expect(_for).toHaveBeenCalledWith(el, 'item in items', mockContext);
    });

    it('should apply custom directives', () => {
        const el = document.createElement('div');
        el.setAttribute('c-custom', 'someExpression');
        mockContext.dirs = {
            custom: vi.fn(),
        };

        walk(el, mockContext);

        expect(mockContext.dirs.custom).toHaveBeenCalled();
    });

    it('should apply scope directive', () => {
        const el = document.createElement('div');
        el.setAttribute('scope', '');

        walk(el, mockContext);

        expect(mockContext.scope).toBeDefined();
    });
});

describe('applyDirectiveBasedOnName', () => {
    const mockContext = createContext();

    it('should apply "bind" directive for ":" prefix', () => {
        const el = document.createElement('div');
        const exp = 'someProp';

        applyDirectiveBasedOnName(el, ':prop', exp, mockContext);

        expect(evaluate).toHaveBeenCalledWith(mockContext.scope, exp, el);
    });


    it('should apply custom directive from context', () => {
        const el = document.createElement('div');
        const exp = 'someCustomExpression';
        mockContext.dirs.customDirective = vi.fn();

        applyDirectiveBasedOnName(el, 'v-customDirective', exp, mockContext);

        expect(mockContext.dirs.customDirective).toHaveBeenCalled();
    });
});

describe('checkAndRemoveAttr', () => {
    it('should remove attribute from element', () => {
        const el = document.createElement('div');
        el.setAttribute('c-if', 'someCondition');

        const result = checkAndRemoveAttr(el, 'c-if');

        expect(result).toBe('someCondition');
        expect(el.hasAttribute('c-if')).toBe(false);
    });

    it('should return null if attribute is not found', () => {
        const el = document.createElement('div');
        const result = checkAndRemoveAttr(el, 'non-existent');

        expect(result).toBeNull();
    });
});
