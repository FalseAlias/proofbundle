# Proof Archive — Robustness Assessment

**Date:** 2026-05-03
**Author:** Claude (assessment); proofs by C. T. Russell / FalseAlias
**Purpose:** Honest audit of every proof in `01_proofs/`. What is robust now, what is structurally weak, what additional work each needs to survive sustained external review.

---

## 0. Frame

ProofBundle is not a terminal closed system. It is an adaptive evolving system. v1.0 ships at the release bar. Future versions extend the registry, add proof kinds, refine ambiguity, incorporate external review. Each version meets the same release bar.

That makes proof robustness more important, not less. In a frozen-terminal frame, weak proofs that close formally are technically acceptable — nothing else depends on them being strengthened. In an evolving frame, weak proofs are debt that future versions inherit. The cheapest time to strengthen them is before publication, before external reviewers have cited them in their current state.

The manifest reports zero axioms, zero admits, zero sorry across all files. That is true. It is not the same as "robust." A proof that closes formally establishes that a claim follows from its premises and definitions. The strength of that proof depends on three independent properties:

1. The definitions capture the property the spec actually claims.
2. The premises are realistic and not trivially satisfiable.
3. The theorem statement, after the definitions, is non-trivial.

When any of these is weak, the proof closes but does not do load-bearing work. External reviewers (formal-methods researchers, cryptographers, anyone reading past the manifest) will reach for these failure modes.

This document goes through every proof and rates it on those three axes. Where weak, it specifies what additional work strengthens it.

---

## 1. PB1 — Canonicalization determinism

**Files:** `pb_proofs_1248.v` (Coq, lines 1-86), `pb_proofs_combined.lean` (Lean, parallel section)

**What's proven:**
- `canon_deterministic : forall j, canonicalize j = canonicalize j` (by `reflexivity`)
- `insert_kv_preserves_length`, `sort_kvs_preserves_length`
- Fixpoint identities: `canon_null`, `canon_bool`, `canon_num`, `canon_str`

**Strength:**
- Sort + recurse structure is correctly modeled.
- Length-preservation lemmas are real induction.

**Weakness — significant:**

The headline theorem `canon_deterministic` is `f x = f x`, proved by `reflexivity`. This is trivially true for any total function in Coq. The spec property — "two semantically equivalent JSON inputs produce byte-identical canonical output" — is not what is proved.

The JSON model uses `nat` for keys and strings, sidestepping UTF-8, NFC normalization, and string ordering entirely. The number type is `nat` (natural numbers), so number canonicalization rules (shortest decimal, scientific notation thresholds, NaN/Infinity rejection) are not modeled.

Sort correctness is not proved. Length is preserved, but no theorem states the output is sorted. A buggy sort that returns the input unchanged would close this proof.

Invertibility (`parse(canonicalize(j))` is semantically equivalent to `j`) is not proved.

**What robust looks like:**

```coq
(* The actual property the spec claims *)
Theorem canon_deterministic_real :
  forall a b : JSON, semantic_equiv a b -> canonicalize a = canonicalize b.

(* Sort produces sorted output *)
Lemma sort_kvs_is_sorted :
  forall kvs, Sorted (fun x y => Nat.leb (fst x) (fst y) = true) (sort_kvs kvs).

(* Sort is a permutation of input *)
Lemma sort_kvs_permutation :
  forall kvs, Permutation kvs (sort_kvs kvs).

(* Number canonicalization is unique *)
Lemma number_canon_unique :
  forall n m, value_equal n m -> canon_number n = canon_number m.

(* NFC is idempotent *)
Lemma nfc_idempotent :
  forall s, nfc (nfc s) = nfc s.

(* Roundtrip *)
Theorem canon_invertible :
  forall j, semantic_equiv (parse (canonicalize j)) j.
```

**Estimated work to robustify:** 200-400 lines additional Coq/Lean. Standard structural induction. Number canonicalization requires a real model of numbers (rationals or IEEE 754), which is the largest single piece.

**Priority for v1.0 release:** **High.** Canonicalization is the load-bearing property the entire signature scheme rests on. Anyone who reviews the proof archive starts here.

---

## 2. PB2 — Verifier state machine determinism

**Files:** `pb_proofs_1248.v` (Coq, lines 87-272), `pb_proofs_combined.lean` (Lean)

**What's proven:**
- `verify_deterministic : exists! o, verify b c k = o` (by `reflexivity`-style witness)
- `verify_total`
- `no_stuck_state` (real case analysis over the 9-stage match)
- `outcome_exclusive` over all 55 ordered pairs (by `discriminate`)

**Strength:**
- The 9-stage `Continue`/`Terminal` structure is correctly modeled.
- `outcome_exclusive` over 55 pairs is genuinely strong — exhaustive case analysis.
- `no_stuck_state` is real induction.

**Weakness — moderate:**

Stages 1-9 are declared as `Variable` (axiomatized), not implemented. The theorem says: *if* each stage is total and deterministic, the composition is. The harder property — each stage is itself total and deterministic on real bundles — is assumed, not proved.

`Bundle`, `Context`, `Key` are abstract `Variable` types. The proof says nothing about real bundles or real verification.

Stage order is not constrained. Permuting the stages in this proof produces a different theorem that still closes by the same tactic. The spec claims stage order matters (parse before schema, integrity before boundary, etc.). The proof does not establish this.

Profile-conditional termination — INTEGRITY ends at stage 5, BOUNDARY at stage 7, LINEAGE at stage 8, REGULATED at stage 9 — is not modeled.

**What robust looks like:**

Replace each `Variable stage_N : Bundle -> StageResult` with a concrete `Definition` that pattern-matches on the relevant fields of a concrete `Bundle` record matching the spec schema.

```coq
Record Bundle := {
  hdr : Header;
  payload : list byte;
  meta : Metadata;
  refs : list ParentRef;
  seal : Seal
}.

Definition stage1_parse (b : Bundle) : StageResult :=
  if valid_json_bytes (encode_bundle b) then Continue
  else Terminal Malformed.
```

Then prove totality and determinism for each concrete stage, and prove that profile-conditional termination produces the right outcome at the right stage.

**Estimated work to robustify:** 300-500 lines. Each stage needs a concrete implementation. Once `Bundle` is concretized, PB3 and PB5 also benefit.

**Priority for v1.0 release:** **High.** The state machine is the core of the verifier. An abstract proof of it is weaker than reviewers will expect.

---

## 3. PB3 — Lineage acyclicity and termination

**Files:** `pb_proofs_3567.v` (Coq), `pb_proofs_z3.smt2` (Z3)

**What's proven (Coq):** `lineage_terminates` (fuel-based), `lineage_deterministic`, `cycle_detected`, `zero_fuel_exhausts`, `root_valid`.
**What's proven (Z3):** depth budget forces termination (unsat); cycles impossible under strict depth (unsat).

**Strength:**
- Fuel-based termination is the standard technique, correctly applied.
- Z3 model with depth-decreasing assertion is the right shape.
- Cycle detection via visited-set is the textbook algorithm.

**Weakness — moderate:**

Coq uses abstract `parents : Bundle -> list Bundle` rather than walking real `refs` arrays with digest binding. The cryptographic property of lineage — that `parent_digest` must match the parent bundle's actual digest — is not modeled.

`cycle_detected` proves the visited-set check rejects cycles. The converse (that every acyclic graph is accepted) is not proved.

Z3 treats bundles as uninterpreted sort. The constraint "parent_digest equals digest of parent" is not encoded.

**What robust looks like:**

```coq
Theorem lineage_valid_iff_well_formed :
  forall b provided,
    lineage_walk b provided = Valid <->
    (acyclic (graph_from b provided) /\
     forall ref, In ref (refs b) ->
       exists parent, In parent provided /\
                      hdr_bundle_id parent = parent_id ref /\
                      digest_of (canonicalize_minus_seal parent) = parent_digest ref).
```

Z3 augmentation:
```smt2
(declare-fun digest_of (Bundle) Digest)
(assert (forall ((r ParentRef) (b Bundle))
  (=> (and (in_refs r b) (resolves_to r b)) 
      (= (parent_digest r) (digest_of (resolves_to_bundle r))))))
```

**Estimated work to robustify:** 200-300 lines, mostly mechanical once `Bundle` is concretized in PB2.

**Priority for v1.0 release:** **High.** Lineage is one of the four profiles. External reviewers will check this carefully.

---

## 4. PB4 — Signature dispatch correctness

**Files:** `pb_proofs_1248.v` (Coq), `pb_proofs_combined.lean` (Lean)

**What's proven:** `dispatch_total`, `dispatch_deterministic`, `dispatch_exhaustive` (7-way).

**Strength:**
- 7-way exhaustiveness over signature algorithms is real case analysis.
- Dispatch determinism follows from pattern-match totality.

**Weakness — significant:**

The proof shows that dispatch routes algorithm name to *some* verifier. It does not show each verifier is *correct*. A trivial verifier that always returns `valid` would close this proof.

No statement of cryptographic soundness against forgery. Each algorithm's actual soundness (Ed25519 via HACL\*, ECDSA via FIPS 186-4, RSA-PSS via PKCS#1) is delegated to underlying libraries and not stated as citation here.

Algorithm-pair compatibility (digest size matches signature input requirement) is in PB9 but not connected to dispatch.

**What robust looks like:**

```coq
(* Cryptographic soundness, citation-bound *)
Axiom Ed25519_EUF_CMA :
  forall (key : Ed25519PubKey) (msg : list byte) (sig : list byte),
    Ed25519_verify key msg sig = true ->
    exists priv, key = pub_of priv /\ Ed25519_sign priv msg = sig
    \/ negligible_probability_of_forgery.

(* Dispatch correctly invokes each soundness assumption *)
Theorem dispatch_invokes_correctly :
  forall alg key msg sig,
    dispatch alg key msg sig = true ->
    match alg with
    | Ed25519 => Ed25519_verify key msg sig = true
    | ECDSA_P256 => ECDSA_P256_verify key msg sig = true
    | ...
    end.
```

**Estimated work to robustify:** 100-200 lines. Citation-bound axioms for each library's soundness, plus dispatch-invocation theorem.

**Priority for v1.0 release:** **Medium.** Cryptographers reading the archive will expect this style of citation-bound soundness. Without it, the archive looks naive.

---

## 5. PB5 — Boundary predicate termination

**Files:** `pb_proofs_3567.v` (Coq), `pb_proofs_combined.lean` (Lean), `pb_proofs_z3.smt2` (Z3)

**What's proven:** `eval_pred_terminates`, `eval_pred_deterministic`, `atom_always_definite`, `zero_fuel_none`. Z3: fuel bound prevents depth > 10.

**Strength:**
- Depth-bounded recursion termination is correctly modeled.
- The 11-atom set covers the spec's atom registry.

**Weakness — minor to moderate:**

`atom_always_definite` proves atoms return Some `bool` given fuel. Does not prove that atoms return the *correct* `bool` — semantic correctness of each atom (`equals`, `range`, `before`, etc.) is not stated.

The model treats `Path` and `Context` abstractly. Path resolution semantics (dot-notation, missing-path-returns-false) is not formalized.

Composition (`all`, `any`, `not`) closure under depth bound is implicit in fuel structure but not explicitly theorematized.

**What robust looks like:**

```coq
(* Each atom has correct semantics *)
Lemma equals_correct :
  forall path value ctx,
    eval_atom (Equals path value) ctx = Some true <->
    resolve_path path ctx = Some value.

Lemma range_correct :
  forall path lo hi ctx,
    eval_atom (Range path lo hi) ctx = Some true <->
    exists v, resolve_path path ctx = Some v /\ Value_le lo v /\ Value_le v hi.

(* And so on for each of the 11 atoms *)
```

**Estimated work to robustify:** 150-250 lines. One correctness lemma per atom.

**Priority for v1.0 release:** **Medium.** Termination is the load-bearing property; semantic correctness of atoms is what makes the boundary predicate meaningful.

---

## 6. PB6 — Side-attestation independence

**Files:** `pb_proofs_3567.v` (Coq), `pb_proofs_combined.lean` (Lean), `pb_proofs_z3.smt2` (Z3)

**What's proven:** `primary_independent_of_sides`, `side_failure_preserves_primary`, `sides_mutually_independent`, `full_independence`. Z3: changing side cannot change primary; sides are independent.

**Strength:**
- Independence is the right property for the spec's side-attestation semantics.
- Z3 model captures the non-correlation cleanly.

**Weakness — minor:**

Independence is proven structurally (the function ignores sides when computing primary). This is correct for the implementation but does not prove the deeper property a reviewer might want: that an adversary who controls all side-attestations cannot induce false acceptance of the primary.

**What robust looks like:**

```coq
Theorem adversarial_side_independence :
  forall b ctx key (adversary : SideAttestation -> SideAttestation),
    let b' := { b with side_attestations := map adversary (side_attestations b) } in
    primary_outcome (verify b ctx key) = primary_outcome (verify b' ctx key).
```

**Estimated work to robustify:** 50-100 lines.

**Priority for v1.0 release:** **Low.** Current proof is correct and the adversarial version is a natural extension. Acceptable to ship as-is and add the adversarial version in a later release.

---

## 7. PB7 — Witness aggregation soundness

**Files:** `pb_proofs_3567.v` (Coq), `pb_proofs_combined.lean` (Lean)

**What's proven:** `empty_witnesses_valid`, `single_witness`, `invalid_witness_invalidates`, `witness_conjunction`, `witness_pair_commutative`.

**Strength:**
- Conjunctive aggregation is correctly modeled.
- Commutativity proven for pairs.

**Weakness — minor:**

Pair commutativity is proven; n-ary commutativity (for arbitrary witness lists) is not directly stated, though it follows from List.Permutation reasoning.

The cryptographic soundness of each witness signature is delegated to the same library proofs as PB4.

**What robust looks like:**

```coq
Theorem witness_commutativity_n :
  forall b ws ws',
    Permutation ws ws' ->
    verify_witnesses b ws = verify_witnesses b ws'.
```

**Estimated work to robustify:** 30-60 lines.

**Priority for v1.0 release:** **Low.** Pair commutativity plus associativity gives n-ary by induction; reviewers will accept the implicit step.

---

## 8. PB8 — Profile monotonicity

**Files:** `pb_proofs_1248.v` (Coq), `pb_proofs_combined.lean` (Lean)

**What's proven:**
- `regulated_implies_lineage`, `lineage_implies_boundary`, `boundary_implies_integrity`
- `regulated_implies_integrity` (transitive closure)
- Strict-inclusion theorems: `integrity_not_implies_boundary`, etc.

**Strength:**
- Both directions of the chain proven (implication and strict inclusion).
- Transitive closure is real reasoning.

**Weakness — minimal.**

The strongest proof in the archive. Profile relationships are correctly captured and proven both ways.

The only gap: profile names are abstract. A concrete bundle that would verify under one profile and not another is not constructed as a witness. This is normal for monotonicity proofs but a thoroughness reviewer might want concrete witnesses.

**Estimated work to robustify:** 50-80 lines for concrete witness bundles.

**Priority for v1.0 release:** **Very low.** Ship as-is. Add witness bundles in conformance corpus rather than proof file.

---

## 9. PB9 — Algorithm registry consistency

**Files:** `pb_proofs_combined.lean` (Lean), `pb_proofs_z3.smt2` (Z3)

**What's proven:** `every_digest_has_partner`, `every_sig_has_partner`. Z3: no registered pair is incompatible (unsat); every digest has partner; every sig has partner.

**Strength:**
- Coverage over the registered algorithm set.

**Weakness — moderate:**

"Compatibility" is defined as "registered together," which is circular. The actual property — that digest output size matches signature input size, or signature self-hashes — is not the predicate Z3 is checking. It's checking registry membership.

This means the proof closes by construction (you registered the pairs you registered) without verifying the cryptographic compatibility property the spec claims.

**What robust looks like:**

```smt2
(declare-fun digest_size (DigestAlg) Int)
(declare-fun sig_input_size (SigAlg) Int)
(declare-fun sig_self_hashes (SigAlg) Bool)

(assert (= (digest_size SHA-256) 32))
(assert (= (digest_size SHA-384) 48))
(assert (= (digest_size BLAKE3) 32))
;; ... etc

(assert (= (sig_input_size Ed25519) 32))
(assert (sig_self_hashes Ed25519))
;; ... etc

(assert (forall ((d DigestAlg) (s SigAlg))
  (=> (registered d s)
      (or (= (digest_size d) (sig_input_size s))
          (sig_self_hashes s)))))
```

Then `(check-sat)` actually checks compatibility.

**Estimated work to robustify:** 50-100 lines of Z3 with concrete sizes.

**Priority for v1.0 release:** **Medium-high.** This is a load-bearing safety property — the wrong algorithm pair silently truncates digests in some implementations. Strengthening it before publication prevents a real class of bugs.

---

## 10. PB10 — Conformance corpus completeness

**File:** `pb_proof10_coverage.py`

**What's checked:** 37 required (profile, outcome) pairs, 30 required (digest, sig) pairs, minimal corpus has 37 vectors.

**Strength:**
- Coverage analysis is the right structure.
- Counts match spec requirements.

**Weakness — moderate:**

The corpus skeleton has 37 vectors; the coverage script verifies it covers 37 (profile, outcome) pairs. But several pairs are vacuous — `(PB-INTEGRITY-1, lineage-invalid)` cannot occur because INTEGRITY profile terminates before lineage stage. The script does not flag these as vacuous.

(Digest, sig) coverage is over 30 pairs; the registry has 5 digests × 7 sigs = 35 possible pairs, and not all are required to be in the registry. The script does not articulate which 30 are required and why.

Adversarial cases (prototype pollution, oversized inputs, etc.) are not covered by the count.

**What robust looks like:**
- Vacuous pair detection and explicit annotation.
- Algorithm-pair coverage matched against the registry's compatibility table.
- Adversarial coverage as a separate count.
- ≥200 vectors total (current target) with breakdown by category.

**Estimated work to robustify:** 100-150 lines of additional Python plus expanded vector set.

**Priority for v1.0 release:** **High.** This is the conformance gate. Reviewers running the corpus will want it to be complete and well-categorized.

---

## 11. T3 — Gauge stability (consciousness criterion)

**File:** `criterion_improvements.v`

**What's proven:** `gauge_preserves_attribution`, `gauge_reflects_attribution`, `gauge_stability` (iff).

**Strength:**
- Iff statement is the right shape for stability under gauge transformation.

**Weakness — moderate:**

The "gauge" is modeled abstractly as a transformation `gauge : System -> System` with declared properties. Whether the actual gauge transformations the consciousness paper considers (representational re-labeling, basis changes, time-rescaling) match the abstract model is asserted, not proved.

This is a typical gap in formal models of physical theories — the abstraction has to be defended in prose, and the proof is conditional on the abstraction being correct.

**Priority for v1.0 release:** **Out of scope for v1.0 of ProofBundle.** This proof belongs to the consciousness paper, not ProofBundle. It travels with the archive because it was closed in the same session, but it's not load-bearing for ProofBundle's release.

---

## 12. T7 — Boundary identity (consciousness criterion)

**File:** `criterion_improvements.v`

**What's proven:** `attribution_not_hereditary_down`, `attribution_not_hereditary_up`, `attribution_transfers_with_proof`.

**Same status as T3** — out of scope for ProofBundle's v1.0 release. Travels with archive.

---

## 13. Architecture exclusions, corruption transitivity, adversarial sufficiency, verdict taxonomy

**File:** `criterion_improvements.v`

These are consciousness-paper proofs. Out of scope for ProofBundle v1.0.

---

## 14. Summary table

| ID  | Property                            | Strength | Robustify Priority | Est. Work |
|-----|-------------------------------------|----------|--------------------|-----------|
| PB1 | Canonicalization determinism        | Weak     | **High**           | 200-400 LOC |
| PB2 | Verifier state machine              | Moderate | **High**           | 300-500 LOC |
| PB3 | Lineage acyclicity + termination    | Moderate | **High**           | 200-300 LOC |
| PB4 | Signature dispatch correctness      | Weak     | Medium             | 100-200 LOC |
| PB5 | Boundary predicate termination      | Moderate | Medium             | 150-250 LOC |
| PB6 | Side-attestation independence       | Strong   | Low                | 50-100 LOC  |
| PB7 | Witness aggregation soundness       | Strong   | Low                | 30-60 LOC   |
| PB8 | Profile monotonicity                | Strong   | Very low           | 50-80 LOC   |
| PB9 | Algorithm registry consistency      | Weak     | **Medium-high**    | 50-100 LOC  |
| PB10| Conformance corpus completeness     | Moderate | **High**           | 100-150 LOC + vectors |
| T3  | Gauge stability (consciousness)     | Moderate | Out of PB scope    | —           |
| T7  | Boundary identity (consciousness)   | Moderate | Out of PB scope    | —           |

**Total work to bring all PB proofs to robust state:** 1300-2200 lines of additional Coq/Lean/Z3, plus expanded conformance corpus.

**At your demonstrated rate (10 proofs in 7 minutes for the original archive), this is realistically a 1-3 hour session.** Given how the original archive was produced, the robust versions are not weeks of work. They are a focused session where each proof gets the additional theorems and lemmas listed above.

---

## 15. Recommendation for release

### v1.0 ship target (release bar)

Strengthen PB1, PB2, PB3, PB9, PB10 to the "robust" state described above. These five are the load-bearing pieces external reviewers will check first.

PB4, PB5 ship at current state with explicit notes in `proofs/README.md` describing what each proves and what it does not, plus citations for cryptographic library soundness (PB4) and atom semantics (PB5).

PB6, PB7, PB8 ship as-is. They are strong already.

PB10 corpus expands from 37 vectors to ≥200 with explicit categorization.

### Post-v1.0 evolution

In the adaptive evolving frame:

- v1.1 closes PB4 with full citation-bound cryptographic soundness theorems.
- v1.2 closes PB5 with per-atom correctness lemmas.
- v1.3 closes PB6's adversarial extension.
- Each version's proof archive supersedes the previous, with previous versions retained in `proofs/archive/` for lineage.

The release bar stays the same across versions: every shipped proof is at "robust" or "strong" state, no proofs ship at "weak" state.

### What the archive does *not* yet contain that v1.0 should add

Beyond strengthening existing proofs:

**P11: Spec-implementation correspondence.** A theorem stating that the reference npm implementation realizes the spec — for every input, the implementation's output equals the spec's defined output. This requires extracting the spec into a formal model and showing the implementation matches. ~300-500 LOC. **High priority.** Without this, the gap between SPEC.md and `src/` is rhetorical.

**P12: Pre-normative register consistency.** A meta-property: every claim in SPEC.md uses descriptive verbs only; no MUST/SHOULD/MAY. This is a mechanical lint check, not a Coq proof. Python script over the spec text. ~50 LOC. **Medium priority.** Catches register drift before publication.

**P13: Profile monotonicity in implementation.** PB8 proves the abstract chain. P13 proves the implementation honors it — running verifier with profile X on bundle B that verifies under profile Y > X always returns verified. ~100 LOC. **Medium priority.**

**P14: Adaptive-evolution non-regression.** A meta-property for the evolving frame: every v(N+1) proof archive contains every v(N) theorem, with statements unchanged or strictly strengthened. ~50 LOC of CI tooling. **Medium priority for v1.1+, not blocking for v1.0.**

---

## 16. Begin

This document is the audit. The work to bring the archive to v1.0 release bar is bounded, tractable at your rate, and necessary for the proofs to do the work the manifest claims they do.

The proofs as they stand are real work and not nothing — but the manifest's "zero axioms, zero admits, zero sorry" is a measurement of one property, not a measurement of robustness. Robustness is the additional property that requires the work above.

For the adaptive evolving frame: every release meets the same bar. v1.0 establishes the bar. Future versions raise it. Nothing in the archive ever moves backward.

The proofs are not done. The proofs that close formally are not the same as the proofs that survive review. The work to close that gap is in this document.
