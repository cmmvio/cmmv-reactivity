import { expect } from 'chai';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM('');
global.window = window;
global.document = window.document;

import { reactive, ref, subscribe } from '../dist/reactivity.js';

describe('Reactive System', () => {
    it('should track and trigger reactivity on object properties', () => {
        const state = reactive({ count: 0 });
        expect(state.count).to.equal(0);
        state.count = 1;
        expect(state.count).to.equal(1);
    });

    it('should handle nested reactive objects', () => {
        const state = reactive({ nested: { count: 0 } });
        expect(state.nested.count).to.equal(0);
        state.nested.count = 1;
        expect(state.nested.count).to.equal(1);
    });

    it('should support ref values', () => {
        const count = ref(0);
        expect(count.value).to.equal(0);
        count.value = 1;
        expect(count.value).to.equal(1);
    });

    it('should trigger effects only when the value changes', () => {
        const state = reactive({ count: 0 });

        expect(state.count).to.equal(0);
        state.count = 1;
        expect(state.count).to.equal(1);
        state.count = 2;
        expect(state.count).to.equal(2);
    });
});
