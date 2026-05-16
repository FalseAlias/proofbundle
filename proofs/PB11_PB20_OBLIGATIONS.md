# PB11-PB20 Proof Obligations

These obligations define the adaptive v1.0 proof surface. They are not marked closed until proofbench compiles corresponding artifacts.

## PB11 - Proof-Kind Dispatch Correctness

Every registered `meta.proof_kind` dispatches to exactly one verifier path. Unknown kinds return `not-defined-in-this-version`.

## PB12 - Proof-Certificate Binding

For non-signature proof kinds, `seal.proof_cert` binds checker output to the canonical payload digest.

## PB13 - Expiration Correctness

If `meta.expiration` is before verifier time, verification returns `out-of-bounds` after integrity succeeds.

## PB14 - Revocation Handling Correctness

Revocation checks are side-effecting policy checks and cannot change canonical digest validity.

## PB15 - Plugin Registration Soundness

Registered extensions cannot alter stable core semantics.

## PB16 - Cross-Version Compatibility

v1.x verifiers produce the same outcome as v1.0 for v1.0 bundles. v1.0 returns `unknown-version` for later v1.x bundles.

## PB17 - Schema Extension Safety

Extension fields do not change canonicalization or verification of v1.0 fields.

## PB18 - Module Composition Soundness

Two non-conflicting modules compose without changing each other's registered semantics.

## PB19 - Registry Conflict Detection

Duplicate registry names with incompatible definitions are rejected.

## PB20 - Deprecation Handling

Deprecated registry entries remain verifiable and produce warnings outside the core outcome enum.

