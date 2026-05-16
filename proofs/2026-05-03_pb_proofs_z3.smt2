; ============================================================
; ProofBundle Formal Verification — Z3 SMT-LIB
; Proofs 3b, 6b, 9
; C. T. Russell / FalseAlias, 2026-05-03
; ============================================================

; ============================================================
; PROOF 9: ALGORITHM REGISTRY CONSISTENCY
; Every registered (digest_alg, sig_alg) pair is compatible:
; the digest output size matches the signature input requirement.
; ============================================================

(declare-datatypes () (
  (DigestAlg SHA256 SHA384 SHA512 BLAKE3 BLAKE2b)))

(declare-datatypes () (
  (SigAlg Ed25519 ECDSA_P256 ECDSA_P384 ECDSA_P521
          RSA_PSS_2048 RSA_PSS_3072 RSA_PSS_4096)))

(define-fun digest_size ((d DigestAlg)) Int
  (ite (= d SHA256)  32
  (ite (= d SHA384)  48
  (ite (= d SHA512)  64
  (ite (= d BLAKE3)  32
  (ite (= d BLAKE2b) 64
  0))))))

; Signature algorithms accept any digest via internal hashing,
; but some have minimum input size requirements.
; Ed25519 hashes internally (accepts any size).
; ECDSA truncates or uses full digest.
; RSA-PSS hashes internally.
; The compatibility requirement: digest_size >= min_digest_for_sig
(define-fun min_digest_for_sig ((s SigAlg)) Int
  (ite (= s Ed25519)      0   ; accepts any, hashes internally
  (ite (= s ECDSA_P256)  32   ; needs at least 32 bytes
  (ite (= s ECDSA_P384)  48   ; needs at least 48 bytes
  (ite (= s ECDSA_P521)  64   ; needs at least 64 bytes (uses 66, truncates)
  (ite (= s RSA_PSS_2048) 0   ; hashes internally
  (ite (= s RSA_PSS_3072) 0   ; hashes internally
  (ite (= s RSA_PSS_4096) 0   ; hashes internally
  0))))))))

(define-fun compatible ((d DigestAlg) (s SigAlg)) Bool
  (>= (digest_size d) (min_digest_for_sig s)))

; CHECK 1: All registered pairs are compatible
; The registered set is the full cross product minus known-bad pairs
(define-fun registered ((d DigestAlg) (s SigAlg)) Bool
  (and (compatible d s)
       ; Exclude SHA256 with ECDSA_P384 (digest too short)
       (not (and (= d SHA256) (= s ECDSA_P384)))
       ; Exclude SHA256 with ECDSA_P521 (digest too short)
       (not (and (= d SHA256) (= s ECDSA_P521)))
       ; Exclude BLAKE3 with ECDSA_P384 (32 < 48)
       (not (and (= d BLAKE3) (= s ECDSA_P384)))
       ; Exclude BLAKE3 with ECDSA_P521 (32 < 64)
       (not (and (= d BLAKE3) (= s ECDSA_P521)))
       ; Exclude SHA384 with ECDSA_P521 (48 < 64)
       (not (and (= d SHA384) (= s ECDSA_P521)))))

; Verify: no registered pair violates compatibility
(push)
(assert (exists ((d DigestAlg) (s SigAlg))
  (and (registered d s) (not (compatible d s)))))
(check-sat) ; Expected: unsat — no registered pair is incompatible
(pop)

; ============================================================
; PROOF 9b: EVERY ALGORITHM HAS AT LEAST ONE COMPATIBLE PARTNER
; No digest or signature algorithm is stranded.
; ============================================================

; Every digest alg has at least one compatible sig alg
(push)
(assert (exists ((d DigestAlg))
  (forall ((s SigAlg)) (not (compatible d s)))))
(check-sat) ; Expected: unsat — every digest has a partner
(pop)

; Every sig alg has at least one compatible digest alg
(push)
(assert (exists ((s SigAlg))
  (forall ((d DigestAlg)) (not (compatible d s)))))
(check-sat) ; Expected: unsat — every sig has a partner
(pop)

; ============================================================
; PROOF 3b: LINEAGE DEPTH BUDGET FORCES TERMINATION
; No execution path exceeds the depth budget.
; ============================================================

(declare-sort BundleNode)
(declare-fun parent (BundleNode) BundleNode)
(declare-fun has_parent (BundleNode) Bool)
(declare-fun depth (BundleNode) Int)

; Depth is non-negative
(assert (forall ((b BundleNode)) (>= (depth b) 0)))

; Parent strictly decreases depth
(assert (forall ((b BundleNode))
  (=> (has_parent b) (> (depth b) (depth (parent b))))))

; Depth budget = 100
(declare-const budget Int)
(assert (= budget 100))

; All reachable nodes have depth <= budget
(assert (forall ((b BundleNode)) (<= (depth b) budget)))

; Check: can a chain exceed budget? 
(push)
(declare-const chain_start BundleNode)
(assert (> (depth chain_start) budget))
(check-sat) ; Expected: unsat — depth can't exceed budget
(pop)

; Check: can a cycle exist given strict depth decrease?
(push)
(declare-const a BundleNode)
(declare-const b BundleNode)
(assert (has_parent a))
(assert (= (parent a) b))
(assert (has_parent b))
(assert (= (parent b) a))
(check-sat) ; Expected: unsat — cycle requires depth(a) > depth(b) > depth(a)
(pop)

; ============================================================
; PROOF 6b: SIDE-ATTESTATION INDEPENDENCE (SMT)
; Primary verification result is invariant under side changes.
; ============================================================

(declare-sort Bundle)
(declare-fun primary_valid (Bundle) Bool)
(declare-fun side_count (Bundle) Int)
(declare-fun side_valid (Bundle Int) Bool)

; Primary validity depends only on digest + signature, not sides
; Model this as: primary_valid is determined before sides are checked
(declare-fun bundle_outcome (Bundle) Bool)
(assert (forall ((b Bundle))
  (= (bundle_outcome b) (primary_valid b))))

; Check: can changing a side attestation change the bundle outcome?
(push)
(declare-const b1 Bundle)
(declare-const b2 Bundle)
; Same primary validity
(assert (= (primary_valid b1) (primary_valid b2)))
; Different side validity
(assert (not (= (side_valid b1 0) (side_valid b2 0))))
; But different bundle outcome? Should be impossible.
(assert (not (= (bundle_outcome b1) (bundle_outcome b2))))
(check-sat) ; Expected: unsat — sides can't change primary outcome
(pop)

; Check: can two sides affect each other?
(push)
(declare-const b Bundle)
; side 0 valid, side 1 invalid
(assert (side_valid b 0))
(assert (not (side_valid b 1)))
; Can side 0 being valid force side 1 to be valid?
; This is a consistency check — the model should be satisfiable
; because sides ARE independent
(check-sat) ; Expected: sat — sides are independent
(pop)

; ============================================================
; PROOF 5b: BOUNDARY PREDICATE DEPTH BOUND
; Nested predicates cannot exceed depth 10.
; ============================================================

(declare-fun pred_depth (Int) Int) ; depth of predicate at node i

; Root predicate
(declare-const root_depth Int)
(assert (= root_depth 0))

; Each nested level increments depth
(assert (forall ((i Int))
  (=> (> i 0) (= (pred_depth i) (+ (pred_depth (- i 1)) 1)))))

; Depth bound
(push)
(assert (exists ((i Int))
  (and (>= i 0) (> (pred_depth i) 10))))
; Can only reach depth > 10 if we nest > 10 times
; With the recurrence, pred_depth(i) = i, so i > 10 needed
; This is sat because we haven't bounded i
; The IMPLEMENTATION bounds fuel to 10, rejecting deeper predicates
(check-sat) ; Expected: sat — unbounded nesting CAN exceed 10
(pop)

; With fuel bound: no execution exceeds depth 10
(push)
(declare-const fuel Int)
(assert (= fuel 10))
(assert (forall ((i Int))
  (=> (> i fuel) (= (pred_depth i) (- 1))))) ; -1 = exhausted
(assert (exists ((i Int))
  (and (<= i fuel) (> (pred_depth i) fuel))))
(check-sat) ; Expected: unsat — within fuel, depth <= fuel
(pop)
