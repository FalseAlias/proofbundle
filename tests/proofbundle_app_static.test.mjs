import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../web/proofbundle_v1_0_app.html', import.meta.url), 'utf8');

function scriptBlocks() {
  return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
}

test('browser app JavaScript parses', () => {
  const scripts = scriptBlocks();
  assert.equal(scripts.length, 1);
  for (const script of scripts) {
    new Function(script);
  }
});

test('standing block preserves blocked release truth', () => {
  assert.match(html, /releaseStanding:\s*'[^']*not release-green[^']*implementation blockers remain'/);
  assert.match(html, /releaseAllowed:\s*false/);
  assert.match(html, /releaseGreen:\s*false/);
  assert.match(html, /artifactVersion:\s*'v1\.0\.0-alpha\.1_conformance-manifest-sync'/);
  assert.match(html, /standing:\s*'conformance-manifest-sync-closed-blocked'/);
  assert.match(html, /closureName:\s*'v1\.0\.0-alpha\.1_conformance-manifest-sync'/);
  assert.match(html, /closurePhrase:\s*'Closed for this lane\. Open to governed evolution\.'/);
  assert.match(html, /closureStanding:\s*'Closed for this lane\. Open to governed evolution\. Not release-green; no formal proof closure; descriptive-not-persuasive framing required\.'/);
  assert.match(html, /transcript_manifest_sha256:\s*'1C490970FB474B11DAD4AAD155CADEBB043BDE568C88D863505CBEDE545CD659'/);
  assert.match(html, /TypeScript full conformance is 300\/300, verified/);
  assert.match(html, /Proof assistant guard scaffolds are narrow VM-checked guards only; no proof closure/);
});

test('runtime status text cannot report a false green', () => {
  const forbidden = [
    'blocked until 300 non-placeholder vectors pass',
    '300-vector gate ${passed}/${results.length} passed',
    'vectors passed</div>',
    'algorithm pairs passed</div>',
    'tests passed</div>',
    'source_zip_vectors_extracted',
    'skeleton_vectors_extracted',
    'skeleton_placeholder_inputs'
  ];
  for (const phrase of forbidden) {
    assert.equal(html.includes(phrase), false, `stale or false-green phrase remains: ${phrase}`);
  }
});

test('visible status surfaces carry release-blocked state', () => {
  assert.match(html, /v1\.0\.0-alpha\.1_conformance-manifest-sync blocked snapshot/);
  assert.match(html, /Closed for this lane\. Open to governed evolution\./);
  assert.match(html, /id="closure-summary"/);
  assert.match(html, /footer-status">PB-CANON-JSON-1 - ready - release blocked/);
  assert.match(html, /setFooterStatus\(`PB-CANON-JSON-1 - \$\{text\} - release blocked`\)/);
  assert.match(html, /synthetic 300-vector gate \$\{passed\}\/\$\{results\.length\}; release blocked/);
});
