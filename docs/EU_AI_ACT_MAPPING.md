# EU AI Act Mapping

## Overview

This document maps articles of the EU AI Act (Regulation (EU) 2024/1689)
to ProofBundle claim classes, boundary templates, and evidence digest
sets. The mapping is advisory. Some mappings are provisional where the
AI Act text does not directly correspond to a bundle structure.

## Article 6: Risk classification

Article 6 defines the risk-based classification of AI systems
(high-risk, limited risk, minimal risk, unacceptable risk).

### Mapping

- **Claim class**: `regulatory-classification`
- **Boundary template**: Check `classification` field against permitted
  risk levels.
- **Evidence digest set**: Classification report, risk assessment
documentation, conformity assessment results.

### Bundle structure

```json
{
  "all": [
    {"in": ["risk_level", ["minimal", "limited", "high"]]},
    {"exists": ["conformity_assessment_id"]}
  ]
}
```

### Provisional notes

The mapping of "unacceptable risk" systems is provisional. The AI Act
prohibits such systems, so no bundle structure is defined for them.

## Articles 8–15: Obligations for high-risk AI systems

Articles 8–15 specify obligations for high-risk AI systems, including:

- Article 8: Risk management system
- Article 9: Data governance
- Article 10: Technical documentation
- Article 11: Record-keeping
- Article 12: Transparency
- Article 13: Human oversight
- Article 14: Accuracy, robustness, cybersecurity
- Article 15: Conformity assessment

### Mapping

- **Claim class**: `artifact-provenance`
- **Boundary template**: Check `artifact_kind` is `"model"`, verify
  documentation digests.
- **Evidence digest set**: Technical documentation, risk management
  plan, data governance plan, test results, human oversight protocol.

### Bundle structure

```json
{
  "all": [
    {"equals": ["artifact_kind", "model"]},
    {"exists": ["technical_documentation_digest"]},
    {"exists": ["risk_management_digest"]},
    {"exists": ["human_oversight_protocol_digest"]}
  ]
}
```

## Article 16: Obligations of providers

Article 16 specifies obligations for providers of AI systems.

### Mapping

- **Claim class**: `issuer-authority`
- **Boundary template**: Check `issuer_role` is `"provider"`, verify
  provider registration.
- **Evidence digest set**: Provider registration, quality management
  system documentation, post-market monitoring plan.

### Bundle structure

```json
{
  "all": [
    {"equals": ["issuer_role", "provider"]},
    {"exists": ["provider_registration_id"]},
    {"exists": ["quality_management_digest"]}
  ]
}
```

## Article 43: Conformity assessment

Article 43 describes the conformity assessment procedures for high-risk
AI systems.

### Mapping

- **Claim class**: `artifact-provenance`
- **Boundary template**: Check `conformity_status` is `"assessed"`,
  verify assessment body.
- **Evidence digest set**: Conformity assessment report, notified body
  certificate, test results.

### Bundle structure

```json
{
  "all": [
    {"equals": ["conformity_status", "assessed"]},
    {"exists": ["notified_body_id"]},
    {"exists": ["assessment_report_digest"]}
  ]
}
```

### Provisional notes

The mapping to "notified body" identifiers is provisional. The AI Act
does not specify a uniform identifier format for notified bodies.

## Article 53: GPAI model obligations

Article 53 specifies obligations for general-purpose AI (GPAI) models.

### Mapping

- **Claim class**: `artifact-provenance`
- **Boundary template**: Check `artifact_kind` is `"model"`, verify
  systemic risk classification.
- **Evidence digest set**: Model card, training data documentation,
  evaluation results, systemic risk assessment.

### Bundle structure

```json
{
  "all": [
    {"equals": ["artifact_kind", "model"]},
    {"exists": ["model_card_digest"]},
    {"exists": ["evaluation_results_digest"]},
    {"in": ["systemic_risk", ["none", "low", "high"]]}
  ]
}
```

## Article 72: Post-market monitoring

Article 72 requires providers to establish post-market monitoring
systems.

### Mapping

- **Claim class**: `incident-response`
- **Boundary template**: Check monitoring plan exists, verify periodic
  review.
- **Evidence digest set**: Post-market monitoring plan, monitoring
  reports, corrective action records.

### Bundle structure

```json
{
  "all": [
    {"exists": ["monitoring_plan_digest"]},
    {"exists": ["last_review_date"]},
    {"gt": ["days_since_review", 0]},
    {"lte": ["days_since_review", 365]}
  ]
}
```

## Article 73: Serious incident reporting

Article 73 requires providers to report serious incidents to market
surveillance authorities.

### Mapping

- **Claim class**: `incident-response`
- **Boundary template**: Check `severity` is `"high"` or `"critical"`,
  verify reporting timeline.
- **Evidence digest set**: Incident report, root cause analysis,
  corrective measures, authority notification.

### Bundle structure

```json
{
  "all": [
    {"in": ["severity", ["high", "critical"]]},
    {"exists": ["incident_report_digest"]},
    {"exists": ["authority_notification_id"]},
    {"gt": ["hours_since_incident", 0]}
  ]
}
```

## Article 74: Market surveillance

Article 74 describes the market surveillance powers and procedures.

### Mapping

- **Claim class**: `regulatory-classification`
- **Boundary template**: Check surveillance status, verify authority
  identifiers.
- **Evidence digest set**: Surveillance report, enforcement decision,
  corrective action order.

### Bundle structure

```json
{
  "all": [
    {"exists": ["surveillance_authority_id"]},
    {"in": ["enforcement_status", ["monitoring", "investigating", "resolved"]]},
    {"exists": ["surveillance_report_digest"]}
  ]
}
```

### Provisional notes

The mapping of enforcement status values is provisional. The AI Act
does not define a standardized vocabulary for enforcement statuses.

## Cross-cutting requirements

Several AI Act requirements apply across multiple articles. The
following boundary atoms are common:

- `{"exists": ["jurisdiction"]}` with value `"EU"`
- `{"exists": ["applicable_regulation_id"]}` with value `"EU-AI-ACT-2024"`
- `{"gte": ["compliance_date", "2024-08-01"]}`

## Summary table

| Article | Topic                  | Claim class            | Status        |
|---------|------------------------|------------------------|---------------|
| 6       | Risk classification    | regulatory-classification | Stable     |
| 8–15    | High-risk obligations  | artifact-provenance    | Stable        |
| 16      | Provider obligations   | issuer-authority       | Stable        |
| 43      | Conformity assessment  | artifact-provenance    | Provisional   |
| 53      | GPAI model obligations | artifact-provenance    | Stable        |
| 72      | Post-market monitoring | incident-response      | Stable        |
| 73      | Serious incident       | incident-response      | Stable        |
| 74      | Market surveillance    | regulatory-classification | Provisional |

## Compliance note

This mapping is provided for technical integration purposes. It does not
constitute legal advice. Organizations subject to the EU AI Act should
consult legal counsel for compliance matters.
