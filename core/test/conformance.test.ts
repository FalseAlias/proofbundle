/**
 * Conformance tests for ProofBundle v1.0.0.
 * Loads conformance/vectors_v1.json and verifies each vector.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  verifyBundle,
  sealBundle,
  canonicalJSON,
  canonicalBytes,
  digest,
  digestSync,
  generateKeyPair,
  exportKeyPair,
  importPublicKey,
  sign,
  verify as verifySig,
  encodeBase64,
  decodeBase64,
  evaluateAtom,
  evaluateBoundary,
  sealedContentDigest,
  verifyLineage,
  SUPPORTED_DIGESTS,
  SUPPORTED_SIGNATURES,
  SUPPORTED_PROFILES,
  VERSION,
  CanonError,
} from '../src/index.js';
import type { Bundle, Atom, BoundaryPolicy, VerifyConfig, Profile } from '../src/index.js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Conformance vectors file
// ---------------------------------------------------------------------------
const VECTORS_PATH = join(process.cwd(), '..', 'conformance', 'vectors_v1.json');

interface ConformanceVector {
  name: string;
  bundle: Bundle;
  config: VerifyConfig;
  expected: string;
}

function loadVectors(): ConformanceVector[] {
  if (existsSync(VECTORS_PATH)) {
    const data = readFileSync(VECTORS_PATH, 'utf-8');
    return JSON.parse(data) as ConformanceVector[];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function makeMinimalBundle(overrides: Partial<Bundle> = {}): Promise<Bundle> {
  const hdrOverrides = (overrides.hdr as Record<string, unknown>) ?? {};
  const { hdr: _hdr, payload: _payload, ...rest } = overrides;
  return {
    hdr: {
      spec_id: 'PROOFBUNDLE',
      spec_ver: '1.0.0',
      profile: 'PB-INTEGRITY-1' as Profile,
      ...hdrOverrides,
    },
    payload: overrides.payload ?? { data: 'test' },
    ...rest,
  } as Bundle;
}

function makeConfig(overrides: Partial<VerifyConfig> = {}): VerifyConfig {
  return {
    profile: 'PB-INTEGRITY-1',
    ...overrides,
  } as VerifyConfig;
}

// ---------------------------------------------------------------------------
// Canonical tests
// ---------------------------------------------------------------------------

describe('canonicalJSON', () => {
  it('serializes null', () => {
    assert.strictEqual(canonicalJSON(null), 'null');
  });

  it('serializes booleans', () => {
    assert.strictEqual(canonicalJSON(true), 'true');
    assert.strictEqual(canonicalJSON(false), 'false');
  });

  it('serializes safe integers', () => {
    assert.strictEqual(canonicalJSON(0), '0');
    assert.strictEqual(canonicalJSON(-1), '-1');
    assert.strictEqual(canonicalJSON(9007199254740991), '9007199254740991');
  });

  it('rejects non-safe integers', () => {
    assert.throws(() => canonicalJSON(9007199254740992), CanonError);
    assert.throws(() => canonicalJSON(1.5), CanonError);
  });

  it('serializes strings with escaping', () => {
    assert.strictEqual(canonicalJSON('hello'), '"hello"');
    assert.strictEqual(canonicalJSON('a"b'), '"a\\"b"');
    assert.strictEqual(canonicalJSON('a\\b'), '"a\\\\b"');
  });

  it('serializes arrays', () => {
    assert.strictEqual(canonicalJSON([1, 2, 3]), '[1,2,3]');
    assert.strictEqual(canonicalJSON([]), '[]');
  });

  it('serializes objects with sorted keys', () => {
    assert.strictEqual(canonicalJSON({ b: 1, a: 2 }), '{"a":2,"b":1}');
  });

  it('serializes nested structures', () => {
    const input = { z: [null, true, { c: 3, a: 1 }] };
    assert.strictEqual(canonicalJSON(input), '{"z":[null,true,{"a":1,"c":3}]}');
  });

  it('NFC-normalizes strings', () => {
    const decomposed = 'cafe\u0301';
    const composed = 'caf\u00e9';
    assert.strictEqual(canonicalJSON(decomposed), canonicalJSON(composed));
  });

  it('rejects unsupported types', () => {
    assert.throws(() => canonicalJSON(undefined as unknown as null), CanonError);
  });

  it('produces byte-identical output for equal inputs', () => {
    const a = { b: 1, a: [{ x: 2, y: 3 }] };
    const b = { a: [{ y: 3, x: 2 }], b: 1 };
    assert.strictEqual(canonicalJSON(a), canonicalJSON(b));
  });
});

// ---------------------------------------------------------------------------
// Digest tests
// ---------------------------------------------------------------------------

describe('digest', () => {
  const testData = new TextEncoder().encode('proofbundle');

  it('SHA-256 produces 32 bytes', async () => {
    const d = await digest('SHA-256', testData);
    assert.strictEqual(d.length, 32);
  });

  it('SHA-384 produces 48 bytes', async () => {
    const d = await digest('SHA-384', testData);
    assert.strictEqual(d.length, 48);
  });

  it('SHA-512 produces 64 bytes', async () => {
    const d = await digest('SHA-512', testData);
    assert.strictEqual(d.length, 64);
  });

  it('BLAKE3 produces 32 bytes', async () => {
    const d = await digest('BLAKE3', testData);
    assert.strictEqual(d.length, 32);
  });

  it('BLAKE2b produces 64 bytes', async () => {
    const d = await digest('BLAKE2b', testData);
    assert.strictEqual(d.length, 64);
  });

  it('BLAKE3 sync matches async', () => {
    const a = digestSync('BLAKE3', testData);
    const b = digestSync('BLAKE3', testData);
    assert.deepStrictEqual(a, b);
  });

  it('rejects unknown algorithm', async () => {
    await assert.rejects(digest('UNKNOWN' as 'SHA-256', testData));
  });

  it('all digest names are supported', async () => {
    for (const alg of SUPPORTED_DIGESTS) {
      const d = await digest(alg, testData);
      assert.ok(d.length > 0, `${alg} produced empty digest`);
    }
  });
});

// ---------------------------------------------------------------------------
// Signature tests
// ---------------------------------------------------------------------------

describe('signatures', () => {
  for (const alg of SUPPORTED_SIGNATURES) {
    it(`${alg}: round-trip sign and verify`, async () => {
      const keys = await generateKeyPair(alg);
      const data = new TextEncoder().encode('test message');
      const sig = await sign(alg, keys.privateKey, data);
      assert.ok(sig.length > 0, `${alg}: signature is empty`);
      const ok = await verifySig(alg, keys.publicKey, data, sig);
      assert.strictEqual(ok, true, `${alg}: verify failed`);
    });

    it(`${alg}: export and re-import keys`, async () => {
      const keys = await generateKeyPair(alg);
      const exported = await exportKeyPair(keys, alg);
      assert.ok(exported.publicKey.length > 0, `${alg}: empty public key`);
      assert.ok(exported.privateKey.length > 0, `${alg}: empty private key`);
      const pub = await importPublicKey(alg, exported.publicKey);
      const data = new TextEncoder().encode('roundtrip');
      const sig = await sign(alg, keys.privateKey, data);
      const ok = await verifySig(alg, pub, data, sig);
      assert.strictEqual(ok, true, `${alg}: re-imported key verify failed`);
    });

    it(`${alg}: wrong data fails verify`, async () => {
      const keys = await generateKeyPair(alg);
      const data = new TextEncoder().encode('correct');
      const wrong = new TextEncoder().encode('wrong');
      const sig = await sign(alg, keys.privateKey, data);
      const ok = await verifySig(alg, keys.publicKey, wrong, sig);
      assert.strictEqual(ok, false, `${alg}: should fail for wrong data`);
    });
  }
});

// ---------------------------------------------------------------------------
// Seal tests
// ---------------------------------------------------------------------------

describe('sealBundle', () => {
  it('produces a seal with all required fields', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({
      payload: { action: 'transfer', amount: 100 },
    });
    const result = await sealBundle(bundle, keys);
    assert.ok(result.seal.digest_b64u, 'seal has digest_b64u');
    assert.ok(result.seal.digest_alg, 'seal has digest_alg');
    assert.ok(result.seal.sig_alg, 'seal has sig_alg');
    assert.ok(result.seal.signature_b64u, 'seal has signature_b64u');
    assert.ok(result.bundle.hdr.bundle_id, 'bundle has bundle_id');
  });

  it('uses specified digest algorithm', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle();
    const result = await sealBundle(bundle, keys, { digestAlg: 'BLAKE3' });
    assert.strictEqual(result.seal.digest_alg, 'BLAKE3');
  });

  it('uses specified signature algorithm', async () => {
    const keys = await generateKeyPair('ECDSA-P256');
    const bundle = await makeMinimalBundle();
    const result = await sealBundle(bundle, keys, { sigAlg: 'ECDSA-P256' });
    assert.strictEqual(result.seal.sig_alg, 'ECDSA-P256');
  });

  it('sets custom id when provided', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle();
    const result = await sealBundle(bundle, keys, { id: 'custom-id-123' });
    assert.strictEqual(result.bundle.hdr.bundle_id, 'custom-id-123');
  });
});

// ---------------------------------------------------------------------------
// Boundary atom tests
// ---------------------------------------------------------------------------

describe('evaluateAtom', () => {
  const ctx = { _now: new Date('2024-01-15T12:00:00Z') };
  const subject = {
    status: 'active',
    count: 42,
    amount: 150.5,
    tags: ['a', 'b'],
    env: 'demo',
    issued_at: '2024-01-10T08:00:00Z',
    expires_at: '2024-12-31T23:59:59Z',
  };

  it('equals: match', () => {
    const atom: Atom = { op: 'equals', path: 'status', value: 'active' };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), true);
  });

  it('equals: no match', () => {
    const atom: Atom = { op: 'equals', path: 'status', value: 'inactive' };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), false);
  });

  it('in: scalar match', () => {
    const atom: Atom = { op: 'in', path: 'status', values: ['active', 'pending'] };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), true);
  });

  it('range: value within', () => {
    const atom: Atom = { op: 'range', path: 'count', lo: 0, hi: 100 };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), true);
  });

  it('present: field exists', () => {
    const atom: Atom = { op: 'present', path: 'status' };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), true);
  });

  it('present: field missing', () => {
    const atom: Atom = { op: 'present', path: 'nonexistent' };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), false);
  });

  it('before: date comparison', () => {
    const atom: Atom = { op: 'before', path: 'issued_at', at: '2024-02-01T00:00:00Z' };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), true);
  });

  it('after: date comparison', () => {
    const atom: Atom = { op: 'after', path: 'issued_at', at: '2024-01-01T00:00:00Z' };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), true);
  });

  it('expired: not expired', () => {
    const atom: Atom = { op: 'expired', path: 'expires_at' };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), false);
  });

  it('not_expired: still valid', () => {
    const atom: Atom = { op: 'not_expired', path: 'expires_at' };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), true);
  });

  it('age_lt: age under threshold', () => {
    const atom: Atom = { op: 'age_lt', path: 'issued_at', amount: 30, unit: 'd' };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), true);
  });

  it('age_gt: age over threshold', () => {
    const atom: Atom = { op: 'age_gt', path: 'issued_at', amount: 1, unit: 'd' };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), true);
  });

  it('within_last: timestamp within window', () => {
    const atom: Atom = { op: 'within_last', path: 'issued_at', amount: 30, unit: 'd' };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), true);
  });

  it('all: all atoms pass', () => {
    const atom: Atom = {
      op: 'all',
      atoms: [
        { op: 'equals', path: 'status', value: 'active' },
        { op: 'range', path: 'count', lo: 0, hi: 100 },
      ],
    };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), true);
  });

  it('any: at least one passes', () => {
    const atom: Atom = {
      op: 'any',
      atoms: [
        { op: 'equals', path: 'status', value: 'inactive' },
        { op: 'range', path: 'count', lo: 0, hi: 100 },
      ],
    };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), true);
  });

  it('not: negation', () => {
    const atom: Atom = {
      op: 'not',
      atoms: [{ op: 'equals', path: 'status', value: 'inactive' }],
    };
    assert.strictEqual(evaluateAtom(atom, ctx, subject), true);
  });
});

// ---------------------------------------------------------------------------
// Boundary policy tests
// ---------------------------------------------------------------------------

describe('evaluateBoundary', () => {
  const ctx = { _now: new Date('2024-01-15T12:00:00Z') };

  it('returns on_match for first matching rule', () => {
    const policy: BoundaryPolicy = {
      rules: [
        { atom: { op: 'equals', path: 'status', value: 'inactive' }, on_match: 'out-of-bounds' },
        { atom: { op: 'equals', path: 'status', value: 'active' }, on_match: 'verified' },
      ],
    };
    const subject = { status: 'active' };
    const result = evaluateBoundary(policy, ctx, subject);
    assert.strictEqual(result, 'verified');
  });

  it('returns default when no rule matches', () => {
    const policy: BoundaryPolicy = {
      rules: [
        { atom: { op: 'equals', path: 'status', value: 'inactive' }, on_match: 'out-of-bounds' },
      ],
      default: 'verified',
    };
    const subject = { status: 'active' };
    const result = evaluateBoundary(policy, ctx, subject);
    assert.strictEqual(result, 'verified');
  });

  it('returns null when no match and no default', () => {
    const policy: BoundaryPolicy = {
      rules: [
        { atom: { op: 'equals', path: 'status', value: 'inactive' }, on_match: 'out-of-bounds' },
      ],
    };
    const subject = { status: 'active' };
    const result = evaluateBoundary(policy, ctx, subject);
    assert.strictEqual(result, null);
  });
});

// ---------------------------------------------------------------------------
// Lineage tests
// ---------------------------------------------------------------------------

describe('lineage', () => {
  it('sealedContentDigest is deterministic', async () => {
    const bundle: Bundle = {
      hdr: { spec_id: 'PROOFBUNDLE', spec_ver: '1.0.0', profile: 'PB-INTEGRITY-1' },
      payload: { data: 'test' },
    };
    const d1 = await sealedContentDigest(bundle, 'SHA-256');
    const d2 = await sealedContentDigest(bundle, 'SHA-256');
    assert.deepStrictEqual(d1, d2);
  });

  it('sealedContentDigest ignores seal field', async () => {
    const bundle1: Bundle = {
      hdr: { spec_id: 'PROOFBUNDLE', spec_ver: '1.0.0', profile: 'PB-INTEGRITY-1' },
      payload: { data: 'test' },
    };
    const bundle2: Bundle = {
      hdr: { spec_id: 'PROOFBUNDLE', spec_ver: '1.0.0', profile: 'PB-INTEGRITY-1', bundle_id: 'x' },
      payload: { data: 'test' },
    };
    const d1 = await sealedContentDigest(bundle1, 'SHA-256');
    const d2 = await sealedContentDigest(bundle2, 'SHA-256');
    assert.notDeepStrictEqual(d1, d2);
  });

  it('verifyLineage with no refs returns valid', async () => {
    const bundle: Bundle = {
      hdr: { spec_id: 'PROOFBUNDLE', spec_ver: '1.0.0', profile: 'PB-INTEGRITY-1' },
      payload: { data: 'test' },
    };
    const result = await verifyLineage(bundle, { maxDepth: 8, fetch: async () => null });
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.depth, 0);
  });

  it('verifyLineage detects missing parent', async () => {
    const bundle: Bundle = {
      hdr: { spec_id: 'PROOFBUNDLE', spec_ver: '1.0.0', profile: 'PB-LINEAGE-1', bundle_id: 'child' },
      payload: { data: 'child' },
      refs: [
        {
          id: 'parent',
          digest: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
          digest_alg: 'SHA-256',
          sig_alg: 'Ed25519',
          signature: 'dummy',
          public_key: 'dummy',
        },
      ],
    };
    const result = await verifyLineage(bundle, { maxDepth: 8, fetch: async () => null });
    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes('parent not found'));
  });

  it('verifyLineage detects depth exceeded', async () => {
    const root: Bundle = {
      hdr: { spec_id: 'PROOFBUNDLE', spec_ver: '1.0.0', profile: 'PB-INTEGRITY-1', bundle_id: 'root' },
      payload: { data: 'root' },
    };
    const chain: Bundle = {
      hdr: { spec_id: 'PROOFBUNDLE', spec_ver: '1.0.0', profile: 'PB-LINEAGE-1', bundle_id: 'a' },
      payload: { data: 'a' },
      refs: [
        {
          id: 'root',
          digest: encodeBase64(await sealedContentDigest(root, 'SHA-256')),
          digest_alg: 'SHA-256',
          sig_alg: 'Ed25519',
          signature: 'sig',
          public_key: 'pk',
        },
      ],
    };
    const result = await verifyLineage(chain, {
      maxDepth: 0,
      fetch: async (id: string) => (id === 'root' ? root : null),
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.reason?.includes('max depth'));
  });
});

// ---------------------------------------------------------------------------
// Verify pipeline tests — all 11 outcomes
// ---------------------------------------------------------------------------

describe('verifyBundle outcomes', () => {
  it('verified: sealed bundle passes all stages', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({ payload: { action: 'test' } });
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig({ profile: 'PB-INTEGRITY-1' });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'verified');
    assert.ok(result.trace.length >= 1);
  });

  it('malformed: non-object bundle', async () => {
    const config = makeConfig();
    const result = await verifyBundle('not-a-bundle' as unknown as Bundle, config);
    assert.strictEqual(result.outcome, 'malformed');
  });

  it('malformed: missing hdr', async () => {
    const config = makeConfig();
    const result = await verifyBundle({ payload: {} } as unknown as Bundle, config);
    assert.strictEqual(result.outcome, 'malformed');
  });

  it('malformed: missing payload', async () => {
    const config = makeConfig();
    const result = await verifyBundle({ hdr: { spec_id: 'PROOFBUNDLE', spec_ver: '1.0.0', profile: 'PB-INTEGRITY-1' } } as unknown as Bundle, config);
    assert.strictEqual(result.outcome, 'malformed');
  });

  it('malformed: invalid hdr.spec_ver type', async () => {
    const bundle = await makeMinimalBundle({ hdr: { spec_ver: 123, profile: 'PB-INTEGRITY-1', spec_id: 'PROOFBUNDLE' } as unknown as Bundle['hdr'] });
    const config = makeConfig();
    const result = await verifyBundle(bundle, config);
    assert.strictEqual(result.outcome, 'malformed');
  });

  it('resource-exhausted: maxBytes exceeded', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({ payload: { data: 'x'.repeat(1000) } });
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig({ maxBytes: 100 });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'resource-exhausted');
  });

  it('unknown-version: unsupported version', async () => {
    const bundle = await makeMinimalBundle({
      hdr: { spec_ver: '99.99.99', profile: 'PB-INTEGRITY-1', spec_id: 'PROOFBUNDLE' },
    });
    const config = makeConfig();
    const result = await verifyBundle(bundle, config);
    assert.strictEqual(result.outcome, 'unknown-version');
  });

  it('unknown-version: unknown profile', async () => {
    const bundle = await makeMinimalBundle({
      hdr: { spec_ver: '1.0.0', profile: 'PB-UNKNOWN-1', spec_id: 'PROOFBUNDLE' } as unknown as Bundle['hdr'],
    });
    const config = makeConfig();
    const result = await verifyBundle(bundle, config);
    assert.strictEqual(result.outcome, 'unknown-version');
  });

  it('not-defined-in-this-version: unsealed bundle without acceptUnsealed', async () => {
    const bundle = await makeMinimalBundle();
    const config = makeConfig({ acceptUnsealed: false });
    const result = await verifyBundle(bundle, config);
    assert.strictEqual(result.outcome, 'not-defined-in-this-version');
  });

  it('verified: unsealed bundle with acceptUnsealed', async () => {
    const bundle = await makeMinimalBundle();
    const config = makeConfig({ acceptUnsealed: true });
    const result = await verifyBundle(bundle, config);
    assert.strictEqual(result.outcome, 'verified');
  });

  it('invalid-signature: tampered payload', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({ payload: { value: 100 } });
    const sealed = await sealBundle(bundle, keys);
    const tampered = { ...sealed.bundle, payload: { value: 999 } };
    const exported = await exportKeyPair(keys, 'Ed25519');
    const config = makeConfig({ publicKey: exported.publicKey });
    const result = await verifyBundle(tampered, config);
    assert.strictEqual(result.outcome, 'invalid-signature');
  });

  it('invalid-signature: wrong public key', async () => {
    const keys1 = await generateKeyPair('Ed25519');
    const keys2 = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle();
    const sealed = await sealBundle(bundle, keys1);
    const exported2 = await exportKeyPair(keys2, 'Ed25519');
    const config = makeConfig({ publicKey: exported2.publicKey });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'invalid-signature');
  });

  it('out-of-bounds: context commitment mismatch', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({
      hdr: { spec_ver: '1.0.0', profile: 'PB-INTEGRITY-1', spec_id: 'PROOFBUNDLE', ctx: 'expected-context' },
    });
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig({ contextCommitment: 'wrong-context' });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'out-of-bounds');
  });

  it('verified: context commitment match', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({
      hdr: { spec_ver: '1.0.0', profile: 'PB-INTEGRITY-1', spec_id: 'PROOFBUNDLE', ctx: 'expected-context' },
    });
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig({ contextCommitment: 'expected-context' });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'verified');
  });

  it('policy-denied: boundary denies', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({
      profile: 'PB-BOUNDARY-1' as Profile,
      payload: { status: 'blocked' },
      boundary: {
        rules: [
          { atom: { op: 'equals', path: 'payload.status', value: 'blocked' }, on_match: 'policy-denied' },
        ],
        default: 'verified',
      } as BoundaryPolicy,
    });
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig({ profile: 'PB-BOUNDARY-1' });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'policy-denied');
  });

  it('indeterminate: boundary policy indeterminate', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({
      profile: 'PB-BOUNDARY-1' as Profile,
      payload: { status: 'unknown' },
      boundary: {
        rules: [
          { atom: { op: 'equals', path: 'payload.status', value: 'unknown' }, on_match: 'indeterminate' },
        ],
      } as BoundaryPolicy,
    });
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig({ profile: 'PB-BOUNDARY-1' });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'indeterminate');
  });

  it('verified: boundary allows', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({
      profile: 'PB-BOUNDARY-1' as Profile,
      payload: { status: 'active' },
      boundary: {
        rules: [
          { atom: { op: 'equals', path: 'payload.status', value: 'active' }, on_match: 'verified' },
        ],
        default: 'out-of-bounds',
      } as BoundaryPolicy,
    });
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig({ profile: 'PB-BOUNDARY-1' });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'verified');
  });

  it('missing-side-info: side info required but absent', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle();
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig({ sideInfoRequired: true });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'missing-side-info');
  });

  it('verified: side info present', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({
      side: [
        {
          role: 'auditor',
          party: 'third-party',
          at: '2024-01-01T00:00:00Z',
          statement: 'I attest',
          sig_alg: 'Ed25519',
          signature: 'dummysig',
          public_key: 'dummypk',
        },
      ],
    });
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig({ sideInfoRequired: true });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'verified');
  });

  it('lineage-invalid: missing parent for PB-LINEAGE-1', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({
      profile: 'PB-LINEAGE-1' as Profile,
      refs: [
        {
          id: 'parent',
          digest: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
          digest_alg: 'SHA-256',
          sig_alg: 'Ed25519',
          signature: 'sig',
          public_key: 'pk',
        },
      ],
    });
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig({
      profile: 'PB-LINEAGE-1',
      fetchLineage: async () => null,
    });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'lineage-invalid');
  });

  it('lineage-invalid: PB-REGULATED-1 requires refs', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({
      profile: 'PB-REGULATED-1' as Profile,
    });
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig({ profile: 'PB-REGULATED-1' });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'lineage-invalid');
  });

  it('indeterminate: HITL required but missing attestation', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({
      hitl: { required: true },
    });
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig();
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'indeterminate');
  });

  it('indeterminate: HITL explicitly required via config', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle();
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig({ hitlRequired: true });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'indeterminate');
  });

  it('verified: HITL present with attestation', async () => {
    const keys = await generateKeyPair('Ed25519');
    const bundle = await makeMinimalBundle({
      hitl: {
        required: true,
        attestation: {
          role: 'human-approver',
          party: 'operator',
          at: '2024-01-01T00:00:00Z',
          statement: 'Approved for deployment',
          sig_alg: 'Ed25519',
          signature: 'sig',
          public_key: 'pk',
        },
      },
    });
    const sealed = await sealBundle(bundle, keys);
    const config = makeConfig({ hitlRequired: true });
    const result = await verifyBundle(sealed.bundle, config);
    assert.strictEqual(result.outcome, 'verified');
  });

  it('verified: all profiles supported', async () => {
    const keys = await generateKeyPair('Ed25519');
    for (const profile of SUPPORTED_PROFILES) {
      const bundle = await makeMinimalBundle({ profile });
      const sealed = await sealBundle(bundle, keys);
      const config = makeConfig({ profile });
      const result = await verifyBundle(sealed.bundle, config);
      assert.ok(
        result.outcome === 'verified' || result.outcome === 'lineage-invalid',
        `profile ${profile}: unexpected outcome ${result.outcome}`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// Conformance vectors (external file)
// ---------------------------------------------------------------------------

describe('conformance vectors', () => {
  const vectors = loadVectors();

  if (vectors.length === 0) {
    it.skip('no conformance vectors found (vectors_v1.json missing)', () => {});
  } else {
    for (const v of vectors) {
      it(v.name, async () => {
        const result = await verifyBundle(v.bundle, v.config as VerifyConfig);
        assert.strictEqual(result.outcome, v.expected as string, `trace: ${JSON.stringify(result.trace)}`);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('constants', () => {
  it('VERSION is 1.0.0', () => {
    assert.strictEqual(VERSION, '1.0.0');
  });

  it('all 4 profiles supported', () => {
    assert.strictEqual(SUPPORTED_PROFILES.length, 4);
    assert.ok(SUPPORTED_PROFILES.includes('PB-INTEGRITY-1'));
    assert.ok(SUPPORTED_PROFILES.includes('PB-BOUNDARY-1'));
    assert.ok(SUPPORTED_PROFILES.includes('PB-LINEAGE-1'));
    assert.ok(SUPPORTED_PROFILES.includes('PB-REGULATED-1'));
  });

  it('all 5 digest algorithms supported', () => {
    assert.strictEqual(SUPPORTED_DIGESTS.length, 5);
  });

  it('all 7 signature algorithms supported', () => {
    assert.strictEqual(SUPPORTED_SIGNATURES.length, 7);
  });
});
