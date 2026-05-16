# Commands Run

Generated during the `v1.0.0-alpha.1_conformance-manifest-sync` publication-prep pass.

| UTC time | Directory | Command | Exit | Result |
|---|---|---:|---:|---|
| 2026-05-16T13:33Z | `implementations/typescript-core-20260516` | `npm test` | 1 | Failed before dependency install: `tsx` package was missing because `node_modules` was absent. |
| 2026-05-16T13:34Z | `implementations/typescript-core-20260516` | `npm ci` | 0 | Installed package dependencies from `package-lock.json`; `node_modules` is not source and is excluded from publication. |
| 2026-05-16T13:36Z | `implementations/typescript-core-20260516` | `npm test` | 0 | TypeScript conformance run passed 300/300 vectors. Output saved at `conformance/typescript_test_output_20260516T1336Z.txt`; SHA-256 `B69BEE7BC90D86ED07ECEA268EB1A60C2C7F45967B765127AA422DF3E8FE9BD7`. |
| 2026-05-16T13:35Z | repository root | `node tests/proofbundle_app_static.test.mjs` | 0 | Browser app static tests passed 4/4. |
| 2026-05-16T13:36Z | repository root | `node tools/build_repo_merkle_manifest_20260516.mjs` | 0 | Built append-only repo Merkle event. Root `9925B4303B71AB50F71FB711857F2F037D56A8FC30039332EE6E1BCB77A2724A`. |

These commands do not establish release-green standing.
