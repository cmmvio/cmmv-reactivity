import { describe, it, expect } from 'vitest';
import { updateProps } from '../src/props';
import { Context } from '../src/context';

describe('updateProps', () => {
    it('should update the correct prop in referenced component', () => {
        const mockComponent = {
            $props: {
                $root_name: 'name',
                $root_value: 'value'
            },
            name: '',
            value: ''
        };

        const ctx: Context = {
            scope: {
                $refs: {
                    someRef: mockComponent
                }
            },
            delimiters: ['{{', '}}'],
            delimitersRE: /\{\{([^]+?)\}\}/g,
            effects: [],
            dirs: {},
            blocks: [],
            cleanups: [],
            components: {}
        };

        updateProps(ctx, 'name', 'updatedName');
        expect(mockComponent.name).toBe('updatedName');
    });

    it('should not update anything if no matching prop is found', () => {
        const mockComponent = {
            $props: {
                $root_name: 'name'
            },
            name: ''
        };

        const ctx: Context = {
            scope: {
                $refs: {
                    someRef: mockComponent
                }
            },
            delimiters: ['{{', '}}'],
            delimitersRE: /\{\{([^]+?)\}\}/g,
            effects: [],
            dirs: {},
            blocks: [],
            cleanups: [],
            components: {}
        };

        updateProps(ctx, 'nonExistentProp', 'someValue');
        expect(mockComponent.name).toBe('');
    });

    it('should handle multiple components in refs', () => {
        const mockComponent1 = {
            $props: {
                $root_name: 'name'
            },
            name: ''
        };

        const mockComponent2 = {
            $props: {
                $root_value: 'value'
            },
            value: ''
        };

        const ctx: Context = {
            scope: {
                $refs: {
                    ref1: mockComponent1,
                    ref2: mockComponent2
                }
            },
            delimiters: ['{{', '}}'],
            delimitersRE: /\{\{([^]+?)\}\}/g,
            effects: [],
            dirs: {},
            blocks: [],
            cleanups: [],
            components: {}
        };

        updateProps(ctx, 'name', 'newName');
        updateProps(ctx, 'value', 'newValue');

        expect(mockComponent1.name).toBe('newName');
        expect(mockComponent2.value).toBe('newValue');
    });

    it('should not throw if refs are empty', () => {
        const ctx: Context = {
            scope: {
                $refs: {}
            },
            delimiters: ['{{', '}}'],
            delimitersRE: /\{\{([^]+?)\}\}/g,
            effects: [],
            dirs: {},
            blocks: [],
            cleanups: [],
            components: {}
        };

        expect(() => {
            updateProps(ctx, 'name', 'newName');
        }).not.toThrow();
    });
});
