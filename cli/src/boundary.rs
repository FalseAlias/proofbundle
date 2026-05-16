//! Boundary atom evaluator for ProofBundle.
//!
//! Atoms: equals, in, range, present, before, after, within, expired,
//!        not_expired, age_lt, age_gt, within_last, within_next,
//!        all, any, not

use serde_json::Value;

#[derive(Debug, Clone, PartialEq, thiserror::Error)]
pub enum BoundaryError {
    #[error("Unknown atom type: {0}")]
    UnknownAtom(String),
    #[error("Invalid atom arguments: {0}")]
    InvalidArguments(String),
    #[error("Type mismatch in atom evaluation: {0}")]
    TypeMismatch(String),
}

/// Evaluate a boundary atom against a value context.
///
/// The `context` is the JSON value against which the boundary is evaluated.
/// The `atom` is the boundary specification JSON.
pub fn evaluate(context: &Value, atom: &Value) -> Result<bool, BoundaryError> {
    match atom {
        Value::Object(map) => {
            let atom_type = map
                .get("type")
                .and_then(|v| v.as_str())
                .ok_or_else(|| BoundaryError::InvalidArguments("atom missing 'type'".to_string()))?;
            evaluate_atom(context, atom_type, map)
        }
        _ => Err(BoundaryError::InvalidArguments(
            "atom must be an object".to_string(),
        )),
    }
}

fn evaluate_atom(
    context: &Value,
    atom_type: &str,
    args: &serde_json::Map<String, Value>,
) -> Result<bool, BoundaryError> {
    match atom_type {
        // Field atoms: operate on a specific field from context
        "equals" => eval_equals(context, args),
        "in" => eval_in(context, args),
        "range" => eval_range(context, args),
        "present" => eval_present(context, args),
        "before" => eval_before(context, args),
        "after" => eval_after(context, args),
        "within" => eval_within(context, args),
        "expired" => eval_expired(context, args),
        "not_expired" => eval_not_expired(context, args),
        "age_lt" => eval_age_lt(context, args),
        "age_gt" => eval_age_gt(context, args),
        "within_last" => eval_within_last(context, args),
        "within_next" => eval_within_next(context, args),

        // Logical atoms
        "all" => eval_all(context, args),
        "any" => eval_any(context, args),
        "not" => eval_not(context, args),

        other => Err(BoundaryError::UnknownAtom(other.to_string())),
    }
}

fn get_field<'a>(context: &'a Value, args: &serde_json::Map<String, Value>) -> Option<&'a Value> {
    args.get("field")
        .and_then(|f| f.as_str())
        .and_then(|field_name| context.get(field_name))
}

fn eval_equals(context: &Value, args: &serde_json::Map<String, Value>) -> Result<bool, BoundaryError> {
    let value = get_field(context, args).unwrap_or(&Value::Null);
    let expected = args
        .get("value")
        .ok_or_else(|| BoundaryError::InvalidArguments("equals: missing 'value'".to_string()))?;
    Ok(value == expected)
}

fn eval_in(context: &Value, args: &serde_json::Map<String, Value>) -> Result<bool, BoundaryError> {
    let value = get_field(context, args).unwrap_or(&Value::Null);
    let list = args
        .get("values")
        .and_then(|v| v.as_array())
        .ok_or_else(|| BoundaryError::InvalidArguments("in: missing 'values' array".to_string()))?;
    Ok(list.contains(value))
}

fn eval_range(
    context: &Value,
    args: &serde_json::Map<String, Value>,
) -> Result<bool, BoundaryError> {
    let value = get_field(context, args).unwrap_or(&Value::Null);
    let min = args.get("min");
    let max = args.get("max");
    if min.is_none() && max.is_none() {
        return Err(BoundaryError::InvalidArguments(
            "range: need at least 'min' or 'max'".to_string(),
        ));
    }
    let meets_min = match min {
        Some(min_v) => compare_values(value, min_v).map(|c| c >= 0)?,
        None => true,
    };
    let meets_max = match max {
        Some(max_v) => compare_values(value, max_v).map(|c| c <= 0)?,
        None => true,
    };
    Ok(meets_min && meets_max)
}

fn eval_present(
    context: &Value,
    args: &serde_json::Map<String, Value>,
) -> Result<bool, BoundaryError> {
    match args.get("field").and_then(|f| f.as_str()) {
        Some(field) => {
            let present = context.get(field).is_some();
            Ok(present)
        }
        None => Err(BoundaryError::InvalidArguments(
            "present: missing 'field'".to_string(),
        )),
    }
}

fn eval_before(
    context: &Value,
    args: &serde_json::Map<String, Value>,
) -> Result<bool, BoundaryError> {
    let value = get_field(context, args).unwrap_or(&Value::Null);
    let bound = args
        .get("value")
        .ok_or_else(|| BoundaryError::InvalidArguments("before: missing 'value'".to_string()))?;
    compare_values(value, bound)
        .map(|c| c < 0)
        .map_err(|_| BoundaryError::TypeMismatch("before: cannot compare".to_string()))
}

fn eval_after(
    context: &Value,
    args: &serde_json::Map<String, Value>,
) -> Result<bool, BoundaryError> {
    let value = get_field(context, args).unwrap_or(&Value::Null);
    let bound = args
        .get("value")
        .ok_or_else(|| BoundaryError::InvalidArguments("after: missing 'value'".to_string()))?;
    compare_values(value, bound)
        .map(|c| c > 0)
        .map_err(|_| BoundaryError::TypeMismatch("after: cannot compare".to_string()))
}

fn eval_within(
    context: &Value,
    args: &serde_json::Map<String, Value>,
) -> Result<bool, BoundaryError> {
    let value = get_field(context, args).unwrap_or(&Value::Null);
    let min = args
        .get("min")
        .ok_or_else(|| BoundaryError::InvalidArguments("within: missing 'min'".to_string()))?;
    let max = args
        .get("max")
        .ok_or_else(|| BoundaryError::InvalidArguments("within: missing 'max'".to_string()))?;
    let ge_min = compare_values(value, min).map(|c| c >= 0).unwrap_or(false);
    let le_max = compare_values(value, max).map(|c| c <= 0).unwrap_or(false);
    Ok(ge_min && le_max)
}

fn eval_expired(
    context: &Value,
    args: &serde_json::Map<String, Value>,
) -> Result<bool, BoundaryError> {
    let now = chrono::Utc::now();
    let field_val = get_field(context, args).unwrap_or(&Value::Null);
    match field_val.as_str() {
        Some(ts) => {
            let dt = chrono::DateTime::parse_from_rfc3339(ts)
                .map_err(|e| BoundaryError::InvalidArguments(format!("expired: {e}")))?;
            Ok(now > dt.with_timezone(&chrono::Utc))
        }
        None => Ok(false),
    }
}

fn eval_not_expired(
    context: &Value,
    args: &serde_json::Map<String, Value>,
) -> Result<bool, BoundaryError> {
    eval_expired(context, args).map(|r| !r)
}

fn eval_age_lt(
    context: &Value,
    args: &serde_json::Map<String, Value>,
) -> Result<bool, BoundaryError> {
    let now = chrono::Utc::now();
    let field_val = get_field(context, args).unwrap_or(&Value::Null);
    let max_seconds = args
        .get("seconds")
        .and_then(|v| v.as_i64())
        .ok_or_else(|| BoundaryError::InvalidArguments("age_lt: missing 'seconds'".to_string()))?;
    match field_val.as_str() {
        Some(ts) => {
            let dt = chrono::DateTime::parse_from_rfc3339(ts)
                .map_err(|e| BoundaryError::InvalidArguments(format!("age_lt: {e}")))?;
            let age = now.signed_duration_since(dt.with_timezone(&chrono::Utc));
            Ok(age.num_seconds() < max_seconds)
        }
        None => Ok(false),
    }
}

fn eval_age_gt(
    context: &Value,
    args: &serde_json::Map<String, Value>,
) -> Result<bool, BoundaryError> {
    let now = chrono::Utc::now();
    let field_val = get_field(context, args).unwrap_or(&Value::Null);
    let min_seconds = args
        .get("seconds")
        .and_then(|v| v.as_i64())
        .ok_or_else(|| BoundaryError::InvalidArguments("age_gt: missing 'seconds'".to_string()))?;
    match field_val.as_str() {
        Some(ts) => {
            let dt = chrono::DateTime::parse_from_rfc3339(ts)
                .map_err(|e| BoundaryError::InvalidArguments(format!("age_gt: {e}")))?;
            let age = now.signed_duration_since(dt.with_timezone(&chrono::Utc));
            Ok(age.num_seconds() > min_seconds)
        }
        None => Ok(false),
    }
}

fn eval_within_last(
    context: &Value,
    args: &serde_json::Map<String, Value>,
) -> Result<bool, BoundaryError> {
    let now = chrono::Utc::now();
    let field_val = get_field(context, args).unwrap_or(&Value::Null);
    let seconds = args
        .get("seconds")
        .and_then(|v| v.as_i64())
        .ok_or_else(|| {
            BoundaryError::InvalidArguments("within_last: missing 'seconds'".to_string())
        })?;
    match field_val.as_str() {
        Some(ts) => {
            let dt = chrono::DateTime::parse_from_rfc3339(ts)
                .map_err(|e| BoundaryError::InvalidArguments(format!("within_last: {e}")))?;
            let age = now.signed_duration_since(dt.with_timezone(&chrono::Utc));
            Ok(age.num_seconds() >= 0 && age.num_seconds() <= seconds)
        }
        None => Ok(false),
    }
}

fn eval_within_next(
    context: &Value,
    args: &serde_json::Map<String, Value>,
) -> Result<bool, BoundaryError> {
    let now = chrono::Utc::now();
    let field_val = get_field(context, args).unwrap_or(&Value::Null);
    let seconds = args
        .get("seconds")
        .and_then(|v| v.as_i64())
        .ok_or_else(|| {
            BoundaryError::InvalidArguments("within_next: missing 'seconds'".to_string())
        })?;
    match field_val.as_str() {
        Some(ts) => {
            let dt = chrono::DateTime::parse_from_rfc3339(ts)
                .map_err(|e| BoundaryError::InvalidArguments(format!("within_next: {e}")))?;
            let diff = dt.with_timezone(&chrono::Utc).signed_duration_since(now);
            Ok(diff.num_seconds() >= 0 && diff.num_seconds() <= seconds)
        }
        None => Ok(false),
    }
}

fn eval_all(context: &Value, args: &serde_json::Map<String, Value>) -> Result<bool, BoundaryError> {
    let conditions = args
        .get("conditions")
        .and_then(|v| v.as_array())
        .ok_or_else(|| BoundaryError::InvalidArguments("all: missing 'conditions'".to_string()))?;
    for cond in conditions {
        if !evaluate(context, cond)? {
            return Ok(false);
        }
    }
    Ok(true)
}

fn eval_any(context: &Value, args: &serde_json::Map<String, Value>) -> Result<bool, BoundaryError> {
    let conditions = args
        .get("conditions")
        .and_then(|v| v.as_array())
        .ok_or_else(|| BoundaryError::InvalidArguments("any: missing 'conditions'".to_string()))?;
    if conditions.is_empty() {
        return Ok(false);
    }
    for cond in conditions {
        if evaluate(context, cond)? {
            return Ok(true);
        }
    }
    Ok(false)
}

fn eval_not(context: &Value, args: &serde_json::Map<String, Value>) -> Result<bool, BoundaryError> {
    let condition = args
        .get("condition")
        .ok_or_else(|| BoundaryError::InvalidArguments("not: missing 'condition'".to_string()))?;
    evaluate(context, condition).map(|r| !r)
}

/// Compare two JSON values. Returns:
/// - Ok(-1) if a < b
/// - Ok(0) if a == b
/// - Ok(1) if a > b
fn compare_values(a: &Value, b: &Value) -> Result<i32, BoundaryError> {
    match (a, b) {
        (Value::Null, Value::Null) => Ok(0),
        (Value::Bool(a), Value::Bool(b)) => {
            if a == b {
                Ok(0)
            } else if *a {
                Ok(1)
            } else {
                Ok(-1)
            }
        }
        (Value::Number(a), Value::Number(b)) => {
            match (a.as_i64(), b.as_i64()) {
                (Some(ai), Some(bi)) => {
                    if ai < bi {
                        Ok(-1)
                    } else if ai > bi {
                        Ok(1)
                    } else {
                        Ok(0)
                    }
                }
                _ => Err(BoundaryError::TypeMismatch(
                    "compare: non-integer numbers".to_string(),
                )),
            }
        }
        (Value::String(a), Value::String(b)) => Ok(a.cmp(b) as i32),
        _ => Err(BoundaryError::TypeMismatch(
            "compare: incompatible types".to_string(),
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_equals() {
        let ctx = serde_json::json!({"role": "admin"});
        let atom = serde_json::json!({"type": "equals", "field": "role", "value": "admin"});
        assert!(evaluate(&ctx, &atom).unwrap());

        let atom2 = serde_json::json!({"type": "equals", "field": "role", "value": "user"});
        assert!(!evaluate(&ctx, &atom2).unwrap());
    }

    #[test]
    fn test_in() {
        let ctx = serde_json::json!({"role": "admin"});
        let atom = serde_json::json!({"type": "in", "field": "role", "values": ["admin", "user"]});
        assert!(evaluate(&ctx, &atom).unwrap());
    }

    #[test]
    fn test_range() {
        let ctx = serde_json::json!({"age": 25});
        let atom = serde_json::json!({"type": "range", "field": "age", "min": 18, "max": 65});
        assert!(evaluate(&ctx, &atom).unwrap());
    }

    #[test]
    fn test_present() {
        let ctx = serde_json::json!({"name": "test"});
        let atom = serde_json::json!({"type": "present", "field": "name"});
        assert!(evaluate(&ctx, &atom).unwrap());

        let atom2 = serde_json::json!({"type": "present", "field": "missing"});
        assert!(!evaluate(&ctx, &atom2).unwrap());
    }

    #[test]
    fn test_all() {
        let ctx = serde_json::json!({"role": "admin", "active": true});
        let atom = serde_json::json!({
            "type": "all",
            "conditions": [
                {"type": "equals", "field": "role", "value": "admin"},
                {"type": "equals", "field": "active", "value": true}
            ]
        });
        assert!(evaluate(&ctx, &atom).unwrap());
    }

    #[test]
    fn test_any() {
        let ctx = serde_json::json!({"role": "user"});
        let atom = serde_json::json!({
            "type": "any",
            "conditions": [
                {"type": "equals", "field": "role", "value": "admin"},
                {"type": "equals", "field": "role", "value": "user"}
            ]
        });
        assert!(evaluate(&ctx, &atom).unwrap());
    }

    #[test]
    fn test_not() {
        let ctx = serde_json::json!({"role": "user"});
        let atom = serde_json::json!({
            "type": "not",
            "condition": {"type": "equals", "field": "role", "value": "admin"}
        });
        assert!(evaluate(&ctx, &atom).unwrap());
    }
}
