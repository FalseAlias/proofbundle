package proofbundle

import "encoding/json"

// Bundle is the top-level ProofBundle v1.0.0 structure.
type Bundle struct {
	Hdr     Header          `json:"hdr"`
	Payload string          `json:"payload"`
	Meta    Meta            `json:"meta"`
	Refs    []ParentRef     `json:"refs"`
	Seal    Seal            `json:"seal"`
}

// Header contains bundle identification metadata.
type Header struct {
	SpecID    string `json:"spec_id"`
	SpecVer   string `json:"spec_ver"`
	Profile   string `json:"profile"`
	BundleID  string `json:"bundle_id"`
}

// Meta contains bundle metadata including proof configuration.
type Meta struct {
	ProducerID               string              `json:"producer_id"`
	CreatedAt                string              `json:"created_at"`
	CanonicalEncoding        string              `json:"canonical_encoding"`
	DigestAlg                string              `json:"digest_alg"`
	SigAlg                   string              `json:"sig_alg"`
	ProofKind                string              `json:"proof_kind"`
	Boundary                 json.RawMessage     `json:"boundary,omitempty"`
	RequiresSideAttestations bool                `json:"requires_side_attestations,omitempty"`
	SideAttestations         []SideAttestation   `json:"side_attestations,omitempty"`
	HITL                     *HITL               `json:"hitl,omitempty"`
}

// Seal contains the cryptographic seal over the bundle.
type Seal struct {
	DigestAlg      string `json:"digest_alg"`
	DigestB64U     string `json:"digest_b64u"`
	SigAlg         string `json:"sig_alg"`
	SignatureB64U  string `json:"signature_b64u"`
}

// ParentRef references a parent bundle in a lineage chain.
type ParentRef struct {
	ParentID   string `json:"parent_id"`
	ParentDigest string `json:"parent_digest"`
	DigestAlg  string `json:"digest_alg"`
	EdgeKind   string `json:"edge_kind"`
}

// SideAttestation represents a third-party attestation.
type SideAttestation struct {
	AuthorityID string `json:"authority_id"`
	Attestation string `json:"attestation"`
	Timestamp   string `json:"timestamp"`
}

// HITL represents human-in-the-loop approval data.
type HITL struct {
	ApproverID string `json:"approver_id"`
	ApprovedAt string `json:"approved_at"`
	Expiry     string `json:"expiry,omitempty"`
}

// VerifyConfig configures the verification process.
type VerifyConfig struct {
	Profile          string
	Context          map[string]interface{}
	PublicKeyB64U    string
	ParentBundles    []Bundle
	MaxBundleBytes   int
	MaxLineageDepth  int
	ReferenceTime    string
}

// TraceStep records a single verification stage result.
type TraceStep struct {
	Stage   string `json:"stage"`
	Passed  bool   `json:"passed"`
	Detail  string `json:"detail,omitempty"`
}

// VerifyResult is the outcome of bundle verification.
type VerifyResult struct {
	Outcome string      `json:"outcome"`
	Trace   []TraceStep `json:"trace"`
}
