import { expect } from 'chai';
import { evaluate, execute, toFunction } from '../dist/reactivity.js';

describe('Expression Evaluation System', () => {

    it('should evaluate a simple expression with scope', () => {
        const scope = { a: 2, b: 3 };
        const result = evaluate(scope, 'a + b');
        expect(result).to.equal(5);
    });

    it('should evaluate an expression using element context', () => {
        const scope = { a: 10 };
        const element = document.createElement('div');
        const result = evaluate(scope, 'a * 2', element);
        expect(result).to.equal(20);
    });

    it('should handle invalid expressions gracefully', () => {
        const scope = { a: 1 };
        const result = evaluate(scope, 'a +', null);
        expect(result).to.be.undefined;
    });

    it('should handle syntax errors in expressions', () => {
        const scope = { num: 7 };
        const result = execute(scope, 'num + (');
        expect(result).to.be.undefined; 
    });

});

