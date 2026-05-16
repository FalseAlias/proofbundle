//! Inspect command implementation - print bundle structure without verifying.

use proofbundle::read_input;
use serde_json::Value;

pub struct InspectArgs {
    pub bundle: Option<String>,
}

pub fn run(args: InspectArgs) -> Result<(), Box<dyn std::error::Error>> {
    let bundle_data = read_input(args.bundle.as_deref())?;
    let bundle: Value = serde_json::from_slice(&bundle_data)?;

    println!("=== ProofBundle Structure ===");
    print_value("", &bundle, 0);
    println!("=============================");

    // Print summary
    if let Some(obj) = bundle.as_object() {
        println!("\n--- Summary ---");
        println!("Top-level fields: {}", obj.keys().cloned().collect::<Vec<_>>().join(", "));

        if let Some(v) = obj.get("version").and_then(|v| v.as_str()) {
            println!("Version: {v}");
        }
        if let Some(p) = obj.get("profile").and_then(|v| v.as_str()) {
            println!("Profile: {p}");
        }
        if let Some(d) = obj.get("digest_algorithm").and_then(|v| v.as_str()) {
            println!("Digest algorithm: {d}");
        }
        if let Some(s) = obj.get("signature_algorithm").and_then(|v| v.as_str()) {
            println!("Signature algorithm: {s}");
        }
        if obj.contains_key("boundary") {
            println!("Boundary: present");
        } else {
            println!("Boundary: absent");
        }
        if let Some(parents) = obj.get("parents").and_then(|v| v.as_array()) {
            println!("Parents: {} reference(s)", parents.len());
        } else {
            println!("Parents: absent");
        }
        if let Some(side) = obj.get("side_attestations").and_then(|v| v.as_array()) {
            println!("Side attestations: {}", side.len());
        } else {
            println!("Side attestations: absent");
        }
        if let Some(exp) = obj.get("expiration").and_then(|v| v.as_str()) {
            println!("Expiration: {exp}");
        }
        if let Some(sig) = obj.get("signature").and_then(|v| v.as_str()) {
            println!("Signature: {} bytes (hex)", sig.len() / 2);
        }
    }

    Ok(())
}

fn print_value(name: &str, value: &Value, depth: usize) {
    let indent = "  ".repeat(depth);
    match value {
        Value::Null => println!("{indent}{name}: null"),
        Value::Bool(b) => println!("{indent}{name}: {b}"),
        Value::Number(n) => println!("{indent}{name}: {n}"),
        Value::String(s) => {
            let display = if s.len() > 80 {
                format!("{}...(truncated, {} bytes)", &s[..80], s.len())
            } else {
                s.clone()
            };
            println!("{indent}{name}: \"{display}\"")
        }
        Value::Array(arr) => {
            if name.is_empty() {
                println!("{indent}[array, {} items]", arr.len());
            } else {
                println!("{indent}{name}: [array, {} items]", arr.len());
            }
            for (i, item) in arr.iter().enumerate() {
                print_value(&format!("[{i}]"), item, depth + 1);
            }
        }
        Value::Object(map) => {
            if name.is_empty() {
                println!("{indent}{{object, {} fields}}", map.len());
            } else {
                println!("{indent}{name}: {{object, {} fields}}", map.len());
            }
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            for key in keys {
                print_value(key, &map[key], depth + 1);
            }
        }
    }
}
