# Downloads Source Comparison - 2026-05-16

Standing: append-only correction record.

## Source Artifact

- Path: `C:\Users\alib90\Downloads\2026-05-15_proofbundle_v1.0.0-alpha.1_standing-sync-repaired_20260515T111154Z.zip`
- Size: 7,901,642 bytes
- SHA-256: `3777FF33CF178A61F41AC9875C8A4CED2EB5F7B60ADFEB8CD956CC441865C693`
- Zip entries inspected: 1,161 total entries, 1,142 file entries in the Merkle manifest
- Source zip Merkle root: `A8D0F571C94CA36AFA60A67A35B06B10FA1D96FC053C1AEDC3482C922D7A24F8`
- Source zip Merkle manifest: `manifest/source_baselines/source_zip_merkle_manifest_20260516T141552Z.json`
- Source zip Merkle manifest SHA-256: `5C157F123CF2A10844C45797AD2DE81363F3E9F2270530802F43BAE5D93D4820`

This artifact is the better baseline for the current repair lane because it is the May 15 standing-sync repaired package the release-standard prompt refers to.

## Extracted Baseline Files

| Entry | Bytes | SHA-256 |
|---|---:|---|
| `proofbundle\conformance\vectors_v1.json` | 534,647 | `11AEF10B061EE9C1CDF417F6DD7117B5AB83492B7FFE814F8CBE5D5699F5CFB3` |
| `proofbundle\conformance\cross_impl_results.json` | 8,815 | `20492DCFB9426A0D15866944B24E452E27CC6F9FC2D80C0CCFFEC8B6D84AC511` |
| `proofbundle\web\2026-05-03_proofbundle_ui_v1.0.html` | 175,639 | `F44DCBD55355CED84F4840B0D7A4CC15DDD61E54E9ABEEE9E64B8B79CD7A9557` |
| `proofbundle\manifest.json` | 48,169 | `091C46085D8A9C1E98CFF4B0724A918CB10FEF15C26BF92E259299AA04A52CD8` |

## Repo Comparison

The pushed branch previously used the existing repository clone as its working surface:

- Repo vector path: `conformance/vectors_v1.json`
- Repo vector SHA-256: `7ACAF3C90DB8DF28BF250433FB29E31DC156482B3F1CEB30E08062E9C0560C1B`
- Repo vector count: 300
- Repo vector IDs: `V0001` through `V0300`

The May 15 source zip vector file:

- Source vector count: 300
- Source vector IDs: `CV0001` through `CV0300`
- Source first-entry keys: `id`, `category`, `description`, `trust_label`, `input`, `expected_outcome`
- Source cross-implementation standing: `alpha-repair-snapshot`, not release-green
- Source Python standing: 299/300, blocker `CV0124`
- Source TypeScript standing: full run 136/300, 164 mismatches
- Source Rust standing: prior-reported 36/37, context-commitment blocker
- Source Go standing: unverified

The repo and the May 15 source zip are not byte-identical and are not the same vector namespace.

## Correction

The source zip is the baseline for the current `v1.0.0-alpha.1_conformance-manifest-sync` repair lane.

Existing pushed branch work remains as an append-only derivative and should not be deleted. Further work should reconcile the repo against this Downloads source package with explicit diffs, manifests, Merkle roots, OTS artifacts, and standing labels.

## Post-Import Standing - 2026-05-16T14:23:38Z

The May 15 baseline was imported into this repository working tree as a new append-only correction layer.

- Import report: `manifest/source_baselines/source_zip_import_report_20260516T142055Z.json`
- Post-import diff report: `manifest/source_baselines/source_zip_vs_repo_diff_after_import_20260516T142100Z.json`
- Source files written from `proofbundle/` entries: 1,140
- Source wrapper entries skipped: 2 (`plan.md`, `proofbundle-v1.0.0-alpha-repair-snapshot.zip`)
- Shared operative paths after import: 351
- Identical shared operative paths after import: 351
- Different shared operative paths after import: 0

Remaining source-zip paths not present in the Git-tracked clean repo scope are classified as generated/vendor/cache/archive-wrapper material:

| Class | Count | Standing |
|---|---:|---|
| `core/node_modules` | 754 | excluded from clean repo publication scope |
| `core/dist` | 20 | generated build output, excluded from clean repo publication scope |
| Python `__pycache__` | 10 | cache output, excluded from clean repo publication scope |
| Python `.pytest_cache` | 5 | cache output, excluded from clean repo publication scope |
| `plan.md` | 1 | source-zip wrapper entry, not imported under repo root |
| nested repair snapshot zip | 1 | source-zip wrapper artifact, not imported into clean repo |

This means the repo is now aligned with the May 15 operative source baseline for files admitted to the clean repository scope. It is not a byte-for-byte reproduction of every zip entry, because the clean repo intentionally excludes generated dependencies, build output, caches, and nested archive artifacts.
