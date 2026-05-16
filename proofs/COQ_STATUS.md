# Coq Status - ProofBundle v1.0.0-alpha.1

Generated: 2026-05-15T10:54:02Z

Standing: `guard_build_passed_not_closed`

Operative Coq source now exists only for a narrow false-theorem guard:

- `proofs/coq/ContinuitySuppressionGuard.v`

Guard implemented:

- The scaffold does not assert proof closure.
- It proves an equal-cost counterexample to the universal claim that suppression always strictly exceeds continuity.
- It proves the same negative guard for the common `supression` misspelling lane.
- It records only a qualified positive fact: strict excess implies inequality.

No release-green, proof-complete, or axiom-free standing is claimed by this Coq lane.

Build status:

- VM check path: `/home/falsealias267_gmail_com/proofbundle-cloud/alpha1_proof_check_20260515T1107Z/proofs/coq`.
- Command: `make -f Makefile.coq`.
- Result: exit 0; `coqc -q ContinuitySuppressionGuard.v` completed with warnings only.
- Local receipt: `proofs/build_receipts/coq_build_20260515T1107Z.log`.
- Receipt SHA-256: `c859c3b5d1d20919e7abe0bb95c42c0adcce52ae8820dd8dd13a8fa1e0cdd15c`.
- This is a narrow guard build, not proof closure for the broader ProofBundle system.
