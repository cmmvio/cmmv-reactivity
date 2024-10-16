import { describe, it, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { effect as effectDirective } from '../src/directives/effect';
import { nextTick } from '../src/scheduler';
import { execute } from '../src/eval';
import { Context } from '../src/context';
import { Block } from '../src/block';

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
global.window = window;
global.document = window.document;

vi.mock('../src/eval', () => ({
    execute: vi.fn(),
}));

vi.mock('../src/scheduler', () => ({
    nextTick: vi.fn((fn: () => void) => Promise.resolve().then(fn)),
}));

describe('effect directive', () => {
    it('should execute the effect after nextTick', async () => {
        const mockEl = document.createElement('div');
        const mockScope = { message: 'Hello World' };
        const mockEffect = vi.fn((fn) => fn()); 
        const exp = 'message';

        const ctx: Context = {
            scope: mockScope,
            cleanups: [],
            blocks: [],
        };

        // @ts-ignore
        effectDirective({
            el: mockEl,
            ctx,
            exp,
            effect: mockEffect
        });

        expect(nextTick).toHaveBeenCalled();

        await nextTick(() => {});

        // @ts-ignore
        const calls = execute.mock.calls;
        expect(calls.length).toBe(1); 
        const [scopeArg, expArg, elArg] = calls[0];
        expect(scopeArg).toEqual(mockScope); 
        expect(expArg).toBe(exp);
        expect(elArg).toBe(mockEl); 
    });
});
