import { Directive } from '../directive';

import {
    normalizeClass,
    normalizeStyle,
    isString,
    isArray,
    hyphenate,
    camelize
} from '../shared';

const forceAttrRE = /^(spellcheck|draggable|form|list|type)$/;

export const bind: Directive<Element & { _class?: string }> = ({
    el,
    get,
    effect,
    arg,
    modifiers
}) => {
    let prevValue: any;

    if (arg === 'class') {
        el._class = el.className;
    }

    effect(() => {
        const value = get();

        if (arg) {
            const property = modifiers?.camel ? camelize(arg) : arg;
            setProperty(el, property, value, prevValue);
        } else {
            updateAllProperties(el, value, prevValue);
        }

        prevValue = value;
    });
};

const setProperty = (
    el: Element & { _class?: string },
    key: string,
    value: any,
    prevValue?: any
) => {
    if (key === 'class') {
        el.setAttribute('class', normalizeClass([el._class, value]) || '');
    } else if (key === 'style') {
        updateStyle(el as HTMLElement, value, prevValue);
    } else if (shouldSetAsProperty(el, key)) {
        // @ts-ignore
        el[key] = value;
        if (key === 'value') {
            // @ts-ignore
            el._value = value;
        }
    } else {
        updateAttribute(el, key, value);
    }
};

const updateStyle = (el: HTMLElement, value: any, prevValue?: any) => {
    const style = el.style;
    if (!value) {
        el.removeAttribute('style');
    } else if (isString(value)) {
        if (value !== prevValue) style.cssText = value;
    } else {
        applyStyles(style, value, prevValue);
    }
};

const applyStyles = (
    style: CSSStyleDeclaration,
    value: Record<string, string>,
    prevValue?: Record<string, string>
) => {
    for (const key in value) {
        setStyle(style, key, value[key]);
    }
    if (prevValue && !isString(prevValue)) {
        for (const key in prevValue) {
            if (!value[key]) setStyle(style, key, '');
        }
    }
};

const shouldSetAsProperty = (el: Element, key: string) => 
    !(el instanceof SVGElement) && key in el && !forceAttrRE.test(key);

const updateAttribute = (
    el: Element,
    key: string,
    value: any
) => {
    if (value != null) {
        el.setAttribute(key, value);
    } else {
        el.removeAttribute(key);
    }
};

const updateAllProperties = (
    el: Element & { _class?: string },
    value: Record<string, any>,
    prevValue?: Record<string, any>
) => {
    for (const key in value) {
        setProperty(el, key, value[key], prevValue?.[key]);
    }
    for (const key in prevValue) {
        if (!(key in value)) {
            setProperty(el, key, null);
        }
    }
};

const importantRE = /\s*!important$/;

const setStyle = (
    style: CSSStyleDeclaration,
    name: string,
    val: string | string[]
) => {
    if (isArray(val)) {
        val.forEach(v => setStyle(style, name, v));
    } else {
        const value = importantRE.test(val)
            ? val.replace(importantRE, '')
            : val;
        style.setProperty(name.startsWith('--') ? name : hyphenate(name), value, 'important');
    }
};
