import { expect } from 'chai';
import { createContext, createScopedContext } from '../dist/reactivity.js';

describe('createContext', () => {
    it('should create a context with default values when no parent context is provided', () => {
        const context = createContext();

        expect(context.delimiters).to.deep.equal(['{{', '}}']);
        expect(context.delimitersRE).to.be.an.instanceOf(RegExp);
        expect(context.scope).to.be.an('object');
        expect(context.effect).to.be.a('function');
        expect(context.dirs).to.deep.equal({});
        expect(context.blocks).to.be.an('array').that.is.empty;
        expect(context.cleanups).to.be.an('array').that.is.empty;
    });

    it('should create a context inheriting from a parent context', () => {
        const parentContext = createContext();
        parentContext.scope.customProp = 'test';
        parentContext.dirs.customDir = {};

        const childContext = createContext(parentContext);

        expect(childContext.scope.customProp).to.equal('test');
        expect(childContext.dirs.customDir).to.equal(parentContext.dirs.customDir);
    });

    it('should create a scoped context with merged data', () => {
        const parentContext = createContext();
        parentContext.scope.parentProp = 'parentValue';

        const scopedContext = createScopedContext(parentContext, { childProp: 'childValue' });
        console.log(scopedContext);

        expect(scopedContext.scope.parentProp).to.equal('parentValue');
        expect(scopedContext.scope.childProp).to.equal('childValue');
    });

    it('should bind functions to the scope', () => {
        const scopedContext = createScopedContext(createContext(), {
            fn() {
                return this;
            }
        });

        expect(scopedContext.scope.fn()).to.equal(scopedContext.scope);
    });

    it('should set properties on parent scope if not found in child scope', () => {
        const parentContext = createContext();
        const scopedContext = createScopedContext(parentContext);

        scopedContext.scope.newProp = 'newValue';
        expect(parentContext.scope.newProp).to.equal('newValue');
    });
});
