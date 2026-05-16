# Commands Run

Generated during the `v1.0.0-alpha.1_conformance-manifest-sync` publication-prep pass.

| UTC time | Directory | Command | Exit | Result |
|---|---|---:|---:|---|
| 2026-05-16T13:33Z | `implementations/typescript-core-20260516` | `npm test` | 1 | Failed before dependency install: `tsx` package was missing because `node_modules` was absent. |
| 2026-05-16T13:34Z | `implementations/typescript-core-20260516` | `npm ci` | 0 | Installed package dependencies from `package-lock.json`; `node_modules` is not source and is excluded from publication. |
| 2026-05-16T13:36Z | `implementations/typescript-core-20260516` | `npm test` | 0 | TypeScript conformance run passed 300/300 vectors. Output saved at `conformance/typescript_test_output_20260516T1336Z.txt`; SHA-256 `B69BEE7BC90D86ED07ECEA268EB1A60C2C7F45967B765127AA422DF3E8FE9BD7`. |
| 2026-05-16T13:35Z | repository root | `node tests/proofbundle_app_static.test.mjs` | 0 | Browser app static tests passed 4/4. |
| 2026-05-16T13:36Z | repository root | `node tools/build_repo_merkle_manifest_20260516.mjs` | 0 | Built append-only repo Merkle event. Root `9925B4303B71AB50F71FB711857F2F037D56A8FC30039332EE6E1BCB77A2724A`. |
| 2026-05-16T13:56Z | repository root | `node tools/build_repo_merkle_manifest_20260516.mjs` | 0 | Regenerated repo Merkle manifest with generated Merkle outputs excluded from operative-file scope. Root `F7A7B0FE235751B4BEE42F0FB127B949BD24CFB4AA85D14AE7421137D57A066C`; manifest SHA-256 `AEC811CA16FF77F3F64BAF218C8658ED0BC34D2530050D269D33C5B6406FB6EC`. |
| 2026-05-16T13:56Z | repository root | `node tests/proofbundle_app_static.test.mjs` | 0 | Browser app static tests passed 4/4. |
| 2026-05-16T13:56Z | `implementations/typescript-core-20260516` | `npm test` | 0 | TypeScript conformance run passed 300/300 vectors. |
| 2026-05-16T14:14Z | `AGENT_COORDINATION` | `python proofbundles/tools/submit_sequence_ots_20260516.py ...` | 0 | Submitted OTS receipts through Tor for bridge sequence hash artifacts 1 through 2594. Missing `.ots` after run: 0. Full batch Merkle tip `ABE0D040128A844220DEB5CC85C99DD29673336E1AB0926E10C4858A8C9B75FC`. |
| 2026-05-16T14:15Z | `AGENT_COORDINATION` | `python proofbundles/tools/submit_sequence_ots_20260516.py ...` | 0 | Submitted OTS receipt through Tor for sequence 2595 created by the OTS status bridge send. Missing `.ots` after run: 0. |
| 2026-05-16T14:15Z | repository root | source zip Merkle generation over `C:\Users\alib90\Downloads\2026-05-15_proofbundle_v1.0.0-alpha.1_standing-sync-repaired_20260515T111154Z.zip` | 0 | Computed source zip Merkle root `A8D0F571C94CA36AFA60A67A35B06B10FA1D96FC053C1AEDC3482C922D7A24F8`; manifest SHA-256 `5C157F123CF2A10844C45797AD2DE81363F3E9F2270530802F43BAE5D93D4820`. |

These commands do not establish release-green standing.
