package proofbundle

import (
	"crypto/sha256"
	"crypto/sha512"
	"errors"
	"fmt"

	"golang.org/x/crypto/blake2b"
	"lukechampine.com/blake3"
)

// ComputeDigest computes the digest of data using the named algorithm.
func ComputeDigest(alg string, data []byte) ([]byte, error) {
	switch alg {
	case "SHA-256":
		h := sha256.Sum256(data)
		return h[:], nil
	case "SHA-384":
		h := sha512.Sum384(data)
		return h[:], nil
	case "SHA-512":
		h := sha512.Sum512(data)
		return h[:], nil
	case "BLAKE3":
		h := blake3.Sum256(data)
		return h[:], nil
	case "BLAKE2b":
		h := blake2b.Sum512(data)
		return h[:], nil
	default:
		return nil, fmt.Errorf("unsupported digest algorithm: %s", alg)
	}
}

// DigestLength returns the byte length of a digest for the given algorithm.
func DigestLength(alg string) (int, error) {
	switch alg {
	case "SHA-256":
		return 32, nil
	case "SHA-384":
		return 48, nil
	case "SHA-512":
		return 64, nil
	case "BLAKE3":
		return 32, nil
	case "BLAKE2b":
		return 64, nil
	default:
		return 0, errors.New("unknown digest algorithm")
	}
}
