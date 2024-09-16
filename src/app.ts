import { reactive } from "@vue/reactivity";

import { Block } from "./block";
import { bindContextMethods, createContext } from "./context";
import { toDisplayString } from './directives/text'
import { nextTick } from "./scheduler";
import { mountComponent } from "./component";

export const createApp = (initialData?: any) => {
    const ctx = createContext();

    if (initialData) {
        let scopeData = { ...initialData };

        if(typeof initialData.data == "function")
            scopeData = { ...scopeData, ...initialData.data() };

        ctx.scope = reactive(scopeData);

        bindContextMethods(ctx.scope)
    }

    ctx.scope.$s = toDisplayString;
    ctx.scope.$nextTick = nextTick;
    ctx.scope.$refs = Object.create(null);
    let rootBlocks: Block[];

    if (initialData?.components) {
        ctx.components = Object.keys(initialData.components).reduce((acc, key) => {
            acc[key.toLowerCase()] = initialData.components[key];
            return acc;
        }, {});
    }

    if (typeof initialData.created === "function")
        initialData.created.call(ctx.scope);
   
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
                roots = [el];

            roots.forEach((rootEl) => {
                const componentEls = rootEl.querySelectorAll('*');

                componentEls.forEach((componentEl) => {
                    const componentName = componentEl.tagName.toLowerCase();

                    if (ctx.components) 
                        mountComponent(ctx, componentEl, componentName, rootEl);                    
                });
            });
            
            rootBlocks = roots.map((el) => new Block(el, ctx, true))

            if (typeof initialData.mounted === "function")
                initialData.mounted.call(ctx.scope);

            return this;
        },

        unmount() {
            rootBlocks.forEach((block) => block.teardown())
        }
    }
}