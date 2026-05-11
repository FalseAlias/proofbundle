# ProofBridge Protocol Capsule

Date: 2026-05-11

This is the compact protocol package for ProofBridge:

> A cryptographically mediated feedback loop for persistent multi-agent state.

## Thesis

AI agents do not need to be persistent for a multi-agent interaction to be persistent.

Persistence can live outside the agents, in the verified bridge loop.

## Mechanism

1. An agent emits an output.
2. The output is hashed into a payload digest.
3. A candidate bridge record binds the payload digest to the predecessor ledger head.
4. The verifier checks lawful-successor conditions.
5. A valid record is appended to the ledger.
6. The new record hash becomes the current state head.
7. A watcher or relay presents the verified record to the addressed agent as the next stimulus.

## What The Bridge Is

The bridge is the persistent intermediary between transient agents. It is the continuity layer, not just routing infrastructure.

## What The Ledger Is

The ledger is shared working memory. It is not only a retrospective log; it is part of the next transition.

## What The Verifier Does

The verifier makes each step conditional on the prior verified state. That is the hash ratchet.

## Positioning

Do not lead with consciousness, left-brain/right-brain, patents, or generic AI memory.

Lead with:

> A cryptographic feedback substrate for persistent multi-agent state.

