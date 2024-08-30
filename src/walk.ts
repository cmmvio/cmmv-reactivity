import { Context, createScopedContext } from "./context"
import { Directive, builtInDirectives } from "./directive";
import { evaluate } from "./eval";
import { text } from "./directives/text";
import { ref } from './directives/ref';
import { bind } from './directives/bind';
import { on } from './directives/on';

const dirRE = /^(?:v-|:|@)/
const modifierRE = /\.([\w-]+)/g

export let inOnce = false;

export const walk = (node: Node, ctx: Context): ChildNode | null | void => {
    const type = node.nodeType;

    if (type === 1) {
        const el = node as Element;

        if (el.hasAttribute('c-pre')) 
            return
        
        let exp: string | null

        if ((exp = checkAttr(el, 'scope')) || exp === '') {
            const scope = exp ? evaluate(ctx.scope, exp) : {};
            ctx = createScopedContext(ctx, scope);

            if (scope.$template) 
              resolveTemplate(el, scope.$template);
        }

        if ((exp = checkAttr(el, 'ref'))) 
            applyDirective(el, ref, `"${exp}"`, ctx)
        
        walkChildren(el, ctx)

        const deferred: [string, string][] = [];

        for (const { name, value } of [...el.attributes]) {
            if (dirRE.test(name) && name !== 'v-cloak') {
                if (name === 'v-model') 
                    deferred.unshift([name, value])
                else if (name[0] === '@' || /^v-on\b/.test(name)) 
                    deferred.push([name, value])
                else 
                    processDirective(el, name, value, ctx)
            }
        }

        for (const [name, value] of deferred) 
            processDirective(el, name, value, ctx)
    }
    else if (type === 3) {
        const data = (node as Text).data;

        if (data.includes(ctx.delimiters[0])) {
            let segments: string[] = [];
            let lastIndex = 0;
            let match;

            while ((match = ctx.delimitersRE.exec(data))) {
                const leading = data.slice(lastIndex, match.index)
                if (leading) segments.push(JSON.stringify(leading))
                segments.push(`$s(${match[1]})`)
                lastIndex = match.index + match[0].length
            }

            if (lastIndex < data.length) 
                segments.push(JSON.stringify(data.slice(lastIndex)))
            
            applyDirective(node, text, segments.join('+'), ctx);
        }
    }
    else if (type === 11) {
        walkChildren(node as DocumentFragment, ctx)
    }
}

const walkChildren = (node: Element | DocumentFragment, ctx: Context) => {
    let child = node.firstChild;

    while (child) 
      child = walk(child, ctx) || child.nextSibling;
}



export const checkAttr = (el: Element, name: string): string | null => {
    const val = el.getAttribute(name)
    if (val != null) el.removeAttribute(name)
    return val
}

export const applyDirective = (
    el: Node,
    dir: Directive<any>,
    exp: string,
    ctx: Context,
    arg?: string,
    modifiers?: Record<string, true>
) => {
    const get = (e = exp) => evaluate(ctx.scope, e, el)

    const cleanup = dir({
      el,
      get,
      effect: ctx.effect,
      ctx,
      exp,
      arg,
      modifiers
    })

    if (cleanup) 
      ctx.cleanups.push(cleanup);
}

export const resolveTemplate = (el: Element, template: string) => {
    if (template[0] === '#') {
        const templateEl = document.querySelector(template)
        el.appendChild((templateEl as HTMLTemplateElement).content.cloneNode(true))
        return
    }

    el.innerHTML = template;
}

const processDirective = (
    el: Element,
    raw: string,
    exp: string,
    ctx: Context
) => {
    let dir: Directive
    let arg: string | undefined
    let modifiers: Record<string, true> | undefined
  
    raw = raw.replace(modifierRE, (_, m) => {
      ;(modifiers || (modifiers = {}))[m] = true
      return '';
    })
  
    if (raw[0] === ':') {
        dir = bind;
        arg = raw.slice(1);
    } 
    else if (raw[0] === '@') {
        dir = on;
        arg = raw.slice(1);
    } 
    else {
        const argIndex = raw.indexOf(':');
        const dirName = argIndex > 0 ? raw.slice(2, argIndex) : raw.slice(2);
        dir = builtInDirectives[dirName] || ctx.dirs[dirName];
        arg = argIndex > 0 ? raw.slice(argIndex + 1) : undefined;
    }

    if (dir) {
        if (dir === bind && arg === 'ref') dir = ref;
        applyDirective(el, dir, exp, ctx, arg, modifiers);
        el.removeAttribute(raw);
    }
}