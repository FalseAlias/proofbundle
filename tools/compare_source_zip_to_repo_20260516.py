import hashlib
import json
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path


EXCLUDE_REPO_PARTS = {
    ".git",
    "node_modules",
    "dist",
    "target",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
}


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest().upper()


def sha384_bytes(data: bytes) -> str:
    return hashlib.sha384(data).hexdigest().upper()


def sha512_bytes(data: bytes) -> str:
    return hashlib.sha512(data).hexdigest().upper()


def should_skip_repo(path: Path) -> bool:
    return any(part in EXCLUDE_REPO_PARTS for part in path.parts)


def load_source_entries(zip_path: Path):
    entries = {}
    with zipfile.ZipFile(zip_path) as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            raw_name = info.filename.replace("\\", "/")
            normalized = raw_name
            if normalized.startswith("proofbundle/"):
                normalized = normalized[len("proofbundle/") :]
            data = zf.read(info)
            entries[normalized] = {
                "zip_path": raw_name,
                "bytes": len(data),
                "compressed_bytes": info.compress_size,
                "sha256": sha256_bytes(data),
                "sha384": sha384_bytes(data),
                "sha512": sha512_bytes(data),
            }
    return entries


def load_repo_entries(repo_root: Path):
    entries = {}
    for path in sorted(repo_root.rglob("*")):
        if not path.is_file():
            continue
        rel_path = path.relative_to(repo_root)
        if should_skip_repo(rel_path):
            continue
        rel = rel_path.as_posix()
        data = path.read_bytes()
        entries[rel] = {
            "bytes": len(data),
            "sha256": sha256_bytes(data),
            "sha384": sha384_bytes(data),
            "sha512": sha512_bytes(data),
        }
    return entries


def main() -> int:
    if len(sys.argv) != 4:
        print("usage: compare_source_zip_to_repo_20260516.py <zip> <repo_root> <out_json>", file=sys.stderr)
        return 2

    zip_path = Path(sys.argv[1]).resolve()
    repo_root = Path(sys.argv[2]).resolve()
    out_json = Path(sys.argv[3]).resolve()
    out_json.parent.mkdir(parents=True, exist_ok=True)

    source_entries = load_source_entries(zip_path)
    repo_entries = load_repo_entries(repo_root)

    source_paths = set(source_entries)
    repo_paths = set(repo_entries)
    shared_paths = sorted(source_paths & repo_paths)

    identical = []
    different = []
    for rel in shared_paths:
        if source_entries[rel]["sha256"] == repo_entries[rel]["sha256"]:
            identical.append(rel)
        else:
            different.append(
                {
                    "path": rel,
                    "source_sha256": source_entries[rel]["sha256"],
                    "repo_sha256": repo_entries[rel]["sha256"],
                    "source_bytes": source_entries[rel]["bytes"],
                    "repo_bytes": repo_entries[rel]["bytes"],
                }
            )

    report = {
        "schema": "proofbundle-source-zip-vs-repo-diff/1.0",
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_zip_path": str(zip_path),
        "repo_root": str(repo_root),
        "source_file_count": len(source_entries),
        "repo_file_count": len(repo_entries),
        "shared_path_count": len(shared_paths),
        "identical_path_count": len(identical),
        "different_path_count": len(different),
        "missing_from_repo_count": len(source_paths - repo_paths),
        "extra_in_repo_count": len(repo_paths - source_paths),
        "source_zip_sha256": sha256_bytes(zip_path.read_bytes()),
        "identical_paths": identical,
        "different_paths": different,
        "missing_from_repo": sorted(source_paths - repo_paths),
        "extra_in_repo": sorted(repo_paths - source_paths),
    }

    out_json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: report[k] for k in (
        "source_file_count",
        "repo_file_count",
        "shared_path_count",
        "identical_path_count",
        "different_path_count",
        "missing_from_repo_count",
        "extra_in_repo_count",
        "source_zip_sha256",
    )}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
