package proofbundle

import (
	"bytes"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func loadVectors(t *testing.T) []map[string]any {
	vectorPaths := []string{
		"../conformance/vectors_v1.json",
		"../conformance/vectors.generated.json",
	}
	for _, p := range vectorPaths {
		absPath, err := filepath.Abs(p)
		if err != nil {
			continue
		}
		data, err := os.ReadFile(absPath)
		if err != nil {
			continue
		}
		var vectors []map[string]any
		dec := json.NewDecoder(bytes.NewReader(data))
		dec.UseNumber()
		if err := dec.Decode(&vectors); err != nil {
			continue
		}
		return vectors
	}
	t.Skip("no conformance vectors found")
	return nil
}

func TestConformanceVectors(t *testing.T) {
	vectors := loadVectors(t)

	passed := 0
	failed := 0
	skipped := 0

	for i, vec := range vectors {
		sigAlg, _ := vec["sigAlg"].(string)
		digestAlg, _ := vec["digestAlg"].(string)
		publicKeyB64u, _ := vec["publicKey_b64u"].(string)
		signatureB64u, _ := vec["signature_b64u"].(string)
		expectedOutcome, _ := vec["expectedOutcome"].(string)

		// Skip unsupported digest algorithms for now (BLAKE3/BLAKE2b)
		if digestAlg == "BLAKE3" || digestAlg == "BLAKE2b" {
			skipped++
			continue
		}

		// Build bundle from vector using json.Number for numeric fidelity
		bundleMap := map[string]any{
			"hdr":     vec["hdr"],
			"payload": vec["payload"],
			"meta":    vec["meta"],
			"refs":    vec["refs"],
			"seal": map[string]any{
				"sigAlg":         sigAlg,
				"digestAlg":      digestAlg,
				"signature_b64u": signatureB64u,
				"digest_b64u":    vec["digest_b64u"],
			},
		}
		// Re-parse through JSON to get json.Number semantics
		stdJSON, err := json.Marshal(bundleMap)
		if err != nil {
			t.Logf("vector %d: marshal error: %v", i, err)
			failed++
			continue
		}
		var reparsed map[string]any
		dec := json.NewDecoder(bytes.NewReader(stdJSON))
		dec.UseNumber()
		if err := dec.Decode(&reparsed); err != nil {
			t.Logf("vector %d: reparse error: %v", i, err)
			failed++
			continue
		}

		// Re-marshal for VerifyBundle
		bundleJSON, err := json.Marshal(reparsed)
		if err != nil {
			t.Logf("vector %d: marshal error: %v", i, err)
			failed++
			continue
		}

		res, err := VerifyBundle(bundleJSON, publicKeyB64u)
		if err != nil {
			t.Logf("vector %d (%s/%s): verify error: %v", i, sigAlg, digestAlg, err)
			failed++
			continue
		}
		if res.Outcome != expectedOutcome {
			t.Logf("vector %d (%s/%s): expected %s, got %s", i, sigAlg, digestAlg, expectedOutcome, res.Outcome)
			failed++
			continue
		}
		passed++
	}

	t.Logf("Conformance: %d passed, %d failed, %d skipped (total %d)",
		passed, failed, skipped, len(vectors))
	if failed > 0 {
		t.Fatalf("%d conformance vectors failed", failed)
	}
}

func TestConformanceSignVerify(t *testing.T) {
	pairs := []struct{ sigAlg, digestAlg string }{
		{"Ed25519", "SHA-256"},
		{"Ed25519", "SHA-384"},
		{"Ed25519", "SHA-512"},
		{"ECDSA-P256", "SHA-256"},
		{"ECDSA-P256", "SHA-384"},
		{"ECDSA-P256", "SHA-512"},
		{"ECDSA-P384", "SHA-256"},
		{"ECDSA-P384", "SHA-384"},
		{"ECDSA-P384", "SHA-512"},
		{"ECDSA-P521", "SHA-256"},
		{"ECDSA-P521", "SHA-384"},
		{"ECDSA-P521", "SHA-512"},
		{"RSA-PSS-2048", "SHA-256"},
		{"RSA-PSS-2048", "SHA-384"},
		{"RSA-PSS-2048", "SHA-512"},
		{"RSA-PSS-3072", "SHA-256"},
		{"RSA-PSS-3072", "SHA-384"},
		{"RSA-PSS-3072", "SHA-512"},
		{"RSA-PSS-4096", "SHA-256"},
		{"RSA-PSS-4096", "SHA-384"},
		{"RSA-PSS-4096", "SHA-512"},
	}

	payload := map[string]any{
		"hdr":     map[string]any{"t": "test", "v": "1.0.0"},
		"payload": map[string]any{"msg": "hello"},
		"meta":    map[string]any{},
		"refs":    map[string]any{},
	}

	for _, pair := range pairs {
		kp, err := GenerateKeypair(pair.sigAlg)
		if err != nil {
			t.Fatalf("generate %s: %v", pair.sigAlg, err)
		}

		canon, err := CanonicalJSON(payload)
		if err != nil {
			t.Fatalf("canonical %s/%s: %v", pair.sigAlg, pair.digestAlg, err)
		}

		digest, err := DigestBytes(canon, pair.digestAlg)
		if err != nil {
			t.Fatalf("digest %s/%s: %v", pair.sigAlg, pair.digestAlg, err)
		}

		sig, err := SignDigest(kp.PrivateKeyPEM, pair.sigAlg, digest)
		if err != nil {
			t.Fatalf("sign %s/%s: %v", pair.sigAlg, pair.digestAlg, err)
		}

		ok, err := VerifyDigest(kp.PublicKeyB64u, pair.sigAlg, digest, sig)
		if err != nil {
			t.Fatalf("verify %s/%s: %v", pair.sigAlg, pair.digestAlg, err)
		}
		if !ok {
			t.Fatalf("verify failed %s/%s", pair.sigAlg, pair.digestAlg)
		}
	}
}
