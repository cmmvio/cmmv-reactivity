import { reactive } from "@vue/reactivity";

import { Block } from "./block";
import { bindContextMethods, createContext } from "./context";
import { toDisplayString } from './directives/text'
import { nextTick } from "./scheduler";

export const createApp = (initialData?: any) => {
    const ctx = createContext();

    if (initialData) {
        ctx.scope = reactive(initialData);
        bindContextMethods(ctx.scope)
    }

    ctx.scope.$s = toDisplayString;
    ctx.scope.$nextTick = nextTick;
    ctx.scope.$refs = Object.create(null);
    let rootBlocks: Block[];

    return {
        mount(el?: string | Element | null) {
            if (typeof el === 'string') {
                el = document.querySelector(el);

                if (!el) {
                    console.error(`Selector ${el} has no matching element.`)
                    return
                }
            }

            el = el || document.documentElement;
            let roots: Element[];

            if (el.hasAttribute('scope')) {
                roots = [el]
            } else {
                roots = [...el.querySelectorAll(`[scope]`)].filter(
                  (root) => !root.matches(`[scope] [scope]`)
                )
            }

            if (!roots.length) 
                roots = [el]
            
            rootBlocks = roots.map((el) => new Block(el, ctx, true))

            return this;
        },

        unmount() {
            rootBlocks.forEach((block) => block.teardown())
        }
    }
}