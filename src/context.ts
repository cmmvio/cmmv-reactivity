import { Block } from "./block";
import { Directive } from "./directive"
import { reactive, effect as rawEffect } from "./reactivity";

export interface Context {
    key?: any
    delimiters: [string, string]
    delimitersRE: RegExp
    effect: typeof rawEffect
    scope: Record<string, any>
    dirs: Record<string, Directive>
    blocks: Block[],
    cleanups: (() => void)[]
}

export function createContext(parent?: Context): Context {
    const ctx: Context = {
        delimiters: ['{{', '}}'],
        delimitersRE: /\{\{([^]+?)\}\}/g,
        ...parent,
        scope: parent ? parent.scope : reactive({}),
        dirs: parent ? parent.dirs : {},
        effect: (fn) => rawEffect(fn),
        blocks: [],
        cleanups: [],
    };

    return ctx;
}

export const createScopedContext = (ctx: Context, data = {}): Context => {
    const parentScope = ctx.scope
    const mergedScope = Object.create(parentScope)
    Object.defineProperties(mergedScope, Object.getOwnPropertyDescriptors(data))
    mergedScope.$refs = Object.create(parentScope.$refs)

    const reactiveProxy = reactive(
        new Proxy(mergedScope, {
            set(target, key, val, receiver) {
                if (receiver === reactiveProxy && !target.hasOwnProperty(key)) 
                    return Reflect.set(parentScope, key, val)
            
                return Reflect.set(target, key, val, receiver)
            }
        })
    )
  
    bindContextMethods(reactiveProxy);
    return { ...ctx, scope: reactiveProxy }
}

export const bindContextMethods = (scope: Record<string, any>) => {
    for (const key of Object.keys(scope)) {
        if (typeof scope[key] === 'function') 
            scope[key] = scope[key].bind(scope)
    }
}