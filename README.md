# ProofBundle v1.0.0-alpha.1

A sealed claim object. Verifiable offline. No certifying authority.

## Browser showcase

The single-file browser verifier is the primary inspectable artifact for this snapshot.

Open locally from this repository:

- `web/proofbundle_v1_0_app.html`
- `web/2026-05-03_proofbundle_ui_v1.0.html`

Both files are static HTML artifacts with no build step. They carry the alpha.1 standing display and the 12-algorithm verifier surface. They do not claim release-green or proof closure.

## Standing

This repository is an `alpha-repair-snapshot`, not a release-green artifact.

The browser demo has been restored and synchronized with the repair state. It records the current implementation matrix and blocks false proof-standing inheritance.

Proof closure is not claimed. This package contains narrow Coq, Lean, and Z3 guard scaffolds for the false suppression/supression-over-continuity theorem family. Those guards were build/solver checked on the VM receipts in `proofs/build_receipts/`, but they are guards only and do not close the proof lane.

The root `manifest.json` is an operative-source manifest. It intentionally excludes dependency, vendor, build, cache, and generated artifact directories. It is not a complete archive-entry inventory for every file shipped in the zip. Consumers that need whole-archive accounting must use the full archive manifest/receipt for the packaged zip.

## Current blockers

| Component | Standing |
|---|---|
| Browser demo | restored and standing-synced |
| Proof assistants | Coq/Lean/Z3 guard builds/checks passed on VM receipts; no proof closure |
| Cross-implementation conformance | partial; full agreement not established |
| Python | 299/300 vectors reported passing; CV0124 remains |
| Rust CLI | build/unit tests reported passing; 36/37 conformance reported passing |
| TypeScript | local full run measured 136/300; sample runner 16/20; ECDSA/RSA and broader outcome blockers remain |
| Go | patched but unverified in environment |

## Browser demo evidence

The browser verifier runs locally in the page. The page states alpha.1 standing and does not inherit proof closure.

## Proof standing

See:

- `proofs/PROOF_STATUS.md`
- `proofs/QUARANTINE.md`
- `proofs/manifest.json`

No proof closure is claimed by this package.

## False theorem guard

The false theorem direction around suppression/supression and continuity is not present as an operative proof claim. The package does not assert `suppression_exceeds_continuity` or the misspelled `supression_exceeds_continuity`. Any future proof in this family must be stated as a qualified or reversed theorem with explicit assumptions and build logs before it can affect standing.

## Status

See `STATUS.md`.
