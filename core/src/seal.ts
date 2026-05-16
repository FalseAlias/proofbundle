/**
 * sealBundle: compute canonical bytes, digest, set bundle_id, re-canonicalize,
 * re-digest, and produce a Seal with signature.
 */

import { canonicalBytes } from './canonical.js';
import { digest } from './digest.js';
import { sign, encodeBase64 } from './signature.js';
import type { Bundle, Seal, Header, SignatureAlgorithm, DigestAlgorithm } from './types.js';
import type { KeyPair } from './signature.js';

export class SealError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'SealError';
  }
}

export interface SealOptions {
  digestAlg?: DigestAlgorithm;
  sigAlg?: SignatureAlgorithm;
  id?: string;
}

export async function sealBundle(
  bundle: Bundle,
  keyPair: KeyPair,
  options: SealOptions = {}
): Promise<{ bundle: Bundle; seal: Seal }> {
  const digestAlg = options.digestAlg ?? 'SHA-256';
  const sigAlg = options.sigAlg ?? 'Ed25519';

  const hdr: Header = { ...bundle.hdr };
  if (options.id) {
    hdr.bundle_id = options.id;
  }

  const preBundle: Record<string, unknown> = {
    hdr,
    payload: bundle.payload,
  };

  if (bundle.meta !== undefined) {
    preBundle.meta = bundle.meta;
  }
  if (bundle.refs !== undefined && bundle.refs.length > 0) {
    preBundle.refs = bundle.refs;
  }

  const canon1 = canonicalBytes(preBundle);
  const digest1 = await digest(digestAlg, canon1);

  hdr.bundle_id = hdr.bundle_id ?? encodeBase64(digest1).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);

  const preBundle2: Record<string, unknown> = {
    hdr,
    payload: bundle.payload,
  };
  if (bundle.meta !== undefined) {
    preBundle2.meta = bundle.meta;
  }
  if (bundle.refs !== undefined && bundle.refs.length > 0) {
    preBundle2.refs = bundle.refs;
  }

  const canon2 = canonicalBytes(preBundle2);
  const digest2 = await digest(digestAlg, canon2);

  const signature = await sign(sigAlg, keyPair.privateKey, digest2);

  const seal: Seal = {
    digest_b64u: encodeBase64(digest2),
    digest_alg: digestAlg,
    sig_alg: sigAlg,
    signature_b64u: encodeBase64(signature),
  };

  return {
    bundle: {
      ...bundle,
      hdr,
      seal,
    },
    seal,
  };
}
