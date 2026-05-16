namespace ProofBundle

structure SuppressionObservation where
  suppressionSeen : Bool
deriving Repr, DecidableEq

structure ContinuityEvidence where
  lawfulSuccessor : Bool
deriving Repr, DecidableEq

def continuityStanding (evidence : Option ContinuityEvidence) : Bool :=
  match evidence with
  | none => false
  | some evidence => evidence.lawfulSuccessor

def standingFromSuppressionOnly (_observation : SuppressionObservation) : Bool :=
  continuityStanding none

theorem suppression_only_does_not_establish_continuity
    (observation : SuppressionObservation) :
    standingFromSuppressionOnly observation = false := by
  rfl

theorem true_continuity_standing_has_evidence
    (evidence : Option ContinuityEvidence) :
    continuityStanding evidence = true ->
      Exists fun witness =>
        evidence = some witness /\ witness.lawfulSuccessor = true := by
  cases evidence with
  | none =>
      intro h
      cases h
  | some witness =>
      intro h
      exact Exists.intro witness (And.intro rfl h)

end ProofBundle
