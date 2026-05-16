import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, 'manifest');
const logPath = path.join(outDir, 'repo_merkle_log.jsonl');
const latestManifestPath = path.join(outDir, 'LATEST_REPO_MERKLE_MANIFEST.json');
const latestRootPath = path.join(outDir, 'LATEST_REPO_MERKLE_ROOT.txt');

const excludedParts = new Set(['.git', 'node_modules', 'dist', 'target', '__pycache__', '.pytest_cache', '.mypy_cache']);
const excludedFiles = new Set(['proofbundle-7-commits.patch']);
const excludedManifestOutputs = [
  /^manifest\/LATEST_REPO_MERKLE_(MANIFEST|ROOT)\.(json|txt)$/,
  /^manifest\/repo_merkle_(manifest|root)_\d{8}T\d{6}Z\.(json|txt)$/,
  /^manifest\/repo_merkle_log\.jsonl$/,
];

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase();
}

function sha384Bytes(bytes) {
  return crypto.createHash('sha384').update(bytes).digest('hex').toUpperCase();
}

function sha512Bytes(bytes) {
  return crypto.createHash('sha512').update(bytes).digest('hex').toUpperCase();
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stable(value));
}

function shouldSkip(rel) {
  const parts = rel.split(/[\\/]+/);
  if (parts.some((part) => excludedParts.has(part))) return true;
  if (excludedManifestOutputs.some((pattern) => pattern.test(rel))) return true;
  return excludedFiles.has(parts.at(-1));
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(repoRoot, full).replaceAll(path.sep, '/');
    if (shouldSkip(rel)) continue;
    if (entry.isDirectory()) out.push(...walk(full));
    if (entry.isFile()) out.push(rel);
  }
  return out;
}

function merkleRoot(leaves) {
  if (leaves.length === 0) return null;
  let level = leaves.map((leaf) => leaf.leaf_sha256);
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? left;
      next.push(sha256Bytes(`${left}${right}`));
    }
    level = next;
  }
  return level[0];
}

const files = walk(repoRoot).sort();
const leaves = files.map((rel) => {
  const full = path.join(repoRoot, rel);
  const bytes = fs.readFileSync(full);
  const stat = fs.statSync(full);
  const fileSha256 = sha256Bytes(bytes);
  const leafPayload = {
    path: rel,
    bytes: bytes.length,
    sha256: fileSha256,
  };
  return {
    path: rel,
    bytes: bytes.length,
    sha256: fileSha256,
    sha384: sha384Bytes(bytes),
    sha512: sha512Bytes(bytes),
    mtime_utc: stat.mtime.toISOString(),
    leaf_sha256: sha256Bytes(stableJson(leafPayload)),
  };
});

fs.mkdirSync(outDir, { recursive: true });

const generatedAtUtc = new Date().toISOString();
const stamp = generatedAtUtc.replaceAll(':', '').replaceAll('-', '').replace(/\.\d+Z$/, 'Z');
const manifestPath = path.join(outDir, `repo_merkle_manifest_${stamp}.json`);
const rootPath = path.join(outDir, `repo_merkle_root_${stamp}.txt`);
const manifestRelPath = path.relative(repoRoot, manifestPath).replaceAll(path.sep, '/');
const rootRelPath = path.relative(repoRoot, rootPath).replaceAll(path.sep, '/');
const root = merkleRoot(leaves);
const manifest = {
  schema: 'proofbundle-repo-merkle-manifest/1.0',
  generated_at_utc: generatedAtUtc,
  repo_root: '.',
  scope: 'operative repo files excluding .git, node_modules, build/cache directories, transient patch files, and generated repo Merkle outputs',
  file_count: leaves.length,
  zero_byte_files: leaves.filter((leaf) => leaf.bytes === 0).map((leaf) => leaf.path),
  merkle_root_sha256: root,
  leaves,
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
const manifestSha256 = sha256Bytes(fs.readFileSync(manifestPath));
const summary = [
  `schema: proofbundle-repo-merkle-root/1.0`,
  `generated_at_utc: ${generatedAtUtc}`,
  `repo_root: .`,
  `file_count: ${leaves.length}`,
  `zero_byte_file_count: ${manifest.zero_byte_files.length}`,
  `merkle_root_sha256: ${root}`,
  `manifest_path: ${manifestRelPath}`,
  `manifest_sha256: ${manifestSha256}`,
  '',
].join('\n');
fs.writeFileSync(rootPath, summary, 'utf8');
fs.copyFileSync(manifestPath, latestManifestPath);
fs.copyFileSync(rootPath, latestRootPath);

const event = {
  schema: 'proofbundle-repo-merkle-log-event/1.0',
  generated_at_utc: generatedAtUtc,
  repo_root: '.',
  manifest_path: manifestRelPath,
  root_path: rootRelPath,
  file_count: leaves.length,
  zero_byte_file_count: manifest.zero_byte_files.length,
  merkle_root_sha256: root,
  manifest_sha256: manifestSha256,
};
fs.appendFileSync(logPath, `${JSON.stringify(event)}\n`, 'utf8');

console.log(JSON.stringify({ ...event, log_path: logPath, latest_manifest_path: latestManifestPath, latest_root_path: latestRootPath }, null, 2));
