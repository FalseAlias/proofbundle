#!/usr/bin/env python3
"""
ProofBundle Proof 10: Conformance Corpus Coverage Analysis
Verifies that the test corpus exercises every reachable state
in the verifier state machine.

C. T. Russell / FalseAlias, 2026-05-03

This is a meta-proof: it checks that the conformance corpus
is complete with respect to the outcome enum and profile set.
"""

import json
import hashlib
import sys
from datetime import datetime, timezone
from itertools import product

# ============================================================
# VERIFIER STATE MODEL
# ============================================================

OUTCOMES = [
    "verified",
    "malformed",
    "invalid-signature",
    "out-of-bounds",
    "unknown-version",
    "missing-side-info",
    "lineage-invalid",
    "resource-exhausted",
    "policy-denied",
    "indeterminate",
    "not-defined-in-version",
]

PROFILES = [
    "INTEGRITY",
    "BOUNDARY",
    "LINEAGE",
    "REGULATED",
]

DIGEST_ALGS = ["SHA-256", "SHA-384", "SHA-512", "BLAKE3", "BLAKE2b"]
SIG_ALGS = ["Ed25519", "ECDSA-P256", "ECDSA-P384", "ECDSA-P521",
            "RSA-PSS-2048", "RSA-PSS-3072", "RSA-PSS-4096"]

# Which outcomes are reachable from which profiles?
# All outcomes are reachable from all profiles except:
# - missing-side-info only from LINEAGE and REGULATED (sides are optional in lower profiles)
# - policy-denied only from REGULATED (HITL check)
# - lineage-invalid only from LINEAGE and REGULATED
REACHABLE = {}
for p in PROFILES:
    REACHABLE[p] = set(OUTCOMES)  # start with all
    if p in ("INTEGRITY", "BOUNDARY"):
        REACHABLE[p].discard("lineage-invalid")
        REACHABLE[p].discard("missing-side-info")
    if p != "REGULATED":
        REACHABLE[p].discard("policy-denied")


def generate_required_vectors():
    """Generate the set of (profile, outcome) pairs that must be covered."""
    required = set()
    for profile in PROFILES:
        for outcome in REACHABLE[profile]:
            required.add((profile, outcome))
    return required


def generate_algorithm_vectors():
    """Generate the set of (digest, sig) pairs that must be tested."""
    # Only compatible pairs
    digest_sizes = {"SHA-256": 32, "SHA-384": 48, "SHA-512": 64,
                    "BLAKE3": 32, "BLAKE2b": 64}
    sig_min = {"Ed25519": 0, "ECDSA-P256": 32, "ECDSA-P384": 48,
               "ECDSA-P521": 64, "RSA-PSS-2048": 0, "RSA-PSS-3072": 0,
               "RSA-PSS-4096": 0}
    pairs = set()
    for d, s in product(DIGEST_ALGS, SIG_ALGS):
        if digest_sizes[d] >= sig_min[s]:
            pairs.add((d, s))
    return pairs


def check_corpus_coverage(corpus_path=None):
    """
    Check that a conformance corpus covers all required vectors.
    If no corpus provided, generates the requirement set as output.
    """
    required_pairs = generate_required_vectors()
    required_algs = generate_algorithm_vectors()

    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    report = {
        "timestamp": ts,
        "required_profile_outcome_pairs": len(required_pairs),
        "required_algorithm_pairs": len(required_algs),
        "profiles": PROFILES,
        "outcomes": OUTCOMES,
        "digest_algs": DIGEST_ALGS,
        "sig_algs": SIG_ALGS,
    }

    # If corpus provided, check coverage
    if corpus_path:
        with open(corpus_path) as f:
            corpus = json.load(f)

        tests = corpus.get("tests", corpus.get("vectors", []))
        covered_pairs = set()
        covered_algs = set()

        for test in tests:
            profile = test.get("profile", "INTEGRITY")
            expected = test.get("expected_outcome", test.get("expected", ""))
            digest = test.get("digest_alg", "SHA-256")
            sig = test.get("sig_alg", "Ed25519")
            covered_pairs.add((profile, expected))
            covered_algs.add((digest, sig))

        missing_pairs = required_pairs - covered_pairs
        missing_algs = required_algs - covered_algs

        report["corpus_tests"] = len(tests)
        report["covered_profile_outcome_pairs"] = len(covered_pairs)
        report["covered_algorithm_pairs"] = len(covered_algs)
        report["missing_profile_outcome_pairs"] = sorted(list(missing_pairs))
        report["missing_algorithm_pairs"] = sorted(list(missing_algs))
        report["profile_outcome_coverage"] = len(covered_pairs) / len(required_pairs)
        report["algorithm_coverage"] = len(covered_algs) / len(required_algs)
        report["PASS"] = len(missing_pairs) == 0 and len(missing_algs) == 0
    else:
        # No corpus — output requirements
        report["required_profile_outcome_pairs_list"] = sorted(list(required_pairs))
        report["required_algorithm_pairs_list"] = sorted(list(required_algs))
        report["PASS"] = None  # no corpus to check
        report["note"] = "No corpus provided. Requirements generated."

    # Hash the report
    report_str = json.dumps(report, sort_keys=True)
    report["sha256"] = hashlib.sha256(report_str.encode()).hexdigest()

    return report


def generate_minimal_corpus():
    """
    Generate a minimal conformance corpus skeleton covering all
    required (profile, outcome) and (digest, sig) pairs.
    """
    required_pairs = sorted(generate_required_vectors())
    required_algs = sorted(generate_algorithm_vectors())

    vectors = []
    alg_iter = iter(required_algs)

    for i, (profile, outcome) in enumerate(required_pairs):
        # Cycle through algorithm pairs
        try:
            d, s = next(alg_iter)
        except StopIteration:
            alg_iter = iter(required_algs)
            d, s = next(alg_iter)

        vectors.append({
            "id": f"V{i+1:04d}",
            "profile": profile,
            "expected_outcome": outcome,
            "digest_alg": d,
            "sig_alg": s,
            "description": f"Test {profile}/{outcome} with {d}/{s}",
            "input": "PLACEHOLDER",
            "notes": "Skeleton vector — replace input with actual test data"
        })

    # Add remaining algorithm pairs not yet covered
    covered_algs = set((v["digest_alg"], v["sig_alg"]) for v in vectors)
    remaining_algs = set(required_algs) - covered_algs
    for j, (d, s) in enumerate(sorted(remaining_algs)):
        vectors.append({
            "id": f"A{j+1:04d}",
            "profile": "INTEGRITY",
            "expected_outcome": "verified",
            "digest_alg": d,
            "sig_alg": s,
            "description": f"Algorithm coverage: {d}/{s}",
            "input": "PLACEHOLDER",
            "notes": "Algorithm-coverage vector — replace input with actual test data"
        })

    corpus = {
        "spec_id": "PB-CANON-JSON-1",
        "spec_ver": "1.0.0",
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "vector_count": len(vectors),
        "vectors": vectors,
    }

    return corpus


if __name__ == "__main__":
    if len(sys.argv) > 1:
        report = check_corpus_coverage(sys.argv[1])
    else:
        report = check_corpus_coverage()

    print(json.dumps(report, indent=2))

    # Also generate minimal corpus skeleton
    corpus = generate_minimal_corpus()
    with open("2026-05-03_minimal_corpus_skeleton.json", "w") as f:
        json.dump(corpus, f, indent=2)

    print(f"\nMinimal corpus skeleton: {corpus['vector_count']} vectors")
    print(f"Written to 2026-05-03_minimal_corpus_skeleton.json")

    if report.get("PASS") is True:
        print("\nCOVERAGE CHECK: PASS")
        sys.exit(0)
    elif report.get("PASS") is False:
        print("\nCOVERAGE CHECK: FAIL")
        sys.exit(1)
    else:
        print("\nCOVERAGE CHECK: NO CORPUS PROVIDED")
        sys.exit(0)
