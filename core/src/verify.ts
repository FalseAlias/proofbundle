/**
 * verifyBundle — 11-stage verification pipeline.
 * Returns { outcome, trace } for every bundle.
 */

import type {
  Bundle, Outcome, TraceStep, VerifyConfig, VerifyResult,
  Header, Seal, Meta, ParentRef, SideAttestation, HITL,
  Profile, DigestAlgorithm, SignatureAlgorithm,
} from './types.js';
import { canonicalBytes, CanonError } from './canonical.js';
import { digest } from './digest.js';
import { verify, importPublicKey, decodeBase64url } from './signature.js';
import { evaluateBoundary, evaluateAtom, parseVectorAtom } from './boundary.js';
import type { BoundaryCtx } from './boundary.js';
import { verifyLineage, sealedContentDigest } from './lineage.js';

export class VerifyError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'VerifyError';
  }
}

export async function verifyBundle(
  bundle: Bundle,
  config: VerifyConfig
): Promise<VerifyResult> {
  const trace: TraceStep[] = [];

  const fail = (outcome: Outcome, stage: string, detail: string): VerifyResult => {
    trace.push({ stage, outcome, detail, passed: false });
    return { outcome, trace };
  };

  // Stage 1: Parse
  const parseResult = stageParse(bundle);
  if (!parseResult.ok) {
    return fail('malformed', 'parse', parseResult.reason ?? 'parse failed');
  }
  trace.push({ stage: 'parse', passed: true });

  // Stage 2: Schema validation
  const schemaResult = stageSchema(bundle);
  if (!schemaResult.ok) {
    return fail('malformed', 'schema', schemaResult.reason ?? 'schema failed');
  }
  trace.push({ stage: 'schema', passed: true });

  // Stage 3: Resource budget
  const resourceResult = stageResourceBudget(bundle, config);
  if (!resourceResult.ok) {
    return fail('resource-exhausted', 'resource-budget', resourceResult.reason ?? 'resource budget exceeded');
  }
  trace.push({ stage: 'resource-budget', passed: true });

  // Stage 4: Version
  const versionResult = stageVersion(bundle);
  if (!versionResult.ok) {
    return fail('unknown-version', 'version', versionResult.reason ?? 'version check failed');
  }
  trace.push({ stage: 'version', passed: true });

  // Stage 5: Canonical integrity
  const canonicalResult = await stageCanonical(bundle, config);
  if (!canonicalResult.ok) {
    const oc: Outcome = canonicalResult.outcome ?? 'invalid-signature';
    return fail(oc, 'canonical', canonicalResult.reason ?? 'canonical failed');
  }
  trace.push({ stage: 'canonical', passed: true });

  // Stage 6: Cryptographic integrity (seal)
  const integrityResult = await stageIntegrity(bundle, config);
  if (!integrityResult.ok) {
    const oc: Outcome = integrityResult.outcome ?? 'invalid-signature';
    return fail(oc, 'integrity', integrityResult.reason ?? 'integrity failed');
  }
  trace.push({ stage: 'integrity', passed: true });

  // Stage 7: Context commitment
  const contextResult = stageContextCommitment(bundle, config);
  if (!contextResult.ok) {
    return fail('out-of-bounds', 'context-commitment', contextResult.reason ?? 'context commitment failed');
  }
  trace.push({ stage: 'context-commitment', passed: true });

  // Stage 8: Boundary policy
  const boundaryResult = stageBoundary(bundle, config);
  if (!boundaryResult.ok) {
    const oc: Outcome = boundaryResult.outcome ?? 'out-of-bounds';
    return fail(oc, 'boundary', boundaryResult.reason ?? 'boundary denied');
  }
  trace.push({ stage: 'boundary', passed: true });

  // Stage 9: Side info
  const sideResult = stageSideInfo(bundle, config);
  if (!sideResult.ok) {
    return fail('missing-side-info', 'side-info', sideResult.reason ?? 'side info missing');
  }
  trace.push({ stage: 'side-info', passed: true });

  // Stage 10: Lineage
  const lineageResult = await stageLineage(bundle, config);
  if (!lineageResult.ok) {
    const oc: Outcome = lineageResult.outcome ?? 'lineage-invalid';
    return fail(oc, 'lineage', lineageResult.reason ?? 'lineage failed');
  }
  trace.push({ stage: 'lineage', passed: true });

  // Stage 11: HITL
  const hitlResult = stageHITL(bundle, config);
  if (!hitlResult.ok) {
    const oc: Outcome = hitlResult.outcome ?? 'indeterminate';
    return fail(oc, 'hitl', hitlResult.reason ?? 'HITL failed');
  }
  trace.push({ stage: 'hitl', passed: true });

  return { outcome: 'verified', trace };
}

interface StageResult {
  ok: boolean;
  reason?: string;
  outcome?: Outcome;
}

function stageParse(bundle: unknown): StageResult {
  if (bundle === null || typeof bundle !== 'object') {
    return { ok: false, reason: 'bundle is not an object' };
  }
  const b = bundle as Record<string, unknown>;
  if (!('hdr' in b)) {
    return { ok: false, reason: 'missing hdr' };
  }
  const hdr = b.hdr;
  if (!hdr || typeof hdr !== 'object') {
    return { ok: false, reason: 'hdr is not an object' };
  }
  if (!('payload' in b)) {
    return { ok: false, reason: 'missing payload' };
  }
  return { ok: true };
}

function stageSchema(bundle: Record<string, unknown>): StageResult {
  const hdr = bundle.hdr as Record<string, unknown>;
  if (typeof hdr.spec_id !== 'string') {
    return { ok: false, reason: 'hdr.spec_id must be string' };
  }
  if (typeof hdr.spec_ver !== 'string') {
    return { ok: false, reason: 'hdr.spec_ver must be string' };
  }
  if (typeof hdr.profile !== 'string') {
    return { ok: false, reason: 'hdr.profile must be string' };
  }
  if (hdr.bundle_id !== undefined && typeof hdr.bundle_id !== 'string') {
    return { ok: false, reason: 'hdr.bundle_id must be string' };
  }

  if (bundle.seal !== undefined) {
    const seal = bundle.seal as Record<string, unknown>;
    if (typeof seal.digest_b64u !== 'string') return { ok: false, reason: 'seal.digest_b64u must be string' };
    if (typeof seal.digest_alg !== 'string') return { ok: false, reason: 'seal.digest_alg must be string' };
    if (typeof seal.sig_alg !== 'string') return { ok: false, reason: 'seal.sig_alg must be string' };
    if (typeof seal.signature_b64u !== 'string') return { ok: false, reason: 'seal.signature_b64u must be string' };
  }

  if (bundle.refs !== undefined) {
    if (!Array.isArray(bundle.refs)) {
      return { ok: false, reason: 'refs must be array' };
    }
    // Vectors use empty refs arrays; only validate if non-empty
    for (let i = 0; i < (bundle.refs as unknown[]).length; i++) {
      const ref = (bundle.refs as Record<string, unknown>[])[i];
      if (typeof ref.id !== 'string') return { ok: false, reason: `refs[${i}].id must be string` };
      if (typeof ref.digest !== 'string') return { ok: false, reason: `refs[${i}].digest must be string` };
      if (typeof ref.digest_alg !== 'string') return { ok: false, reason: `refs[${i}].digest_alg must be string` };
      if (typeof ref.signature !== 'string') return { ok: false, reason: `refs[${i}].signature must be string` };
      if (typeof ref.public_key !== 'string') return { ok: false, reason: `refs[${i}].public_key must be string` };
    }
  }

  if (bundle.side !== undefined) {
    if (!Array.isArray(bundle.side)) {
      return { ok: false, reason: 'side must be array' };
    }
  }

  return { ok: true };
}

function stageResourceBudget(bundle: Record<string, unknown>, config: VerifyConfig): StageResult {
  const maxBytes = config.maxBytes ?? 10 * 1024 * 1024;
  const json = JSON.stringify(bundle);
  if (json.length > maxBytes) {
    return { ok: false, reason: `bundle exceeds maxBytes: ${json.length} > ${maxBytes}` };
  }
  return { ok: true };
}

function stageVersion(bundle: Record<string, unknown>): StageResult {
  const hdr = bundle.hdr as Record<string, unknown>;
  const specVer = hdr.spec_ver as string;
  if (specVer !== '1.0.0' && specVer !== '1') {
    return { ok: false, reason: `unsupported version: ${specVer}` };
  }
  const profile = hdr.profile as string;
  const validProfiles: string[] = ['PB-INTEGRITY-1', 'PB-BOUNDARY-1', 'PB-LINEAGE-1', 'PB-REGULATED-1'];
  if (!validProfiles.includes(profile)) {
    return { ok: false, reason: `unknown profile: ${profile}` };
  }
  return { ok: true };
}

async function stageCanonical(bundle: Record<string, unknown>, config: VerifyConfig): Promise<StageResult> {
  try {
    const seal = bundle.seal as Record<string, unknown> | undefined;

    if (seal) {
      // With seal: canonicalize without seal only, compute digest, compare
      const withoutSeal: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(bundle)) {
        if (k !== 'seal') {
          withoutSeal[k] = v;
        }
      }
      const canon = canonicalBytes(withoutSeal);
      const computed = await digest(seal.digest_alg as DigestAlgorithm, canon);
      const expected = decodeBase64url(seal.digest_b64u as string);
      if (!timingSafeEqual(computed, expected)) {
        return { ok: false, outcome: 'invalid-signature', reason: 'canonical digest mismatch' };
      }
    } else if (!config.acceptUnsealed) {
      return { ok: false, outcome: 'not-defined-in-this-version', reason: 'bundle is unsealed' };
    }

    return { ok: true };
  } catch (e) {
    if (e instanceof CanonError) {
      return { ok: false, outcome: 'malformed', reason: `canonicalization failed: ${e.message}` };
    }
    return { ok: false, outcome: 'malformed', reason: `canonical error: ${String(e)}` };
  }
}

async function stageIntegrity(bundle: Record<string, unknown>, config: VerifyConfig): Promise<StageResult> {
  const seal = bundle.seal as Record<string, unknown> | undefined;
  if (!seal) {
    if (config.acceptUnsealed) {
      return { ok: true };
    }
    return { ok: false, outcome: 'not-defined-in-this-version', reason: 'missing seal' };
  }

  const digestAlg = seal.digest_alg as DigestAlgorithm;
  const sigAlg = seal.sig_alg as SignatureAlgorithm;
  const signature = decodeBase64url(seal.signature_b64u as string);
  const publicKeyB64 = config.publicKey;

  if (!publicKeyB64) {
    return { ok: false, outcome: 'invalid-signature', reason: 'public key not provided in config' };
  }

  const withoutSeal: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(bundle)) {
    if (k !== 'seal') {
      withoutSeal[k] = v;
    }
  }

  try {
    const canon = canonicalBytes(withoutSeal);
    const computedDigest = await digest(digestAlg, canon);
    let valid: boolean;
    if (sigAlg === 'Ed25519') {
      // Ed25519: use raw public key with @noble/curves
      const pubKeyBytes = decodeBase64url(publicKeyB64);
      valid = await verify(sigAlg, pubKeyBytes, computedDigest, signature);
    } else {
      const pubKey = await importPublicKey(sigAlg, publicKeyB64);
      valid = await verify(sigAlg, pubKey, computedDigest, signature);
    }
    if (!valid) {
      return { ok: false, outcome: 'invalid-signature', reason: 'signature verification failed' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, outcome: 'invalid-signature', reason: `verification error: ${String(e)}` };
  }
}

function stageContextCommitment(bundle: Record<string, unknown>, config: VerifyConfig): StageResult {
  if (!config.contextCommitment) {
    return { ok: true };
  }
  const hdr = bundle.hdr as Record<string, unknown>;
  const expected = config.contextCommitment;
  const found = hdr.ctx as string | undefined;
  if (found !== expected) {
    return { ok: false, reason: `context commitment mismatch: expected ${expected}, got ${found}` };
  }
  return { ok: true };
}

function stageBoundary(bundle: Record<string, unknown>, config: VerifyConfig): StageResult {
  const profile = (bundle.hdr as Record<string, unknown>).profile as string;
  const meta = bundle.meta as Record<string, unknown> | undefined;
  const boundaryPolicy = meta?.boundary;

  if (profile === 'PB-INTEGRITY-1') {
    return { ok: true };
  }

  if (!boundaryPolicy) {
    if ((profile === 'PB-BOUNDARY-1' || profile === 'PB-REGULATED-1') && config.strictBoundary) {
      return { ok: false, outcome: 'policy-denied', reason: 'boundary policy required by profile' };
    }
    return { ok: true };
  }

  // Parse vector-format boundary and evaluate against caller's context
  const atom = parseVectorAtom(boundaryPolicy);
  if (!atom) {
    return { ok: false, outcome: 'out-of-bounds', reason: 'boundary policy unparseable' };
  }

  const ctx: BoundaryCtx = { _now: config.now };
  const subject = config.context ?? {};

  // Check if the atom is a known operator
  const knownOps: string[] = [
    'equals', 'in', 'range', 'present', 'before', 'after', 'within',
    'expired', 'not_expired', 'age_lt', 'age_gt', 'within_last', 'within_next',
    'all', 'any', 'not',
  ];

  const result = evaluateAtom(atom, ctx, subject);

  if (!result) {
    return { ok: false, outcome: 'out-of-bounds', reason: 'boundary policy denied' };
  }

  return { ok: true };
}

function stageSideInfo(bundle: Record<string, unknown>, config: VerifyConfig): StageResult {
  if (!config.sideInfoRequired) {
    return { ok: true };
  }
  if (!bundle.side || (bundle.side as unknown[]).length === 0) {
    return { ok: false, reason: 'side attestation required but missing' };
  }
  const side = bundle.side as Record<string, unknown>[];
  for (let i = 0; i < side.length; i++) {
    const att = side[i];
    if (!att.role || typeof att.role !== 'string') {
      return { ok: false, reason: `side[${i}]: missing role` };
    }
    if (!att.party || typeof att.party !== 'string') {
      return { ok: false, reason: `side[${i}]: missing party` };
    }
    if (!att.statement || typeof att.statement !== 'string') {
      return { ok: false, reason: `side[${i}]: missing statement` };
    }
    if (!att.signature || typeof att.signature !== 'string') {
      return { ok: false, reason: `side[${i}]: missing signature` };
    }
    if (!att.public_key || typeof att.public_key !== 'string') {
      return { ok: false, reason: `side[${i}]: missing public_key` };
    }
  }
  return { ok: true };
}

async function stageLineage(bundle: Record<string, unknown>, config: VerifyConfig): Promise<StageResult> {
  const profile = (bundle.hdr as Record<string, unknown>).profile as string;
  const refs = bundle.refs as Record<string, unknown>[] | undefined;

  if (profile !== 'PB-LINEAGE-1' && profile !== 'PB-REGULATED-1') {
    return { ok: true };
  }

  if (!refs || refs.length === 0) {
    if (profile === 'PB-REGULATED-1') {
      return { ok: false, outcome: 'lineage-invalid', reason: 'lineage required by PB-REGULATED-1' };
    }
    return { ok: true };
  }

  if (!config.fetchLineage) {
    return { ok: false, outcome: 'lineage-invalid', reason: 'lineage fetch not configured' };
  }

  const maxDepth = config.maxDepth ?? 16;
  const trustedKeys = config.trustedKeys ? new Set(config.trustedKeys.keys()) : undefined;

  const result = await verifyLineage(
    bundle as Bundle,
    {
      maxDepth,
      fetch: config.fetchLineage,
      trustedKeys,
    }
  );

  if (!result.valid) {
    return { ok: false, outcome: 'lineage-invalid', reason: result.reason };
  }

  return { ok: true };
}

function stageHITL(bundle: Record<string, unknown>, config: VerifyConfig): StageResult {
  const hitl = bundle.hitl as Record<string, unknown> | undefined;

  if (!hitl) {
    if (config.hitlRequired) {
      return { ok: false, outcome: 'indeterminate', reason: 'HITL required but missing' };
    }
    return { ok: true };
  }

  if (hitl.required === true) {
    if (!hitl.attestation) {
      return { ok: false, outcome: 'indeterminate', reason: 'HITL attestation required but missing' };
    }
    const att = hitl.attestation as Record<string, unknown>;
    if (!att.signature || typeof att.signature !== 'string') {
      return { ok: false, outcome: 'indeterminate', reason: 'HITL attestation missing signature' };
    }
  }

  return { ok: true };
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    d |= a[i] ^ b[i];
  }
  return d === 0;
}
