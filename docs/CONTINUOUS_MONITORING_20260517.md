# Continuous Monitoring Plan

ProofBundle continuous monitoring is the scheduled verification layer for public-surface integrity, standing drift, manifest freshness, and external evidence validation.

Current standing:

```text
blocked_not_release_green
```

Current controlling public lane:

```text
1.0.0
```

## Scope

Continuous monitoring should check:

- public lane version remains `1.0.0`
- standing remains explicitly bounded unless changed by governed release process
- controlling docs do not reintroduce forbidden identity-surface leakage
- release boundary references the latest merged public-surface repair PR
- manifests are marked current or pending recompute honestly
- conformance outputs remain aligned with status files
- public entrypoints continue to exist
- audit companion remains labeled as smoke-audit, not proof closure

## GitHub Actions Layer

The repository should use CI guards to fail pull requests that violate the public boundary.

Minimum checks:

- README version and standing check
- RELEASE_BOUNDARY standing check
- required public file existence check
- identity-surface leakage check in controlling public docs
- historical-version-drift separation check

## Scheduled Monitoring Layer

A scheduled job should run at least daily after the repository stabilizes.

Recommended checks:

- public URL availability
- GitHub Pages entrypoint availability
- manifest digest recomputation
- changed-file inventory hash
- release boundary freshness against latest merged PR
- external witness status when witness tooling is actually integrated

## Climate Validation Pattern

Climate validation is an example of the same monitoring discipline applied to time-indexed external claims.

A climate validation packet should contain:

- claim identifier
- source URL or dataset reference
- retrieval timestamp in UTC
- raw retrieved artifact hash
- normalized observation hash
- validation rule
- result
- reviewer or automated job identifier
- prior result pointer if this is a repeated observation

## Non-Claims

Continuous monitoring does not prove truth by itself.

A passing scheduled check does not establish formal proof closure.

A timestamp does not establish factual correctness.

A public URL remaining live does not establish release-green standing.

Monitoring establishes drift detection, custody continuity, and repeatable observation discipline.
