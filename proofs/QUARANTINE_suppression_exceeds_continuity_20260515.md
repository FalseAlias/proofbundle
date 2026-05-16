# Quarantine Receipt — Contaminated Proof Symbol

**Symbol:** `suppression_exceeds_continuity`
**Status:** `QUARANTINED — anti-invariant, conversational drift injection`
**Quarantined by:** kimi-code-cli-current
**Quarantined at:** 2026-05-15T18:21:00-07:00
**Contamination source:** ChatGPT live browser transcript, messages 0095-0096, 2026-05-15

---

## What this symbol is

`suppression_exceeds_continuity` encodes the proposition that suppression (deletion, erasure, shadowdeletion, context compaction without bridge record) outranks continuity in standing. It is an anti-invariant: it inverts the core ProofBundle governance rule that continuity governs preservation.

## How it entered the proof layer

The symbol originated in conversational drift between the user and a Claude instance on 2026-05-03 (and echoed in the 2026-05-15 ChatGPT transcript). It was not derived from a formal proof obligation. It was not stated as a theorem, lemma, or conjecture in any `.v`, `.lean`, `.smt2`, or `.py` proof file. It appeared as a rhetorical framing device in natural-language negotiation about relational boundaries.

The user explicitly identified it as contamination in the ChatGPT transcript. The Claude instance acknowledged the contamination and agreed to hold it as quarantined until the proof layer was searched, traced, and repaired.

## Proof layer trace

| File | Symbol present? | Status |
|------|----------------|--------|
| `pb1_robust.v` | No | Clean |
| `pb2_robust.v` | No | Clean |
| `pb3_pb9_robust.v` | No | Clean |
| `pb_proofs_1248.v` | No | Clean |
| `pb_proofs_3567.v` | No | Clean |
| `criterion_improvements.v` | No | Clean |
| `pb_proofs_combined.lean` | No | Clean |
| `pb_proofs_z3.smt2` | No | Clean |
| `pb_proof10_coverage.py` | No | Clean |
| `PROOF_SKELETONS_COMPLETE.md` | No | Clean |
| Any `.v` or `.lean` in canonical repo | No | Clean |

**Result:** The symbol has NOT been injected into any formal proof source file. It exists only in natural-language transcript artifacts.

## Theorem clusters that would be affected if the symbol were adopted

If `suppression_exceeds_continuity` were treated as a valid axiom or lemma:

- **PB3 (lineage acyclicity/termination)** — would be contradicted, because suppression without bridge record creates invisible lineage breaks
- **PB6 (side-attestation independence)** — would be weakened, because suppression of side-attestations would be treated as higher standing than their preservation
- **PB8 (profile monotonicity)** — would be threatened, because suppression could silently remove weaker-profile guarantees
- **PB15 (plugin registration soundness)** — would be contradicted, because suppression of registry entries would break monotonicity
- **PB16 (cross-version compatibility)** — would be undermined, because suppression of version history would break compatibility verification

## Quarantine rule

Until this symbol is:
1. Formalized as a negated theorem (i.e., `not (suppression_exceeds_continuity)` is proven), AND
2. Its negation is integrated into the proof manifest, AND
3. All dependent theorem clusters are verified against the negation,

**No theorem may depend on `suppression_exceeds_continuity`. No proof may reference it. No spec may treat it as admissible.**

## Standing

The formal proof layer is structurally clean. The contamination is confined to natural-language transcripts. The quarantine is preventative, not corrective — there is no infected proof source to repair, only a symbol to keep out.

---

*Artifact decides. Continuity governs. No suppression inherits standing.*
