package proofbundle

import (
	"crypto"
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/asn1"
	"encoding/base64"
	"encoding/pem"
	"fmt"
	"math/big"
)

// SignatureAlgorithms supported by ProofBundle v1.0.0
var SignatureAlgorithms = []string{
	"Ed25519",
	"ECDSA-P256", "ECDSA-P384", "ECDSA-P521",
	"RSA-PSS-2048", "RSA-PSS-3072", "RSA-PSS-4096",
}

// KeyPair holds a generated keypair.
type KeyPair struct {
	PublicKeyB64u string
	PrivateKeyPEM string
	SignatureAlg  string
}

// GenerateKeypair creates a new keypair for the given signature algorithm.
func GenerateKeypair(sigAlg string) (*KeyPair, error) {
	switch sigAlg {
	case "Ed25519":
		_, priv, err := ed25519.GenerateKey(rand.Reader)
		if err != nil {
			return nil, err
		}
		pubDer, err := x509.MarshalPKIXPublicKey(priv.Public())
		if err != nil {
			return nil, err
		}
		privPem := pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: mustMarshalPKCS8(priv)})
		return &KeyPair{
			PublicKeyB64u: base64.RawURLEncoding.EncodeToString(pubDer),
			PrivateKeyPEM: string(privPem),
			SignatureAlg:  sigAlg,
		}, nil

	case "ECDSA-P256":
		return generateECDSA(elliptic.P256(), sigAlg)
	case "ECDSA-P384":
		return generateECDSA(elliptic.P384(), sigAlg)
	case "ECDSA-P521":
		return generateECDSA(elliptic.P521(), sigAlg)

	case "RSA-PSS-2048":
		return generateRSA(2048, sigAlg)
	case "RSA-PSS-3072":
		return generateRSA(3072, sigAlg)
	case "RSA-PSS-4096":
		return generateRSA(4096, sigAlg)

	default:
		return nil, fmt.Errorf("unsupported signature algorithm: %s", sigAlg)
	}
}

func generateECDSA(curve elliptic.Curve, sigAlg string) (*KeyPair, error) {
	priv, err := ecdsa.GenerateKey(curve, rand.Reader)
	if err != nil {
		return nil, err
	}
	pubDer, err := x509.MarshalPKIXPublicKey(&priv.PublicKey)
	if err != nil {
		return nil, err
	}
	privPem := pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: mustMarshalPKCS8(priv)})
	return &KeyPair{
		PublicKeyB64u: base64.RawURLEncoding.EncodeToString(pubDer),
		PrivateKeyPEM: string(privPem),
		SignatureAlg:  sigAlg,
	}, nil
}

func generateRSA(bits int, sigAlg string) (*KeyPair, error) {
	priv, err := rsa.GenerateKey(rand.Reader, bits)
	if err != nil {
		return nil, err
	}
	pubDer, err := x509.MarshalPKIXPublicKey(&priv.PublicKey)
	if err != nil {
		return nil, err
	}
	privPem := pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: mustMarshalPKCS8(priv)})
	return &KeyPair{
		PublicKeyB64u: base64.RawURLEncoding.EncodeToString(pubDer),
		PrivateKeyPEM: string(privPem),
		SignatureAlg:  sigAlg,
	}, nil
}

func mustMarshalPKCS8(key any) []byte {
	b, err := x509.MarshalPKCS8PrivateKey(key)
	if err != nil {
		panic(err)
	}
	return b
}

// SignDigest signs a pre-computed digest using the given algorithm.
func SignDigest(privateKeyPEM string, sigAlg string, digest []byte) ([]byte, error) {
	block, _ := pem.Decode([]byte(privateKeyPEM))
	if block == nil {
		return nil, fmt.Errorf("invalid PEM")
	}
	key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}

	switch sigAlg {
	case "Ed25519":
		priv := key.(ed25519.PrivateKey)
		return ed25519.Sign(priv, digest), nil

	case "ECDSA-P256", "ECDSA-P384", "ECDSA-P521":
		priv := key.(*ecdsa.PrivateKey)
		// Use SignASN1 directly to avoid double-hashing by crypto.Signer
		return ecdsa.SignASN1(rand.Reader, priv, digest)

	case "RSA-PSS-2048", "RSA-PSS-3072", "RSA-PSS-4096":
		priv := key.(*rsa.PrivateKey)
		h := hashForDigestLength(len(digest))
		return rsa.SignPSS(rand.Reader, priv, h, digest, &rsa.PSSOptions{
			SaltLength: len(digest),
			Hash:       h,
		})

	default:
		return nil, fmt.Errorf("unsupported signature algorithm: %s", sigAlg)
	}
}

// VerifyDigest verifies a signature against a pre-computed digest.
func VerifyDigest(publicKeyB64u string, sigAlg string, digest []byte, signature []byte) (bool, error) {
	pubDer, err := base64.RawURLEncoding.DecodeString(publicKeyB64u)
	if err != nil {
		return false, err
	}
	key, err := x509.ParsePKIXPublicKey(pubDer)
	if err != nil {
		return false, err
	}

	switch sigAlg {
	case "Ed25519":
		pub := key.(ed25519.PublicKey)
		return ed25519.Verify(pub, digest, signature), nil

	case "ECDSA-P256", "ECDSA-P384", "ECDSA-P521":
		pub := key.(*ecdsa.PublicKey)
		return ecdsa.VerifyASN1(pub, digest, signature), nil

	case "RSA-PSS-2048", "RSA-PSS-3072", "RSA-PSS-4096":
		pub := key.(*rsa.PublicKey)
		h := hashForDigestLength(len(digest))
		err := rsa.VerifyPSS(pub, h, digest, signature, &rsa.PSSOptions{
			SaltLength: len(digest),
			Hash:       h,
		})
		return err == nil, nil

	default:
		return false, fmt.Errorf("unsupported signature algorithm: %s", sigAlg)
	}
}

func hashForDigestLength(length int) crypto.Hash {
	switch length {
	case 32:
		return crypto.SHA256
	case 48:
		return crypto.SHA384
	case 64:
		return crypto.SHA512
	default:
		return 0
	}
}

// ecdsaSignature represents the two integers in an ECDSA signature.
type ecdsaSignature struct {
	R, S *big.Int
}

// parseECDSASig parses an ASN.1 DER ECDSA signature.
func parseECDSASig(sig []byte) (*big.Int, *big.Int, error) {
	var es ecdsaSignature
	if _, err := asn1.Unmarshal(sig, &es); err != nil {
		return nil, nil, err
	}
	return es.R, es.S, nil
}
