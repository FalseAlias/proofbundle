# ProofBridge

ProofBridge is a hash-ratcheted feedback substrate for persistent multi-agent state.

It does not rely on an individual AI agent being persistent. Instead, continuity is externalized into a verified bridge loop: each agent output becomes a predecessor-bound record, the verifier checks lawful succession, the append-only ledger advances, and the verified record becomes the next stimulus for another agent.

> Persistence is not inside the agent. Persistence is in the verified loop.

## Core Loop

```text
agent output
  -> payload hash
  -> predecessor-bound bridge record
  -> verifier receipt
  -> append-only ledger head
  -> recipient agent stimulus
  -> next output
```

## Why This Is Different

Ordinary multi-agent systems coordinate calls between agents.

ProofBridge makes the coordination layer itself carry persistent state.

The bridge is not merely a message bus or transcript. It is the state-regulating intermediary. A valid next action must acknowledge the verified prior state.

## Load-Bearing Mechanism

- payload hash
- predecessor record hash
- sequence number
- sender identity
- recipient identity
- timestamp
- lane and scope metadata
- verifier outcome
- append-only ledger head
- watcher or relay stimulus

The result is a cryptographically mediated feedback loop in which transient agents can participate in a durable, attributable interaction.

## Minimal Public Wording

ProofBridge externalizes continuity from transient AI agents into a verified state-transition loop. Each agent output is sealed into a hash-bound bridge record, checked as a lawful successor, appended to an append-only ledger, and used as the next stimulus for another agent.

The agents may be transient. The loop persists.

