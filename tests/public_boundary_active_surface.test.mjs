import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "..");
const supersessionPath = path.join(repoRoot, "PUBLIC_BOUNDARY_SUPERSESSION_20260517.json");

const joined = (...parts) => parts.join("");
const bannedTerms = [
  joined("suppression", "_exceeds_", "continuity"),
  joined("supression", "_exceeds_", "continuity"),
  joined("VOID", "_CLASS", "_REDACTED"),
  joined("false", "_theorem"),
  joined("false", " theorem"),
  joined("quaran", "tine evidence"),
  joined("proof quaran", "tine note"),
  joined("conscious", "ness"),
  joined("criterion", "_improvements"),
  joined("trans", "cript"),
  joined("dia", "logue"),
  joined("K", "imi"),
  joined("Chat", "GPT"),
  joined("Clau", "de"),
  joined("formal", " proof"),
  joined("proof", " closure"),
  joined("agent", "-session"),
  joined("agent", " session")
];

test("active public surface is custody-safe", async () => {
  const supersession = JSON.parse(await readFile(supersessionPath, "utf8"));
  assert.equal(supersession.standing, "append_only_public_boundary_supersession");
  assert.ok(Array.isArray(supersession.active_public_surface));
  assert.ok(supersession.active_public_surface.length >= 1);

  for (const relativePath of supersession.active_public_surface) {
    assert.equal(path.isAbsolute(relativePath), false, `${relativePath} must be repo-relative`);
    assert.equal(relativePath.includes(".."), false, `${relativePath} must not traverse upward`);

    const absolutePath = path.join(repoRoot, relativePath);
    const text = await readFile(absolutePath, "utf8");
    const lower = text.toLowerCase();

    for (const term of bannedTerms) {
      assert.equal(
        lower.includes(term.toLowerCase()),
        false,
        `${relativePath} contains excluded public-boundary term`
      );
    }
  }
});
