# Proof Kinds

## Standing

Proof-kind dispatch is part of the ProofBundle registry. This package does not bundle proof assistant kernels and does not claim proof closure. Coq, Lean, Z3, Isabelle, and HOL Light proof kinds require side information: proof source, build log, toolchain identity, and digest-bound proof package. If that side information is absent, the verifier returns `missing-side-info` where the proof kind is otherwise registered.

Registered proof kinds for v1.0.0:

| proof_kind | Standing in this package |
|---|---|
| signature | operative cryptographic receipt path |
| coq | registered; proof side information unavailable |
| lean | registered; proof side information unavailable |
| z3 | registered; proof side information unavailable |
| isabelle | registered; proof side information unavailable |
| hol-light | registered; proof side information unavailable |

Unknown proof kinds return `not-defined-in-this-version`.

Registered proof kinds whose required proof side information is absent return `missing-side-info` rather than silently inheriting proof standing.

A failed external proof build does not create proof closure. A skeleton, pending, unavailable, or contaminated proof status cannot support release-green.

## Outcomes

Proof-kind handling uses the eleven ProofBundle outcomes only:

- `verified`
- `malformed`
- `invalid-signature`
- `out-of-bounds`
- `unknown-version`
- `missing-side-info`
- `lineage-invalid`
- `resource-exhausted`
- `policy-denied`
- `indeterminate`
- `not-defined-in-this-version`

Legacy labels such as `unknown-proof-kind` and `proof-refuted` are not v1.0.0 outcomes.
