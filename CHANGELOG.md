# Changelog

## v1.0.0-alpha.1 — 2026-05-15

Alpha repair snapshot. Not release-green.

Changed standing:

- Restored the browser HTML artifact from the supplied 12-algorithm single-file verifier.
- Synchronized the browser artifact with the current repair state.
- Blocked false proof-standing inheritance from lineage and proof metadata.
- Recomputed manifest after repair.
- Added VM build/solver receipts for the narrow Coq, Lean, and Z3 false-theorem guards while keeping proof closure unavailable.

Current implementation standing:

- Python: 299/300 vectors reported passing; CV0124 remains.
- TypeScript: local full run measured 136/300; sample runner remains 16/20; ECDSA/RSA and broader outcome blockers remain.
- Rust CLI: build/unit tests reported passing; 36/37 conformance reported passing.
- Go: patched but unverified because Go was unavailable.

Remaining blockers:

- Full cross-implementation agreement is not established.
- Proof assistant guard scaffolds passed narrow VM build/solver checks; proof closure remains unavailable.
- Release signing and external timestamping are not included.

## v1.0.0 draft lineage

Earlier repository metadata described release/proof standing that this snapshot does not support. That standing is superseded by v1.0.0-alpha.1 status. The current artifact does not inherit proof closure from absent files, stale metadata, or narrow guard builds.
