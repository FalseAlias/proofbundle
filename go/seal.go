package proofbundle

import (
	"crypto"
	"encoding/base64"
	"fmt"
)

// SealBundle creates a sealed bundle by canonicalizing the content, computing digests,
// setting the bundle_id, and creating the cryptographic seal.
func SealBundle(payload string, meta Meta, refs []ParentRef, privateKey crypto.PrivateKey) (*Bundle, error) {
	// Step 1: Build initial bundle without bundle_id and seal
	hdr := Header{
		SpecID:  "PROOFBUNDLE",
		SpecVer: "1.0.0",
		Profile: profileFromMeta(meta),
	}

	bundle := Bundle{
		Hdr:     hdr,
		Payload: payload,
		Meta:    meta,
		Refs:    refs,
	}

	// Step 2: Canonicalize {hdr, payload, meta, refs} and compute bundle_id
	obj := map[string]interface{}{
		"hdr":     bundle.Hdr,
		"payload": bundle.Payload,
		"meta":    bundle.Meta,
		"refs":    bundle.Refs,
	}
	canon, err := toCanonicalBytes(obj)
	if err != nil {
		return nil, fmt.Errorf("canonicalize for bundle_id: %w", err)
	}

	digest, err := ComputeDigest(meta.DigestAlg, canon)
	if err != nil {
		return nil, fmt.Errorf("compute bundle_id digest: %w", err)
	}
	bundle.Hdr.BundleID = base64.RawURLEncoding.EncodeToString(digest)

	// Step 3: Re-canonicalize full bundle with bundle_id (but without seal)
	obj2 := map[string]interface{}{
		"hdr":     bundle.Hdr,
		"payload": bundle.Payload,
		"meta":    bundle.Meta,
		"refs":    bundle.Refs,
	}
	canon2, err := toCanonicalBytes(obj2)
	if err != nil {
		return nil, fmt.Errorf("re-canonicalize: %w", err)
	}

	// Step 4: Compute digest of canonicalized content
	contentDigest, err := ComputeDigest(meta.DigestAlg, canon2)
	if err != nil {
		return nil, fmt.Errorf("compute content digest: %w", err)
	}

	// Step 5: Sign the digest
	sig, err := Sign(meta.SigAlg, privateKey, canon2)
	if err != nil {
		return nil, fmt.Errorf("sign: %w", err)
	}

	bundle.Seal = Seal{
		DigestAlg:     meta.DigestAlg,
		DigestB64U:    base64.RawURLEncoding.EncodeToString(contentDigest),
		SigAlg:        meta.SigAlg,
		SignatureB64U: base64.RawURLEncoding.EncodeToString(sig),
	}

	return &bundle, nil
}

// CanonicalizeBundle returns the canonical JSON encoding of the bundle's sealed content.
func CanonicalizeBundle(bundle Bundle) ([]byte, error) {
	obj := map[string]interface{}{
		"hdr":     bundle.Hdr,
		"payload": bundle.Payload,
		"meta":    bundle.Meta,
		"refs":    bundle.Refs,
	}
	return toCanonicalBytes(obj)
}

// CanonicalizeFullBundle returns the canonical JSON encoding of the full bundle including seal.
func CanonicalizeFullBundle(bundle Bundle) ([]byte, error) {
	obj := map[string]interface{}{
		"hdr":     bundle.Hdr,
		"payload": bundle.Payload,
		"meta":    bundle.Meta,
		"refs":    bundle.Refs,
		"seal":    bundle.Seal,
	}
	return toCanonicalBytes(obj)
}

func profileFromMeta(meta Meta) string {
	// Default to PB-BOUNDARY-1 if not specified
	return "PB-BOUNDARY-1"
}
