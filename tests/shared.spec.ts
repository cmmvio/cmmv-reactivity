import { describe, it, expect } from 'vitest';
import {
  hasOwn,
  isArray,
  isMap,
  isSet,
  isDate,
  isRegExp,
  isFunction,
  isString,
  isSymbol,
  isObject,
  camelize,
  hyphenate,
  capitalize,
  normalizeStyle,
  parseStringStyle,
  normalizeClass,
  looseEqual,
  looseIndexOf,
  looseToNumber,
  toNumber
} from '../src/shared';

describe('Utility Functions', () => {
    it('should correctly identify hasOwn properties', () => {
        const obj = { foo: 'bar' };
        expect(hasOwn(obj, 'foo')).toBe(true);
        expect(hasOwn(obj, 'baz')).toBe(false);
    });

    it('should correctly identify array', () => {
        expect(isArray([1, 2, 3])).toBe(true);
        expect(isArray('not an array')).toBe(false);
    });

    it('should correctly identify map', () => {
        expect(isMap(new Map())).toBe(true);
        expect(isMap({})).toBe(false);
    });

    it('should correctly identify set', () => {
        expect(isSet(new Set())).toBe(true);
        expect(isSet({})).toBe(false);
    });

    it('should correctly identify date', () => {
        expect(isDate(new Date())).toBe(true);
        expect(isDate('2021-01-01')).toBe(false);
    });

    it('should correctly identify regexp', () => {
        expect(isRegExp(/test/)).toBe(true);
        expect(isRegExp('not a regex')).toBe(false);
    });

    it('should correctly identify function', () => {
        expect(isFunction(() => {})).toBe(true);
        expect(isFunction(123)).toBe(false);
    });

    it('should correctly identify string', () => {
        expect(isString('hello')).toBe(true);
        expect(isString(123)).toBe(false);
    });

    it('should correctly identify symbol', () => {
        expect(isSymbol(Symbol('test'))).toBe(true);
        expect(isSymbol('not a symbol')).toBe(false);
    });

    it('should correctly identify object', () => {
        expect(isObject({})).toBe(true);
        expect(isObject(null)).toBe(false);
    });

    it('should camelize strings', () => {
        expect(camelize('hello-world')).toBe('helloWorld');
        expect(camelize('some-string-value')).toBe('someStringValue');
    });

    it('should hyphenate camelCase strings', () => {
        expect(hyphenate('helloWorld')).toBe('hello-world');
        expect(hyphenate('someStringValue')).toBe('some-string-value');
    });

    it('should capitalize strings', () => {
        expect(capitalize('hello')).toBe('Hello');
        expect(capitalize('world')).toBe('World');
    });

    it('should normalize styles', () => {
        expect(normalizeStyle('color: red; font-size: 12px;')).toEqual("color: red; font-size: 12px;");

        expect(normalizeStyle({ color: 'blue' })).toEqual({
            color: 'blue'
        });

        expect(normalizeStyle(['color: red', { fontSize: 12 }])).toEqual({
            color: 'red',
            fontSize: 12
        });
    });

    it('should parse string style', () => {
        const styleString = 'color: red; font-size: 12px;';
        expect(parseStringStyle(styleString)).toEqual({
        color: 'red',
        'font-size': '12px'
        });
    });

    it('should normalize class', () => {
        expect(normalizeClass('foo')).toBe('foo');
        expect(normalizeClass(['foo', 'bar'])).toBe('foo bar');
        expect(normalizeClass({ foo: true, bar: false })).toBe('foo');
    });

    it('should compare loosely equal values', () => {
        expect(looseEqual(1, 1)).toBe(true);
        expect(looseEqual('1', 1)).toBe(true);
        expect(looseEqual([1, 2], [1, 2])).toBe(true);
        expect(looseEqual({ a: 1 }, { a: 1 })).toBe(true);
        expect(looseEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    it('should find index of loosely equal values in array', () => {
        expect(looseIndexOf([1, '2', 3], 2)).toBe(1);
        expect(looseIndexOf([{ a: 1 }, { b: 2 }], { b: 2 })).toBe(1);
    });

    it('should convert loose strings to numbers', () => {
        expect(looseToNumber('123')).toBe(123);
        expect(looseToNumber('abc')).toBe('abc');
    });

    it('should convert strings to numbers', () => {
        expect(toNumber('123')).toBe(123);
        expect(toNumber('abc')).toBe('abc');
    });
});
