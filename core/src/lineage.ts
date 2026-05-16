/**
 * Parent reference resolution, sealedContentDigest, and lineage verification.
 * Includes cycle detection and depth budget enforcement.
 */

import { canonicalBytes } from './canonical.js';
import { digest } from './digest.js';
import type { Bundle, DigestAlgorithm } from './types.js';

export class LineageError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'LineageError';
  }
}

export interface LineageVerifyConfig {
  maxDepth: number;
  fetch: (id: string, digest: string) => Promise<Bundle | null>;
  trustedKeys?: Set<string>;
}

export interface LineageResult {
  valid: boolean;
  reason?: string;
  depth: number;
}

function stripSealFromHeader(hdr: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...hdr };
  return copy;
}

function bytesToBase64(u8: Uint8Array): string {
  if (typeof globalThis !== 'undefined' && 'Buffer' in globalThis) {
    return (globalThis as unknown as { Buffer: { from: (u: Uint8Array) => { toString: (enc: string) => string } } }).Buffer.from(u8).toString('base64');
  }
  const bin = Array.from(u8, b => String.fromCharCode(b)).join('');
  return btoa(bin);
}

export function sealedContentDigestInput(bundle: Bundle): Record<string, unknown> {
  const result: Record<string, unknown> = {
    hdr: stripSealFromHeader(bundle.hdr as Record<string, unknown>),
    payload: bundle.payload,
  };
  if (bundle.meta !== undefined) {
    result.meta = bundle.meta as Record<string, unknown>;
  }
  if (bundle.refs !== undefined && bundle.refs.length > 0) {
    result.refs = bundle.refs;
  }
  return result;
}

export async function sealedContentDigest(
  bundle: Bundle,
  alg: DigestAlgorithm
): Promise<Uint8Array> {
  const input = sealedContentDigestInput(bundle);
  const bytes = canonicalBytes(input);
  return digest(alg, bytes);
}

export async function verifyLineage(
  bundle: Bundle,
  config: LineageVerifyConfig,
  visited: Set<string> = new Set()
): Promise<LineageResult> {
  if (!bundle.refs || bundle.refs.length === 0) {
    return { valid: true, depth: 0 };
  }

  if (visited.size >= config.maxDepth) {
    return { valid: false, reason: 'resource-exhausted: max depth exceeded', depth: visited.size };
  }

  const hdrId = bundle.hdr.bundle_id ?? '';
  if (hdrId) {
    if (visited.has(hdrId)) {
      return { valid: false, reason: 'cycle detected', depth: visited.size };
    }
    visited.add(hdrId);
  }

  for (const ref of bundle.refs) {
    const parent = await config.fetch(ref.id, ref.digest);
    if (!parent) {
      return { valid: false, reason: `parent not found: ${ref.id}`, depth: visited.size };
    }

    const parentDigest = await sealedContentDigest(parent, ref.digest_alg);
    const parentDigestB64 = bytesToBase64(parentDigest);
    if (parentDigestB64 !== ref.digest) {
      return { valid: false, reason: `parent digest mismatch: ${ref.id}`, depth: visited.size };
    }

    if (config.trustedKeys && config.trustedKeys.size > 0) {
      const pkMatch = config.trustedKeys.has(ref.public_key);
      if (!pkMatch) {
        return { valid: false, reason: `parent key not trusted: ${ref.id}`, depth: visited.size };
      }
    }

    const sub = await verifyLineage(parent, config, new Set(visited));
    if (!sub.valid) {
      return { valid: false, reason: sub.reason, depth: sub.depth };
    }
  }

  return { valid: true, depth: visited.size };
}
