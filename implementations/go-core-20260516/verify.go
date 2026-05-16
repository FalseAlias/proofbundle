package proofbundle

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
)

// Seal is the cryptographic seal in a ProofBundle.
type Seal struct {
	SigAlg        string `json:"sigAlg"`
	DigestAlg     string `json:"digestAlg"`
	SignatureB64u string `json:"signature_b64u"`
	DigestB64u    string `json:"digest_b64u"`
}

// Bundle is a minimal ProofBundle structure for verification.
type Bundle struct {
	Hdr     map[string]any `json:"hdr"`
	Payload map[string]any `json:"payload"`
	Meta    map[string]any `json:"meta"`
	Refs    map[string]any `json:"refs"`
	Seal    Seal           `json:"seal"`
}

// VerifyResult holds the outcome of verification.
type VerifyResult struct {
	Outcome string `json:"outcome"`
	SigAlg  string `json:"sigAlg"`
}

// VerifyBundle checks a ProofBundle's cryptographic integrity.
func VerifyBundle(bundleJSON []byte, publicKeyB64u string) (*VerifyResult, error) {
	var b Bundle
	if err := json.Unmarshal(bundleJSON, &b); err != nil {
		return nil, err
	}

	// Re-marshal and canonicalize to preserve numeric representation
	withoutSeal := map[string]any{
		"hdr":     b.Hdr,
		"payload": b.Payload,
		"meta":    b.Meta,
		"refs":    b.Refs,
	}
	stdJSON, err := json.Marshal(withoutSeal)
	if err != nil {
		return nil, err
	}
	canon, err := CanonicalJSONFromBytes(stdJSON)
	if err != nil {
		return nil, err
	}

	// Compute digest
	digest, err := DigestBytes(canon, b.Seal.DigestAlg)
	if err != nil {
		return &VerifyResult{Outcome: "invalid-digest-algorithm", SigAlg: b.Seal.SigAlg}, nil
	}

	// Verify digest match
	declaredDigest, err := base64.RawURLEncoding.DecodeString(b.Seal.DigestB64u)
	if err != nil {
		return &VerifyResult{Outcome: "invalid-signature", SigAlg: b.Seal.SigAlg}, nil
	}
	if !bytesEqual(digest, declaredDigest) {
		return &VerifyResult{Outcome: "invalid-signature", SigAlg: b.Seal.SigAlg}, nil
	}

	// Verify signature
	sig, err := base64.RawURLEncoding.DecodeString(b.Seal.SignatureB64u)
	if err != nil {
		return &VerifyResult{Outcome: "invalid-signature", SigAlg: b.Seal.SigAlg}, nil
	}
	ok, err := VerifyDigest(publicKeyB64u, b.Seal.SigAlg, digest, sig)
	if err != nil || !ok {
		return &VerifyResult{Outcome: "invalid-signature", SigAlg: b.Seal.SigAlg}, nil
	}

	return &VerifyResult{Outcome: "verified", SigAlg: b.Seal.SigAlg}, nil
}

func bytesEqual(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
