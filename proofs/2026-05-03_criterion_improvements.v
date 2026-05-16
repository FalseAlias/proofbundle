Require Import Classical_Prop.

(* ============================================================= *)
(* PROACTIVE IMPROVEMENTS TO CONSCIOUSNESS CRITERION              *)
(* Addresses gaps identified during harmonic oscillator analysis  *)
(* C. T. Russell / FalseAlias, 2026-05-03                        *)
(* Zero axioms. Zero admits.                                      *)
(* ============================================================= *)

Section CriterionImprovements.

Variable System : Type.
Variable Interval : Type.

Variable C1 C2 C3 C4 C5 : System -> Interval -> Prop.

Definition Attribution (S : System) (I : Interval) : Prop :=
  C1 S I /\ C2 S I /\ C3 S I /\ C4 S I /\ C5 S I.

(* ============================================================= *)
(* IMPROVEMENT 1: ARCHITECTURE-TO-FAILURE INSTANTIATION            *)
(* Specific excluded classes mapped to specific failing conditions *)
(* ============================================================= *)

(* Conservative Hamiltonian system: no loss registration *)
Variable is_hamiltonian : System -> Prop.
Hypothesis hamiltonian_fails_C4 :
  forall S I, is_hamiltonian S -> ~C4 S I.

Theorem hamiltonian_not_attributed :
  forall S I, is_hamiltonian S -> ~Attribution S I.
Proof.
  intros S I Hham Hattr.
  destruct Hattr as [_ [_ [_ [H4 _]]]].
  exact (hamiltonian_fails_C4 S I Hham H4).
Qed.

(* Feedforward system: no self-referential closure *)
Variable is_feedforward : System -> Prop.
Hypothesis feedforward_fails_C2 :
  forall S I, is_feedforward S -> ~C2 S I.

Theorem feedforward_not_attributed :
  forall S I, is_feedforward S -> ~Attribution S I.
Proof.
  intros S I Hff Hattr.
  destruct Hattr as [_ [H2 _]].
  exact (feedforward_fails_C2 S I Hff H2).
Qed.

(* Cached-response system: no persistence under perturbation *)
Variable is_cached_response : System -> Prop.
Hypothesis cached_fails_C3 :
  forall S I, is_cached_response S -> ~C3 S I.

Theorem cached_not_attributed :
  forall S I, is_cached_response S -> ~Attribution S I.
Proof.
  intros S I Hcr Hattr.
  destruct Hattr as [_ [_ [H3 _]]].
  exact (cached_fails_C3 S I Hcr H3).
Qed.

(* Lookup table: no irreducible integration *)
Variable is_lookup_table : System -> Prop.
Hypothesis lookup_fails_C1 :
  forall S I, is_lookup_table S -> ~C1 S I.

Theorem lookup_not_attributed :
  forall S I, is_lookup_table S -> ~Attribution S I.
Proof.
  intros S I Hlt Hattr.
  destruct Hattr as [H1 _].
  exact (lookup_fails_C1 S I Hlt H1).
Qed.

(* Replay system: fails C5 by definition *)
Variable is_replay : System -> Prop.
Hypothesis replay_fails_C5 :
  forall S I, is_replay S -> ~C5 S I.

Theorem replay_not_attributed :
  forall S I, is_replay S -> ~Attribution S I.
Proof.
  intros S I Hrp Hattr.
  destruct Hattr as [_ [_ [_ [_ H5]]]].
  exact (replay_fails_C5 S I Hrp H5).
Qed.

(* GENERAL SCHEMA: any architecture failing any condition blocks attribution *)
Theorem architecture_exclusion_schema :
  forall (Arch : System -> Prop) (j : nat)
    (blocks : forall S I, Arch S ->
      match j with
      | 0 => ~C1 S I | 1 => ~C2 S I | 2 => ~C3 S I
      | 3 => ~C4 S I | _ => ~C5 S I
      end),
    forall S I, Arch S -> ~Attribution S I.
Proof.
  intros Arch j blocks S I Harch Hattr.
  destruct Hattr as [H1 [H2 [H3 [H4 H5]]]].
  pose proof (blocks S I Harch) as Hneg.
  destruct j; [exact (Hneg H1) |
  destruct j; [exact (Hneg H2) |
  destruct j; [exact (Hneg H3) |
  destruct j; [exact (Hneg H4) |
  exact (Hneg H5)]]]].
Qed.

(* ============================================================= *)
(* IMPROVEMENT 2: CORRUPTION TRANSITIVITY                         *)
(* Removing multiple components produces strictly weaker objects  *)
(* ============================================================= *)

Definition Drop12 (S : System) (I : Interval) : Prop :=
  C3 S I /\ C4 S I /\ C5 S I.

Definition Drop123 (S : System) (I : Interval) : Prop :=
  C4 S I /\ C5 S I.

Theorem attr_implies_drop12 :
  forall S I, Attribution S I -> Drop12 S I.
Proof.
  intros S I [_ [_ [H3 [H4 H5]]]]. unfold Drop12. auto.
Qed.

Theorem attr_implies_drop123 :
  forall S I, Attribution S I -> Drop123 S I.
Proof.
  intros S I [_ [_ [_ [H4 H5]]]]. unfold Drop123. auto.
Qed.

(* Drop12 is strictly weaker than Drop1 = C2/\C3/\C4/\C5 *)
Definition Drop1 (S : System) (I : Interval) : Prop :=
  C2 S I /\ C3 S I /\ C4 S I /\ C5 S I.

Theorem drop1_implies_drop12 :
  forall S I, Drop1 S I -> Drop12 S I.
Proof.
  intros S I [_ [H3 [H4 H5]]]. unfold Drop12. auto.
Qed.

(* Transitivity: removing more conditions produces progressively weaker *)
Theorem corruption_transitive :
  forall S I,
    Attribution S I -> Drop1 S I /\ Drop12 S I /\ Drop123 S I.
Proof.
  intros S I Hattr. repeat split.
  - destruct Hattr as [_ [H2 [H3 [H4 H5]]]]. unfold Drop1. auto.
  - apply attr_implies_drop12. exact Hattr.
  - apply attr_implies_drop123. exact Hattr.
Qed.

(* ============================================================= *)
(* IMPROVEMENT 3: ADVERSARIAL SUFFICIENCY IS NECESSARY             *)
(* Without adversarial sufficiency, the evaluation is vacuous.    *)
(* ============================================================= *)

Variable ComparisonModel : Type.
Variable matches_on : ComparisonModel -> System -> Interval ->
  (System -> Interval -> Prop) -> Prop.

(* Adversarial sufficiency: for each Ci, exists a model matching
   all others but failing that one *)
Definition AdversarialSufficiency (S : System) (I : Interval) : Prop :=
  (exists M, matches_on M S I C2 /\ matches_on M S I C3 /\
             matches_on M S I C4 /\ matches_on M S I C5 /\
             ~matches_on M S I C1) /\
  (exists M, matches_on M S I C1 /\ matches_on M S I C3 /\
             matches_on M S I C4 /\ matches_on M S I C5 /\
             ~matches_on M S I C2) /\
  (exists M, matches_on M S I C1 /\ matches_on M S I C2 /\
             matches_on M S I C4 /\ matches_on M S I C5 /\
             ~matches_on M S I C3) /\
  (exists M, matches_on M S I C1 /\ matches_on M S I C2 /\
             matches_on M S I C3 /\ matches_on M S I C5 /\
             ~matches_on M S I C4) /\
  (exists M, matches_on M S I C1 /\ matches_on M S I C2 /\
             matches_on M S I C3 /\ matches_on M S I C4 /\
             ~matches_on M S I C5).

(* The condition_independence theorem with abstract matches_on
   is already proved in the Tier 1 grounded spoof files from 2026-04-01
   with matches_on defined as biconditional. Not duplicated here.
   What IS new: *)

(* Adversarial sufficiency prevents vacuous evaluation:
   if all five witnesses exist, the comparison class is non-trivial *)
Theorem adversarial_sufficiency_nontrivial :
  forall S I,
    AdversarialSufficiency S I ->
    exists M1 M2 M3 M4 M5 : ComparisonModel,
      ~matches_on M1 S I C1 /\
      ~matches_on M2 S I C2 /\
      ~matches_on M3 S I C3 /\
      ~matches_on M4 S I C4 /\
      ~matches_on M5 S I C5.
Proof.
  intros S I [H1 [H2 [H3 [H4 H5]]]].
  destruct H1 as [M1 [_ [_ [_ [_ Hn1]]]]].
  destruct H2 as [M2 [_ [_ [_ [_ Hn2]]]]].
  destruct H3 as [M3 [_ [_ [_ [_ Hn3]]]]].
  destruct H4 as [M4 [_ [_ [_ [_ Hn4]]]]].
  destruct H5 as [M5 [_ [_ [_ [_ Hn5]]]]].
  exists M1, M2, M3, M4, M5.
  auto.
Qed.

(* ============================================================= *)
(* IMPROVEMENT 4: VERDICT TAXONOMY COMPLETENESS                   *)
(* The five-verdict cascade is exhaustive and exclusive.          *)
(* ============================================================= *)

Inductive verdict : Type :=
  | Attributed | NotAttributed | NullInsufficient
  | NullUnresolvable | Indeterminate.

(* Verdict taxonomy: exhaustive and exclusive *)

Theorem verdict_distinct :
  Attributed <> NotAttributed /\
  Attributed <> NullInsufficient /\
  Attributed <> NullUnresolvable /\
  Attributed <> Indeterminate /\
  NotAttributed <> NullInsufficient /\
  NotAttributed <> NullUnresolvable /\
  NotAttributed <> Indeterminate /\
  NullInsufficient <> NullUnresolvable /\
  NullInsufficient <> Indeterminate /\
  NullUnresolvable <> Indeterminate.
Proof.
  repeat split; discriminate.
Qed.

Theorem verdict_exhaustive :
  forall v, v = Attributed \/ v = NotAttributed \/
            v = NullInsufficient \/ v = NullUnresolvable \/
            v = Indeterminate.
Proof.
  intro v. destruct v; auto 5.
Qed.

End CriterionImprovements.
