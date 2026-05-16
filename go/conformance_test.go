package proofbundle

import (
	"encoding/json"
	"os"
	"testing"
)

type ConformanceVector struct {
	ID            string               `json:"id"`
	Category      string               `json:"category"`
	Description   string               `json:"description"`
	TrustLabel    string               `json:"trust_label"`
	Input         ConformanceInput     `json:"input"`
	ExpectedOutcome string             `json:"expected_outcome"`
}

type ConformanceInput struct {
	Bundle         json.RawMessage   `json:"bundle"`
	PublicKeyB64U  string            `json:"public_key_b64u"`
	Context        map[string]interface{} `json:"context"`
	ParentBundles  []json.RawMessage `json:"parent_bundles"`
	Profile        string            `json:"profile"`
	MaxBundleBytes int               `json:"max_bundle_bytes"`
	ReferenceTime  string            `json:"reference_time"`
}

func TestConformanceVectors(t *testing.T) {
	data, err := os.ReadFile("../conformance/vectors_v1.json")
	if err != nil {
		t.Fatalf("failed to read vectors file: %v", err)
	}

	var vectors []ConformanceVector
	if err := json.Unmarshal(data, &vectors); err != nil {
		t.Fatalf("failed to unmarshal vectors: %v", err)
	}

	// Track outcome coverage
	outcomeCounts := make(map[string]int)
	outcomeFailures := make(map[string][]string)

	for _, vec := range vectors {
		outcomeCounts[vec.ExpectedOutcome]++

		cfg := VerifyConfig{
			Profile:         vec.Input.Profile,
			PublicKeyB64U:   vec.Input.PublicKeyB64U,
			Context:         vec.Input.Context,
			MaxBundleBytes:  vec.Input.MaxBundleBytes,
			ReferenceTime:   vec.Input.ReferenceTime,
			MaxLineageDepth: 100,
		}

		// Parse parent bundles
		for _, pbRaw := range vec.Input.ParentBundles {
			var pb Bundle
			if err := json.Unmarshal(pbRaw, &pb); err == nil {
				cfg.ParentBundles = append(cfg.ParentBundles, pb)
			}
		}

		outcome, trace := VerifyBundle(vec.Input.Bundle, cfg)

		if outcome != vec.ExpectedOutcome {
			key := vec.ID + ": " + vec.Description
			outcomeFailures[vec.ExpectedOutcome] = append(outcomeFailures[vec.ExpectedOutcome],
				key+": expected "+vec.ExpectedOutcome+", got "+outcome)
			if len(trace) > 0 {
				lastTrace := trace[len(trace)-1]
				t.Logf("FAIL %s: expected=%s got=%s last_stage=%s detail=%s",
					vec.ID, vec.ExpectedOutcome, outcome, lastTrace.Stage, lastTrace.Detail)
			} else {
				t.Logf("FAIL %s: expected=%s got=%s (no trace)",
					vec.ID, vec.ExpectedOutcome, outcome)
			}
		}
	}

	// Report statistics
	t.Logf("Total vectors: %d", len(vectors))
	for outcome, count := range outcomeCounts {
		failures := len(outcomeFailures[outcome])
		t.Logf("  %s: %d total, %d failures", outcome, count, failures)
	}

	// Report failures
	totalFailures := 0
	for _, failures := range outcomeFailures {
		totalFailures += len(failures)
	}

	if totalFailures > 0 {
		for outcome, failures := range outcomeFailures {
			if len(failures) > 0 {
				t.Logf("Failures for outcome '%s':", outcome)
				for _, f := range failures[:min(len(failures), 10)] {
					t.Logf("  - %s", f)
				}
			}
		}
		t.Fatalf("%d of %d vectors failed", totalFailures, len(vectors))
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
