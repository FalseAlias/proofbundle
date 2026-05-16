# ProofBundle Status

Lane: `v1.0.0-alpha.1_conformance-manifest-sync`

Closure phrase: `Closed for this lane. Open to governed evolution.`

Standing: `blocked_not_release_green`

This lane is closed for the current browser artifact, conformance manifest, and standing-synchronization surface. New work must be classified as an existing-gate defect, governed v1.1 item, extension-pack item, proof-augmented item, or inadmissible.

No release-green, proof-complete, axiom-free, or formal proof closure claim is made here.

## Current Evidence

- Browser app: `web/proofbundle_v1_0_app.html`
- Public entrypoint: `index.html`
- Slim public manifest: `PUBLIC_PROOFBUNDLE_MANIFEST_20260516.json`
- Static app tests: `tests/proofbundle_app_static.test.mjs`
- Conformance vectors: `conformance/vectors_v1.json`
- Conformance vector count: 300
- Conformance vector SHA-256: `7ACAF3C90DB8DF28BF250433FB29E31DC156482B3F1CEB30E08062E9C0560C1B`
- Current verified bridge sequence: 2684
- Current verified bridge head SHA-256: `BBC43459FC55341897D8DD13B03D202238C4F0BA7A5AB0AD23528BB646E62252`
- Transcript manifest SHA-256: `1C490970FB474B11DAD4AAD155CADEBB043BDE568C88D863505CBEDE545CD659`
- Bridge read extract SHA-256: `FD4800900911A904F2784AEE5758A029BAD19C2DB05DC105AA2823D580B2F568`

## Public Alpha Snapshot

Bridge-reported standing data used in the public alpha manifest:

- formal proof and verification files indexed: 13,236
- Coq: 9,181
- Lean 4: 2,840
- Isabelle: 981
- Z3: 121
- Python: 113
- OTS artifacts present in source report: 2,634 / 2,634
- JavaScript conformance: 303 / 303
- TypeScript conformance: 300 / 300
- canonical proof audit exceptions: 189
- quarantine files: 1
- active VM instances: 2

These are indexed corpus and standing numbers, not a universal proof-closure
claim.

## Implementation Matrix

- Python: committed GitHub evidence currently covers package import, profile constants, vector corpus shape/count/unique IDs, required vector fields, and signed-vector smoke sample V0001-V0003. Full 300-vector Python parity remains a release blocker unless separately reproduced and committed.
- TypeScript: committed GitHub Proofbench evidence covers 300/300 public-alpha conformance; release-green remains blocked until reproduction records, cross-implementation closure, proof audit, and witnessing gates are committed.
- Rust: cargo build and 18/18 unit tests reported passing; 36/37 conformance reported passing; context-commitment encoding blocker remains.
- Go: committed GitHub Proofbench evidence covers the current Go test gate; full Go/vector parity status remains bounded by the current test suite.

## Proof Standing

Formal proof closure is unavailable. The narrow Coq, Lean, and Z3 guard scaffolds are not a proof-complete release gate. The known audit debt remains 189 failures.

The historically observed symbols `suppression_exceeds_continuity`, `supression_exceeds_continuity`, `suppression_exceeds_continuation`, and `supression_exceeds_continuation` are quarantine markers, not operative proof claims.
