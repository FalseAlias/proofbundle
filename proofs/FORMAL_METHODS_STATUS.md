# Formal Methods Status - Worker 3

Generated: 2026-05-15T10:54:01Z

Scope: `proofs/z3/**`, `proofs/isabelle/**`, `proofs/agda/**`, `proofs/hol-light/**`.

Standing: `scaffold_only`; no proof closure claimed.

## Guard Implemented

Path: `proofs/z3/suppression_continuation_guard.smt2`

The guard covers the arithmetic defect around suppression cost and normalized continuation cost. It does not assert the false universal direction. Instead it checks:

- `sat` counterexample search for the invalid shape `k >= 2`, `W > 0`, and `k * W <= 1`;
- `sat` pinned counterexample `k = 3`, `W = 1/4`;
- `unsat` negation of the threshold-qualified direction: if `k >= 2` and `W > 1/k`, then `k * W > 1`;
- `unsat` negation of the boundary equality: if `W = 1/k`, then `k * W = 1`, not strict exceedance.

This is a guard against theorem-direction regression, not a proof of the broader ProofBundle system.

## Assistant Standing

| Assistant | Added source | Tool available in this environment | Build/check standing | Closure inheritance |
|---|---:|---|---|---|
| Z3 / SMT-LIB | 1 guard scaffold | yes on VM | ran; returned expected `sat`, `sat`, `unsat`, `unsat` | none |
| Isabelle/HOL | 0 proof sources; status only | no | not run | none |
| Agda | 0 proof sources; status only | no | not run | none |
| HOL Light | 0 proof sources; status only | no OCaml/HOL Light command found | not run | none |

## Non-Inheritance Rule

Unavailable assistants, comments, status files, README files, and narrow guard scaffolds do not confer proof closure. Any future closure claim requires broader assistant source, toolchain identity, build logs, and digest-bound receipts for the exact files checked.

## VM Check Receipt

- Path: `proofs/build_receipts/z3_check_20260515T1107Z.log`
- SHA-256: `7d1c4e47e2603f091b039090e8275411dbba521374dfee85c52d7e3ea28c8657`
- Result: expected `sat`, `sat`, `unsat`, `unsat` sequence.
