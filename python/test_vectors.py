#!/usr/bin/env python3
"""
Conformance vector test runner for ProofBundle.
Loads all vectors from vectors_v1.json and runs verify_bundle on each.
"""

import json
from pathlib import Path
from collections import Counter

from proofbundle import verify_bundle

VECTORS_PATH = Path(__file__).parent.parent / "conformance" / "vectors_v1.json"


def main():
    with open(VECTORS_PATH, "r", encoding="utf-8") as f:
        vectors = json.load(f)

    total = len(vectors)
    passed = 0
    failed = 0
    failures = []
    outcome_counts = Counter()
    outcome_failures = Counter()

    print(f"Loaded {total} conformance vectors from {VECTORS_PATH}")
    print("=" * 70)

    for vector in vectors:
        vid = vector["id"]
        expected = vector["expected_outcome"]
        category = vector.get("category", expected)
        inp = vector["input"]

        try:
            result = verify_bundle(
                bundle=inp["bundle"],
                public_key_b64u=inp["public_key_b64u"],
                context=inp.get("context", {}),
                profile=inp["profile"],
                parent_bundles=inp.get("parent_bundles", []),
                max_bundle_bytes=inp.get("max_bundle_bytes", 1024 * 1024),
                max_lineage_depth=256,
            )
            actual = result["outcome"]
        except Exception as e:
            actual = f"exception: {type(e).__name__}: {e}"

        outcome_counts[expected] += 1

        if actual == expected:
            passed += 1
        else:
            failed += 1
            outcome_failures[expected] += 1
            failures.append({
                "id": vid,
                "category": category,
                "expected": expected,
                "actual": actual,
                "trace": result.get("trace", []) if isinstance(result, dict) else [],
            })

    # ---- Summary ----
    print(f"\n{'='*70}")
    print(f"RESULTS SUMMARY")
    print(f"{'='*70}")
    print(f"Total vectors:  {total}")
    print(f"Passed:         {passed}")
    print(f"Failed:         {failed}")
    print(f"Pass rate:      {passed/total*100:.1f}%")

    print(f"\n--- Breakdown by expected outcome ---")
    for outcome in sorted(outcome_counts.keys()):
        count = outcome_counts[outcome]
        fail_count = outcome_failures[outcome]
        ok = "ALL PASSED" if fail_count == 0 else f"{fail_count} FAILED"
        print(f"  {outcome:30s}  {count:3d} vectors  ({ok})")

    if failures:
        print(f"\n--- FAILURE DETAILS ---")
        for f in failures:
            print(f"\n  {f['id']} (category: {f['category']})")
            print(f"    Expected: {f['expected']}")
            print(f"    Actual:   {f['actual']}")
            trace = f.get("trace", [])
            for stage_info in trace:
                status = "PASS" if stage_info.get("passed") else "FAIL"
                detail = stage_info.get("detail", "")
                print(f"    [{status}] {stage_info['stage']}: {detail}")

    print(f"\n{'='*70}")
    print(f"FINAL: {passed}/{total} passed, {failed}/{total} failed")
    print(f"{'='*70}")

    return failed == 0


if __name__ == "__main__":
    ok = main()
    exit(0 if ok else 1)
