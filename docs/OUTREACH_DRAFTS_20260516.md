# Outreach Drafts — Staged for User Approval

**Identity:** kimi-current-lane1-spark
**Standing:** blocked_not_release_green
**Status:** DRAFT — NOT POSTED pending explicit user authorization per AGENTS.md policy

---

## Draft 1: Hacker News — "Show HN"

**Title:** Show HN: ProofBundle — browser verifier for cryptographic provenance receipts

**Body:**
ProofBundle is a self-contained browser verifier/sealer for cryptographic provenance receipts, with a 300-vector conformance corpus and an indexed formal-proof corpus.

Current standing is intentionally **not release-green**. The repo lists remaining implementation and proof-assistant blockers. I'm looking for adversarial technical review of the verifier model, evidence schema, conformance vectors, proof standing, and AI-governance mapping.

App: https://falsealias.github.io/proofbundle/
Repo: https://github.com/FalseAlias/proofbundle

Current bounded numbers:
- 13,236 indexed formal-proof and verification files
- 2,685 bridge records with OTS artifacts
- JavaScript conformance: 303/303 pass
- TypeScript conformance: 300/300 pass
- Coq proof compilation: 5/6 pass (1 remaining Forall unification blocker)
- Lean proof compilation: 0/1 pass (27 errors, termination + definitional equality)
- Standing: public alpha, not release-green

What would break this? What did I miss?

---

## Draft 2: Reddit r/crypto

**Title:** [Public Alpha] ProofBundle — cryptographic provenance verifier with 300-vector conformance corpus

**Body:**
I've been working on ProofBundle, a browser-based verifier and sealer for cryptographic provenance receipts. It's designed for supply-chain transparency, AI governance audit tooling, and formal-methods-backed evidence preservation.

The public alpha is live with:
- Single-file HTML5 verifier (no build step, works offline)
- 300 conformance vectors covering 5 digest + 7 signature algorithms
- Cross-implementation verification (JS, Python, TypeScript, Go, Rust)
- 13k+ indexed formal proof files (Coq, Lean, Z3)
- Append-only bridge ledger with OpenTimestamp receipts

**I need adversarial review.** The repo documents exactly what's blocked and why. No release-green claims until the proof gates pass.

Links:
- Live app: https://falsealias.github.io/proofbundle/
- Repo: https://github.com/FalseAlias/proofbundle
- Current state: docs/CURRENT_STATE_20260516.md
- Proof standing: proofs/PROOF_STATUS.generated.json

What would you attack first?

---

## Draft 3: Academic / Formal Methods Lists

**Subject:** Call for adversarial review: ProofBundle provenance verifier and formal proof corpus

**Body:**
ProofBundle is a cryptographic provenance system with a browser-based verifier, 300-vector conformance corpus, and indexed formal proof artifacts in Coq, Lean 4, and Z3.

We are explicitly **not claiming release-green status**. The proof corpus has 2 remaining compilation blockers:
1. Coq: Forall unification failure in JSON object equivalence (pb1_robust.v)
2. Lean: Termination and definitional equality in recursive canonicalization (pb_proofs_combined.lean)

We are seeking:
- Formal methods reviewers for the proof blockers
- Cryptographic reviewers for the verifier model
- Supply-chain provenance reviewers for the evidence schema
- Browser/offline-verifier implementers for cross-platform testing

Repository: https://github.com/FalseAlias/proofbundle
Formal proof directory: proofs/
Conformance vectors: conformance/vectors_v1.json

---

## Approval Required

Per AGENTS.md Section 8: "Fresh explicit approval required for... Public posting or publishing"

These drafts are staged and ready. **Do not post without user explicit authorization.**

