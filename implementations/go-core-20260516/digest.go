package proofbundle

import (
	"crypto/sha256"
	"crypto/sha512"
	"fmt"
	"hash"
)

// DigestAlgorithms supported by ProofBundle v1.0.0
var DigestAlgorithms = []string{"SHA-256", "SHA-384", "SHA-512", "BLAKE3", "BLAKE2b"}

// DigestBytes computes the digest of canon using the named algorithm.
func DigestBytes(canon []byte, alg string) ([]byte, error) {
	h, err := newHash(alg)
	if err != nil {
		return nil, err
	}
	h.Write(canon)
	return h.Sum(nil), nil
}

func newHash(alg string) (hash.Hash, error) {
	switch alg {
	case "SHA-256":
		return sha256.New(), nil
	case "SHA-384":
		return sha512.New384(), nil
	case "SHA-512":
		return sha512.New(), nil
	case "BLAKE3":
		// BLAKE3 requires external package; placeholder
		return nil, fmt.Errorf("BLAKE3 not yet implemented in Go core")
	case "BLAKE2b":
		// BLAKE2b requires external package; placeholder
		return nil, fmt.Errorf("BLAKE2b not yet implemented in Go core")
	default:
		return nil, fmt.Errorf("unsupported digest algorithm: %s", alg)
	}
}

// HashForDigest determines the hash algorithm to use for Prehashed verification
// based on digest length, matching Python behavior.
func HashForDigest(digest []byte) (string, error) {
	switch len(digest) {
	case 32:
		return "sha256", nil
	case 48:
		return "sha384", nil
	case 64:
		return "sha512", nil
	default:
		return "", fmt.Errorf("unsupported prehash length: %d", len(digest))
	}
}
