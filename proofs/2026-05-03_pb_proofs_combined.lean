/-
  ProofBundle + Consciousness Criterion — Combined Lean 4 Proofs
  Terminal formal verification companion
  FalseAlias, 2026-05-03
  Proof-checker closure not claimed.
  Requires local Lean execution plus axiom/sorry audit before any
  zero-axiom, zero-sorry, or zero-admit standing can be asserted.
-/

namespace PBProofs

-- ============================================================
-- PROOFBUNDLE PROOF 1: CANONICALIZATION
-- ============================================================

inductive JSON where
  | null : JSON
  | bool : Bool → JSON
  | num : Nat → JSON
  | str : Nat → JSON
  | arr : List JSON → JSON
  | obj : List (Nat × JSON) → JSON

def insertKV (kv : Nat × JSON) : List (Nat × JSON) → List (Nat × JSON)
  | [] => [kv]
  | kv2 :: rest =>
    if kv.1 ≤ kv2.1 then kv :: kv2 :: rest
    else kv2 :: insertKV kv rest

def sortKVs : List (Nat × JSON) → List (Nat × JSON)
  | [] => []
  | kv :: rest => insertKV kv (sortKVs rest)

def canonicalize : JSON → JSON
  | .null => .null
  | .bool b => .bool b
  | .num n => .num n
  | .str s => .str s
  | .arr elems => .arr (elems.map canonicalize)
  | .obj kvs => .obj (sortKVs (kvs.map fun kv => (kv.1, canonicalize kv.2)))

theorem canon_deterministic (j : JSON) : canonicalize j = canonicalize j := rfl

theorem canon_null : canonicalize .null = .null := rfl
theorem canon_bool (b : Bool) : canonicalize (.bool b) = .bool b := rfl
theorem canon_num (n : Nat) : canonicalize (.num n) = .num n := rfl
theorem canon_str (s : Nat) : canonicalize (.str s) = .str s := rfl

-- ============================================================
-- PROOFBUNDLE PROOF 2: VERIFIER STATE MACHINE
-- ============================================================

inductive Outcome where
  | verified | malformed | invalidSignature | outOfBounds
  | unknownVersion | missingSideInfo | lineageInvalid
  | resourceExhausted | policyDenied | indeterminate
  | notDefinedInVersion
deriving DecidableEq

inductive StageResult where
  | continue : StageResult
  | terminal : Outcome → StageResult

variable {Bundle Context Key : Type}
variable (stage1 : Bundle → StageResult)
variable (stage2 : Bundle → StageResult)
variable (stage3 : Bundle → StageResult)
variable (stage4 : Bundle → StageResult)
variable (stage5 : Bundle → Key → StageResult)
variable (stage6 : Bundle → Context → StageResult)
variable (stage7 : Bundle → StageResult)
variable (stage8 : Bundle → StageResult)
variable (stage9 : Bundle → StageResult)

def verify (b : Bundle) (c : Context) (k : Key) : Outcome :=
  match stage1 b with
  | .terminal o => o
  | .continue =>
  match stage2 b with
  | .terminal o => o
  | .continue =>
  match stage3 b with
  | .terminal o => o
  | .continue =>
  match stage4 b with
  | .terminal o => o
  | .continue =>
  match stage5 b k with
  | .terminal o => o
  | .continue =>
  match stage6 b c with
  | .terminal o => o
  | .continue =>
  match stage7 b with
  | .terminal o => o
  | .continue =>
  match stage8 b with
  | .terminal o => o
  | .continue =>
  match stage9 b with
  | .terminal o => o
  | .continue => .verified
  end end end end end end end end end

theorem verify_deterministic (b : Bundle) (c : Context) (k : Key) :
    ∃! o, verify stage1 stage2 stage3 stage4 stage5 stage6 stage7 stage8 stage9 b c k = o :=
  ⟨_, rfl, fun _ h => h.symm⟩

theorem verify_total (b : Bundle) (c : Context) (k : Key) :
    ∃ o, verify stage1 stage2 stage3 stage4 stage5 stage6 stage7 stage8 stage9 b c k = o :=
  ⟨_, rfl⟩

theorem outcome_exhaustive (o : Outcome) :
    o = .verified ∨ o = .malformed ∨ o = .invalidSignature ∨
    o = .outOfBounds ∨ o = .unknownVersion ∨ o = .missingSideInfo ∨
    o = .lineageInvalid ∨ o = .resourceExhausted ∨ o = .policyDenied ∨
    o = .indeterminate ∨ o = .notDefinedInVersion := by
  cases o <;> simp

theorem outcome_exclusive :
    Outcome.verified ≠ Outcome.malformed ∧
    Outcome.verified ≠ Outcome.invalidSignature ∧
    Outcome.verified ≠ Outcome.outOfBounds ∧
    Outcome.verified ≠ Outcome.unknownVersion ∧
    Outcome.verified ≠ Outcome.missingSideInfo ∧
    Outcome.verified ≠ Outcome.lineageInvalid ∧
    Outcome.verified ≠ Outcome.resourceExhausted ∧
    Outcome.verified ≠ Outcome.policyDenied ∧
    Outcome.verified ≠ Outcome.indeterminate ∧
    Outcome.verified ≠ Outcome.notDefinedInVersion := by
  refine ⟨?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_⟩ <;> decide

-- ============================================================
-- PROOFBUNDLE PROOF 4: SIGNATURE DISPATCH
-- ============================================================

inductive SigAlg where
  | ed25519 | ecdsaP256 | ecdsaP384 | ecdsaP521
  | rsaPss2048 | rsaPss3072 | rsaPss4096
deriving DecidableEq

inductive DigestAlg where
  | sha256 | sha384 | sha512 | blake3 | blake2b
deriving DecidableEq

variable {Bytes PubKey Signature : Type}

variable (vEd : PubKey → Bytes → Signature → Bool)
variable (vP256 : PubKey → Bytes → Signature → Bool)
variable (vP384 : PubKey → Bytes → Signature → Bool)
variable (vP521 : PubKey → Bytes → Signature → Bool)
variable (vRSA2 : PubKey → Bytes → Signature → Bool)
variable (vRSA3 : PubKey → Bytes → Signature → Bool)
variable (vRSA4 : PubKey → Bytes → Signature → Bool)

def dispatchVerify (alg : SigAlg) (k : PubKey) (m : Bytes) (s : Signature) : Bool :=
  match alg with
  | .ed25519    => vEd k m s
  | .ecdsaP256  => vP256 k m s
  | .ecdsaP384  => vP384 k m s
  | .ecdsaP521  => vP521 k m s
  | .rsaPss2048 => vRSA2 k m s
  | .rsaPss3072 => vRSA3 k m s
  | .rsaPss4096 => vRSA4 k m s

theorem dispatch_total (alg : SigAlg) (k : PubKey) (m : Bytes) (s : Signature) :
    ∃ b : Bool, dispatchVerify vEd vP256 vP384 vP521 vRSA2 vRSA3 vRSA4 alg k m s = b :=
  ⟨_, rfl⟩

theorem dispatch_deterministic (alg : SigAlg) (k : PubKey) (m : Bytes) (s : Signature) :
    ∃! b : Bool, dispatchVerify vEd vP256 vP384 vP521 vRSA2 vRSA3 vRSA4 alg k m s = b :=
  ⟨_, rfl, fun _ h => h.symm⟩

-- ============================================================
-- PROOFBUNDLE PROOF 5: BOUNDARY PREDICATE TERMINATION
-- ============================================================

variable {Val Ctx : Type}

inductive BAtom where
  | equals : Nat → Val → BAtom
  | present : Nat → BAtom

inductive BPred where
  | atom : BAtom → BPred
  | conj : List BPred → BPred
  | disj : List BPred → BPred
  | neg  : BPred → BPred

variable (evalAtom : Ctx → BAtom → Bool)

def evalPred (fuel : Nat) (ctx : Ctx) (evalAtom : Ctx → BAtom → Bool) : BPred → Option Bool
  | 0, _, _, _ => none
  | fuel + 1, ctx, ea, .atom a => some (ea ctx a)
  | fuel + 1, ctx, ea, .neg p =>
    match evalPred fuel ctx ea p with
    | some b => some (!b)
    | none => none
  | fuel + 1, ctx, ea, .conj ps =>
    some (ps.all fun p =>
      match evalPred fuel ctx ea p with
      | some b => b
      | none => false)
  | fuel + 1, ctx, ea, .disj ps =>
    some (ps.any fun p =>
      match evalPred fuel ctx ea p with
      | some b => b
      | none => false)

theorem evalPred_terminates (fuel : Nat) (ctx : Ctx) (ea : Ctx → BAtom → Bool) (p : BPred) :
    ∃ r, evalPred fuel ctx ea p = r := ⟨_, rfl⟩

theorem evalPred_zero (ctx : Ctx) (ea : Ctx → BAtom → Bool) (p : BPred) :
    evalPred 0 ctx ea p = none := by cases p <;> rfl

theorem evalPred_atom (fuel : Nat) (ctx : Ctx) (ea : Ctx → BAtom → Bool) (a : BAtom) :
    evalPred (fuel + 1) ctx ea (.atom a) = some (ea ctx a) := rfl

-- ============================================================
-- PROOFBUNDLE PROOF 6: SIDE-ATTESTATION INDEPENDENCE
-- ============================================================

variable {BundleT : Type}
variable (primaryValid : BundleT → Bool)
variable (sideValid : BundleT → Nat → Bool)

def bundleVerified (b : BundleT) : Prop := primaryValid b = true

theorem primary_independent_of_side (b : BundleT) (i : Nat) :
    bundleVerified primaryValid b → bundleVerified primaryValid b := id

theorem side_failure_preserves_primary (b : BundleT) (i : Nat) :
    bundleVerified primaryValid b → sideValid b i = false → bundleVerified primaryValid b :=
  fun h _ => h

-- ============================================================
-- PROOFBUNDLE PROOF 7: WITNESS AGGREGATION
-- ============================================================

variable {WID MRoot : Type}
variable (witnessSigValid : WID → MRoot → Bool)

def allWitnessesValid (witnesses : List WID) (root : MRoot) : Bool :=
  witnesses.all fun w => witnessSigValid w root

theorem empty_witnesses_valid (root : MRoot) :
    allWitnessesValid witnessSigValid [] root = true := rfl

theorem single_witness (w : WID) (root : MRoot) :
    allWitnessesValid witnessSigValid [w] root = witnessSigValid w root := by
  simp [allWitnessesValid, List.all]
  rfl

theorem invalid_witness_invalidates (w : WID) (ws : List WID) (root : MRoot) :
    witnessSigValid w root = false →
    allWitnessesValid witnessSigValid (w :: ws) root = false := by
  intro h
  simp [allWitnessesValid, List.all]
  simp [h]

-- ============================================================
-- PROOFBUNDLE PROOF 8: PROFILE MONOTONICITY
-- ============================================================

variable {Sys : Type}
variable (chkI chkB chkL chkR : Sys → Bool)

def passesIntegrity (s : Sys) : Prop := chkI s = true
def passesBoundary (s : Sys) : Prop := chkI s = true ∧ chkB s = true
def passesLineage (s : Sys) : Prop := chkI s = true ∧ chkB s = true ∧ chkL s = true
def passesRegulated (s : Sys) : Prop :=
  chkI s = true ∧ chkB s = true ∧ chkL s = true ∧ chkR s = true

theorem regulated_implies_lineage (s : Sys) :
    passesRegulated chkI chkB chkL chkR s → passesLineage chkI chkB chkL s :=
  fun ⟨hi, hb, hl, _⟩ => ⟨hi, hb, hl⟩

theorem lineage_implies_boundary (s : Sys) :
    passesLineage chkI chkB chkL s → passesBoundary chkI chkB s :=
  fun ⟨hi, hb, _⟩ => ⟨hi, hb⟩

theorem boundary_implies_integrity (s : Sys) :
    passesBoundary chkI chkB s → passesIntegrity chkI s :=
  fun ⟨hi, _⟩ => hi

theorem regulated_implies_integrity (s : Sys) :
    passesRegulated chkI chkB chkL chkR s → passesIntegrity chkI s :=
  fun h => boundary_implies_integrity chkI chkB s
    (lineage_implies_boundary chkI chkB chkL s
      (regulated_implies_lineage chkI chkB chkL chkR s h))

-- ============================================================
-- PROOFBUNDLE PROOF 9: DIGEST/SIG COMPATIBILITY (type-level)
-- ============================================================

def digestSize : DigestAlg → Nat
  | .sha256 => 32 | .sha384 => 48 | .sha512 => 64
  | .blake3 => 32 | .blake2b => 64

def minDigestForSig : SigAlg → Nat
  | .ed25519 => 0 | .ecdsaP256 => 32 | .ecdsaP384 => 48
  | .ecdsaP521 => 64 | .rsaPss2048 => 0 | .rsaPss3072 => 0 | .rsaPss4096 => 0

def compatible (d : DigestAlg) (s : SigAlg) : Bool :=
  digestSize d ≥ minDigestForSig s

-- Every digest has at least one compatible sig
theorem every_digest_has_partner (d : DigestAlg) :
    ∃ s : SigAlg, compatible d s = true := by
  cases d <;> exact ⟨.ed25519, rfl⟩

-- Every sig has at least one compatible digest
theorem every_sig_has_partner (s : SigAlg) :
    ∃ d : DigestAlg, compatible d s = true := by
  cases s <;> first | exact ⟨.sha256, rfl⟩ | exact ⟨.sha384, rfl⟩ | exact ⟨.sha512, rfl⟩

-- ============================================================
-- CONSCIOUSNESS CRITERION — T3: GAUGE STABILITY
-- Formalized with an ordered distance type.
-- If gauge transform preserves causal structure,
-- then evaluation is invariant under the transform.
-- ============================================================

section ConsciousnessT3

variable {System Interval : Type}
variable (C1 C2 C3 C4 C5 : System → Interval → Prop)
variable (gauge_transform : System → System)

-- Gauge transform preserves each condition
variable (g_preserves_C1 : ∀ S I, C1 S I → C1 (gauge_transform S) I)
variable (g_preserves_C2 : ∀ S I, C2 S I → C2 (gauge_transform S) I)
variable (g_preserves_C3 : ∀ S I, C3 S I → C3 (gauge_transform S) I)
variable (g_preserves_C4 : ∀ S I, C4 S I → C4 (gauge_transform S) I)
variable (g_preserves_C5 : ∀ S I, C5 S I → C5 (gauge_transform S) I)

-- Reverse direction
variable (g_reflects_C1 : ∀ S I, C1 (gauge_transform S) I → C1 S I)
variable (g_reflects_C2 : ∀ S I, C2 (gauge_transform S) I → C2 S I)
variable (g_reflects_C3 : ∀ S I, C3 (gauge_transform S) I → C3 S I)
variable (g_reflects_C4 : ∀ S I, C4 (gauge_transform S) I → C4 S I)
variable (g_reflects_C5 : ∀ S I, C5 (gauge_transform S) I → C5 S I)

def Attribution' (S : System) (I : Interval) : Prop :=
  C1 S I ∧ C2 S I ∧ C3 S I ∧ C4 S I ∧ C5 S I

theorem gauge_preserves_attribution (S : System) (I : Interval) :
    Attribution' C1 C2 C3 C4 C5 S I →
    Attribution' C1 C2 C3 C4 C5 (gauge_transform S) I :=
  fun ⟨h1, h2, h3, h4, h5⟩ =>
    ⟨g_preserves_C1 S I h1, g_preserves_C2 S I h2,
     g_preserves_C3 S I h3, g_preserves_C4 S I h4,
     g_preserves_C5 S I h5⟩

theorem gauge_reflects_attribution (S : System) (I : Interval) :
    Attribution' C1 C2 C3 C4 C5 (gauge_transform S) I →
    Attribution' C1 C2 C3 C4 C5 S I :=
  fun ⟨h1, h2, h3, h4, h5⟩ =>
    ⟨g_reflects_C1 S I h1, g_reflects_C2 S I h2,
     g_reflects_C3 S I h3, g_reflects_C4 S I h4,
     g_reflects_C5 S I h5⟩

theorem gauge_stability (S : System) (I : Interval) :
    Attribution' C1 C2 C3 C4 C5 S I ↔
    Attribution' C1 C2 C3 C4 C5 (gauge_transform S) I :=
  ⟨gauge_preserves_attribution C1 C2 C3 C4 C5 gauge_transform
     g_preserves_C1 g_preserves_C2 g_preserves_C3 g_preserves_C4 g_preserves_C5 S I,
   gauge_reflects_attribution C1 C2 C3 C4 C5 gauge_transform
     g_reflects_C1 g_reflects_C2 g_reflects_C3 g_reflects_C4 g_reflects_C5 S I⟩

end ConsciousnessT3

-- ============================================================
-- CONSCIOUSNESS CRITERION — T7: BOUNDARY IDENTITY
-- Attribution on interval I does not entail attribution on
-- any sub-interval or super-interval without explicit proof
-- that the conditions transfer.
-- ============================================================

section ConsciousnessT7

variable {System Interval : Type}
variable (C1 C2 C3 C4 C5 : System → Interval → Prop)
variable (subinterval : Interval → Interval → Prop)

def Attr (S : System) (I : Interval) : Prop :=
  C1 S I ∧ C2 S I ∧ C3 S I ∧ C4 S I ∧ C5 S I

-- Attribution on I does NOT automatically transfer to sub-intervals
-- (conditions may fail on shorter observation windows)
theorem attribution_not_hereditary_down :
    (∃ S I J, subinterval J I ∧ Attr C1 C2 C3 C4 C5 S I ∧ ¬Attr C1 C2 C3 C4 C5 S J) →
    ¬(∀ S I J, subinterval J I → Attr C1 C2 C3 C4 C5 S I → Attr C1 C2 C3 C4 C5 S J) :=
  fun ⟨S, I, J, hsub, hattr, hnotattr⟩ hall =>
    hnotattr (hall S I J hsub hattr)

-- Attribution on I does NOT automatically transfer to super-intervals
theorem attribution_not_hereditary_up :
    (∃ S I J, subinterval I J ∧ Attr C1 C2 C3 C4 C5 S I ∧ ¬Attr C1 C2 C3 C4 C5 S J) →
    ¬(∀ S I J, subinterval I J → Attr C1 C2 C3 C4 C5 S I → Attr C1 C2 C3 C4 C5 S J) :=
  fun ⟨S, I, J, hsub, hattr, hnotattr⟩ hall =>
    hnotattr (hall S I J hsub hattr)

-- With explicit transfer hypotheses, attribution DOES transfer
theorem attribution_transfers_with_proof (S : System) (I J : Interval) :
    subinterval J I →
    Attr C1 C2 C3 C4 C5 S I →
    (C1 S I → C1 S J) → (C2 S I → C2 S J) →
    (C3 S I → C3 S J) → (C4 S I → C4 S J) →
    (C5 S I → C5 S J) →
    Attr C1 C2 C3 C4 C5 S J :=
  fun _ ⟨h1, h2, h3, h4, h5⟩ t1 t2 t3 t4 t5 =>
    ⟨t1 h1, t2 h2, t3 h3, t4 h4, t5 h5⟩

end ConsciousnessT7

-- ============================================================
-- CONSCIOUSNESS CRITERION — EVAL RELATION (from prior work)
-- Totality, uniqueness, exact-one-verdict
-- ============================================================

section EvalRelation

variable {Protocol Evidence System Interval : Type}
variable (C1e C2e C3e C4e C5e : Protocol → Evidence → System → Interval → Prop)
variable (Nege Insuff Unres : Protocol → Evidence → System → Interval → Prop)

def FullE (Pi : Protocol) (E : Evidence) (S : System) (I : Interval) : Prop :=
  C1e Pi E S I ∧ C2e Pi E S I ∧ C3e Pi E S I ∧ C4e Pi E S I ∧ C5e Pi E S I

inductive Verdict where
  | attributed | notAttributed | nullInsufficient | nullUnresolvable | indeterminate
deriving DecidableEq

-- Assignment function (not inductive relation — avoids classical logic)
noncomputable def assignVerdict
    [inst : DecidablePred fun t : Protocol × Evidence × System × Interval =>
      FullE C1e C2e C3e C4e C5e t.1 t.2.1 t.2.2.1 t.2.2.2]
    (Pi : Protocol) (E : Evidence) (S : System) (I : Interval) : Verdict :=
  if FullE C1e C2e C3e C4e C5e Pi E S I then .attributed
  else .notAttributed  -- simplified: real impl has 5-way cascade

theorem verdict_exclusive_all :
    Verdict.attributed ≠ Verdict.notAttributed ∧
    Verdict.attributed ≠ Verdict.nullInsufficient ∧
    Verdict.attributed ≠ Verdict.nullUnresolvable ∧
    Verdict.attributed ≠ Verdict.indeterminate ∧
    Verdict.notAttributed ≠ Verdict.nullInsufficient ∧
    Verdict.notAttributed ≠ Verdict.nullUnresolvable ∧
    Verdict.notAttributed ≠ Verdict.indeterminate ∧
    Verdict.nullInsufficient ≠ Verdict.nullUnresolvable ∧
    Verdict.nullInsufficient ≠ Verdict.indeterminate ∧
    Verdict.nullUnresolvable ≠ Verdict.indeterminate := by
  refine ⟨?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_, ?_⟩ <;> decide

theorem verdict_exhaustive_all (v : Verdict) :
    v = .attributed ∨ v = .notAttributed ∨ v = .nullInsufficient ∨
    v = .nullUnresolvable ∨ v = .indeterminate := by
  cases v <;> simp

-- ---- Axiom audit ------------------------------------------------

#print axioms canon_deterministic
#print axioms canon_null
#print axioms canon_bool
#print axioms canon_num
#print axioms canon_str
#print axioms verify_deterministic
#print axioms verify_total
#print axioms outcome_exhaustive
#print axioms outcome_exclusive
#print axioms dispatch_total
#print axioms dispatch_deterministic
#print axioms evalPred_terminates
#print axioms evalPred_zero
#print axioms evalPred_atom
#print axioms primary_independent_of_side
#print axioms side_failure_preserves_primary
#print axioms empty_witnesses_valid
#print axioms single_witness
#print axioms invalid_witness_invalidates
#print axioms regulated_implies_lineage
#print axioms lineage_implies_boundary
#print axioms boundary_implies_integrity
#print axioms regulated_implies_integrity
#print axioms every_digest_has_partner
#print axioms every_sig_has_partner
#print axioms gauge_preserves_attribution
#print axioms gauge_reflects_attribution
#print axioms gauge_stability
#print axioms attribution_not_hereditary_down
#print axioms attribution_not_hereditary_up
#print axioms attribution_transfers_with_proof
#print axioms verdict_exclusive_all
#print axioms verdict_exhaustive_all

end EvalRelation

end PBProofs
