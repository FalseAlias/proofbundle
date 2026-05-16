/**
 * Boundary policy evaluation.
 * evaluateAtom and evaluateBoundary with all defined atoms.
 */

import type { Atom, AtomOp, AtomValue, BoundaryPolicy, BoundaryRule, Outcome } from './types.js';

export class BoundaryError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'BoundaryError';
  }
}

export interface BoundaryCtx {
  [key: string]: unknown;
  _now?: Date;
}

function resolvePath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function toDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === 'string') {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof v === 'number') {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function now(ctx: BoundaryCtx): Date {
  return ctx._now ?? new Date();
}

/**
 * Parse a vector-style boundary atom into the internal Atom format.
 * Vector format: { "equals": ["env", "demo"] }
 * Internal format: { op: "equals", path: "env", value: "demo" }
 */
export function parseVectorAtom(value: unknown): Atom | null {
  if (typeof value !== 'object' || value === null) return null;
  const obj = value as Record<string, unknown>;

  // Compound operators
  if ('all' in obj) {
    const items = (obj.all as unknown[]).map(v => parseVectorAtom(v)).filter((a): a is Atom => a !== null);
    return { op: 'all', atoms: items };
  }
  if ('any' in obj) {
    const items = (obj.any as unknown[]).map(v => parseVectorAtom(v)).filter((a): a is Atom => a !== null);
    return { op: 'any', atoms: items };
  }
  if ('not' in obj) {
    const items = (obj.not as unknown[]).map(v => parseVectorAtom(v)).filter((a): a is Atom => a !== null);
    return { op: 'not', atoms: items };
  }

  // Leaf operators
  const ops: AtomOp[] = [
    'equals', 'in', 'range', 'present', 'before', 'after', 'within',
    'expired', 'not_expired', 'age_lt', 'age_gt', 'within_last', 'within_next',
  ];

  for (const op of ops) {
    if (op in obj) {
      return parseLeafAtom(op, obj[op]);
    }
  }

  return null;
}

function parseLeafAtom(op: AtomOp, raw: unknown): Atom | null {
  switch (op) {
    case 'equals': {
      const arr = raw as [string, unknown];
      return { op, path: arr[0], value: arr[1] as Atom['value'] };
    }
    case 'in': {
      const arr = raw as [string, unknown];
      const val = arr[1];
      if (Array.isArray(val)) {
        return { op, path: arr[0], values: val as AtomValue[] };
      }
      return { op, path: arr[0], values: [val as AtomValue] };
    }
    case 'range': {
      const arr = raw as [string, number, number];
      return { op, path: arr[0], lo: arr[1], hi: arr[2] };
    }
    case 'present': {
      const path = typeof raw === 'string' ? raw : String(raw);
      return { op, path };
    }
    case 'before':
    case 'after': {
      const arr = raw as [string, string];
      return { op, path: arr[0], at: arr[1] };
    }
    case 'within': {
      const arr = raw as [string, string, string];
      return { op, path: arr[0], of: arr[1], at: arr[2] };
    }
    case 'expired':
    case 'not_expired': {
      const path = typeof raw === 'string' ? raw : String(raw);
      return { op, path };
    }
    case 'age_lt':
    case 'age_gt':
    case 'within_last':
    case 'within_next': {
      const arr = raw as [string, string];
      const parsed = parseDuration(arr[1]);
      return { op, path: arr[0], amount: parsed.amount, unit: parsed.unit };
    }
    default:
      return null;
  }
}

function parseDuration(s: string): { amount: number; unit: string } {
  const m = s.match(/^(\d+)([a-z]+)$/i);
  if (!m) return { amount: 0, unit: 'ms' };
  return { amount: parseInt(m[1], 10), unit: m[2] };
}

export function evaluateAtom(atom: Atom, ctx: BoundaryCtx, subject: Record<string, unknown>): boolean {
  const op = atom.op;
  switch (op) {
    case 'equals': {
      const val = resolvePath(subject, atom.path ?? '');
      return val === atom.value;
    }
    case 'in': {
      const val = resolvePath(subject, atom.path ?? '');
      const target = atom.values ?? (atom.value !== undefined ? [atom.value] : []);
      if (Array.isArray(target)) {
        if (Array.isArray(val)) {
          return (val as unknown[]).every(v => (target as unknown[]).includes(v));
        }
        return (target as unknown[]).includes(val);
      }
      return false;
    }
    case 'range': {
      const val = resolvePath(subject, atom.path ?? '');
      if (typeof val !== 'number') return false;
      const lo = typeof atom.lo === 'number' ? atom.lo : -Infinity;
      const hi = typeof atom.hi === 'number' ? atom.hi : Infinity;
      return val >= lo && val <= hi;
    }
    case 'present': {
      const val = resolvePath(subject, atom.path ?? '');
      return val !== undefined && val !== null;
    }
    case 'before': {
      const val = toDate(resolvePath(subject, atom.path ?? ''));
      const target = toDate(atom.at);
      if (!val || !target) return false;
      return val.getTime() < target.getTime();
    }
    case 'after': {
      const val = toDate(resolvePath(subject, atom.path ?? ''));
      const target = toDate(atom.at);
      if (!val || !target) return false;
      return val.getTime() > target.getTime();
    }
    case 'within': {
      const val = toDate(resolvePath(subject, atom.path ?? ''));
      const start = toDate(atom.of);
      const end = toDate(atom.at);
      if (!val || !start || !end) return false;
      return val.getTime() >= start.getTime() && val.getTime() <= end.getTime();
    }
    case 'expired': {
      const val = toDate(resolvePath(subject, atom.path ?? ''));
      const n = now(ctx);
      if (!val) return false;
      return val.getTime() < n.getTime();
    }
    case 'not_expired': {
      const val = toDate(resolvePath(subject, atom.path ?? ''));
      const n = now(ctx);
      if (!val) return false;
      return val.getTime() >= n.getTime();
    }
    case 'age_lt': {
      const val = toDate(resolvePath(subject, atom.path ?? ''));
      if (!val) return false;
      const n = now(ctx);
      const amount = typeof atom.amount === 'number' ? atom.amount : 0;
      const unit = atom.unit ?? 'ms';
      const diff = n.getTime() - val.getTime();
      return diff < toMs(amount, unit);
    }
    case 'age_gt': {
      const val = toDate(resolvePath(subject, atom.path ?? ''));
      if (!val) return false;
      const n = now(ctx);
      const amount = typeof atom.amount === 'number' ? atom.amount : 0;
      const unit = atom.unit ?? 'ms';
      const diff = n.getTime() - val.getTime();
      return diff > toMs(amount, unit);
    }
    case 'within_last': {
      const val = toDate(resolvePath(subject, atom.path ?? ''));
      if (!val) return false;
      const n = now(ctx);
      const amount = typeof atom.amount === 'number' ? atom.amount : 0;
      const unit = atom.unit ?? 'ms';
      const diff = n.getTime() - val.getTime();
      return diff >= 0 && diff <= toMs(amount, unit);
    }
    case 'within_next': {
      const val = toDate(resolvePath(subject, atom.path ?? ''));
      if (!val) return false;
      const n = now(ctx);
      const amount = typeof atom.amount === 'number' ? atom.amount : 0;
      const unit = atom.unit ?? 'ms';
      const diff = val.getTime() - n.getTime();
      return diff >= 0 && diff <= toMs(amount, unit);
    }
    case 'all': {
      const atoms = atom.atoms ?? [];
      return atoms.every(a => evaluateAtom(a as Atom, ctx, subject));
    }
    case 'any': {
      const atoms = atom.atoms ?? [];
      return atoms.some(a => evaluateAtom(a as Atom, ctx, subject));
    }
    case 'not': {
      const atoms = atom.atoms ?? [];
      if (atoms.length === 0) return true;
      return !evaluateAtom(atoms[0] as Atom, ctx, subject);
    }
    default: {
      const exhaustive: never = op;
      void exhaustive;
      return false;
    }
  }
}

function toMs(amount: number, unit: string): number {
  switch (unit) {
    case 'ms': return amount;
    case 's': return amount * 1000;
    case 'm': return amount * 60 * 1000;
    case 'h': return amount * 60 * 60 * 1000;
    case 'd': return amount * 24 * 60 * 60 * 1000;
    case 'w': return amount * 7 * 24 * 60 * 60 * 1000;
    case 'y': return amount * 365.25 * 24 * 60 * 60 * 1000;
    default: return amount;
  }
}

export function evaluateBoundary(
  policy: BoundaryPolicy,
  ctx: BoundaryCtx,
  subject: Record<string, unknown>
): Outcome | null {
  if (!policy.rules || policy.rules.length === 0) {
    return policy.default ?? null;
  }
  for (const rule of policy.rules) {
    if (evaluateAtom(rule.atom, ctx, subject)) {
      return rule.on_match;
    }
  }
  return policy.default ?? null;
}
