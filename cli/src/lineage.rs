//! Lineage resolution for ProofBundle.
//!
//! Resolves parent chains from leaf bundles, with cycle detection
//! and depth budget enforcement.

use serde_json::Value;
use std::collections::HashSet;

#[derive(Debug, Clone, PartialEq, thiserror::Error)]
pub enum LineageError {
    #[error("Cycle detected in lineage: {0}")]
    CycleDetected(String),
    #[error("Max depth exceeded: {0}")]
    MaxDepthExceeded(usize),
    #[error("Parent bundle not found: {0}")]
    ParentNotFound(String),
    #[error("Invalid parent reference: {0}")]
    InvalidReference(String),
}

/// A resolved lineage chain from leaf to root.
#[derive(Debug, Clone)]
pub struct LineageChain {
    /// Bundles from leaf (index 0) to root (last index).
    pub chain: Vec<Value>,
    /// Set of visited bundle IDs (for cycle detection).
    pub visited: HashSet<String>,
}

impl LineageChain {
    /// Create a new lineage chain starting from a leaf bundle.
    pub fn new(leaf: Value) -> Self {
        let mut visited = HashSet::new();
        if let Some(id) = leaf.get("id").and_then(|v| v.as_str()) {
            visited.insert(id.to_string());
        }
        LineageChain {
            chain: vec![leaf],
            visited,
        }
    }

    /// Get the length of the chain (number of bundles).
    pub fn len(&self) -> usize {
        self.chain.len()
    }

    pub fn is_empty(&self) -> bool {
        self.chain.is_empty()
    }

    /// Get the leaf bundle.
    pub fn leaf(&self) -> Option<&Value> {
        self.chain.first()
    }

    /// Get the root bundle.
    pub fn root(&self) -> Option<&Value> {
        self.chain.last()
    }
}

/// Resolve a lineage chain from a leaf bundle.
///
/// The `leaf` is the starting bundle JSON.
/// The `parent_resolver` is a function that given a parent reference
/// (bundle ID or file path), returns the parent bundle JSON.
/// `max_depth` limits the chain length.
pub fn resolve_lineage<F>(
    leaf: &Value,
    mut parent_resolver: F,
    max_depth: usize,
) -> Result<LineageChain, LineageError>
where
    F: FnMut(&str) -> Result<Value, LineageError>,
{
    let mut chain = LineageChain::new(leaf.clone());

    loop {
        if chain.len() >= max_depth {
            return Err(LineageError::MaxDepthExceeded(chain.len()));
        }

        let current = chain.chain.last().unwrap();
        let parents = match current.get("parents") {
            Some(Value::Array(arr)) => arr,
            Some(_) => {
                return Err(LineageError::InvalidReference(
                    "parents must be an array".to_string(),
                ));
            }
            None => break, // No parents = root
        };

        if parents.is_empty() {
            break; // Empty parents = root
        }

        // For simplicity, we trace the first parent path
        // (multi-parent DAG resolution would merge paths)
        let parent_ref = parents
            .first()
            .and_then(|p| p.as_str())
            .ok_or_else(|| {
                LineageError::InvalidReference("parent must be a string reference".to_string())
            })?;

        // Check for cycles
        if chain.visited.contains(parent_ref) {
            return Err(LineageError::CycleDetected(format!(
                "bundle {parent_ref} already in chain"
            )));
        }

        let parent_bundle = parent_resolver(parent_ref)?;

        if let Some(id) = parent_bundle.get("id").and_then(|v| v.as_str()) {
            if chain.visited.contains(id) {
                return Err(LineageError::CycleDetected(format!(
                    "bundle {id} already in chain"
                )));
            }
            chain.visited.insert(id.to_string());
        }

        chain.chain.push(parent_bundle);
    }

    Ok(chain)
}

/// Build a DOT graph representation of a lineage.
pub fn lineage_to_dot(chain: &LineageChain) -> String {
    let mut output = String::from("digraph lineage {\n");
    output.push_str("  rankdir=TB;\n");
    output.push_str("  node [shape=box];\n\n");

    for (i, bundle) in chain.chain.iter().enumerate() {
        let id = bundle
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");
        let label = format!("{} [{}]", id, i);
        output.push_str(&format!(
            "  \"{}\" [label=\"{}\"];\n",
            id,
            label.replace('"', "\\\"")
        ));
    }

    for i in 0..chain.chain.len().saturating_sub(1) {
        let child_id = chain.chain[i]
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");
        let parent_id = chain.chain[i + 1]
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");
        output.push_str(&format!("  \"{}\" -> \"{}\";\n", child_id, parent_id));
    }

    output.push_str("}\n");
    output
}

/// Format a lineage chain as text.
pub fn lineage_to_text(chain: &LineageChain) -> String {
    let mut lines = Vec::new();
    for (i, bundle) in chain.chain.iter().enumerate() {
        let indent = "  ".repeat(i);
        let id = bundle
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");
        let alg = bundle
            .get("signature_algorithm")
            .and_then(|v| v.as_str())
            .unwrap_or("?");
        lines.push(format!("{}[{}] {} (sig={})", indent, i, id, alg));
    }
    lines.join("\n")
}

/// Validate that a lineage chain is well-formed (no gaps, consistent parent references).
pub fn validate_lineage(chain: &LineageChain) -> Result<(), LineageError> {
    if chain.is_empty() {
        return Err(LineageError::InvalidReference("empty chain".to_string()));
    }

    for i in 0..chain.chain.len().saturating_sub(1) {
        let child = &chain.chain[i];
        let parent = &chain.chain[i + 1];

        let empty_parents = Vec::new();
        let child_parents = child
            .get("parents")
            .and_then(|v| v.as_array())
            .unwrap_or(&empty_parents);
        let parent_id = parent
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        if !child_parents.iter().any(|p| p.as_str() == Some(parent_id)) {
            return Err(LineageError::InvalidReference(format!(
                "bundle at depth {} does not reference parent {}",
                i, parent_id
            )));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_bundle(id: &str, parents: Vec<&str>) -> Value {
        serde_json::json!({
            "id": id,
            "version": "1.0.0",
            "parents": parents,
            "payload": "test"
        })
    }

    #[test]
    fn test_resolve_lineage() {
        let leaf = make_bundle("leaf", vec!["parent"]);
        let parent = make_bundle("parent", vec!["root"]);
        let root = make_bundle("root", Vec::new());

        let resolver = |ref_id: &str| match ref_id {
            "parent" => Ok(parent.clone()),
            "root" => Ok(root.clone()),
            other => Err(LineageError::ParentNotFound(other.to_string())),
        };

        let chain = resolve_lineage(&leaf, resolver, 10).unwrap();
        assert_eq!(chain.len(), 3);
        assert_eq!(chain.leaf().unwrap()["id"], "leaf");
        assert_eq!(chain.root().unwrap()["id"], "root");
    }

    #[test]
    fn test_cycle_detection() {
        let a = make_bundle("a", vec!["b"]);
        let b = make_bundle("b", vec!["a"]);

        let resolver = |ref_id: &str| match ref_id {
            "b" => Ok(b.clone()),
            other => Err(LineageError::ParentNotFound(other.to_string())),
        };

        let result = resolve_lineage(&a, resolver, 10);
        assert!(matches!(result, Err(LineageError::CycleDetected(_))));
    }

    #[test]
    fn test_max_depth() {
        let leaf = make_bundle("leaf", vec!["parent"]);

        let resolver = |_ref_id: &str| Ok(make_bundle("parent", vec!["root"]));

        let result = resolve_lineage(&leaf, resolver, 2);
        assert!(matches!(result, Err(LineageError::MaxDepthExceeded(_))));
    }

    #[test]
    fn test_dot_output() {
        let leaf = make_bundle("leaf", vec!["parent"]);
        let chain = LineageChain::new(leaf);
        let dot = lineage_to_dot(&chain);
        assert!(dot.contains("digraph lineage"));
        assert!(dot.contains("leaf"));
    }
}
