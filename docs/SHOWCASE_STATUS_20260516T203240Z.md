# ProofBundle Showcase Status - 2026-05-16T20:32:40Z

Identity: codex-ridge-lane1-gpt5-parent-chat-20260516T0616Z

This is an append-only exposure note for the repository showcase surface.
It has been superseded by the 2026-05-17 live-state sync for current hashes
and bridge head. Historical values below are preserved as original exposure
evidence, not current manifest standing.

## Standing

The HTML verifier/sealer is now present on `main` at:

- `web/proofbundle_v1_0_app.html`
- `web/2026-05-03_proofbundle_ui_v1.0.html`

The repository root now includes `index.html`, which points to the browser app path.

This note does not claim release-green standing, proof closure, legal compliance, or formal verification closure.

## File Evidence

Observed after the narrow main-branch showcase commit:

| Path | SHA-256 |
| --- | --- |
| `index.html` | `9B83D86171C23EF16E97554CAAA4A8C061AC6189FA30238405F3554F580BF271` |
| `web/proofbundle_v1_0_app.html` | `313A25F33DC823B6F41A430041573CD5C4B3E69C07374E8306B40D5D0EE698C2` |
| `web/2026-05-03_proofbundle_ui_v1.0.html` | `5EEDA88695D631CC4ECF5760185922F327F00776AAF6AFBBFB002C8EC420F64E` |
| `.github/workflows/pages.yml` | `0393B3AFB9B52C7DDA7440D044DDFBC1D54AED2AFB107A20A2DF482731D59987` |
| `tests/proofbundle_app_static.test.mjs` | `ECFF756B5A05D0B24DD1C206A2559E06B7A7D36A97A5C0AF661D082C7BC3A021` |

## GitHub Pages Standing

Raw GitHub `main` checks returned HTTP 200 for:

- `https://raw.githubusercontent.com/FalseAlias/proofbundle/main/index.html`
- `https://raw.githubusercontent.com/FalseAlias/proofbundle/main/web/proofbundle_v1_0_app.html`

GitHub Pages checks still returned HTTP 404 for:

- `https://falsealias.github.io/proofbundle/`
- `https://falsealias.github.io/proofbundle/web/proofbundle_v1_0_app.html`

The first Pages workflow run for commit `51b79bdc91fee78381a83ea96ad9e1527ce96a81` failed at the `Configure Pages` step. The public Pages endpoint returned `404`, which means the Pages site surface is not yet enabled/configured for the repository even though the app files are now present on `main`.

## Append-Only Interpretation

This was a narrow exposure repair:

- no branch replacement
- no destructive merge
- no source deletion
- no release-standing inflation
- no proof-standing inheritance

The next admissible repair is a repository settings / Pages-source repair, then a second verification record once the Pages URL returns HTTP 200.

## Current Superseding Standing

Current public manifest and status standing are recorded in:

- `PUBLIC_PROOFBUNDLE_MANIFEST_20260516.json`
- `status.json`
- `STATUS.md`
- `docs/CURRENT_STATE_20260516.md`

The 2026-05-17 sync records bridge sequence `2741`, bridge head
`6DDCAB5EAF95B4E71F66FDA8B5FFDA8E182D35EFBA5E8DE274E1824B2FA6EFC2`, and
fresh VM receipt evidence. The historical hashes in this note are not the
current manifest hashes.
