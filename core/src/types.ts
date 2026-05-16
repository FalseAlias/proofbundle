/// <reference lib="dom" />

export type DigestAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512' | 'BLAKE3' | 'BLAKE2b';

export type SignatureAlgorithm =
  | 'Ed25519'
  | 'ECDSA-P256'
  | 'ECDSA-P384'
  | 'ECDSA-P521'
  | 'RSA-PSS-2048'
  | 'RSA-PSS-3072'
  | 'RSA-PSS-4096';

export type Outcome =
  | 'verified'
  | 'invalid-signature'
  | 'out-of-bounds'
  | 'indeterminate'
  | 'resource-exhausted'
  | 'lineage-invalid'
  | 'policy-denied'
  | 'not-defined-in-this-version'
  | 'unknown-version'
  | 'malformed'
  | 'missing-side-info';

export type Profile =
  | 'PB-INTEGRITY-1'
  | 'PB-BOUNDARY-1'
  | 'PB-LINEAGE-1'
  | 'PB-REGULATED-1';

export interface Header {
  spec_id: string;
  spec_ver: string;
  profile: Profile;
  bundle_id?: string;
  ctx?: string;
  [key: string]: unknown;
}

export interface Meta {
  issued_at?: string;
  expires_at?: string;
  not_before?: string;
  issuer?: string;
  subject?: string;
  audience?: string | string[];
  purpose?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface Seal {
  digest_b64u: string;
  digest_alg: DigestAlgorithm;
  sig_alg: SignatureAlgorithm;
  signature_b64u: string;
  [key: string]: unknown;
}

export interface ParentRef {
  id: string;
  digest: string;
  digest_alg: DigestAlgorithm;
  sig_alg: SignatureAlgorithm;
  signature: string;
  public_key: string;
  [key: string]: unknown;
}

export interface SideAttestation {
  id?: string;
  role: string;
  party: string;
  at: string;
  statement: string;
  sig_alg: SignatureAlgorithm;
  signature: string;
  public_key: string;
  [key: string]: unknown;
}

export interface HITL {
  required?: boolean;
  approvers?: string[];
  attestation?: SideAttestation;
  [key: string]: unknown;
}

export interface Bundle {
  hdr: Header;
  payload: unknown;
  meta?: Meta;
  refs?: ParentRef[];
  seal?: Seal;
  boundary?: BoundaryPolicy;
  side?: SideAttestation[];
  hitl?: HITL;
  [key: string]: unknown;
}

export interface BoundaryPolicy {
  rules: BoundaryRule[];
  default?: Outcome;
  [key: string]: unknown;
}

export interface BoundaryRule {
  name?: string;
  atom: Atom;
  on_match: Outcome;
  [key: string]: unknown;
}

export type AtomValue = string | number | boolean | null | string[] | number[];

export interface Atom {
  op: AtomOp;
  path?: string;
  value?: AtomValue;
  values?: AtomValue[];
  lo?: number;
  hi?: number;
  of?: string;
  at?: string;
  unit?: string;
  amount?: number;
  atoms?: Atom[];
  [key: string]: unknown;
}

export type AtomOp =
  | 'equals'
  | 'in'
  | 'range'
  | 'present'
  | 'before'
  | 'after'
  | 'within'
  | 'expired'
  | 'not_expired'
  | 'age_lt'
  | 'age_gt'
  | 'within_last'
  | 'within_next'
  | 'all'
  | 'any'
  | 'not';

export interface VerificationPackage {
  bundle: Bundle;
  signature: Seal;
}

export interface Domain {
  domain: string;
  url: string;
  public_key: string;
  sig_alg: SignatureAlgorithm;
  digest_alg: DigestAlgorithm;
  [key: string]: unknown;
}

export interface VerifyConfig {
  profile: Profile;
  context?: Record<string, unknown>;
  publicKey?: string;
  trustedKeys?: Map<string, string>;
  domains?: Domain[];
  maxBytes?: number;
  maxDepth?: number;
  strictBoundary?: boolean;
  now?: Date;
  acceptUnsealed?: boolean;
  contextCommitment?: string;
  sideInfoRequired?: boolean;
  hitlRequired?: boolean;
  fetchLineage?: (id: string, digest: string) => Promise<Bundle | null>;
  [key: string]: unknown;
}

export interface TraceStep {
  stage: string;
  outcome?: Outcome;
  detail?: string;
  passed: boolean;
}

export interface VerifyResult {
  outcome: Outcome;
  trace: TraceStep[];
}

export type BundleSource = Bundle | string | Uint8Array;

export interface SerializedKeyPair {
  publicKey: string;
  privateKey: string;
  algorithm: SignatureAlgorithm;
}

export interface SealedContentDigestInput {
  hdr: Record<string, unknown>;
  payload: unknown;
  meta?: Record<string, unknown>;
  refs?: unknown[];
}
