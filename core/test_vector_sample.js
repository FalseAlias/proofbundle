/**
 * Sample conformance vector test — first 20 vectors only.
 */

import { verifyBundle } from './dist/src/verify.js';
import { readFileSync } from 'fs';

const vectorsPath = '../conformance/vectors_v1.json';
const vectors = JSON.parse(readFileSync(vectorsPath, 'utf-8'));

const sample = vectors.slice(0, 20);

let passed = 0;
let failed = 0;
const failures = [];

for (const v of sample) {
  const input = v.input;
  const expected = v.expected_outcome;

  const config = {
    profile: input.profile,
    publicKey: input.public_key_b64u,
    context: input.context,
  };

  try {
    const result = await verifyBundle(input.bundle, config);
    const actual = result.outcome;
    const ok = actual === expected;

    if (ok) {
      passed++;
    } else {
      failed++;
      failures.push({
        id: v.id,
        category: v.category,
        description: v.description,
        expected,
        actual,
        trace: result.trace,
      });
    }
  } catch (err) {
    failed++;
    failures.push({
      id: v.id,
      category: v.category,
      description: v.description,
      expected,
      actual: `THROW: ${err.message || String(err)}`,
      trace: [],
    });
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed out of ${sample.length} ===\n`);

if (failures.length > 0) {
  console.log('--- Failures ---');
  for (const f of failures) {
    console.log(`\n${f.id} | ${f.category} | ${f.description}`);
    console.log(`  expected: ${f.expected}`);
    console.log(`  actual:   ${f.actual}`);
    if (f.trace && f.trace.length > 0) {
      const failedSteps = f.trace.filter(t => !t.passed);
      if (failedSteps.length > 0) {
        console.log(`  failed at: ${failedSteps.map(s => s.stage).join(' -> ')}`);
        for (const s of failedSteps) {
          console.log(`    [${s.stage}] outcome=${s.outcome} detail=${s.detail}`);
        }
      }
    }
  }
}

console.log(`\n=== SUMMARY: ${passed}/${sample.length} passed ===`);
