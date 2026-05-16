import crypto from "crypto";
import {
  Bundle,
  SPEC_ID,
  SPEC_VER,
  CANONICAL_ENCODING,
  PROFILES,
  DIGEST_ALGORITHMS,
  SIGNATURE_ALGORITHMS,
  PROOF_KINDS,
} from "./types.js";
import { canonicalBytes, b64uEncode } from "./canonical.js";
import { digestBytes } from "./digest.js";
import { signDigest } from "./signature.js";

function withoutSeal(bundle: Record<string, unknown>): Record<string, unknown> {
  const out = { ...bundle };
  delete out.seal;
  return out;
}

function newBundleId(canon: Buffer, digestAlg: string): string {
  return b64uEncode(digestBytes(canon, digestAlg)).slice(0, 32);
}

export function sealBundle(
  payload: Buffer,
  privateKey: crypto.KeyObject,
  options: {
    producer_id: string;
    digest_alg: string;
    sig_alg: string;
    profile?: string;
    proof_kind?: string;
    boundary?: Record<string, unknown>;
    refs?: Record<string, unknown>[];
    side_attestations?: Record<string, unknown>[];
    witnesses?: Record<string, unknown>[];
    expiration?: string;
    revocation_uri?: string;
    hitl?: Record<string, unknown>;
  }
): Bundle {
  const {
    producer_id,
    digest_alg,
    sig_alg,
    profile = "PB-BOUNDARY-1",
    proof_kind = "signature",
    boundary,
    refs,
    side_attestations,
    witnesses,
    expiration,
    revocation_uri,
    hitl,
  } = options;

  if (!DIGEST_ALGORITHMS.includes(digest_alg as any)) {
    throw new Error(`unknown digest algorithm: ${digest_alg}`);
  }
  if (!SIGNATURE_ALGORITHMS.includes(sig_alg as any)) {
    throw new Error(`unknown signature algorithm: ${sig_alg}`);
  }
  if (!PROFILES.includes(profile as any)) {
    throw new Error(`unknown profile: ${profile}`);
  }
  if (!PROOF_KINDS.includes(proof_kind as any)) {
    throw new Error(`unknown proof kind: ${proof_kind}`);
  }

  const meta: Record<string, unknown> = {
    producer_id,
    created_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    canonical_encoding: CANONICAL_ENCODING,
    digest_alg,
    sig_alg,
    proof_kind,
    boundary: boundary ?? { all: [] },
  };

  if (side_attestations !== undefined) meta.side_attestations = side_attestations;
  if (witnesses !== undefined) meta.witnesses = witnesses;
  if (expiration !== undefined) meta.expiration = expiration;
  if (revocation_uri !== undefined) meta.revocation_uri = revocation_uri;
  if (hitl !== undefined) meta.hitl = hitl;

  const bundle: Record<string, unknown> = {
    hdr: {
      spec_id: SPEC_ID,
      spec_ver: SPEC_VER,
      profile,
      bundle_id: "",
    },
    payload: b64uEncode(payload),
    meta,
    refs: refs ?? [],
  };

  bundle.hdr = {
    ...(bundle.hdr as Record<string, unknown>),
    bundle_id: newBundleId(canonicalBytes(withoutSeal(bundle)), digest_alg),
  };

  const canon = canonicalBytes(withoutSeal(bundle));
  const digest = digestBytes(canon, digest_alg);
  const signature = signDigest(privateKey, sig_alg, digest);

  bundle.seal = {
    digest_alg,
    digest_b64u: b64uEncode(digest),
    sig_alg,
    signature_b64u: b64uEncode(signature),
  };

  return bundle as unknown as Bundle;
}
