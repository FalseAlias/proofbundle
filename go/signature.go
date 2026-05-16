package proofbundle

import (
	"crypto"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/elliptic"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/sha512"
	"crypto/x509"
	"encoding/base64"
	"errors"
	"fmt"
	"math/big"
)

var (
	ErrUnsupportedSigAlg = errors.New("unsupported signature algorithm")
	ErrInvalidPublicKey  = errors.New("invalid public key")
	ErrInvalidSignature  = errors.New("invalid signature")
)

// SigKeyPair holds a generated or imported key pair.
type SigKeyPair struct {
	Alg        string
	PublicKey  crypto.PublicKey
	PrivateKey crypto.PrivateKey
}

// GenerateSigKeyPair generates a new key pair for the given algorithm.
func GenerateSigKeyPair(alg string) (*SigKeyPair, error) {
	switch alg {
	case "Ed25519":
		_, priv, err := ed25519.GenerateKey(nil)
		if err != nil {
			return nil, err
		}
		return &SigKeyPair{Alg: alg, PublicKey: priv.Public(), PrivateKey: priv}, nil
	case "ECDSA-P256":
		priv, err := ecdsa.GenerateKey(elliptic.P256(), nil)
		if err != nil {
			return nil, err
		}
		return &SigKeyPair{Alg: alg, PublicKey: &priv.PublicKey, PrivateKey: priv}, nil
	case "ECDSA-P384":
		priv, err := ecdsa.GenerateKey(elliptic.P384(), nil)
		if err != nil {
			return nil, err
		}
		return &SigKeyPair{Alg: alg, PublicKey: &priv.PublicKey, PrivateKey: priv}, nil
	case "ECDSA-P521":
		priv, err := ecdsa.GenerateKey(elliptic.P521(), nil)
		if err != nil {
			return nil, err
		}
		return &SigKeyPair{Alg: alg, PublicKey: &priv.PublicKey, PrivateKey: priv}, nil
	case "RSA-PSS-2048":
		priv, err := rsa.GenerateKey(nil, 2048)
		if err != nil {
			return nil, err
		}
		return &SigKeyPair{Alg: alg, PublicKey: &priv.PublicKey, PrivateKey: priv}, nil
	case "RSA-PSS-3072":
		priv, err := rsa.GenerateKey(nil, 3072)
		if err != nil {
			return nil, err
		}
		return &SigKeyPair{Alg: alg, PublicKey: &priv.PublicKey, PrivateKey: priv}, nil
	case "RSA-PSS-4096":
		priv, err := rsa.GenerateKey(nil, 4096)
		if err != nil {
			return nil, err
		}
		return &SigKeyPair{Alg: alg, PublicKey: &priv.PublicKey, PrivateKey: priv}, nil
	default:
		return nil, ErrUnsupportedSigAlg
	}
}

// ExportPublicKey exports a public key to base64url-encoded format.
func ExportPublicKey(alg string, pub crypto.PublicKey) (string, error) {
	switch alg {
	case "Ed25519":
		k, ok := pub.(ed25519.PublicKey)
		if !ok {
			return "", ErrInvalidPublicKey
		}
		return base64.RawURLEncoding.EncodeToString(k), nil
	case "ECDSA-P256", "ECDSA-P384", "ECDSA-P521":
		k, ok := pub.(*ecdsa.PublicKey)
		if !ok {
			return "", ErrInvalidPublicKey
		}
		return encodeECDSAPublicKey(k), nil
	case "RSA-PSS-2048", "RSA-PSS-3072", "RSA-PSS-4096":
		k, ok := pub.(*rsa.PublicKey)
		if !ok {
			return "", ErrInvalidPublicKey
		}
		return encodeRSAPublicKey(k), nil
	default:
		return "", ErrUnsupportedSigAlg
	}
}

// ImportPublicKey imports a public key from base64url-encoded format.
func ImportPublicKey(alg, b64u string) (crypto.PublicKey, error) {
	raw, err := base64.RawURLEncoding.DecodeString(b64u)
	if err != nil {
		return nil, fmt.Errorf("decode public key: %w", err)
	}
	switch alg {
	case "Ed25519":
		if len(raw) != ed25519.PublicKeySize {
			return nil, ErrInvalidPublicKey
		}
		return ed25519.PublicKey(raw), nil
	case "ECDSA-P256":
		return decodeECDSAPublicKey(elliptic.P256(), raw)
	case "ECDSA-P384":
		return decodeECDSAPublicKey(elliptic.P384(), raw)
	case "ECDSA-P521":
		return decodeECDSAPublicKey(elliptic.P521(), raw)
	case "RSA-PSS-2048", "RSA-PSS-3072", "RSA-PSS-4096":
		return decodeRSAPublicKey(raw)
	default:
		return nil, ErrUnsupportedSigAlg
	}
}

// Sign signs data with the given algorithm and private key.
func Sign(alg string, priv crypto.PrivateKey, data []byte) ([]byte, error) {
	switch alg {
	case "Ed25519":
		k, ok := priv.(ed25519.PrivateKey)
		if !ok {
			return nil, errors.New("invalid Ed25519 private key")
		}
		return ed25519.Sign(k, data), nil
	case "ECDSA-P256":
		k, ok := priv.(*ecdsa.PrivateKey)
		if !ok {
			return nil, errors.New("invalid ECDSA private key")
		}
		h := sha256.Sum256(data)
		return ecdsa.SignASN1(nil, k, h[:])
	case "ECDSA-P384":
		k, ok := priv.(*ecdsa.PrivateKey)
		if !ok {
			return nil, errors.New("invalid ECDSA private key")
		}
		h := sha512.Sum384(data)
		return ecdsa.SignASN1(nil, k, h[:])
	case "ECDSA-P521":
		k, ok := priv.(*ecdsa.PrivateKey)
		if !ok {
			return nil, errors.New("invalid ECDSA private key")
		}
		h := sha512.Sum512(data)
		return ecdsa.SignASN1(nil, k, h[:])
	case "RSA-PSS-2048", "RSA-PSS-3072", "RSA-PSS-4096":
		k, ok := priv.(*rsa.PrivateKey)
		if !ok {
			return nil, errors.New("invalid RSA private key")
		}
		h := sha256.Sum256(data)
		return rsa.SignPSS(nil, k, crypto.SHA256, h[:], &rsa.PSSOptions{SaltLength: rsa.PSSSaltLengthEqualsHash})
	default:
		return nil, ErrUnsupportedSigAlg
	}
}

// Verify verifies a signature with the given algorithm and public key.
func Verify(alg string, pub crypto.PublicKey, data, sig []byte) error {
	switch alg {
	case "Ed25519":
		k, ok := pub.(ed25519.PublicKey)
		if !ok {
			return ErrInvalidPublicKey
		}
		if !ed25519.Verify(k, data, sig) {
			return ErrInvalidSignature
		}
		return nil
	case "ECDSA-P256":
		k, ok := pub.(*ecdsa.PublicKey)
		if !ok {
			return ErrInvalidPublicKey
		}
		h := sha256.Sum256(data)
		if !ecdsa.VerifyASN1(k, h[:], sig) {
			return ErrInvalidSignature
		}
		return nil
	case "ECDSA-P384":
		k, ok := pub.(*ecdsa.PublicKey)
		if !ok {
			return ErrInvalidPublicKey
		}
		h := sha512.Sum384(data)
		if !ecdsa.VerifyASN1(k, h[:], sig) {
			return ErrInvalidSignature
		}
		return nil
	case "ECDSA-P521":
		k, ok := pub.(*ecdsa.PublicKey)
		if !ok {
			return ErrInvalidPublicKey
		}
		h := sha512.Sum512(data)
		if !ecdsa.VerifyASN1(k, h[:], sig) {
			return ErrInvalidSignature
		}
		return nil
	case "RSA-PSS-2048", "RSA-PSS-3072", "RSA-PSS-4096":
		k, ok := pub.(*rsa.PublicKey)
		if !ok {
			return ErrInvalidPublicKey
		}
		h := sha256.Sum256(data)
		if err := rsa.VerifyPSS(k, crypto.SHA256, h[:], sig, &rsa.PSSOptions{SaltLength: rsa.PSSSaltLengthEqualsHash}); err != nil {
			return ErrInvalidSignature
		}
		return nil
	default:
		return ErrUnsupportedSigAlg
	}
}

// encodeECDSAPublicKey encodes an ECDSA public key as base64url.
// Format: uncompressed point (0x04 || X || Y)
func encodeECDSAPublicKey(k *ecdsa.PublicKey) string {
	curveByteLen := (k.Curve.Params().BitSize + 7) / 8
	pubKeyBytes := make([]byte, 1+2*curveByteLen)
	pubKeyBytes[0] = 4 // uncompressed point
	k.X.FillBytes(pubKeyBytes[1 : 1+curveByteLen])
	k.Y.FillBytes(pubKeyBytes[1+curveByteLen : 1+2*curveByteLen])
	return base64.RawURLEncoding.EncodeToString(pubKeyBytes)
}

// decodeECDSAPublicKey decodes an ECDSA public key from raw bytes.
func decodeECDSAPublicKey(curve elliptic.Curve, raw []byte) (*ecdsa.PublicKey, error) {
	curveByteLen := (curve.Params().BitSize + 7) / 8
	if len(raw) != 1+2*curveByteLen {
		return nil, ErrInvalidPublicKey
	}
	if raw[0] != 4 {
		return nil, ErrInvalidPublicKey
	}
	x := new(big.Int).SetBytes(raw[1 : 1+curveByteLen])
	y := new(big.Int).SetBytes(raw[1+curveByteLen:])
	if !curve.IsOnCurve(x, y) {
		return nil, ErrInvalidPublicKey
	}
	return &ecdsa.PublicKey{Curve: curve, X: x, Y: y}, nil
}

// encodeRSAPublicKey encodes an RSA public key as base64url (PKIX format).
func encodeRSAPublicKey(k *rsa.PublicKey) string {
	b, _ := x509.MarshalPKIXPublicKey(k)
	return base64.RawURLEncoding.EncodeToString(b)
}

// decodeRSAPublicKey decodes an RSA public key from raw bytes.
func decodeRSAPublicKey(raw []byte) (*rsa.PublicKey, error) {
	// Try PKIX format first
	pub, err := x509.ParsePKIXPublicKey(raw)
	if err == nil {
		if rk, ok := pub.(*rsa.PublicKey); ok {
			return rk, nil
		}
	}
	// Try PKCS1 format
	pub, err = x509.ParsePKCS1PublicKey(raw)
	if err == nil {
		return pub.(*rsa.PublicKey), nil
	}
	// Try SSH wire format ("ssh-rsa" prefix + length-prefixed fields)
	if rk, err := decodeSSHRSAPublicKey(raw); err == nil {
		return rk, nil
	}
	return nil, ErrInvalidPublicKey
}

// decodeSSHRSAPublicKey decodes an RSA public key from SSH wire format.
func decodeSSHRSAPublicKey(raw []byte) (*rsa.PublicKey, error) {
	// SSH wire format: "ssh-rsa" || e || n  (each length-prefixed)
	// But raw bytes might be the wire format directly
	if len(raw) < 11 {
		return nil, ErrInvalidPublicKey
	}
	// Check for "ssh-rsa" prefix
	const sshRSA = "ssh-rsa"
	// The wire format starts with uint32 length of "ssh-rsa" (7) followed by "ssh-rsa"
	if len(raw) >= 11 && raw[0] == 0 && raw[1] == 0 && raw[2] == 0 && raw[3] == 7 {
		if string(raw[4:11]) == sshRSA {
			rest := raw[11:]
			// Read e
			if len(rest) < 4 {
				return nil, ErrInvalidPublicKey
			}
			elen := uint32(rest[0])<<24 | uint32(rest[1])<<16 | uint32(rest[2])<<8 | uint32(rest[3])
			rest = rest[4:]
			if uint32(len(rest)) < elen {
				return nil, ErrInvalidPublicKey
			}
			e := new(big.Int).SetBytes(rest[:elen])
			rest = rest[elen:]
			// Read n
			if len(rest) < 4 {
				return nil, ErrInvalidPublicKey
			}
			nlen := uint32(rest[0])<<24 | uint32(rest[1])<<16 | uint32(rest[2])<<8 | uint32(rest[3])
			rest = rest[4:]
			if uint32(len(rest)) < nlen {
				return nil, ErrInvalidPublicKey
			}
			n := new(big.Int).SetBytes(rest[:nlen])
			return &rsa.PublicKey{N: n, E: int(e.Int64())}, nil
		}
	}
	return nil, ErrInvalidPublicKey
}



// SigAlgForDigest returns the appropriate hash algorithm for a signature algorithm.
func SigAlgForDigest(sigAlg string) string {
	switch sigAlg {
	case "ECDSA-P256":
		return "SHA-256"
	case "ECDSA-P384":
		return "SHA-384"
	case "ECDSA-P521":
		return "SHA-512"
	default:
		return "SHA-256"
	}
}
