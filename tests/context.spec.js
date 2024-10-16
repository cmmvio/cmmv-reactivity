import { describe, it, expect } from 'vitest';
import { 
    createContext, createScopedContext, 
    bindContextMethods, nextTick 
} from '../dist/reactivity.js';

describe('createContext', () => {
    it('should create a context with default values when no parent context is provided', () => {
        const context = createContext();

        expect(context.delimiters).toEqual(['{{', '}}']);
        expect(context.delimitersRE).toBeInstanceOf(RegExp);
        expect(context.scope).toBeTypeOf('object');
        expect(context.effect).toBeTypeOf('function');
        expect(context.dirs).toEqual({});
        expect(context.blocks).toBeInstanceOf(Array);
        expect(context.blocks).toHaveLength(0);
        expect(context.cleanups).toBeInstanceOf(Array);
        expect(context.cleanups).toHaveLength(0);
    });

    it('should create a context inheriting from a parent context', () => {
        const parentContext = createContext();
        parentContext.scope.customProp = 'test';
        parentContext.dirs.customDir = {};

        const childContext = createContext(parentContext);

        expect(childContext.scope.customProp).toBe('test');
        expect(childContext.dirs.customDir).toBe(parentContext.dirs.customDir);
    });

    it('should create a scoped context with merged data', () => {
        const parentContext = createContext();
        parentContext.scope.parentProp = 'parentValue';

        const scopedContext = createScopedContext(parentContext, { childProp: 'childValue' });

        expect(scopedContext.scope.parentProp).toBe('parentValue');
        expect(scopedContext.scope.childProp).toBe('childValue');
    });

    it('should bind functions to the scope', () => {
        const scopedContext = createScopedContext(createContext(), {
            fn() {
                return this;
            }
        });

        expect(scopedContext.scope.fn()).toBe(scopedContext.scope);
    });

    it('should set properties on parent scope if not found in child scope', () => {
        const parentContext = createContext();
        const scopedContext = createScopedContext(parentContext);

        scopedContext.scope.newProp = 'newValue';
        expect(parentContext.scope.newProp).toBe('newValue');
    });

    it('should create a default context', () => {
        const ctx = createContext();
        
        expect(ctx.delimiters).to.deep.equal(['{{', '}}']);
        expect(ctx.delimitersRE).to.be.an.instanceOf(RegExp);
        expect(ctx.scope).to.be.an('object');
        expect(ctx.effect).to.be.a('function');
        expect(ctx.dirs).to.deep.equal({});
        expect(ctx.blocks).to.be.an('array').that.is.empty;
        expect(ctx.cleanups).to.be.an('array').that.is.empty;
    });

    it('should inherit properties from parent context', () => {
        const parentContext = createContext();
        parentContext.scope.customProp = 'parentValue';
        parentContext.dirs.customDir = { value: 'directive' };

        const childContext = createContext(parentContext);
        
        expect(childContext.scope.customProp).to.equal('parentValue');
        expect(childContext.dirs.customDir).to.deep.equal({ value: 'directive' });
    });

    it('should create a scoped context and merge data', () => {
        const parentContext = createContext();
        parentContext.scope.parentProp = 'parentValue';

        const scopedContext = createScopedContext(parentContext, { childProp: 'childValue' });
        
        expect(scopedContext.scope.parentProp).to.equal('parentValue');
        expect(scopedContext.scope.childProp).to.equal('childValue');
    });

    it('should bind functions in the scope to the context', () => {
        const scopedContext = createScopedContext(createContext(), {
            fn() {
                return this;
            }
        });

        expect(scopedContext.scope.fn()).to.equal(scopedContext.scope);
    });

    it('should update parent scope if property is not found in child scope', () => {
        const parentContext = createContext();
        const scopedContext = createScopedContext(parentContext);

        scopedContext.scope.newProp = 'newValue';
        expect(parentContext.scope.newProp).to.equal('newValue');
    });

    it('should trigger effects and schedule jobs using reactive scope', async () => {
        let dummy;
        const ctx = createContext();
        const reactiveScope = ctx.scope;

        ctx.effect(() => {
            dummy = reactiveScope.count;
        });

        reactiveScope.count = 1;
        await nextTick();
        expect(dummy).to.equal(1);
    });
});


describe('bindContextMethods', () => {
    it('should bind all functions in the scope to the scope itself', () => {
        const scope = {
            val: 42,
            getVal() {
                return this.val;
            },
            anotherFn() {
                return 123;
            }
        };

        bindContextMethods(scope);

        expect(scope.getVal()).to.equal(42);
        expect(scope.anotherFn()).to.equal(123);
    });

    it('should not modify non-function properties', () => {
        const scope = {
            val: 42,
            notFn: 'I am not a function'
        };

        bindContextMethods(scope);

        expect(scope.notFn).to.equal('I am not a function');
    });
});
