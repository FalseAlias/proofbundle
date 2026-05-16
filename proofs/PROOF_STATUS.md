# Proof Status - ProofBundle v1.0.0-alpha.1

Generated: 2026-05-15T11:05:00Z

Standing: `guard_builds_passed_not_closed`

This package now contains narrow proof-assistant guard scaffolds for the false
suppression/supression-over-continuity theorem family. These scaffolds are
not proof closure for ProofBundle v1.0.0-alpha.1, and they do not support a
release-green claim.

The browser artifact, lineage record, repository metadata, and scaffold files
do not inherit proof authority from absent files, stale metadata, or narrow guard builds.

| Assistant | Source files | Build run | Standing |
|---|---:|---|---|
| Coq | 2 | yes on VM; warnings only | guard_build_passed_not_closed |
| Lean 4 | 4 | yes on VM; Lake build completed successfully | guard_build_passed_not_closed |
| Z3 / SMT-LIB | 1 | yes on VM; expected `sat`, `sat`, `unsat`, `unsat` | guard_solver_check_passed_not_closed |
| Isabelle/HOL | 0 proof sources; status only | no | unavailable |
| Agda | 0 proof sources; status only | no | unavailable |
| HOL Light | 0 proof sources; status only | no | unavailable |

## False-Theorem Guard

The false theorem direction is not present as an operative proof claim:

- `suppression_exceeds_continuity`: absent from operative proof sources.
- `supression_exceeds_continuity`: absent from operative proof sources.
- `continuity_exceeds_suppression`: not used as an incorrect operative theorem.

The current guard files are deliberately qualified:

- `coq/ContinuitySuppressionGuard.v` proves an equal-cost counterexample and
  negative guards against the universal claim that suppression always strictly
  exceeds continuity.
- `lean/ProofBundle/SuppressionContinuityGuard.lean` records that
  suppression-only observations do not establish continuity, and true
  continuity standing requires explicit `ContinuityEvidence`.
- `z3/suppression_continuation_guard.smt2` records counterexamples to the
  invalid universal arithmetic shape and only the threshold-qualified direction
  `W > 1/k => k * W > 1`.
- `FALSE_THEOREM_GUARD.md` and
  `tooling/worker4_false_theorem_guard_scan_20260515.mjs` classify exact-name
  hits as quarantine/report references, not operative theorem declarations.

## Build Receipts

- `build_receipts/coq_build_20260515T1107Z.log` - SHA-256 `c859c3b5d1d20919e7abe0bb95c42c0adcce52ae8820dd8dd13a8fa1e0cdd15c`; VM Rocq/Coq check completed with warnings only.
- `build_receipts/lean_build_20260515T1107Z.log` - SHA-256 `ac423fe766e2be3486860f396955fd692961bcbb6b5d6d2b1030524d01c09012`; VM Lean/Lake build completed successfully.
- `build_receipts/z3_check_20260515T1107Z.log` - SHA-256 `7d1c4e47e2603f091b039090e8275411dbba521374dfee85c52d7e3ea28c8657`; VM Z3 check returned the expected `sat`, `sat`, `unsat`, `unsat` sequence.

## Non-Closure Rule

No release-green, proof-complete, axiom-free, or full formal proof standing is
claimed. Any future closure claim requires broader proof assistant source,
toolchain identity, successful full build logs, and digest-bound receipts for
the exact files checked.
