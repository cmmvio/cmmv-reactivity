import { describe, it, expect, vi, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { _for } from '../src/directives/for';
import { evaluate } from '../src/eval';
import { Block } from '../src/block';
import { createScopedContext } from '../src/context';

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
global.window = window;
global.document = window.document;
global.Text = window.Text;
global.Element = window.Element;

vi.mock('../src/eval', () => ({
    evaluate: vi.fn(),
}));

vi.mock('../src/block', () => ({
    Block: vi.fn(function (this: any, el, ctx) {
        this.el = document.createElement('div');
        this.insert = vi.fn();
        this.remove = vi.fn();
        this.ctx = ctx;
    }),
}));

vi.mock('../src/context', () => ({
    createScopedContext: vi.fn((parentCtx, data) => ({
        scope: data,
        key: '',
    })),
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

describe('_for directive', () => {
    it('should create blocks for array data', () => {
        const mockEl = document.createElement('div');
        const mockParent = document.createElement('div');
        mockParent.appendChild(mockEl);
        const mockCtx = {
            scope: {},
            effect: vi.fn((fn) => fn()),
        };

        const exp = 'item in items';
        const items = [1, 2, 3];

        // @ts-ignore
        evaluate.mockReturnValue(items);

        // @ts-ignore
        _for(mockEl, exp, mockCtx);

        expect(evaluate).toHaveBeenCalledWith(mockCtx.scope, 'items');
        expect(Block).toHaveBeenCalledTimes(items.length);

        items.forEach((item, index) => {
            expect(createScopedContext).toHaveBeenCalledWith(mockCtx, { item });
        });
        // @ts-ignore
        Block.mock.calls.forEach((blockCall, index) => {
            expect(blockCall[0]).toBeInstanceOf(Element);
            expect(blockCall[1].scope).toEqual({ item: items[index] });
        });
    });

    it('should update blocks for changing array data', () => {
        const mockEl = document.createElement('div');
        const mockParent = document.createElement('div');
        mockParent.appendChild(mockEl);
        const mockCtx = {
            scope: {},
            effect: vi.fn((fn) => fn()),
        };

        const exp = 'item in items';
        let items = [1, 2, 3];

        // @ts-ignore
        evaluate.mockReturnValue(items);

        // @ts-ignore
        _for(mockEl, exp, mockCtx);

        items = [2, 3, 4];
        // @ts-ignore
        evaluate.mockReturnValue(items);

        mockCtx.effect.mock.calls[0][0]();

        expect(Block).toHaveBeenCalledTimes(items.length + 3);
        // @ts-ignore
        const removedBlocks = Block.mock.results.filter(
            (result) => result.value.remove.mock.calls.length > 0
        );
        expect(removedBlocks.length).toBe(0);
    });
});
