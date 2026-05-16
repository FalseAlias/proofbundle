# Security Policy — ProofBundle v1.0.0-alpha.1 Repair Snapshot

## Standing

This package is an alpha repair snapshot. It is not release-green.

## What is repaired

The browser artifact was restored from the supplied 12-algorithm single-file HTML and synchronized with the repair state.

False proof-standing inheritance in lineage/proof metadata was repaired. The package no longer permits proof closure to inherit from absent or unbuilt proof source files.

## Known limitations

- No factual truth guarantee.
- No legal compliance guarantee.
- No authority guarantee.
- No proof closure is claimed.
- Proof assistant guard scaffolds were build/solver checked on VM receipts, but no proof closure is claimed.
- Cross-implementation conformance is partial.
- TypeScript ECDSA/RSA issues remain.
- Python CV0124 remains.
- Rust context-commitment encoding issue remains.
- Go build/conformance is unverified in the prior environment.
- BLAKE3/BLAKE2b conformance depends on implementation/library standing.
- Browser WebCrypto support varies by runtime.
- ECDSA-P521 support varies by runtime.
- Temporal predicates require deterministic clock/context handling.
- Context commitment behavior still requires cross-implementation agreement.

## Forbidden proof-standing inheritance

The exact symbols `suppression_exceeds_continuity` and `supression_exceeds_continuity` are absent as operative theorem claims after patch. Metadata-level proof-standing contamination was present and repaired. Missing or unbuilt proof files cannot inherit proof authority through lineage, manifests, README text, browser standing blocks, or scaffold comments.

## Scope

ProofBundle verifies cryptographic receipt standing under declared inputs. It does not prove factual truth and does not certify legal compliance.
