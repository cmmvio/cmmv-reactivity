import { Directive } from '../directive';

export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object';

export const text: Directive<Text | Element> = ({ el, get, effect, ctx, exp }) => {
    effect(() => {
        const value = get();
        const toDisplay = toDisplayString('' + value ? value : '');
        el.textContent = toDisplay
    })
}

export const toDisplayString = (value: any) =>
  value == null
    ? ''
    : isObject(value)
    ? JSON.stringify(value, null, 2)
    : String(value)