import { describe, it, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { Block } from '../src/block';
import { createContext } from '../src/context';
import { reactive } from '@vue/reactivity';

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
global.window = window;
global.document = window.document;
global.HTMLTemplateElement = window.HTMLTemplateElement;
global.Node = window.Node;
global.Text = window.Text;
global.Element = window.Element;
global.DocumentFragment = window.DocumentFragment;

describe('Block', () => {

    const setupTemplate = (html: string): Element => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.firstElementChild!;
    };

    const setupParentContext = () => {
        return createContext({
            scope: reactive({}),
            blocks: [],
            effects: [],
            cleanups: []
        });
    };

    it('should create a block from a template element', () => {
        const template = setupTemplate('<div><p>Hello World</p></div>');
        const parentCtx = setupParentContext();
        const block = new Block(template, parentCtx, false);

        expect(block.template).toBeInstanceOf(Element);
        expect(block.ctx).toBeTruthy();
        expect(block.isFragment).toBe(false);
        expect(block.parentCtx).toBe(parentCtx);
        expect(parentCtx.blocks.length).toBe(1);
    });

    it('should create a fragment block from a template element', () => {
        const template = document.createElement('template');
        template.innerHTML = '<div><p>Fragment Content</p></div>';

        const parentCtx = setupParentContext();
        const block = new Block(template, parentCtx, false);

        expect(block.isFragment).toBe(true);
        expect(block.template).toBeInstanceOf(DocumentFragment);
        expect(block.ctx).toBeTruthy();
        expect(block.parentCtx).toBe(parentCtx);
    });

    it('should insert the block into the parent element', () => {
        const template = setupTemplate('<div><p>Insert Me</p></div>');
        const parentElement = document.createElement('div');
        const parentCtx = setupParentContext();

        const block = new Block(template, parentCtx, false);
        block.insert(parentElement);

        expect(parentElement.innerHTML).toContain('<p>Insert Me</p>');
    });

    it('should insert a fragment block into the parent element', () => {
        const template = document.createElement('template');
        template.innerHTML = '<div><p>Fragment Insert</p></div>';

        const parentElement = document.createElement('div');
        const parentCtx = setupParentContext();

        const block = new Block(template, parentCtx, false);
        block.insert(parentElement);

        expect(parentElement.innerHTML).toContain('<p>Fragment Insert</p>');
    });

    it('should remove the block from the parent element', () => {
        const template = setupTemplate('<div><p>Remove Me</p></div>');
        const parentElement = document.createElement('div');
        const parentCtx = setupParentContext();

        const block = new Block(template, parentCtx, false);
        block.insert(parentElement);
        block.remove();

        expect(parentElement.innerHTML).toBe('');
        expect(parentCtx.blocks.length).toBe(0);
    });

    it('should teardown the block correctly', () => {
        const template = setupTemplate('<div><p>Teardown</p></div>');
        const parentCtx = setupParentContext();
        const block = new Block(template, parentCtx, false);

        const cleanupSpy = vi.fn();
        block.ctx.cleanups.push(cleanupSpy);

        block.teardown();
        expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should teardown nested blocks', () => {
        const parentCtx = setupParentContext();
        const template = setupTemplate('<div><p>Parent Block</p></div>');

        const block = new Block(template, parentCtx, false);
        const nestedTemplate = setupTemplate('<div><p>Nested Block</p></div>');
        const nestedBlock = new Block(nestedTemplate, block.ctx, false);

        block.teardown();
        expect(parentCtx.blocks.length).toBe(0);
        expect(nestedBlock.ctx.effects?.length).toBe(0);
    });

    it('should stop all reactive effects on teardown', () => {
        const template = setupTemplate('<div><p>Reactive Block</p></div>');
        const parentCtx = setupParentContext();
        const block = new Block(template, parentCtx, false);

        const reactiveScope = block.ctx.scope;
        let dummy;

        if(block.ctx.effect)
        block.ctx.effect(() => {
            dummy = reactiveScope.count;
        });

        reactiveScope.count = 1;
        block.teardown();

        expect(block.ctx.effects?.length).toBe(0);
    });
});
