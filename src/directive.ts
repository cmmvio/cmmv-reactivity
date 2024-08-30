import { Context } from "./context";
import { effect as rawEffect } from "./reactivity";
import { bind } from './directives/bind';
import { on } from './directives/on';
import { text } from './directives/text';
import { effect } from './directives/effect';
import { model } from './directives/model';
import { html } from './directives/html';
import { show } from './directives/show';

export interface Directive<T = Element> {
    (ctx: DirectiveContext<T>): (() => void) | void 
}

export interface DirectiveContext<T = Element> {
    el: T,
    get: (exp?: string) => any,
    effect: typeof rawEffect
    exp: string,
    arg?: string,
    modifiers?: Record<string, true>,
    ctx: Context
}

export const builtInDirectives: Record<string, Directive<any>> = {
    bind,
    on,
    text,
    effect,
    model,
    html,
    show
}