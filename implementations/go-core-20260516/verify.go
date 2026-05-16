package proofbundle

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
)

// VerifyResult holds the outcome of verification.
type VerifyResult struct {
	Outcome string `json:"outcome"`
	SigAlg  string `json:"sigAlg"`
}

// VerifyBundle checks a ProofBundle's cryptographic integrity.
func VerifyBundle(bundleJSON []byte, publicKeyB64u string) (*VerifyResult, error) {
	// Parse with json.Number to preserve numeric representation
	var bundle map[string]any
	dec := json.NewDecoder(bytes.NewReader(bundleJSON))
	dec.UseNumber()
	if err := dec.Decode(&bundle); err != nil {
		return nil, err
	}

	// Extract seal
	sealRaw, ok := bundle["seal"].(map[string]any)
	if !ok {
		return &VerifyResult{Outcome: "invalid-signature"}, nil
	}

	sigAlg := stringValue(sealRaw["sig_alg"])
	if sigAlg == "" {
		sigAlg = stringValue(sealRaw["sigAlg"])
	}
	digestAlg := stringValue(sealRaw["digest_alg"])
	if digestAlg == "" {
		digestAlg = stringValue(sealRaw["digestAlg"])
	}
	digestB64u := stringValue(sealRaw["digest_b64u"])
	if digestB64u == "" {
		digestB64u = stringValue(sealRaw["digestB64u"])
	}
	signatureB64u := stringValue(sealRaw["signature_b64u"])
	if signatureB64u == "" {
		signatureB64u = stringValue(sealRaw["signatureB64u"])
	}

	// Build canonicalization input without seal
	withoutSeal := map[string]any{}
	for k, v := range bundle {
		if k != "seal" {
			withoutSeal[k] = v
		}
	}

	// Re-marshal and canonicalize to preserve numeric representation
	stdJSON, err := json.Marshal(withoutSeal)
	if err != nil {
		return nil, err
	}
	canon, err := CanonicalJSONFromBytes(stdJSON)
	if err != nil {
		return nil, err
	}

	// Compute digest
	digest, err := DigestBytes(canon, digestAlg)
	if err != nil {
		return &VerifyResult{Outcome: "invalid-digest-algorithm", SigAlg: sigAlg}, nil
	}

	// Verify digest match
	declaredDigest, err := base64.RawURLEncoding.DecodeString(digestB64u)
	if err != nil {
		return &VerifyResult{Outcome: "invalid-signature", SigAlg: sigAlg}, nil
	}
	if !bytesEqual(digest, declaredDigest) {
		return &VerifyResult{Outcome: "invalid-signature", SigAlg: sigAlg}, nil
	}

	// Verify signature
	sig, err := base64.RawURLEncoding.DecodeString(signatureB64u)
	if err != nil {
		return &VerifyResult{Outcome: "invalid-signature", SigAlg: sigAlg}, nil
	}
	ok, err = VerifyDigest(publicKeyB64u, sigAlg, digest, sig)
	if err != nil || !ok {
		return &VerifyResult{Outcome: "invalid-signature", SigAlg: sigAlg}, nil
	}

	return &VerifyResult{Outcome: "verified", SigAlg: sigAlg}, nil
}

func stringValue(v any) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	if n, ok := v.(json.Number); ok {
		return string(n)
	}
	return ""
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
