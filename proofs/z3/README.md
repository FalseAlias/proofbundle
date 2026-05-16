# Z3 Formal-Methods Scaffold

Standing: `scaffold_only`

This directory contains one SMT-LIB guard for the suppression-vs-continuation arithmetic defect. It is not a complete proof archive and does not support release-green or proof-closure standing.

`suppression_continuation_guard.smt2` implements the guard:

- counterexample search for the false universal direction;
- one pinned counterexample, `k = 3` and `W = 1/4`;
- a threshold-qualified direction, `k >= 2` and `W > 1/k` imply `k * W > 1`;
- a boundary check showing `W = 1/k` is equality, not strict exceedance.

Expected solver answers are recorded in comments in the SMT-LIB file. If Z3 is unavailable, this directory remains a scaffold with no proof closure.
