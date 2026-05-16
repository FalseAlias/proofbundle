/**
 * @falsealias/proofbundle — Reference implementation v1.0.0
 * Re-exports all public functions, types, and constants.
 */

// Types
export type {
  Bundle,
  Header,
  Meta,
  Seal,
  ParentRef,
  SideAttestation,
  HITL,
  BoundaryPolicy,
  BoundaryRule,
  Atom,
  AtomOp,
  AtomValue,
  VerificationPackage,
  Domain,
  VerifyConfig,
  VerifyResult,
  TraceStep,
  Outcome,
  Profile,
  DigestAlgorithm,
  SignatureAlgorithm,
  BundleSource,
  SerializedKeyPair,
  SealedContentDigestInput,
} from './types.js';

// Canonical
export { canonicalJSON, canonicalBytes, CanonError } from './canonical.js';
export type { CanonValue, CanonObject } from './canonical.js';

// Digest
export { digest, digestSync, DigestError } from './digest.js';

// Signature
export {
  generateKeyPair,
  exportKeyPair,
  importPublicKey,
  importPrivateKey,
  importKeyPair,
  sign,
  verify,
  encodeBase64,
  decodeBase64,
  decodeBase64url,
  SignatureError,
} from './signature.js';
export type { KeyPair } from './signature.js';

// Seal
export { sealBundle, SealError } from './seal.js';
export type { SealOptions } from './seal.js';

// Boundary
export { evaluateAtom, evaluateBoundary, parseVectorAtom, BoundaryError } from './boundary.js';
export type { BoundaryCtx } from './boundary.js';

// Lineage
export { sealedContentDigest, verifyLineage, LineageError } from './lineage.js';
export type { LineageVerifyConfig, LineageResult } from './lineage.js';

// Verify
export { verifyBundle, VerifyError } from './verify.js';

// Constants
export const VERSION = '1.0.0';
export const SUPPORTED_PROFILES: Profile[] = [
  'PB-INTEGRITY-1',
  'PB-BOUNDARY-1',
  'PB-LINEAGE-1',
  'PB-REGULATED-1',
];
export const SUPPORTED_DIGESTS: DigestAlgorithm[] = [
  'SHA-256',
  'SHA-384',
  'SHA-512',
  'BLAKE3',
  'BLAKE2b',
];
export const SUPPORTED_SIGNATURES: SignatureAlgorithm[] = [
  'Ed25519',
  'ECDSA-P256',
  'ECDSA-P384',
  'ECDSA-P521',
  'RSA-PSS-2048',
  'RSA-PSS-3072',
  'RSA-PSS-4096',
];

import type { Profile, DigestAlgorithm, SignatureAlgorithm } from './types.js';
