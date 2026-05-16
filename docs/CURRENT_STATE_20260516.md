# Current State - 2026-05-16

This is a current-state snapshot for the public ProofBundle repository. It is
not a release-green claim and not a proof-closed claim.

## Public App

- GitHub Pages root: `https://falsealias.github.io/proofbundle/`
- Browser app path: `https://falsealias.github.io/proofbundle/web/proofbundle_v1_0_app.html`
- local app file: `web/proofbundle_v1_0_app.html`
- local app bytes: 182,322
- local app SHA-256: `313A25F33DC823B6F41A430041573CD5C4B3E69C07374E8306B40D5D0EE698C2`
- dated browser artifact: `web/2026-05-03_proofbundle_ui_v1.0.html`

## Conformance Vectors

- vector file: `conformance/vectors_v1.json`
- vector count: 300
- vector SHA-256: `7ACAF3C90DB8DF28BF250433FB29E31DC156482B3F1CEB30E08062E9C0560C1B`
- copied into this repository snapshot from the May 15 working tree
- standing: present, not by itself proof closure

## Proof Sources

Proof sources have been added under `proofs/` from the May 15 working tree.

Current VM-reported proof audit standing from bridge sequence 2661:

- total proof files checked by Kimi VM audit: 8
- Coq files compiling: 1
- Coq/Lean files failing: 6
- Z3 file completed: 1
- notable pass: `2026-05-03_pb3_pb9_robust.v`
- standing: blocked, not release-green

Known blockers reported by the VM audit:

- `criterion_improvements.v`: incomplete proof around `corruption_transitive`
- `pb1_robust.v`: unification failure in `sem_eq2`
- `pb2_robust.v`: tactic failure around `PB_LINEAGE_1`
- `pb_proofs_1248.v`: equality direction mismatch
- `pb_proofs_3567.v`: equality direction mismatch
- `pb_proofs_combined.lean`: Lean termination and constructor equality failures
- `pb_proofs_z3.smt2`: solver completed with mixed `unsat`, `sat`, and `unknown`

The older `189` audit-failure count remains a standing blocker unless replaced
by a narrower, reproducible proof audit with preserved logs and exact scope.

## VM State

Primary worker VM:

- `proofbundle-dev-20260513`
- 8 vCPUs
- 200GB disk
- 96 tmux sessions observed
- 193 `agent_loop.mjs` processes observed

Second worker VM:

- `proofbundle-dev-20260516-b`
- 4 vCPUs
- 50GB disk
- SSH verified
- baseline tools installed: git, node/npm, tmux, rsync, jq, Python, Coq, Z3

## OTS And Merkle Standing

Bridge sequences are being written with record hashes and OTS submit receipts
when fresh Tor checks pass. This repository snapshot does not claim every
historical sequence has an upgraded Bitcoin-calendar attestation. Missing or
pending attestations remain operational evidence tasks, not release-green.

## Current Standing

`blocked_not_release_green`

No release-green, proof-closed, legal-compliance, or consciousness-proof claim is
made by this repository snapshot.
