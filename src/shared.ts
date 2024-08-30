const hasOwnProperty = Object.prototype.hasOwnProperty;

export const hasOwn = (
    val: object,
    key: string | symbol,
): key is keyof typeof val => hasOwnProperty.call(val, key);

export const isArray: typeof Array.isArray = Array.isArray;
export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === '[object Map]'
export const isSet = (val: unknown): val is Set<any> =>
  toTypeString(val) === '[object Set]'
export const isDate = (val: unknown): val is Date =>
  toTypeString(val) === '[object Date]'
export const isRegExp = (val: unknown): val is RegExp =>
  toTypeString(val) === '[object RegExp]'
export const isFunction = (val: unknown): val is Function =>
  typeof val === 'function'
export const isString = (val: unknown): val is string => typeof val === 'string'
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'
export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object';

export const objectToString: typeof Object.prototype.toString =
  Object.prototype.toString
export const toTypeString = (value: unknown): string =>
  objectToString.call(value)

const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
    const cache: Record<string, string> = Object.create(null)
    return ((str: string) => {
      const hit = cache[str]
      return hit || (cache[str] = fn(str))
    }) as T
}

const camelizeRE = /-(\w)/g;

export const camelize: (str: string) => string = cacheStringFunction(
  (str: string): string => {
    return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
  },
)

const hyphenateRE = /\B([A-Z])/g

export const hyphenate: (str: string) => string = cacheStringFunction(
    (str: string) => str.replace(hyphenateRE, '-$1').toLowerCase(),
  )

export const capitalize: <T extends string>(str: T) => Capitalize<T> =
  cacheStringFunction(<T extends string>(str: T) => {
    return (str.charAt(0).toUpperCase() + str.slice(1)) as Capitalize<T>
  })

export type NormalizedStyle = Record<string, string | number>

export function normalizeStyle(
    value: unknown,
): NormalizedStyle | string | undefined {
    if (isArray(value)) {
      const res: NormalizedStyle = {}
      for (let i = 0; i < value.length; i++) {
        const item = value[i]
        const normalized = isString(item)
          ? parseStringStyle(item)
          : (normalizeStyle(item) as NormalizedStyle)
        if (normalized) {
          for (const key in normalized) {
            res[key] = normalized[key]
          }
        }
      }
      return res
    } else if (isString(value) || isObject(value)) {
      return value
    }
  }

const listDelimiterRE = /;(?![^(]*\))/g
const propertyDelimiterRE = /:([^]+)/
const styleCommentRE = /\/\*[^]*?\*\//g

export function parseStringStyle(cssText: string): NormalizedStyle {
    const ret: NormalizedStyle = {}
    cssText
      .replace(styleCommentRE, '')
      .split(listDelimiterRE)
      .forEach(item => {
        if (item) {
          const tmp = item.split(propertyDelimiterRE)
          tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim())
        }
      })
    return ret
  }

export function normalizeClass(value: unknown): string {
    let res = '';

    if (isString(value)) {
      res = value
    } 
    else if (isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const normalized = normalizeClass(value[i])
        if (normalized) {
          res += normalized + ' '
        }
      }
    } 
    else if (isObject(value)) {
      for (const name in value) {
        if (value[name]) {
          res += name + ' '
        }
      }
    }

    return res.trim()
}

function looseCompareArrays(a: any[], b: any[]) {
    if (a.length !== b.length) return false
    let equal = true
    for (let i = 0; equal && i < a.length; i++) {
      equal = looseEqual(a[i], b[i])
    }
    return equal
}

export function looseEqual(a: any, b: any): boolean {
    if (a === b) return true
    let aValidType = isDate(a)
    let bValidType = isDate(b)
    if (aValidType || bValidType) {
      return aValidType && bValidType ? a.getTime() === b.getTime() : false
    }
    aValidType = isSymbol(a)
    bValidType = isSymbol(b)
    if (aValidType || bValidType) {
      return a === b
    }
    aValidType = isArray(a)
    bValidType = isArray(b)
    if (aValidType || bValidType) {
      return aValidType && bValidType ? looseCompareArrays(a, b) : false
    }
    aValidType = isObject(a)
    bValidType = isObject(b)
    if (aValidType || bValidType) {
      if (!aValidType || !bValidType) {
        return false
      }
      const aKeysCount = Object.keys(a).length
      const bKeysCount = Object.keys(b).length
      if (aKeysCount !== bKeysCount) {
        return false
      }
      for (const key in a) {
        const aHasKey = a.hasOwnProperty(key)
        const bHasKey = b.hasOwnProperty(key)
        if (
          (aHasKey && !bHasKey) ||
          (!aHasKey && bHasKey) ||
          !looseEqual(a[key], b[key])
        ) {
          return false
        }
      }
    }
    return String(a) === String(b)
}

export function looseIndexOf(arr: any[], val: any): number {
    return arr.findIndex(item => looseEqual(item, val))
}

export const looseToNumber = (val: any): any => {
    const n = parseFloat(val)
    return isNaN(n) ? val : n
}

export const toNumber = (val: any): any => {
    const n = isString(val) ? Number(val) : NaN
    return isNaN(n) ? val : n
}