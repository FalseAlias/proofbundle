# Changelog

All entries are grounded in repository artifacts present in this repository.

## v1.2.1 — 2026-04-20
- Added successor artifact `2026-04-20_proofbundle_ui_v1.2.1.html`, derived from the canonical 2026-04-19 source artifact.
- Corrected one showcase trace string in the tamper demo so the displayed SHA-256 digest snippet references `merkleRoot` rather than `bundle_id`.
- Reworded one Domains tab sentence for neutral technical tone.
- Updated in-artifact version/storage/export labels from `1.2.0` to `1.2.1` in the successor file.
- Added repository governance and boundary documentation (`README.md`, `SECURITY.md`, `CONTRIBUTING.md`).
- Added stable root entrypoint `index.html` and static hosting helper `.nojekyll`.
- Added explicit dual-license files (`LICENSE-MIT`, `LICENSE-APACHE`).

## v1.2.0 — 2026-04-19
- Added canonical single-file browser artifact `2026-04-19_proofbundle_ui_genesis.html`.
- Implemented browser-local bundle sealing with canonical JSON handling, Merkle root commitment, and ED25519 signing.
- Implemented browser-local verification flow with signature/root checks, boundary predicate evaluation, and execution traces.
- Implemented lineage-related parent reference presence checks against provided bundle maps.
- Implemented profile/domain examples, claims and prediction demo panels, local state import/export/reset, and showcase demo flows.
- Included explicit in-file dual-license declaration (`MIT OR Apache-2.0`).
