
const { readFileSync } = require('fs');
const { join } = require('path');
const { verifyBundle } = require('./dist/src/index.js');

const vectorsPath = join('..', 'conformance', 'vectors_v1.json');
const vectors = JSON.parse(readFileSync(vectorsPath, 'utf-8'));

async function run() {
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const v of vectors) {
    const bundle = v.input.bundle;
    const config = {
      profile: v.input.profile,
      publicKey: v.input.public_key_b64u,
      context: v.input.context,
    };

    try {
      const result = await verifyBundle(bundle, config);
      if (result.outcome === v.expected_outcome) {
        passed++;
      } else {
        failed++;
        failures.push({
          id: v.id,
          category: v.category,
          expected: v.expected_outcome,
          got: result.outcome,
          trace: result.trace
        });
      }
    } catch (e) {
      failed++;
      failures.push({
        id: v.id,
        category: v.category,
        expected: v.expected_outcome,
        got: 'ERROR: ' + e.message,
        trace: []
      });
    }
  }

  console.log('Passed:', passed, 'Failed:', failed, 'Total:', vectors.length);

  if (failures.length > 0) {
    console.log('\nFirst 10 failures:');
    for (const f of failures.slice(0, 10)) {
      console.log(f.id + ' (' + f.category + '): expected=' + f.expected + ' got=' + f.got);
      if (f.trace && f.trace.length > 0) {
        console.log('  trace:', JSON.stringify(f.trace));
      }
    }
  }
}

run().catch(console.error);
