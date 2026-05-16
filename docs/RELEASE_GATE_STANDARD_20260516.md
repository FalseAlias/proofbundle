# Release Gate Standard

Lane: `v1.0.0-alpha.1_conformance-manifest-sync`

Standing rule: truthful standing outranks looking complete.

This repository is being repaired, completed, audited, and packaged as an existing ProofBundle repository. This is not a redesign, brainstorm, marketing rewrite, architecture rewrite, semantic rewrite, blocker-hiding pass, or proof-generation pass unless proof sources already exist.

## Operating Rule

Every feature ends in exactly one state:

1. implemented, tested, documented, and included in the current lane;
2. present only as skeleton/example and clearly marked non-operative;
3. removed from current-lane claims.

No fourth state is allowed.

New items are classified as exactly one of:

- existing gate defect
- v1.1 item
- extension-pack item
- proof-augmented-release item
- inadmissible

No fourth class is allowed.

Closure phrase:

`Closed for this lane. Open to governed evolution.`

## Non-Negotiable Standing Boundaries

- Do not claim release-green.
- Do not claim proof-complete, proof-closed, axiom-free, or formal verification complete unless proof sources exist, build, and audit clean.
- Do not claim all implementations agree unless `conformance/cross_impl_results.json` proves it from actual runs.
- Do not claim EU AI Act compliance; only evidence-carrier mapping is allowed.
- Do not claim ProofBundle is a truth oracle, identity provider, legal authority, blockchain, consciousness proof, human-standing test, or substitute for evidence.
- Do not let transcript, chat-history, metaphysical, personal, or adjacent consciousness material contaminate public primitive standing.

## Current Lane Acceptance Gates

The lane is not closed until the repository truthfully accounts for these gates:

1. Artifact naming uses date/object/version/standing only.
2. `status.json` exists and is the single standing source.
3. Browser HTML is nonzero and contains all 12 declared algorithms.
4. Browser HTML standing block matches `status.json`.
5. `STATUS.md` matches `status.json`.
6. `README.md` standing matches `status.json`.
7. Manifest metadata matches `status.json`.
8. `conformance/vectors_v1.json` has exactly 300 valid entries.
9. Vector quality audit exists.
10. Coverage matrix exists.
11. Verifier trace schema exists.
12. Boundary predicate audit exists.
13. Temporal determinism audit exists.
14. Canonicalization audit exists.
15. Crypto vector audit exists.
16. Key/signature encoding rules are documented.
17. Resource determinism is documented.
18. Lineage hardening is documented and vectored or blocker-labeled.
19. Context commitment decision is documented and vectored or blocker-labeled.
20. Malformed input coverage is documented and vectored or blocker-labeled.
21. Profile nesting is documented and vectored or blocker-labeled.
22. Available implementations run against vectors or are explicitly unavailable.
23. `conformance/cross_impl_results.json` is populated from actual runs.
24. Python status is exact.
25. TypeScript status is exact.
26. Rust status is exact.
27. Go status is exact or unavailable with reason.
28. Proof standing is honest.
29. No proof closure is claimed without sources and builds.
30. Forbidden proof symbols are absent or quarantined.
31. False proof-standing inheritance is blocked.
32. Manifest scope is explicit.
33. Manifest hashes are recomputed after repairs.
34. Archive hygiene is enforced.
35. Release build script exists or absence is documented as a blocker.
36. `COMMANDS_RUN.md` exists.
37. `ENVIRONMENT.md` exists.
38. Schemas exist or missing schemas are blockers.
39. Dependency audit exists.
40. SBOM exists or unavailable status is recorded.
41. Signing/timestamping exists or unavailable status is recorded.
42. Version/evolution policy exists.
43. Regression policy exists.
44. Core/extension separation exists.
45. Falsifiable prediction lane decision is recorded.
46. Persistent state hashing lane decision is recorded.
47. EU AI Act standing is bounded.
48. Domain registry is reconciled.
49. Replay fixtures exist or are listed as blockers.
50. Failure examples exist or are listed as blockers.
51. `TERMS.md` exists.
52. `WHAT_THIS_IS_NOT.md` exists.
53. Key-management boundary exists.
54. Revocation/supersession docs/examples exist or are listed as blockers.
55. Trust-boundary diagrams exist or are listed as blockers.
56. API stability table exists.
57. Compatibility matrix exists.
58. Standing claim audit exists.
59. Reviewer handoff packets exist or are classified outside this lane.
60. Human-standing misuse firewall is handled if adjacent material travels with artifact.
61. Extraction/packaging ledger exists.
62. Transcript/evidence packet standing is recorded if supplied.
63. README is truthful and non-promotional.
64. SECURITY names actual limitations.
65. Release lanes are defined.
66. Final no-else lane-closure rule appears in `STATUS.md` if all gates pass.

If a gate fails, it is a blocker or downgrade reason.

## Current Execution Instruction

Do not optimize for looking complete. Optimize for impossible-to-catch-lying.

If asked what else after this standard, the answer is:

Nothing else for this lane. Classify it. If it repairs a listed gate, do it. If not, defer to v1.1, extension, proof-augmented release, or reject as inadmissible.
