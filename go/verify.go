package proofbundle

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"
)

// Valid profiles for this version.
var knownProfiles = map[string]bool{
	"PB-BOUNDARY-1":   true,
	"PB-LINEAGE-1":    true,
	"PB-REGULATED-1":  true,
}

// Valid spec versions.
var knownSpecVersions = map[string]bool{
	"1.0.0": true,
}

// VerifyBundle verifies a bundle with the given configuration.
// Returns the outcome string and the verification trace.
func VerifyBundle(inputJSON []byte, cfg VerifyConfig) (string, []TraceStep) {
	trace := make([]TraceStep, 0, 12)
	var bundle Bundle
	var publicKey interface{}

	// --- Stage 1: Parse ---
	bundle, ok := stageParse(inputJSON, &trace)
	if !ok {
		return "malformed", trace
	}

	// --- Stage 2: Resource Budget ---
	if !stageResourceBudget(inputJSON, cfg, &trace) {
		return "resource-exhausted", trace
	}

	// --- Stage 3: Schema ---
	if !stageSchema(bundle, &trace) {
		return "malformed", trace
	}

	// --- Stage 4: Version ---
	if !stageVersion(bundle, &trace) {
		return "unknown-version", trace
	}

	// --- Stage 5: Profile / Not Defined ---
	if !stageProfile(bundle, cfg, &trace) {
		return "not-defined-in-this-version", trace
	}

	// --- Stage 6: Canonical ---
	canon, ok := stageCanonical(bundle, &trace)
	if !ok {
		return "malformed", trace
	}

	// --- Stage 7: Integrity ---
	if !stageIntegrity(bundle, canon, &trace) {
		return "invalid-signature", trace
	}

	// --- Stage 8: Signature ---
	publicKey, ok = stageSignature(bundle, cfg, canon, &trace)
	if !ok {
		return "invalid-signature", trace
	}
	_ = publicKey

	// --- Stage 9: Boundary ---
	boundaryResult, ok := stageBoundary(bundle, cfg, &trace)
	if !ok {
		return "indeterminate", trace
	}
	if !boundaryResult {
		return "out-of-bounds", trace
	}

	// --- Stage 10: Side Info ---
	if !stageSideInfo(bundle, cfg, &trace) {
		return "missing-side-info", trace
	}

	// --- Stage 11: Lineage ---
	if !stageLineage(bundle, cfg, &trace) {
		return "lineage-invalid", trace
	}

	// --- Stage 12: HITL ---
	if !stageHITL(bundle, cfg, &trace) {
		return "policy-denied", trace
	}

	trace = append(trace, TraceStep{Stage: "complete", Passed: true, Detail: "all checks passed"})
	return "verified", trace
}

// stageParse parses the raw bundle JSON.
func stageParse(inputJSON []byte, trace *[]TraceStep) (Bundle, bool) {
	var bundle Bundle
	if err := json.Unmarshal(inputJSON, &bundle); err != nil {
		*trace = append(*trace, TraceStep{Stage: "parse", Passed: false, Detail: err.Error()})
		return bundle, false
	}
	*trace = append(*trace, TraceStep{Stage: "parse", Passed: true})
	return bundle, true
}

// stageResourceBudget checks resource limits.
func stageResourceBudget(inputJSON []byte, cfg VerifyConfig, trace *[]TraceStep) bool {
	if cfg.MaxBundleBytes > 0 && len(inputJSON) > cfg.MaxBundleBytes {
		*trace = append(*trace, TraceStep{
			Stage:  "resource-budget",
			Passed: false,
			Detail: fmt.Sprintf("bundle size %d exceeds max %d", len(inputJSON), cfg.MaxBundleBytes),
		})
		return false
	}
	*trace = append(*trace, TraceStep{Stage: "resource-budget", Passed: true})
	return true
}

// stageSchema validates the bundle schema.
func stageSchema(bundle Bundle, trace *[]TraceStep) bool {
	if bundle.Hdr.SpecID == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing hdr.spec_id"})
		return false
	}
	if bundle.Hdr.SpecVer == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing hdr.spec_ver"})
		return false
	}
	if bundle.Hdr.Profile == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing hdr.profile"})
		return false
	}
	if bundle.Hdr.BundleID == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing hdr.bundle_id"})
		return false
	}
	if bundle.Payload == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing payload"})
		return false
	}
	if bundle.Meta.ProducerID == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing meta.producer_id"})
		return false
	}
	if bundle.Meta.CreatedAt == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing meta.created_at"})
		return false
	}
	if bundle.Meta.CanonicalEncoding == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing meta.canonical_encoding"})
		return false
	}
	if bundle.Meta.DigestAlg == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing meta.digest_alg"})
		return false
	}
	if bundle.Meta.SigAlg == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing meta.sig_alg"})
		return false
	}
	if bundle.Meta.ProofKind == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing meta.proof_kind"})
		return false
	}
	if bundle.Seal.DigestAlg == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing seal.digest_alg"})
		return false
	}
	if bundle.Seal.DigestB64U == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing seal.digest_b64u"})
		return false
	}
	if bundle.Seal.SigAlg == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing seal.sig_alg"})
		return false
	}
	if bundle.Seal.SignatureB64U == "" {
		*trace = append(*trace, TraceStep{Stage: "schema", Passed: false, Detail: "missing seal.signature_b64u"})
		return false
	}
	*trace = append(*trace, TraceStep{Stage: "schema", Passed: true})
	return true
}

// stageVersion checks the spec version.
func stageVersion(bundle Bundle, trace *[]TraceStep) bool {
	if bundle.Hdr.SpecID != "PROOFBUNDLE" {
		*trace = append(*trace, TraceStep{
			Stage:  "version",
			Passed: false,
			Detail: fmt.Sprintf("unknown spec_id: %s", bundle.Hdr.SpecID),
		})
		return false
	}
	if !knownSpecVersions[bundle.Hdr.SpecVer] {
		*trace = append(*trace, TraceStep{
			Stage:  "version",
			Passed: false,
			Detail: fmt.Sprintf("unknown spec_ver: %s", bundle.Hdr.SpecVer),
		})
		return false
	}
	*trace = append(*trace, TraceStep{Stage: "version", Passed: true})
	return true
}

// stageProfile checks the profile is known and matches the expected profile.
func stageProfile(bundle Bundle, cfg VerifyConfig, trace *[]TraceStep) bool {
	if !knownProfiles[bundle.Hdr.Profile] {
		*trace = append(*trace, TraceStep{
			Stage:  "profile",
			Passed: false,
			Detail: fmt.Sprintf("unknown profile: %s", bundle.Hdr.Profile),
		})
		return false
	}
	// If a profile is specified in config, it must match
	if cfg.Profile != "" && cfg.Profile != bundle.Hdr.Profile {
		*trace = append(*trace, TraceStep{
			Stage:  "profile",
			Passed: false,
			Detail: fmt.Sprintf("profile mismatch: bundle=%s, expected=%s", bundle.Hdr.Profile, cfg.Profile),
		})
		return false
	}
	*trace = append(*trace, TraceStep{Stage: "profile", Passed: true})
	return true
}

// stageCanonical computes the canonical encoding of the sealed content.
func stageCanonical(bundle Bundle, trace *[]TraceStep) ([]byte, bool) {
	canon, err := CanonicalizeBundle(bundle)
	if err != nil {
		*trace = append(*trace, TraceStep{
			Stage:  "canonical",
			Passed: false,
			Detail: err.Error(),
		})
		return nil, false
	}
	*trace = append(*trace, TraceStep{Stage: "canonical", Passed: true})
	return canon, true
}

// stageIntegrity verifies the digest in the seal matches the canonical content.
func stageIntegrity(bundle Bundle, canon []byte, trace *[]TraceStep) bool {
	digest, err := ComputeDigest(bundle.Seal.DigestAlg, canon)
	if err != nil {
		*trace = append(*trace, TraceStep{
			Stage:  "integrity",
			Passed: false,
			Detail: fmt.Sprintf("digest computation: %v", err),
		})
		return false
	}
	expectedDigest, err := base64.RawURLEncoding.DecodeString(bundle.Seal.DigestB64U)
	if err != nil {
		*trace = append(*trace, TraceStep{
			Stage:  "integrity",
			Passed: false,
			Detail: fmt.Sprintf("decode digest: %v", err),
		})
		return false
	}
	if !constantTimeCompare(digest, expectedDigest) {
		*trace = append(*trace, TraceStep{
			Stage:  "integrity",
			Passed: false,
			Detail: "digest mismatch",
		})
		return false
	}
	*trace = append(*trace, TraceStep{Stage: "integrity", Passed: true})
	return true
}

// stageSignature verifies the cryptographic signature.
func stageSignature(bundle Bundle, cfg VerifyConfig, canon []byte, trace *[]TraceStep) (interface{}, bool) {
	if cfg.PublicKeyB64U == "" {
		*trace = append(*trace, TraceStep{
			Stage:  "signature",
			Passed: false,
			Detail: "no public key provided",
		})
		return nil, false
	}
	pubKey, err := ImportPublicKey(bundle.Seal.SigAlg, cfg.PublicKeyB64U)
	if err != nil {
		*trace = append(*trace, TraceStep{
			Stage:  "signature",
			Passed: false,
			Detail: fmt.Sprintf("import public key: %v", err),
		})
		return nil, false
	}
	sigBytes, err := base64.RawURLEncoding.DecodeString(bundle.Seal.SignatureB64U)
	if err != nil {
		*trace = append(*trace, TraceStep{
			Stage:  "signature",
			Passed: false,
			Detail: fmt.Sprintf("decode signature: %v", err),
		})
		return nil, false
	}
	if err := Verify(bundle.Seal.SigAlg, pubKey, canon, sigBytes); err != nil {
		*trace = append(*trace, TraceStep{
			Stage:  "signature",
			Passed: false,
			Detail: fmt.Sprintf("verify: %v", err),
		})
		return nil, false
	}
	*trace = append(*trace, TraceStep{Stage: "signature", Passed: true})
	return pubKey, true
}

// stageBoundary evaluates the boundary expression.
func stageBoundary(bundle Bundle, cfg VerifyConfig, trace *[]TraceStep) (bool, bool) {
	// Only evaluate boundary for profiles that use it
	if bundle.Hdr.Profile != "PB-BOUNDARY-1" && bundle.Hdr.Profile != "PB-LINEAGE-1" && bundle.Hdr.Profile != "PB-REGULATED-1" {
		*trace = append(*trace, TraceStep{Stage: "boundary", Passed: true, Detail: "no boundary for profile"})
		return true, true
	}

	refTime := time.Now().UTC()
	if cfg.ReferenceTime != "" {
		t, err := time.Parse(time.RFC3339Nano, cfg.ReferenceTime)
		if err == nil {
			refTime = t
		}
	}

	result, err := EvaluateBoundary(bundle.Meta.Boundary, cfg.Context, refTime)
	if err != nil {
		*trace = append(*trace, TraceStep{
			Stage:  "boundary",
			Passed: false,
			Detail: fmt.Sprintf("boundary eval error: %v", err),
		})
		return false, false
	}
	if !result {
		*trace = append(*trace, TraceStep{
			Stage:  "boundary",
			Passed: false,
			Detail: "context out of bounds",
		})
		return false, true
	}
	*trace = append(*trace, TraceStep{Stage: "boundary", Passed: true})
	return true, true
}

// stageSideInfo checks side attestations.
func stageSideInfo(bundle Bundle, cfg VerifyConfig, trace *[]TraceStep) bool {
	if !bundle.Meta.RequiresSideAttestations {
		*trace = append(*trace, TraceStep{Stage: "side-info", Passed: true, Detail: "no side attestations required"})
		return true
	}

	// Check that side attestations are present and valid
	if len(bundle.Meta.SideAttestations) == 0 {
		*trace = append(*trace, TraceStep{
			Stage:  "side-info",
			Passed: false,
			Detail: "required side attestations missing",
		})
		return false
	}

	for _, sa := range bundle.Meta.SideAttestations {
		if sa.AuthorityID == "" {
			*trace = append(*trace, TraceStep{
				Stage:  "side-info",
				Passed: false,
				Detail: "side attestation missing authority_id",
			})
			return false
		}
	}

	*trace = append(*trace, TraceStep{Stage: "side-info", Passed: true})
	return true
}

// stageLineage verifies parent references.
func stageLineage(bundle Bundle, cfg VerifyConfig, trace *[]TraceStep) bool {
	// Lineage is only checked for PB-LINEAGE-1 and PB-REGULATED-1 profiles
	if bundle.Hdr.Profile != "PB-LINEAGE-1" && bundle.Hdr.Profile != "PB-REGULATED-1" {
		*trace = append(*trace, TraceStep{Stage: "lineage", Passed: true, Detail: "no lineage for profile"})
		return true
	}

	maxDepth := cfg.MaxLineageDepth
	if maxDepth <= 0 {
		maxDepth = 100
	}

	if err := VerifyLineage(bundle, cfg.ParentBundles, maxDepth); err != nil {
		*trace = append(*trace, TraceStep{
			Stage:  "lineage",
			Passed: false,
			Detail: err.Error(),
		})
		return false
	}
	*trace = append(*trace, TraceStep{Stage: "lineage", Passed: true})
	return true
}

// stageHITL verifies HITL approval for regulated profiles.
func stageHITL(bundle Bundle, cfg VerifyConfig, trace *[]TraceStep) bool {
	// HITL is only required for PB-REGULATED-1
	if bundle.Hdr.Profile != "PB-REGULATED-1" {
		*trace = append(*trace, TraceStep{Stage: "hitl", Passed: true, Detail: "no HITL required"})
		return true
	}

	if bundle.Meta.HITL == nil {
		*trace = append(*trace, TraceStep{
			Stage:  "hitl",
			Passed: false,
			Detail: "HITL approval required but missing",
		})
		return false
	}

	if bundle.Meta.HITL.ApproverID == "" {
		*trace = append(*trace, TraceStep{
			Stage:  "hitl",
			Passed: false,
			Detail: "HITL approver_id missing",
		})
		return false
	}

	if bundle.Meta.HITL.ApprovedAt == "" {
		*trace = append(*trace, TraceStep{
			Stage:  "hitl",
			Passed: false,
			Detail: "HITL approved_at missing",
		})
		return false
	}

	// Check HITL expiry if present
	if bundle.Meta.HITL.Expiry != "" {
		expiry, err := time.Parse(time.RFC3339Nano, bundle.Meta.HITL.Expiry)
		if err != nil {
			*trace = append(*trace, TraceStep{
				Stage:  "hitl",
				Passed: false,
				Detail: fmt.Sprintf("invalid HITL expiry: %v", err),
			})
			return false
		}
		refTime := time.Now().UTC()
		if cfg.ReferenceTime != "" {
			t, err := time.Parse(time.RFC3339Nano, cfg.ReferenceTime)
			if err == nil {
				refTime = t
			}
		}
		if refTime.After(expiry) {
			*trace = append(*trace, TraceStep{
				Stage:  "hitl",
				Passed: false,
				Detail: "HITL approval expired",
			})
			return false
		}
	}

	*trace = append(*trace, TraceStep{Stage: "hitl", Passed: true})
	return true
}

// constantTimeCompare compares two byte slices in constant time.
func constantTimeCompare(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	var v byte
	for i := 0; i < len(a); i++ {
		v |= a[i] ^ b[i]
	}
	return v == 0
}
