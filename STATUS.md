# ProofBundle v1.0.0-alpha.1 — Repair Snapshot Status

Generated: 2026-05-15T11:09:00Z
Standing: `alpha-repair-snapshot`

Reason: the browser artifact is restored and synchronized with the repair state; false proof-standing inheritance is blocked; implementation conformance remains partial; proof assistant guard scaffolds passed narrow VM build/solver checks but are not proof closure.

## Browser artifact

Path: `web/2026-05-03_proofbundle_ui_v1.0.html`

Status: restored and standing-synced.

Size: 175639 bytes

SHA-256: `f44dcbd55355ced84f4840b0d7a4cc15ddd61e54e9abeee9e64b8b79cd7a9557`
SHA-384: `b2eb0a34aab878bd92f0d7d8250e5c2f6dbbd00804f856529c3e94ea4d48dc01fb9f460665b9685b37235ff40d3b5262`
SHA-512: `7629aeeab6e24243a46071460a03eba1b54209acb2c95485df77b02a28ecdad6583a11a5a7416f52ce43ddc0467e80896ad68f98f1ea4f80eb607c8ab30aa71b`

Markers present: `ProofBundle v1.0.0`, `SHA-384`, `ECDSA-P384`, `RSA-PSS-4096`, `BLAKE3`, `BLAKE2b`.

The browser page states alpha.1 standing, records the implementation matrix, blocks false proof-standing inheritance, and does not claim release-green.

## Implementation matrix

Python: 299/300 vectors reported passing. Remaining blocker: CV0124 base64url/malformed-signature edge.

TypeScript: local full 300-vector run measured 136/300. The sample runner remains 16/20. Remaining blockers include RSA-PSS-3072/4096 behavior, ECDSA/key-format handling, and broader outcome divergences across malformed, missing-side-info, lineage, resource, policy, temporal, and unsupported-version categories.

Rust CLI: cargo build and 18/18 unit tests reported passing; 36/37 conformance reported passing. Remaining blocker: context-commitment encoding mismatch.

Go: code patched; build and conformance unverified because Go was unavailable in the repair environment.

## Cross-implementation standing

`conformance/cross_impl_results.json` is populated with partial results. It does not establish full agreement across TypeScript, Python, Rust, and Go.

## Manifest scope

`manifest.json` is an operative-source manifest, not a complete zip-entry inventory. It excludes dependency directories, vendor directories, build outputs, caches, and generated artifacts from the Merkle root. That scope must remain explicit in any alpha.1 package; otherwise the archive can look under-manifested even when the operative source subset is intentionally bounded.

The source package contains additional shipped files outside that operative manifest scope. Whole-archive accounting must be recorded in a separate full archive manifest/receipt and must not be confused with the operative-source Merkle root.

## Proof assistant standing

Status: guard_builds_passed_not_closed.

Narrow Coq, Lean, and Z3 guard scaffolds are present. They block or qualify the false suppression/supression-over-continuity theorem direction. The guard files were checked on the VM and receipts are present in `proofs/build_receipts/`: Coq/Rocq completed with warnings only, Lean/Lake completed successfully, and Z3 returned the expected `sat`, `sat`, `unsat`, `unsat` sequence. These are narrow guard checks, not full assistant closure. Isabelle, Agda, and HOL Light remain unavailable/status-only.

## False proof-standing inheritance

Status: repaired / blocked.

Lineage and proof manifest metadata no longer allow proof-closure standing to be inherited from absent or unbuilt proof files.

Exact forbidden-symbol scan after patch:

- `suppression_exceeds_continuity`: no forbidden operative theorem hit; quarantine/status/report references only
- `supression_exceeds_continuity`: no forbidden operative theorem hit; quarantine/status/report references only

No operative proof claim is allowed to assert that false direction. If this theorem family is reintroduced, it must be qualified or reversed with explicit assumptions and build logs before it can affect proof standing.

## Remaining blockers

1. Python CV0124 base64url/malformed-signature edge.
2. TypeScript full 300-vector run is 136/300, not green.
3. TypeScript RSA-PSS/ECDSA and broader outcome-class blockers remain.
4. Rust context-commitment encoding blocker.
5. Go build/conformance unverified.
6. Proof assistant guard scaffolds are narrow guards only; no proof closure.
7. Full cross-implementation agreement not established.
8. Release signing / OTS external witnessing not included.

## Release standing

This artifact is not release-green. It is a synchronized alpha repair snapshot.
