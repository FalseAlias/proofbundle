; ProofBundle alpha.1 Worker 3 formal-methods guard.
;
; Scope:
; - This is a bounded SMT-LIB scaffold for the suppression-vs-continuation
;   theorem-direction defect.
; - It is not a proof-closure artifact.
; - It deliberately models only the arithmetic core reported for the corrupt
;   direction: suppression_cost(k, W) = k * W and normalized continuation cost = 1.
;
; Guard:
; - The false universal direction is not asserted.
; - Query 1 asks Z3 to find a counterexample to that false direction.
; - Query 2 pins a known counterexample shape.
; - Query 3 proves only the threshold-qualified direction by checking the
;   unsatisfiability of its negation.
; - Query 4 records the boundary case: equality at W = 1 / k is not a strict
;   exceedance claim.
;
; Expected answers, if Z3 is available:
;   query 1: sat
;   query 2: sat
;   query 3: unsat
;   query 4: unsat

(set-logic QF_NRA)
(set-option :produce-models true)

(declare-const k Real)
(declare-const W Real)

(define-fun suppression_cost ((kk Real) (ww Real)) Real (* kk ww))
(define-fun continuation_cost_normalized () Real 1.0)

; Query 1: counterexample search for the invalid universal shape.
; k >= 2 and W > 0 do not imply k * W > 1.
(push)
(assert (>= k 2.0))
(assert (> W 0.0))
(assert (<= (suppression_cost k W) continuation_cost_normalized))
(check-sat)
(get-model)
(pop)

; Query 2: concrete counterexample.
; k = 3, W = 1/4 gives suppression_cost = 3/4 <= 1.
(push)
(assert (= k 3.0))
(assert (= W (/ 1.0 4.0)))
(assert (>= k 2.0))
(assert (> W 0.0))
(assert (<= (suppression_cost k W) continuation_cost_normalized))
(check-sat)
(get-value ((suppression_cost k W) continuation_cost_normalized))
(pop)

; Query 3: threshold-qualified direction only.
; For k >= 2 and W > 1/k, suppression_cost(k, W) > 1.
(push)
(assert (>= k 2.0))
(assert (> W (/ 1.0 k)))
(assert (not (> (suppression_cost k W) continuation_cost_normalized)))
(check-sat)
(pop)

; Query 4: boundary guard.
; At W = 1/k, the result is equality, not strict exceedance.
(push)
(assert (>= k 2.0))
(assert (= W (/ 1.0 k)))
(assert (not (= (suppression_cost k W) continuation_cost_normalized)))
(check-sat)
(pop)
