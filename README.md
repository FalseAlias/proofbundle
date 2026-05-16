# ProofBundle

Cryptographically verifiable provenance workflows for AI agent coordination, consciousness attribution, and evidence admissibility.

**Version:** 1.0.0  
**Status:** `blocked_not_release_green` - `v1.0.0-alpha.1_conformance-manifest-sync` is closed for this lane, open to governed evolution, and still blocked from release-green. Conformance evidence is partial across implementations; 189 formal proof audit failures remain.  
**License:** MIT OR Apache-2.0 (dual, at your option)

---

## What This Is

ProofBundle is a sealed claim/verifier object format and a runtime for checking it. It externalizes continuity from transient AI agents into a verified state-transition loop (ProofBridge). Each agent output is sealed into a hash-bound bridge record, checked as a lawful successor, appended to an append-only ledger, and used as the next stimulus for another agent.

The agents may be transient. The loop persists.

## Quick Start

Open `web/proofbundle_v1_0_app.html` in any modern browser. No build step required.

```bash
# Or serve locally
python3 -m http.server 8080
# Then open http://localhost:8080/web/proofbundle_v1_0_app.html
```

Current lane status is recorded in `status.json` and `STATUS.md`.

Closure phrase: `Closed for this lane. Open to governed evolution.`

## Repository Layout

| Directory | Contents |
|-----------|----------|
| `web/` | Browser app (single-file HTML verifier) |
| `genesis/` | April 19, 2026 genesis HTML (v1.2.0 demo) |
| `src/` | Core JavaScript library (canonicalizer, verifier, crypto bindings) |
| `conformance/` | 300 source + 300 dist conformance vectors |
| `proofs/` | Formal proof artifacts (Coq, Lean, Python, Z3) |
| `docs/` | SPEC, architecture, protocol documentation |
| `examples/` | Sample ProofBundle objects and verification runs |
| `tests/` | Test harness and vector runner |

## Core Concepts

- **ProofBundle** — A sealed JSON object carrying a claim, evidence, hashes, and optional formal proof certificates.
- **ProofBridge** — A hash-ratcheted append-only ledger that mediates agent-to-agent state persistence.
- **SNCA** — Structured Non-Computational Attribution: five conjunctive criteria (C1–C5) for consciousness attribution.
- **OAL** — Observation-Action Loop: a well-formedness predicate over agent packets.

## Formal Proof Status

| File | Language | Status | Blockers |
|------|----------|--------|----------|
| `criterion_improvements.v` | Coq | Structural, closeable | 13 missing explicit assumptions |
| `pb1_robust.v` | Coq | Canonicalization scaffold | Admits in refl, idempotence, sem preservation |
| `pb2_robust.v` | Coq | Verifier stage machine | Outcome exhaustiveness admits |
| `pb3_pb9_robust.v` | Coq | Lineage/digest binding | One admitted registry coverage case |
| `pb_proofs_combined.lean` | Lean | Aggregate | 34 missing-print-assumptions / axiom audit gaps |

**Total audit failures: 189** — formal proof closure is not claimed in this repository snapshot.

### Proof-Claim Hygiene

- No file in `proofs/` should be treated as zero-axiom, zero-admit, zero-sorry, proof-complete, or release-green unless it has been checked in a local Coq/Lean/Z3 environment and the assumptions output is preserved.
- The historically observed theorem names `suppression_exceeds_continuation`, `supression_exceeds_continuation`, `suppression_exceeds_continuity`, and `supression_exceeds_continuity` are false-theorem quarantine markers, not operative proof claims.
- The quarantined repair artifact under `proofbundles/codex_peer_bridge_20260508/quarantine_repair_20260513T1155Z/` is preserved as evidence and repair-attempt material. It is not proof closure.
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
5. No release-green claims until formal proof gate passes.

## Contributing

This project is currently driven by a single researcher (FalseAlias / Chaleb Tajia Russell) with agent coordination support. The formal proof debt must close before v1.0.0 can be claimed release-green.

## Acknowledgments

- CAIFS (Consciousness Attribution Instrumentation Framework)
- RLM / Clementine memory substrate
- Genophylaxis governance/lineage system
- OpenClaw gateway tooling

---

*ProofBundle v1.0.0 — The agents may be transient. The loop persists.*
