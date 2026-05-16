export const SPEC_ID = "PROOFBUNDLE";
export const SPEC_VER = "1.0.0";
export const CANONICAL_ENCODING = "PB-CANON-JSON-1";

export const PROFILES = [
  "PB-INTEGRITY-1",
  "PB-BOUNDARY-1",
  "PB-LINEAGE-1",
  "PB-REGULATED-1",
] as const;

export const OUTCOMES = [
  "verified",
  "malformed",
  "invalid-signature",
  "out-of-bounds",
  "unknown-version",
  "missing-side-info",
  "lineage-invalid",
  "resource-exhausted",
  "policy-denied",
  "indeterminate",
  "not-defined-in-this-version",
] as const;

export const DIGEST_ALGORITHMS = [
  "SHA-256",
  "SHA-384",
  "SHA-512",
  "BLAKE3",
  "BLAKE2b",
] as const;

export const SIGNATURE_ALGORITHMS = [
  "Ed25519",
  "ECDSA-P256",
  "ECDSA-P384",
  "ECDSA-P521",
  "RSA-PSS-2048",
  "RSA-PSS-3072",
  "RSA-PSS-4096",
] as const;

export const PROOF_KINDS = [
  "signature",
  "coq",
  "lean",
  "z3",
  "isabelle",
  "hol-light",
] as const;

export interface BundleHdr {
  spec_id: string;
  spec_ver: string;
  profile: string;
  bundle_id: string;
}

export interface BundleMeta {
  producer_id: string;
  created_at: string;
  canonical_encoding: string;
  digest_alg: string;
  sig_alg: string;
  proof_kind: string;
  boundary?: BoundaryPredicate;
  side_attestations?: unknown[];
  witnesses?: unknown[];
  expiration?: string;
  revocation_uri?: string;
  hitl?: Record<string, unknown>;
  public_key_b64u?: string;
}

export interface BundleSeal {
  digest_alg: string;
  digest_b64u: string;
  sig_alg: string;
  signature_b64u: string;
  proof_cert?: string;
}

export interface BundleRef {
  parent_id: string;
  parent_digest: string;
}

export interface Bundle {
  hdr: BundleHdr;
  payload: string;
  meta: BundleMeta;
  refs: BundleRef[];
  seal: BundleSeal;
}

export interface VerificationResult {
  outcome: string;
  trace: string[];
  bundle_id: string | null;
  digest_b64u: string | null;
}

export type BoundaryPredicate =
  | { all: BoundaryPredicate[] }
  | { any: BoundaryPredicate[] }
  | { not: BoundaryPredicate }
  | { equals: [string, unknown] }
  | { in: [string, unknown[]] }
  | { range: [string, number, number] }
  | { present: string }
  | { before: [string, string] }
  | { after: [string, string] }
  | { within: [string, string, string] }
  | { expired: string }
  | { not_expired: string }
  | { age_lt: [string, string] }
  | { age_gt: [string, string] };
