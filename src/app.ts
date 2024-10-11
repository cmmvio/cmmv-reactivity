import { reactive } from "@vue/reactivity";

import { Block } from "./block";
import { bindContextMethods, createContext } from "./context";
import { toDisplayString } from './directives/text'
import { nextTick } from "./scheduler";
import { mountComponent } from "./component";
import { updateProps } from "./props";
import { nativeHtmlTags } from "./constants";

export const createApp = (initialData?: any) => {
    const ctx = createContext();

    if (initialData) {
        let scopeData = { ...initialData };
        
        if(typeof initialData.data == "function"){
            scopeData = new Proxy({ ...scopeData, ...initialData.data() }, {
                get(obj, prop) {
                    return obj[prop];
                },
                set(obj, prop, value) {
                    updateProps(ctx, prop, value);
                    obj[prop] = value;
                    return true;
                }
            }) ;
        }

        ctx.scope = reactive(scopeData);

        bindContextMethods(ctx.scope)
    }

    ctx.scope.$s = toDisplayString;
    ctx.scope.$nextTick = nextTick;
    ctx.scope.$refs = Object.create(null);
    let rootBlocks: Block[];

    if (initialData?.components) {
        ctx.components = Object.keys(initialData.components).reduce((acc, key) => {
            acc[key] = initialData.components[key];
            return acc;
        }, {});

        ctx.components = createComponentAliases(ctx.components);
    }

    if (initialData && typeof initialData.created === "function")
        initialData.created.call(ctx.scope);
   
    return {
        async mount(el?: string | Element | null) {
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

            for(let rootEl of roots){                     
                const componentEls = rootEl.querySelectorAll('*');
 
                for(let componentEl of componentEls){
                    const componentName = componentEl.tagName.toLowerCase();
                
                    if (nativeHtmlTags.includes(componentName)) 
                        continue;
        
                    if (ctx.components) 
                        await mountComponent(ctx, componentEl, componentName, rootEl); 
                }
            }

            const refs = ctx.scope.$refs;
            rootBlocks = roots.map((el) => new Block(el, ctx, true));
            ctx.scope.$refs = refs;

            if (initialData && typeof initialData.mounted === "function")
                initialData.mounted.call(ctx.scope);

            return this;
        },

        unmount() {
            rootBlocks.forEach((block) => block.teardown())
        }
    }
}

function createComponentAliases(components) {
    const newComponents = { ...components };

    Object.keys(components).forEach((key) => {
        const kebabCaseName = camelToKebabCase(key);
        newComponents[kebabCaseName] = components[key];
        newComponents[key] = components[key];
        newComponents[key.toLowerCase()] = components[key];
    });

    return newComponents;
}

function camelToKebabCase(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}