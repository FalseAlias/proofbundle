# Domains

## Overview

A domain template defines a set of boundary predicates, identity
variables, and attestation requirements for a specific use case. Six
domain templates are registered at version 1.0.0.

Domain templates are advisory. The verifier does not check the domain
template name. Applications use domain templates to produce consistent
boundary predicates and metadata across bundles in the same domain.

## Domain: subject-identity

The subject-identity domain binds a claim to an identified subject.

### Boundary template

```json
{
  "all": [
    {"exists": ["subject_id"]},
    {"equals": ["subject_type", "..."]}
  ]
}
```

### Identity variables

| Variable     | Description                          |
|--------------|--------------------------------------|
| subject_id   | Unique identifier of the subject     |
| subject_type | Type of subject (person, device, org)|

### Usage

A bundle in this domain asserts a claim about a specific subject. The
verifier checks that the caller provides the subject's identifier and
that the subject type matches.

## Domain: issuer-authority

The issuer-authority domain binds a claim to an authorized issuer.

### Boundary template

```json
{
  "all": [
    {"exists": ["issuer_id"]},
    {"in": ["issuer_role", ["admin", "operator", "auditor"]]},
    {"gt": ["issuer_clearance_level", 0]}
  ]
}
```

### Identity variables

| Variable             | Description                          |
|----------------------|--------------------------------------|
| issuer_id            | Unique identifier of the issuer      |
| issuer_role          | Role of the issuer                   |
| issuer_clearance_level| Numeric clearance level             |

### Usage

A bundle in this domain asserts that the issuer has the required role
and clearance. The verifier checks the issuer's credentials against the
boundary predicate.

## Domain: artifact-provenance

The artifact-provenance domain binds a claim to a software or data
artifact.

### Boundary template

```json
{
  "all": [
    {"exists": ["artifact_id"]},
    {"exists": ["artifact_digest"]},
    {"in": ["artifact_kind", ["binary", "source", "data", "model"]]}
  ]
}
```

### Identity variables

| Variable        | Description                          |
|-----------------|--------------------------------------|
| artifact_id     | Unique identifier of the artifact    |
| artifact_digest | Digest of the artifact               |
| artifact_kind   | Kind of artifact                     |

### Usage

A bundle in this domain asserts a claim about an artifact's provenance.
The verifier checks that the caller provides the artifact identifier and
digest, and that the artifact kind is one of the permitted values.

## Domain: source-lineage

The source-lineage domain binds a claim to a source code revision or
distribution.

### Boundary template

```json
{
  "all": [
    {"exists": ["repository_url"]},
    {"exists": ["commit_hash"]},
    {"regex": ["commit_hash", "^[a-f0-9]{40}$"]}
  ]
}
```

### Identity variables

| Variable       | Description                          |
|----------------|--------------------------------------|
| repository_url | URL of the source repository         |
| commit_hash    | Git commit hash                      |
| branch         | Branch name (optional)               |
| tag            | Tag name (optional)                  |

### Usage

A bundle in this domain asserts a claim about a specific source code
revision. The verifier checks that the caller provides a valid commit
hash and repository URL.

## Domain: regulatory-classification

The regulatory-classification domain binds a claim to a regulatory
classification.

### Boundary template

```json
{
  "all": [
    {"exists": ["jurisdiction"]},
    {"in": ["classification", ["unclassified", "restricted", "confidential", "secret"]]},
    {"exists": ["regulation_id"]}
  ]
}
```

### Identity variables

| Variable       | Description                          |
|----------------|--------------------------------------|
| jurisdiction   | Legal jurisdiction code              |
| classification | Classification level                 |
| regulation_id  | Identifier of the applicable regulation|

### Usage

A bundle in this domain asserts a claim that is valid only within a
specific regulatory classification. The verifier checks that the caller
provides the jurisdiction and classification, and that the classification
is one of the permitted values.

## Domain: incident-response

The incident-response domain binds a claim to an incident context.

### Boundary template

```json
{
  "all": [
    {"exists": ["incident_id"]},
    {"in": ["severity", ["low", "medium", "high", "critical"]]},
    {"exists": ["responder_id"]}
  ]
}
```

### Identity variables

| Variable     | Description                          |
|--------------|--------------------------------------|
| incident_id  | Unique identifier of the incident    |
| severity     | Severity level                       |
| responder_id | Identifier of the responding entity  |
| triggered_at | ISO 8601 timestamp (optional)        |

### Usage

A bundle in this domain asserts a claim about an incident response. The
verifier checks that the caller provides the incident identifier,
severity level, and responder identity.

## Domain selection

An application selects a domain template by choosing the one whose
boundary template and identity variables match the application's context
model. The domain template name is recorded in the application's
documentation, not in the bundle itself.

Multiple domain templates may be composed by combining their boundary
predicates with the `all_of` atom.

## Domain template registry

New domain templates are registered through the plugin mechanism
(Section 19). Domain templates do not affect verifier behavior; they are
conventions for bundle producers.
