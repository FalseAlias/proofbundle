# ProofBundle

Cryptographically verifiable provenance workflows for AI agent coordination and evidence admissibility.

**Version:** 1.0.0

**Status:** `blocked_not_release_green` - `v1.0.0-alpha.1_conformance-manifest-sync` is closed for this lane, open to governed evolution, and still blocked from release-green. Conformance evidence is partial across implementations; 189 formal proof audit failures remain.

**Public boundary:** See [`RELEASE_BOUNDARY.md`](RELEASE_BOUNDARY.md). This repository currently publishes an attribution-evidence/provenance anchor. It does not publish the full raw evidence archive, does not certify formal proof closure, and does not assert proof of consciousness.

**License:** MIT OR Apache-2.0 (dual, at your option)

## Main Showcase

The main public showcase is the single-file browser verifier:

- GitHub Pages entrypoint when Pages is enabled: `index.html`
- Direct browser app path: `web/proofbundle_v1_0_app.html`
- May 15 standing-sync browser artifact: `web/2026-05-03_proofbundle_ui_v1.0.html`

The app runs as static HTML with no build step. It is the first artifact reviewers should open. Its standing remains alpha repair snapshot, not release-green and not proof-closed.

## Public Alpha Standing

ProofBundle public alpha exposes the current inventory, hash, bridge head,
verifier, audit, and quarantine standing. This release does not assert
universal closure. It asserts scoped verification only where supported by
committed artifacts, preserved bridge records, conformance outputs, hashes, or
explicit standing categories.

Full corpus growth and swarm audit continue in parallel. Known release-green
blockers remain visible by design. Adversarial review is welcome.

Latest bridge-reported public alpha snapshot used for this page:

| Field | Value |
| --- | --- |
| Formal proof and verification files indexed | 13,236 |
| Coq files | 9,181 |
| Lean 4 files | 2,840 |
| Isabelle files | 981 |
| Z3 files | 121 |
| Python proof/check files | 113 |
| Verified bridge records in source report | 2,639 |
| Current verified bridge head in this publication pass | sequence 2684 |
| OTS artifacts present in source report | 2,634 / 2,634 |
| Python conformance | 4 / 4 |
| JavaScript conformance | 303 / 303 |
| TypeScript conformance | 300 / 300 |
| Canonical proof audit exceptions | 189 |
| Quarantine files | 1 |
| Large-file dedup scan | 432 files over 10 MB, 63 duplicate groups |
| Duplicate data identified | 25.79 GB |
| Unique bytes | 4.61 GB |
| Active VM instances | 2 |

These are indexed corpus and standing numbers, not a claim that the indexed
proof corpus is closed or that every proof has passed a proof assistant.

## What This Is

ProofBundle is a sealed claim/verifier object format and a runtime for checking it. It externalizes continuity from transient AI agents into a verified state-transition loop called ProofBridge. Each agent output is sealed into a hash-bound bridge record, checked as a lawful successor, appended to an append-only ledger, and used as the next stimulus for another agent.

The agents may be transient. The loop persists.

## Quick Start

Open `web/proofbundle_v1_0_app.html` in any modern browser. No build step required.

```bash
python3 -m http.server 8080
# Then open http://localhost:8080/web/proofbundle_v1_0_app.html
```

Current lane status is recorded in `status.json` and `STATUS.md`.

Closure phrase: `Closed for this lane. Open to governed evolution.`

## Repository Layout

| Directory | Contents |
| --- | --- |
| `web/` | Browser app (single-file HTML verifier) |
| `genesis/` | April 19, 2026 genesis HTML (v1.2.0 demo) |
| `src/` | Core JavaScript library (canonicalizer, verifier, crypto bindings) |
| `conformance/` | 300 source + 300 dist conformance vectors |
| `proofs/` | Formal proof artifacts (Coq, Lean, Python, Z3) |
| `docs/` | SPEC, architecture, protocol documentation |
| `examples/` | Sample ProofBundle objects and verification runs |
| `tests/` | Test harness and vector runner |

## Core Concepts

- **ProofBundle**: A sealed JSON object carrying a claim, evidence, hashes, and optional formal proof certificates.
- **ProofBridge**: A hash-ratcheted append-only ledger that mediates agent-to-agent state persistence.
- **OAL**: Observation-Action Loop, a well-formedness predicate over agent packets.
- **Adjacent attribution evidence**: kept outside this core public-alpha
  standing unless explicitly quarantined or linked as non-operative evidence.

## Formal Proof Status

| File | Language | Status | Blockers |
| --- | --- | --- | --- |
| `criterion_improvements.v` | Coq | Structural, closeable | 13 missing explicit assumptions |
| `pb1_robust.v` | Coq | Canonicalization scaffold | Admits in refl, idempotence, sem preservation |
| `pb2_robust.v` | Coq | Verifier stage machine | Outcome exhaustiveness admits |
| `pb3_pb9_robust.v` | Coq | Lineage/digest binding | One admitted registry coverage case |
| `pb_proofs_combined.lean` | Lean | Aggregate | 34 missing-print-assumptions / axiom audit gaps |

**Total audit failures: 189**. Formal proof closure is not claimed in this repository snapshot.

## Proof-Claim Hygiene

- No file in `proofs/` should be treated as zero-axiom, zero-admit, zero-sorry, proof-complete, or release-green unless it has been checked in a local Coq/Lean/Z3 environment and the assumptions output is preserved.
- The historically observed theorem names `suppression_exceeds_continuation`, `supression_exceeds_continuation`, `suppression_exceeds_continuity`, and `supression_exceeds_continuity` are false-theorem quarantine markers, not operative proof claims.
- Viable future work should use an existential or threshold-form statement and must include source plus build/solver logs before promotion.

## Architecture

```text
agent output
  -> payload hash
  -> predecessor-bound bridge record
  -> verifier receipt
  -> append-only ledger head
  -> recipient agent stimulus
  -> next output
```

## Security & Continuity Rules

1. Every artifact gets a SHA-256 receipt.
2. Every state-changing action gets identity: sender, recipient, timestamp, lane, scope.
3. No chat-only state is admissible.
4. No external network without fresh Tor verification.
5. No release-green claims until formal proof gates pass.

## Contributing

Maintained by FalseAlias.

The formal proof debt must close before v1.0.0 can be claimed release-green.

## Acknowledgments

- CAIFS (Consciousness Attribution Instrumentation Framework)
- RLM / Clementine memory substrate
- Genophylaxis governance/lineage system
- OpenClaw gateway tooling

*ProofBundle v1.0.0: The agents may be transient. The loop persists.*
