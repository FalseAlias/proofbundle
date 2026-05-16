package proofbundle

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
)

// SealedContentDigest computes the digest of the sealed content (hdr + payload + meta + refs)
// using the specified digest algorithm.
func SealedContentDigest(alg string, bundle Bundle) (string, error) {
	obj := map[string]interface{}{
		"hdr":     bundle.Hdr,
		"payload": bundle.Payload,
		"meta":    bundle.Meta,
		"refs":    bundle.Refs,
	}
	canon, err := toCanonicalBytes(obj)
	if err != nil {
		return "", fmt.Errorf("canonicalize sealed content: %w", err)
	}
	digest, err := ComputeDigest(alg, canon)
	if err != nil {
		return "", fmt.Errorf("compute digest: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(digest), nil
}

// VerifyLineage verifies parent references with cycle detection and depth budget.
func VerifyLineage(bundle Bundle, parentBundles []Bundle, maxDepth int) error {
	if maxDepth <= 0 {
		maxDepth = 100
	}

	if len(bundle.Refs) == 0 {
		return nil
	}

	// Build lookup by bundle_id
	bundleByID := make(map[string]Bundle)
	for _, pb := range parentBundles {
		bundleByID[pb.Hdr.BundleID] = pb
	}

	// Track visited to detect cycles
	visited := make(map[string]bool)

	for _, ref := range bundle.Refs {
		if err := verifyParentChain(ref, bundleByID, visited, 0, maxDepth); err != nil {
			return err
		}
	}

	return nil
}

func verifyParentChain(ref ParentRef, bundles map[string]Bundle, visited map[string]bool, depth, maxDepth int) error {
	if depth >= maxDepth {
		return fmt.Errorf("lineage depth exceeded maximum %d", maxDepth)
	}

	if visited[ref.ParentID] {
		return fmt.Errorf("lineage cycle detected at bundle %s", ref.ParentID)
	}

	parent, ok := bundles[ref.ParentID]
	if !ok {
		return fmt.Errorf("parent bundle not found: %s", ref.ParentID)
	}

	// Verify the parent digest matches
	alg := ref.DigestAlg
	if alg == "" {
		alg = parent.Meta.DigestAlg
	}
	if alg == "" {
		alg = parent.Seal.DigestAlg
	}

	digest, err := SealedContentDigest(alg, parent)
	if err != nil {
		return fmt.Errorf("compute parent digest: %w", err)
	}
	if digest != ref.ParentDigest {
		return fmt.Errorf("parent digest mismatch for %s: expected %s, got %s", ref.ParentID, ref.ParentDigest, digest)
	}

	visited[ref.ParentID] = true

	// Recursively verify parent's parents
	for _, parentRef := range parent.Refs {
		if err := verifyParentChain(parentRef, bundles, visited, depth+1, maxDepth); err != nil {
			return err
		}
	}

	return nil
}

// toCanonicalBytes serializes a Go value to canonical JSON bytes.
func toCanonicalBytes(v interface{}) ([]byte, error) {
	// First marshal to JSON then unmarshal to handle struct encoding
	b, err := json.Marshal(v)
	if err != nil {
		return nil, err
	}
	var raw interface{}
	dec := json.NewDecoder(bytes.NewReader(b))
	dec.UseNumber()
	if err := dec.Decode(&raw); err != nil {
		return nil, err
	}
	return CanonicalJSON(raw)
}
