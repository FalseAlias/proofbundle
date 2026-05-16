/**
 * PB-CANON-JSON-1 canonicalization.
 * Deterministic JSON serialization over a restricted subset.
 */

export type CanonValue = null | boolean | number | string | CanonValue[] | CanonObject;
export interface CanonObject { [key: string]: CanonValue }

const enum Tag { Null, True, False, Integer, String, Array, Object }

type Tagged =
  | { t: Tag.Null; v: null }
  | { t: Tag.True; v: true }
  | { t: Tag.False; v: false }
  | { t: Tag.Integer; v: number }
  | { t: Tag.String; v: string }
  | { t: Tag.Array; v: Tagged[] }
  | { t: Tag.Object; v: Map<string, Tagged> };

function isSafeInteger(n: number): boolean {
  return Number.isInteger(n) && n >= -(2 ** 53 - 1) && n <= 2 ** 53 - 1;
}

function classify(v: unknown, path: string): Tagged {
  switch (typeof v) {
    case 'boolean':
      return v ? { t: Tag.True, v: true } : { t: Tag.False, v: false };
    case 'number': {
      if (!Number.isFinite(v) || !isSafeInteger(v)) {
        throw new CanonError(`non-safe-integer number at ${path}: ${v}`);
      }
      return { t: Tag.Integer, v };
    }
    case 'string': {
      const s = v.normalize('NFC');
      for (let i = 0; i < s.length; i++) {
        const cp = s.charCodeAt(i);
        if (cp >= 0xd800 && cp <= 0xdfff) {
          throw new CanonError(`unpaired surrogate at ${path}`);
        }
      }
      return { t: Tag.String, v: s };
    }
    case 'object': {
      if (v === null) return { t: Tag.Null, v: null };
      if (Array.isArray(v)) {
        const items: Tagged[] = [];
        for (let i = 0; i < v.length; i++) {
          items.push(classify(v[i], `${path}[${i}]`));
        }
        return { t: Tag.Array, v: items };
      }
      const map = new Map<string, Tagged>();
      const obj = v as Record<string, unknown>;
      const keys = Object.keys(obj).sort();
      for (const k of keys) {
        map.set(k, classify(obj[k], `${path}.${k}`));
      }
      return { t: Tag.Object, v: map };
    }
    default:
      throw new CanonError(`unsupported type at ${path}: ${typeof v}`);
  }
}

function emit(t: Tagged): string {
  switch (t.t) {
    case Tag.Null:
      return 'null';
    case Tag.True:
      return 'true';
    case Tag.False:
      return 'false';
    case Tag.Integer:
      return String(t.v);
    case Tag.String:
      return quote(t.v);
    case Tag.Array: {
      const items = t.v.map(emit);
      return '[' + items.join(',') + ']';
    }
    case Tag.Object: {
      const parts: string[] = [];
      for (const [k, v] of t.v) {
        parts.push(quote(k) + ':' + emit(v));
      }
      return '{' + parts.join(',') + '}';
    }
  }
}

function quote(s: string): string {
  let out = '"';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 0x22) { out += '\\"'; continue; }
    if (c === 0x5c) { out += '\\\\'; continue; }
    if (c === 0x08) { out += '\\b'; continue; }
    if (c === 0x0c) { out += '\\f'; continue; }
    if (c === 0x0a) { out += '\\n'; continue; }
    if (c === 0x0d) { out += '\\r'; continue; }
    if (c === 0x09) { out += '\\t'; continue; }
    if (c < 0x20) {
      out += '\\u' + c.toString(16).padStart(4, '0');
      continue;
    }
    out += s[i];
  }
  out += '"';
  return out;
}

export class CanonError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'CanonError';
  }
}

export function canonicalJSON(value: unknown): string {
  const tagged = classify(value, '$');
  return emit(tagged);
}

export function canonicalBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(canonicalJSON(value));
}
