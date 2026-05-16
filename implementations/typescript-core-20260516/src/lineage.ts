import { Bundle } from "./types.js";

export function verifyLineage(
  bundle: Bundle,
  providedBundles: Record<string, Bundle>,
  maxDepth: number
): string {
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function walk(node: Bundle, depth: number): string {
    if (depth > maxDepth) return "resource-exhausted";
    const bid = node.hdr?.bundle_id;
    if (typeof bid !== "string") return "lineage-invalid";
    if (visiting.has(bid)) return "lineage-invalid";
    if (visited.has(bid)) return "verified";
    visiting.add(bid);
    for (const ref of node.refs ?? []) {
      const pid = ref.parent_id;
      const pdig = ref.parent_digest;
      const parent = providedBundles[pid];
      if (!parent || typeof parent !== "object") return "lineage-invalid";
      const actual = parent.seal?.digest_b64u;
      if (actual !== pdig) return "lineage-invalid";
      const outcome = walk(parent, depth + 1);
      if (outcome !== "verified") return outcome;
    }
    visiting.delete(bid);
    visited.add(bid);
    return "verified";
  }

  return walk(bundle, 0);
}
