import { describe, it } from "node:test";
import assert from "node:assert";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { verifyBundle } from "../src/verify.js";
import { Bundle } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const vectorsPath = join(__dirname, "../../conformance/vectors.generated.json");
const data = JSON.parse(readFileSync(vectorsPath, "utf-8"));

interface ConformanceVector {
  id: string;
  expected_outcome: string;
  bundle: Bundle;
  context?: Record<string, unknown>;
  public_key_b64u?: string;
  provided_bundles?: Record<string, Bundle>;
  max_depth?: number;
}

const vectors = data.vectors as ConformanceVector[];

describe("ProofBundle conformance vectors", () => {
  for (const v of vectors) {
    it(v.id, () => {
      const result = verifyBundle(v.bundle, v.public_key_b64u ?? null, {
        context: v.context ?? {},
        providedBundles: v.provided_bundles ?? {},
        maxDepth: v.max_depth ?? 16,
      });
      assert.strictEqual(
        result.outcome,
        v.expected_outcome,
        `Vector ${v.id} (${v.expected_outcome}) failed: ${JSON.stringify(result.trace)}`
      );
    });
  }
});
