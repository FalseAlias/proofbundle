From Coq Require Import Lia.

(*
  ProofBundle alpha.1 Coq guard.

  This file intentionally does not prove release closure. It records only
  small arithmetic facts that block the false universal direction:
  "suppression always strictly exceeds continuity".
*)

Module ContinuitySuppressionGuard.

Definition cost := nat.

Definition strictly_exceeds (left right : cost) : Prop :=
  right < left.

Theorem equal_cost_counterexample :
  exists suppression continuity : cost,
    suppression = continuity /\ ~ strictly_exceeds suppression continuity.
Proof.
  exists 0, 0.
  unfold strictly_exceeds.
  split; lia.
Qed.

Theorem no_universal_suppression_strict_excess :
  ~ (forall suppression continuity : cost,
       strictly_exceeds suppression continuity).
Proof.
  intro H.
  pose proof (H 0 0).
  unfold strictly_exceeds in *.
  lia.
Qed.

Theorem no_universal_supression_strict_excess :
  ~ (forall supression continuity : cost,
       strictly_exceeds supression continuity).
Proof.
  intro H.
  pose proof (H 0 0).
  unfold strictly_exceeds in *.
  lia.
Qed.

Theorem strict_excess_requires_inequality :
  forall suppression continuity : cost,
    strictly_exceeds suppression continuity -> suppression <> continuity.
Proof.
  unfold strictly_exceeds.
  intros suppression continuity H Heq.
  lia.
Qed.

End ContinuitySuppressionGuard.
