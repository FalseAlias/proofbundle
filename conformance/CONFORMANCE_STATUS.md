# ProofBundle alpha.1 conformance status

Generated: 2026-05-15T10:54:43Z

Standing: `alpha-repair-snapshot`

Release standing: `blocked_not_release_green`

This status is scoped to `conformance/vectors_v1.json` and the implementation matrix recorded in `conformance/cross_impl_results.json`. It does not claim full-release readiness, all-implementation agreement, proof closure, or release-green status.

## Corpus

`conformance/vectors_v1.json` contains 300 vectors. Expected outcome coverage:

| Outcome | Count |
|---|---:|
| verified | 64 |
| out-of-bounds | 43 |
| invalid-signature | 35 |
| malformed | 20 |
| unknown-version | 20 |
| not-defined-in-this-version | 25 |
| missing-side-info | 20 |
| indeterminate | 20 |
| lineage-invalid | 23 |
| resource-exhausted | 15 |
| policy-denied | 15 |

## Current implementation matrix

| Lane | Evidence | Result | Standing |
|---|---|---:|---|
| Python | local run: `python .\python\test_vectors.py` with `PYTHONPATH=.\python` and `PYTHONDONTWRITEBYTECODE=1` | 299/300 | partial; CV0124 remains |
| TypeScript sample | local run: `node .\test_vector_sample.js` from `core/` | 16/20 | sample-only; not a full gate |
| TypeScript full | local run: `node .\test_vectors.js` from `core/` | 136/300 | failing full gate |
| Rust | prior reported only; `cargo` unavailable here | 36/37 reported | partial prior report; not locally rerun |
| Go | `go` unavailable here | 0/300 verified here | unverified |

The TypeScript full runner exited 0 while printing 164 mismatches, so its process exit code is not evidence of green conformance.

## Observed blockers

1. Python still fails `CV0124`: expected `malformed`, actual `invalid-signature`.
2. TypeScript sample still fails RSA-PSS-3072/4096 vectors `CV0016`, `CV0017`, `CV0019`, and `CV0020`.
3. TypeScript full run fails 164 of 300 vectors across signature, malformed, missing-side-info, indeterminate, lineage, resource, policy, temporal, and unsupported-version categories.
4. Rust was not locally rerun because `cargo` is unavailable; the preserved prior matrix remains 36/37 with a context-commitment blocker.
5. Go was not locally rerun because `go` is unavailable; Go remains unverified.
6. No full Python/TypeScript/Rust/Go 300-vector agreement matrix exists.
7. Proof assistant guard builds/checks are narrow and cannot support release standing.
8. Release signing and external witnessing are outside this conformance artifact and are not satisfied here.

## Proof standing note

Existing proof docs now describe a narrow false-theorem guard, not proof closure. `proofs/COQ_STATUS.md` and `proofs/LEAN_STATUS.md` record VM build receipts for the narrow guards, while keeping the proof lane non-closed.

The operative guard status reflected here is:

- No operative theorem named `suppression_exceeds_continuity` or `supression_exceeds_continuity` is introduced as a release-supporting claim.
- `proofs/coq/ContinuitySuppressionGuard.v` records an equal-cost counterexample and guards against the universal claim that suppression always strictly exceeds continuity.
- `proofs/lean/ProofBundle/SuppressionContinuityGuard.lean` records that suppression-only observations do not establish continuity and that true continuity standing requires explicit `ContinuityEvidence`.
- VM receipts in `proofs/build_receipts/` show Coq/Rocq warnings only, Lean/Lake build success, and the expected Z3 `sat`, `sat`, `unsat`, `unsat` sequence. These proof artifacts are still not promoted to proof closure.

## Verification performed

- Parsed `conformance/vectors_v1.json`: 300 vectors.
- Ran Python conformance: 299/300, command exited 1.
- Ran TypeScript sample conformance: 16/20, command exited 0 while reporting four mismatches.
- Ran TypeScript full conformance: 136/300, command exited 0 while reporting 164 mismatches.
- Checked local tool availability: `go`, `cargo`, `coqc`, and `lake` are unavailable on PATH.
- Imported VM proof guard receipts for Coq/Rocq, Lean/Lake, and Z3.
- Inspected false-theorem guard docs and Coq/Lean scaffold sources.

Final status: `alpha-repair-snapshot`; `blocked_not_release_green`; cross-implementation conformance is partial and currently failing full release criteria.
