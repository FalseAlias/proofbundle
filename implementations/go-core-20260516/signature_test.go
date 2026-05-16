package proofbundle

import (
	"testing"
)

func TestSignVerifyRoundTrip(t *testing.T) {
	algs := []string{
		"Ed25519",
		"ECDSA-P256", "ECDSA-P384", "ECDSA-P521",
		"RSA-PSS-2048", "RSA-PSS-3072", "RSA-PSS-4096",
	}
	digests := map[string][]byte{
		"SHA-256": make([]byte, 32),
		"SHA-384": make([]byte, 48),
		"SHA-512": make([]byte, 64),
	}
	for _, alg := range algs {
		kp, err := GenerateKeypair(alg)
		if err != nil {
			t.Fatalf("generate %s: %v", alg, err)
		}
		for dname, digest := range digests {
			sig, err := SignDigest(kp.PrivateKeyPEM, alg, digest)
			if err != nil {
				t.Fatalf("sign %s+%s: %v", alg, dname, err)
			}
			ok, err := VerifyDigest(kp.PublicKeyB64u, alg, digest, sig)
			if err != nil {
				t.Fatalf("verify %s+%s: %v", alg, dname, err)
			}
			if !ok {
				t.Fatalf("verify failed %s+%s", alg, dname)
			}
		}
	}
}
