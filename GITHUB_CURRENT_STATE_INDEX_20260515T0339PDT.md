# ProofBundle Current State Upload - 2026-05-15 03:39 PDT

This branch is an additive upload target for the current ProofBundle state packet.

Branch: `proofbundle-current-state-20260515T0339PDT`

## Contents Posted Here

- `GITHUB_CURRENT_STATE_INDEX_20260515T0339PDT.md`: this index.
- `state-captures/20260515T0339PDT/README.md`: human-readable front door for the local all-state capture packet.
- `state-captures/20260515T0339PDT/PROOFBUNDLE_ALL_STATE_CAPTURE_20260515T0339PDT.zip.sha256.txt`: checksum for the prepared local capture zip.
- `BINARY_ARTIFACTS_PENDING_GIT_AUTH.md`: explains the binary ZIP upload state.

## Local Binary Artifacts Prepared

The binary artifacts are committed locally on this same branch but the HTTPS `git push` is blocked by GitHub credential authentication on this machine.

Prepared local files:

- `artifacts/20260515T0339PDT/proofbundle_full_preserved_html_false_inheritance_repaired.zip`
  - SHA-256: `460996E569F577B93CD380D18EA28C86DA47E26956EBAFE9062590769C698722`
- `state-captures/20260515T0339PDT/PROOFBUNDLE_ALL_STATE_CAPTURE_20260515T0339PDT.zip`
  - SHA-256: `C9FC4511CC87A5E219EF1B8A8F9654D50648DD6A2DF915F8C1D01FFC72AFF1E2`

Local commit containing binaries: `cb2e004 Add ProofBundle current state capture 20260515`.

## Standing

Current truth: ProofBundle is close, but **not ready yet**.

Known blockers:

- TypeScript test/conformance gates fail.
- Python vectors are 299/300 with CV0124 failing.
- Proof assistant source files are absent; no proof closure.
- Rust and Go were not locally verified in the Windows environment used for this capture.
- Documentation still contains stale release/proof/conformance claims that must be synchronized.

No files from the existing GitHub `main` branch are deleted or rewritten by this branch.
