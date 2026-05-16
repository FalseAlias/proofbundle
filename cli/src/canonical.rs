//! PB-CANON-JSON-1: Canonical JSON encoding for ProofBundle.
//!
//! Produces byte-identical output to the reference TypeScript implementation:
//! - Restricted JSON subset: null, bool, integers only, strings, arrays, objects
//! - No whitespace, sorted keys, no duplicate keys
//! - Integer range: [-(2^53-1), 2^53-1]

use serde_json::Value;
use std::io::Write;

const MAX_SAFE_INTEGER: i64 = 9007199254740991; // 2^53 - 1
const MIN_SAFE_INTEGER: i64 = -9007199254740991; // -(2^53 - 1)

#[derive(Debug, Clone, PartialEq, thiserror::Error)]
pub enum CanonicalError {
    #[error("Unsupported JSON type: {0}")]
    UnsupportedType(String),
    #[error("Integer out of safe range: {0}")]
    IntegerOutOfRange(i64),
    #[error("Float values are not allowed in canonical JSON")]
    FloatNotAllowed,
    #[error("IO error: {0}")]
    Io(String),
}

/// Encode a serde_json::Value into canonical JSON bytes.
pub fn encode_canonical(value: &Value) -> Result<Vec<u8>, CanonicalError> {
    let mut buf = Vec::new();
    write_value(&mut buf, value)?;
    Ok(buf)
}

/// Encode a serde_json::Value into canonical JSON string.
pub fn encode_canonical_string(value: &Value) -> Result<String, CanonicalError> {
    let bytes = encode_canonical(value)?;
    String::from_utf8(bytes).map_err(|e| CanonicalError::Io(e.to_string()))
}

fn write_value<W: Write>(w: &mut W, value: &Value) -> Result<(), CanonicalError> {
    match value {
        Value::Null => write!(w, "null").map_err(|e| CanonicalError::Io(e.to_string())),
        Value::Bool(b) => write!(w, "{b}").map_err(|e| CanonicalError::Io(e.to_string())),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                if i < MIN_SAFE_INTEGER || i > MAX_SAFE_INTEGER {
                    return Err(CanonicalError::IntegerOutOfRange(i));
                }
                write!(w, "{i}").map_err(|e| CanonicalError::Io(e.to_string()))
            } else {
                Err(CanonicalError::FloatNotAllowed)
            }
        }
        Value::String(s) => write_string(w, s),
        Value::Array(arr) => {
            w.write_all(b"[").map_err(|e| CanonicalError::Io(e.to_string()))?;
            for (i, item) in arr.iter().enumerate() {
                if i > 0 {
                    w.write_all(b",").map_err(|e| CanonicalError::Io(e.to_string()))?;
                }
                write_value(w, item)?;
            }
            w.write_all(b"]").map_err(|e| CanonicalError::Io(e.to_string()))
        }
        Value::Object(map) => {
            w.write_all(b"{").map_err(|e| CanonicalError::Io(e.to_string()))?;
            // Sort keys lexicographically
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            for (i, key) in keys.iter().enumerate() {
                if i > 0 {
                    w.write_all(b",").map_err(|e| CanonicalError::Io(e.to_string()))?;
                }
                write_string(w, key)?;
                w.write_all(b":").map_err(|e| CanonicalError::Io(e.to_string()))?;
                write_value(w, &map[*key])?;
            }
            w.write_all(b"}").map_err(|e| CanonicalError::Io(e.to_string()))
        }
    }
}

fn write_string<W: Write>(w: &mut W, s: &str) -> Result<(), CanonicalError> {
    w.write_all(b"\"").map_err(|e| CanonicalError::Io(e.to_string()))?;
    for ch in s.chars() {
        match ch {
            '"' => w.write_all(b"\\\""),
            '\\' => w.write_all(b"\\\\"),
            '\x08' => w.write_all(b"\\b"),
            '\x0C' => w.write_all(b"\\f"),
            '\n' => w.write_all(b"\\n"),
            '\r' => w.write_all(b"\\r"),
            '\t' => w.write_all(b"\\t"),
            c if c < '\u{0020}' => {
                write!(w, "\\u{:04x}", c as u32)
            }
            c => {
                let mut buf = [0u8; 4];
                let bytes = c.encode_utf8(&mut buf);
                w.write_all(bytes.as_bytes())
            }
        }
        .map_err(|e| CanonicalError::Io(e.to_string()))?;
    }
    w.write_all(b"\"").map_err(|e| CanonicalError::Io(e.to_string()))
}

/// Compute PB-CANON-JSON-1 digest: canonical encode then hash.
pub fn canonical_digest(value: &Value, alg: &str) -> Result<Vec<u8>, CanonicalError> {
    let canonical = encode_canonical(value)?;
    match alg {
        "sha256" => {
            use sha2::{Digest, Sha256};
            Ok(Sha256::digest(&canonical).to_vec())
        }
        "sha384" => {
            use sha2::{Digest, Sha384};
            Ok(Sha384::digest(&canonical).to_vec())
        }
        "sha512" => {
            use sha2::{Digest, Sha512};
            Ok(Sha512::digest(&canonical).to_vec())
        }
        "blake3" => Ok(blake3::hash(&canonical).as_bytes().to_vec()),
        "blake2b512" => {
            use blake2::Digest;
            let mut hasher = blake2::Blake2b512::new();
            hasher.update(&canonical);
            Ok(hasher.finalize().to_vec())
        }
        _ => Err(CanonicalError::UnsupportedType(format!(
            "digest algorithm: {alg}"
        ))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_values() {
        assert_eq!(encode_canonical_string(&Value::Null).unwrap(), "null");
        assert_eq!(
            encode_canonical_string(&Value::Bool(true)).unwrap(),
            "true"
        );
        assert_eq!(
            encode_canonical_string(&Value::Bool(false)).unwrap(),
            "false"
        );
    }

    #[test]
    fn test_integer() {
        assert_eq!(
            encode_canonical_string(&Value::from(42)).unwrap(),
            "42"
        );
        assert_eq!(
            encode_canonical_string(&Value::from(-17)).unwrap(),
            "-17"
        );
    }

    #[test]
    fn test_string_escaping() {
        let v = Value::String("hello\nworld".to_string());
        assert_eq!(encode_canonical_string(&v).unwrap(), "\"hello\\nworld\"");
    }

    #[test]
    fn test_sorted_keys() {
        let v: Value = serde_json::from_str(r#"{"z":1,"a":2,"m":3}"#).unwrap();
        assert_eq!(
            encode_canonical_string(&v).unwrap(),
            r#"{"a":2,"m":3,"z":1}"#
        );
    }

    #[test]
    fn test_nested_object() {
        let v: Value =
            serde_json::from_str(r#"{"outer":{"z":1,"a":2},"list":[3,1,2]}"#).unwrap();
        assert_eq!(
            encode_canonical_string(&v).unwrap(),
            r#"{"list":[3,1,2],"outer":{"a":2,"z":1}}"#
        );
    }

    #[test]
    fn test_float_rejected() {
        let v = serde_json::from_str("3.14").unwrap();
        assert!(encode_canonical(&v).is_err());
    }

    #[test]
    fn test_large_integer_rejected() {
        let v = Value::from(9007199254740992i64); // 2^53
        assert!(encode_canonical(&v).is_err());
    }
}
