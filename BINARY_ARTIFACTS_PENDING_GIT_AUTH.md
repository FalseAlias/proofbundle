# Binary Artifacts Pending Git Auth

The current ProofBundle binary artifacts are prepared locally and committed locally, but they are not fully uploaded through `git push` yet because GitHub HTTPS authentication is blocked on this machine.

## Local branch and commit

- Repository: `C:\Users\alib90\Downloads\proofbundle`
- Branch: `proofbundle-current-state-20260515T0339PDT`
- Local commit: `cb2e004 Add ProofBundle current state capture 20260515`

## Prepared local binary files

- `artifacts/20260515T0339PDT/proofbundle_full_preserved_html_false_inheritance_repaired.zip`
  - SHA-256: `460996E569F577B93CD380D18EA28C86DA47E26956EBAFE9062590769C698722`
  - Size: 8,049,727 bytes
- `state-captures/20260515T0339PDT/PROOFBUNDLE_ALL_STATE_CAPTURE_20260515T0339PDT.zip`
  - SHA-256: `C9FC4511CC87A5E219EF1B8A8F9654D50648DD6A2DF915F8C1D01FFC72AFF1E2`
  - Size: 259,878 bytes

## Push blocker

`git push -u origin proofbundle-current-state-20260515T0339PDT` timed out while Git Credential Manager was waiting for GitHub credentials.

A retry with prompts disabled failed with:

```text
fatal: Cannot prompt because user interactivity has been disabled.
fatal: could not read Username for 'https://github.com': terminal prompts disabled
```

## Recovery

After GitHub auth is available on this machine, run from `C:\Users\alib90\Downloads\proofbundle`:

```powershell
git push -u origin proofbundle-current-state-20260515T0339PDT
```

That will upload the local binary commit without deleting or rewriting `main`.
