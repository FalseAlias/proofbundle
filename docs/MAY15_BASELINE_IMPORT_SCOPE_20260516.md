# May 15 Baseline Import Scope - 2026-05-16

Standing: append-only correction record.

## Baseline Used

- Source archive: `C:\Users\alib90\Downloads\2026-05-15_proofbundle_v1.0.0-alpha.1_standing-sync-repaired_20260515T111154Z.zip`
- Source SHA-256: `3777FF33CF178A61F41AC9875C8A4CED2EB5F7B60ADFEB8CD956CC441865C693`
- Source Merkle root: `A8D0F571C94CA36AFA60A67A35B06B10FA1D96FC053C1AEDC3482C922D7A24F8`
- Source file entries: 1,142

## What Was Wrong

The existing GitHub working branch was not initially built from this May 15 Downloads baseline. It contained useful publication infrastructure, but it used a different 300-vector namespace and a different repository surface.

That earlier work is preserved in Git history and source-baseline comparison reports. It is not treated as the authoritative May 15 baseline.

## What Was Imported

The import pass copied `proofbundle/` entries from the May 15 archive into the repository root.

- Written files: 1,140
- Skipped wrapper entries: 2
- Skipped wrapper paths: `plan.md`, `proofbundle-v1.0.0-alpha-repair-snapshot.zip`
- Import report: `manifest/source_baselines/source_zip_import_report_20260516T142055Z.json`

## Post-Import Match

Post-import comparison was run against the same May 15 source archive.

- Source file count: 1,142
- Repo clean-scope file count: 433
- Shared path count: 351
- Identical path count: 351
- Different path count: 0
- Missing from clean repo scope: 791
- Extra in repo scope: 82

The 791 remaining missing paths are not operative source disagreements. They are classified as:

| Class | Count | Decision |
|---|---:|---|
| `core/node_modules` | 754 | generated/vendor dependency tree, excluded from clean repo |
| `core/dist` | 20 | generated TypeScript build output, excluded from clean repo |
| Python `__pycache__` | 10 | cache output, excluded from clean repo |
| Python `.pytest_cache` | 5 | cache output, excluded from clean repo |
| `plan.md` | 1 | source-archive wrapper entry, not part of `proofbundle/` repo tree |
| nested repair snapshot zip | 1 | source-archive wrapper artifact, not part of clean repo |

## Git Tracking Decision

The clean repo should track source, docs, conformance vectors, status files, manifests, proof sources, and proof receipt logs.

The clean repo should not track `node_modules`, generated `dist`, Python bytecode/cache files, pytest cache, egg-info metadata, or nested zip artifacts. Raw archive preservation belongs in the raw evidence repository, not in the clean ProofBundle protocol repo.

Ignored baseline files that still matter as source/evidence are force-added explicitly:

- `cli/Cargo.lock`
- `proofs/build_receipts/coq_build_20260515T1107Z.log`
- `proofs/build_receipts/lean_build_20260515T1107Z.log`
- `proofs/build_receipts/z3_check_20260515T1107Z.log`

## Standing

The repository is now being corrected on top of the May 15 baseline. It is not release-green. It remains an alpha repair/publication lane until the listed conformance, standing, manifest, and proof-source gates pass.

## Post-Import Repo Merkle

After the May 15 baseline import and scope documentation update, the operative clean repo Merkle manifest was regenerated.

- Generated at UTC: `2026-05-16T14:24:45.231Z`
- Manifest path: `manifest/repo_merkle_manifest_20260516T142445Z.json`
- Root path: `manifest/repo_merkle_root_20260516T142445Z.txt`
- File count: 422
- Zero-byte files: 2 (`.gitkeep`, `python/tests/__init__.py`)
- Repo Merkle root SHA-256: `13C260DC388235C0D30821541D8E58F16F9CE2B3EE8B9227195F2E65259E9459`
- Repo Merkle manifest SHA-256: `BFC2D4EBB962150074E7AA0ECAB2AE2B4687DE4694799108DC4925F812395230`
