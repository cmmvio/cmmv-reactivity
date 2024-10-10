import { Context, createScopedContext } from "./context";
import { Directive, builtInDirectives } from "./directive";
import { evaluate } from "./eval";
import { _if } from "./directives/if";
import { _for } from './directives/for';
import { text } from "./directives/text";
import { ref } from './directives/ref';
import { bind } from './directives/bind';
import { on } from './directives/on';

const dirRE = /^(c-|:|@)/;
const dirREVue = /^(v-|:|@)/;
const modifierRE = /\.([\w-]+)/g;

export let inOnce = false;

export const walk = (node: Node, ctx: Context): ChildNode | null | void => {
    const nodeType = node.nodeType;

    switch (nodeType) {
        case 1: processElementNode(node as Element, ctx); break;
        case 3: processTextNode(node as Text, ctx); break;
        case 11: walkChildren(node as DocumentFragment, ctx); break;
    }
}

const processElementNode = (el: Element, ctx: Context): void | ChildNode | null => {
    if (el.hasAttribute('pre')) return;

    checkAndRemoveAttr(el, 'c-cloak');

    let exp: string | null;

    if ((exp = checkAndRemoveAttr(el, 'c-if') || checkAndRemoveAttr(el, 'v-if'))) 
        return _if(el, exp, ctx);

    if ((exp = checkAndRemoveAttr(el, 'c-for') || checkAndRemoveAttr(el, 'v-for'))) 
        return _for(el, exp, ctx);
    
    if ((exp = checkAndRemoveAttr(el, 'scope') || checkAndRemoveAttr(el, 'v-scope')) !== null || exp === '') {
        const scope = exp ? evaluate(ctx.scope, exp) : {};
        ctx = createScopedContext(ctx, scope);

        if (scope.$template) 
            resolveTemplate(el, scope.$template)
    }

    const hasVOnce = checkAndRemoveAttr(el, 'once') !== null || checkAndRemoveAttr(el, 'v-once') !== null;
    if (hasVOnce) inOnce = true;

    //if ((exp = checkAndRemoveAttr(el, 'ref'))) {
    //    applyDirective(el, ref, `"${exp}"`, ctx);
    //}

    walkChildren(el, ctx);
    processElementDirectives(el, ctx);

    if (hasVOnce) inOnce = false;
}

const processTextNode = (node: Text, ctx: Context): void => {
    const data = node.data;

    if (data.includes(ctx.delimiters[0])) {
        const segments: string[] = [];
        let lastIndex = 0;
        let match;

        while ((match = ctx.delimitersRE.exec(data))) {
            segments.push(JSON.stringify(data.slice(lastIndex, match.index)));
            segments.push(`$s(${match[1]})`);
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < data.length) 
            segments.push(JSON.stringify(data.slice(lastIndex)));
        
        applyDirective(node, text, segments.join('+'), ctx);
    }
}

const walkChildren = (node: Element | DocumentFragment, ctx: Context): void => {
    let child = node.firstChild;
    while (child) child = walk(child, ctx) || child.nextSibling;
}

const checkAndRemoveAttr = (el: Element, name: string): string | null => {
    const val = el.getAttribute(name);
    if (val !== null) el.removeAttribute(name);
    return val;
}

const applyDirective = (
    el: Node,
    dir: Directive<any>,
    exp: string,
    ctx: Context,
    arg?: string,
    modifiers?: Record<string, true>
): void => {
    const get = (e = exp) => evaluate(ctx.scope, e, el);

    const cleanup = dir({
        el,
        get,
        effect: ctx.effect,
        ctx,
        exp,
        arg,
        modifiers,
    });

    if (cleanup) ctx.cleanups.push(cleanup);
}

const processElementDirectives = (el: Element, ctx: Context): void => {
    const deferred: [string, string][] = [];

    for (const { name, value } of Array.from(el.attributes)) {
        if (dirRE.test(name) || dirREVue.test(name)) {
            if (name === 'model' || name === 'c-model' || name === 'v-model') {
                deferred.unshift([name, value]);
            } else if (name.startsWith('@') || /^on\b/.test(name) || /^v-on\b/.test(name)) {
                deferred.push([name, value]);
            } else {
                applyDirectiveBasedOnName(el, name, value, ctx);
            }
        }
    }

    for (const [name, value] of deferred) {
        applyDirectiveBasedOnName(el, name, value, ctx);
    }
}

const applyDirectiveBasedOnName = (
    el: Element,
    raw: string,
    exp: string,
    ctx: Context
): void => {
    let dir: Directive | undefined;
    let arg: string | undefined;
    let modifiers: Record<string, true> | undefined;

    raw = raw.replace(modifierRE, (_, m) => {
        (modifiers || (modifiers = {}))[m] = true;
        return '';
    });

    if (raw[0] === ':') {
        dir = bind;
        arg = raw.slice(1);
    } else if (raw[0] === '@') {
        dir = on;
        arg = raw.slice(1);
    } else {
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


const resolveTemplate = (el: Element, template: string) => {
    if (template[0] === '#') {
        const templateEl = document.querySelector(template);

        if (import.meta.env.DEV && !templateEl) {
            console.error(
            `template selector ${template} has no matching <template> element.`
            )
        }

        el.appendChild((templateEl as HTMLTemplateElement).content.cloneNode(true));

        return;
    }
    el.innerHTML = template
}