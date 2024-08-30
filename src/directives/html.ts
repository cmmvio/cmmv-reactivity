import { Directive } from '../directive'

export const html: Directive = ({ el, get, effect }) => {
    effect(() => {
        el.innerHTML = get()
    });
};