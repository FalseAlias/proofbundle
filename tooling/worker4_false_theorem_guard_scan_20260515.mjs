#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || process.cwd());

const exactTerms = [
  {
    term: 'suppression_exceeds_continuity',
    standing: 'forbidden_false_direction'
  },
  {
    term: 'supression_exceeds_continuity',
    standing: 'forbidden_misspelled_false_direction'
  },
  {
    term: 'continuity_exceeds_suppression',
    standing: 'reversed_direction_watch'
  }
];

const skipDirs = new Set(['.git']);
const skipFiles = new Set(['false_theorem_scan_latest.json']);
const proofExtensions = new Set(['.v', '.lean', '.smt2', '.thy', '.agda', '.ml', '.p']);
const theoremLikePattern =
  /\b(Theorem|Lemma|Corollary|Proposition|Axiom|Definition|Conjecture|Claim|theorem|lemma|axiom|def|conjecture|claim)\b/;
const familyPattern = /(suppression|supression|continuity|continuation)/i;
const quarantineOrReportPattern =
  /\b(absent|not found|guard|quarantine|scan|forbidden-symbol|false-theorem|does not assert|not introduced|not present|not an operative proof claim|qualified|reversed|counterexample|no universal|does not prove|blocked|report|standing)\b/i;

function toRepoPath(filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function listFiles(dirPath, out = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (entry.isDirectory() && skipDirs.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      listFiles(fullPath, out);
    } else if (entry.isFile()) {
      out.push(fullPath);
    }
  }
  return out;
}

function readTextIfText(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.includes(0)) {
    return null;
  }
  return buffer.toString('utf8');
}

function contextFor(lines, index, radius = 3) {
  const start = Math.max(0, index - radius);
  const end = Math.min(lines.length, index + radius + 1);
  return lines.slice(start, end).map((text, offset) => ({
    line: start + offset + 1,
    text
  }));
}

function classifyExactHit(hit) {
  const contextText = hit.context.map((line) => line.text).join('\n');
  const proofSource = proofExtensions.has(path.extname(hit.file).toLowerCase());
  const theoremLike = theoremLikePattern.test(contextText);
  const guardOrScanner =
    hit.file === 'proofs/FALSE_THEOREM_GUARD.md' ||
    hit.file === 'proofs/manifest.json' ||
    hit.file.endsWith('false_theorem_scan_latest.json') ||
    hit.file === 'tooling/worker4_false_theorem_guard_scan_20260515.mjs';
  const quarantineOrReport = quarantineOrReportPattern.test(contextText);

  if (guardOrScanner) {
    return 'quarantine_or_report_reference';
  }

  if (
    (hit.term === 'suppression_exceeds_continuity' ||
      hit.term === 'supression_exceeds_continuity') &&
    (proofSource || theoremLike) &&
    !quarantineOrReport
  ) {
    return 'forbidden_operational_theorem';
  }

  if (
    hit.term === 'continuity_exceeds_suppression' &&
    (proofSource || theoremLike) &&
    !quarantineOrReport
  ) {
    return 'review_required_reversal_theorem';
  }

  if (quarantineOrReport) {
    return 'quarantine_or_report_reference';
  }

  return 'plain_reference';
}

function countByClassification(hits) {
  const counts = {};
  for (const hit of hits) {
    counts[hit.classification] = (counts[hit.classification] || 0) + 1;
  }
  return counts;
}

const files = listFiles(root);
const skippedBinaryFiles = [];
const exactHits = [];
const theoremFamilyText = [];

for (const filePath of files) {
  const repoPath = toRepoPath(filePath);
  if (skipFiles.has(path.basename(repoPath))) {
    continue;
  }
  const text = readTextIfText(filePath);
  if (text === null) {
    skippedBinaryFiles.push(repoPath);
    continue;
  }

  const lines = text.split(/\r?\n/);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    for (const { term, standing } of exactTerms) {
      if (line.includes(term)) {
        const hit = {
          file: repoPath,
          line: i + 1,
          term,
          standing,
          text: line,
          context: contextFor(lines, i)
        };
        hit.classification = classifyExactHit(hit);
        exactHits.push(hit);
      }
    }

    if (theoremLikePattern.test(line)) {
      const context = contextFor(lines, i);
      const contextText = context.map((entry) => entry.text).join('\n');
      if (familyPattern.test(contextText)) {
        theoremFamilyText.push({
          file: repoPath,
          line: i + 1,
          text: line,
          proofSource: proofExtensions.has(path.extname(filePath).toLowerCase()),
          context
        });
      }
    }
  }
}

const exactTermSummary = {};
for (const { term, standing } of exactTerms) {
  const hits = exactHits.filter((hit) => hit.term === term);
  exactTermSummary[term] = {
    standing,
    total: hits.length,
    classifications: countByClassification(hits),
    hits
  };
}

const forbiddenOperationalHits = exactHits.filter(
  (hit) => hit.classification === 'forbidden_operational_theorem'
);
const reviewRequiredReversalHits = exactHits.filter(
  (hit) => hit.classification === 'review_required_reversal_theorem'
);

const summary = {
  scanner: 'worker4_false_theorem_guard_scan_20260515',
  root,
  scannedAtUtc: new Date().toISOString(),
  scannedFiles: files.length,
  skippedBinaryFiles,
  exactTerms: exactTermSummary,
  theoremFamilyText,
  verdict: {
    forbiddenFalseTheoremAbsentFromOperativeProofSources:
      forbiddenOperationalHits.length === 0,
    reversedDirectionIncorrectUseFound: reviewRequiredReversalHits.length > 0,
    failed:
      forbiddenOperationalHits.length > 0 || reviewRequiredReversalHits.length > 0
  }
};

console.log(JSON.stringify(summary, null, 2));

if (summary.verdict.failed) {
  process.exitCode = 1;
}
