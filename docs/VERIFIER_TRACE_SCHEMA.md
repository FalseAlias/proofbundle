# Verifier Trace Schema

Lane: `v1.0.0-alpha.1_conformance-manifest-sync`

Closure phrase: `Closed for this lane. Open to governed evolution.`

The browser verifier reports a trace as an ordered list of stage names. The current adapter contract uses:

```json
[
  "parse",
  "schema",
  "version",
  "canonical",
  "integrity",
  "context-commitment",
  "boundary",
  "side-info",
  "lineage",
  "hitl"
]
```

This trace is a verifier receipt surface, not a formal proof closure. Passing runtime checks does not set `releaseAllowed` or `releaseGreen`.
