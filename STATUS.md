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
- Current verified bridge sequence: 2744
- Current verified bridge head SHA-256: `1EDF83040612EBA2D83191005207F06C37F51E596E0D020EBD36617CF172FB3F`
- Latest repository Merkle root pointer: `manifest/LATEST_REPO_MERKLE_ROOT.txt`
- Latest repository Merkle leaf manifest pointer: `manifest/LATEST_REPO_MERKLE_MANIFEST.json`
- OTS submission index: `manifest/ots_submission_index_20260517T072225Z.json`
- OTS submitted tick: `manifest/repo_merkle_root_20260517T052916Z.txt` and `manifest/repo_merkle_manifest_20260517T052916Z.json`
- OTS submitted tick root: `C8F7F3EB3D5AAAF592E6A2E9F49C85FBFA43A89EFB26124D6D6C5173C46F4DAB`
- OTS root receipt SHA-256: `F0936DE233532E6DD4B08CD1F9309C7F58E9E91EDDEB9FAE4616AD71B980285A`
- OTS manifest receipt SHA-256: `E994A8C4B06F75CB95F6B127D50BE470FE8B187FF5CC4F491648BF7401D7A10D`
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
- fresh VM receipt check: `2026-05-17T05:28:44Z`
- primary VM live standing: `proofbundle-dev-20260513`, 71 tmux sessions, 159GB free, CPU saturated, fresh receipts observed through `2026-05-17T05:26Z`
- secondary VM live standing: `proofbundle-dev-20260516-b`, 51 tmux sessions, 40GB free, CPU saturated, fresh receipts observed through `2026-05-17T05:26Z`

These are indexed corpus and standing numbers, not a universal proof-closure
claim.

## Controlled Corpus Boundary

The public repository is a receipt-backed alpha surface, not the full private
formal-math archive. It carries the verifier, status surfaces, manifests,
Merkle roots, OTS references, proof inventories, selected reviewed artifacts,
audit blockers, and quarantine evidence. The full formal-math corpus, raw
transcripts, VM extracts, large concat artifacts, and unreviewed proof
generations stay in controlled storage unless a reviewed tranche is published
with source hashes, build or audit logs, standing, and witness records.

Repo Merkle tick `20260517T052916Z` was submitted to OTS over a fresh Tor-true
path after an append-only OTS-only supersession receipt for the older Tor stop
lock. The root and Merkle manifest `.ots` files and submission receipts are indexed in
`manifest/ots_submission_index_20260517T072225Z.json`. Later OTS/index files are
captured by the next Merkle tick; a root is not claimed to contain its own
future witness.

## Implementation Matrix

- Python: committed GitHub evidence currently covers package import, profile constants, vector corpus shape/count/unique IDs, required vector fields, and signed-vector smoke sample V0001-V0003. Full 300-vector Python parity remains a release blocker unless separately reproduced and committed.
- TypeScript: committed GitHub Proofbench evidence covers 300/300 public-alpha conformance; release-green remains blocked until reproduction records, cross-implementation closure, proof audit, and witnessing gates are committed.
- Rust: cargo build and 18/18 unit tests reported passing; 36/37 conformance reported passing; context-commitment encoding blocker remains.
- Go: committed GitHub Proofbench evidence covers the current Go test gate; full Go/vector parity status remains bounded by the current test suite.

## Proof Standing

Formal proof closure is unavailable. The narrow Coq, Lean, and Z3 guard scaffolds are not a proof-complete release gate. The historic `189` audit-failure count remains a standing blocker until superseded by a scope-exact, reproducible proof audit with preserved build logs and committed status synchronization.

Internal review markers and draft proof claims are not operative proof claims.
