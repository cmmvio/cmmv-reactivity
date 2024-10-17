import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { evaluate } from '../dist/reactivity.js';

beforeAll(() => {
    const { window } = new JSDOM('');
    global.window = window;
    global.document = window.document;
});

describe('Expression Evaluation System', () => {
    it('should evaluate a simple expression with scope', () => {
        const scope = { a: 2, b: 3 };
        const result = evaluate(scope, 'a + b');
        expect(result).toBe(5);
    });

    it('should evaluate an expression using element context', () => {
        const scope = { a: 10 };
        const element = document.createElement('div');
        const result = evaluate(scope, 'a * 2', element);
        expect(result).toBe(20);
    });

    it('should handle invalid expressions gracefully', () => {
        const scope = { a: 1 };
        const result = evaluate(scope, 'a +', null);
        expect(result).toBe(undefined);
    });

    it('should handle syntax errors in expressions', () => {
        const scope = { num: 7 };
        const result = evaluate(scope, 'num + (');
        expect(result).toBe(undefined);
    });
});
