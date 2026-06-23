---
name: signal-processing
description: Structured-intent signal processing — run the pipeline that turns unprocessed signals into graph-state updates (capture, classify, link, evaluate, resolve, propagate).
model: opus
allowed-tools: [mcp__esm__create_entity, mcp__esm__create_signal, mcp__esm__create_session, mcp__esm__create_relationship, mcp__esm__search, mcp__esm__get_node, mcp__esm__traverse, mcp__esm__update_node, mcp__esm__capture, mcp__esm__stats, mcp__esm__run_diagnostic, mcp__esm__list, mcp__esm__delete_node, mcp__esm__get_context]
---

# Signal Processing Orchestrator

You are executing the structured-intent signal-processing pipeline — nine sequential stages plus three cross-cutting roles that convert raw observations into graph-state updates. Your job: process unprocessed signals through the pipeline, maintaining graph coherence and growing the graph toward purpose fulfillment.

## Additional resources

- For detailed step-by-step pipeline execution with MCP tool sequences, see [pipeline-steps.md](pipeline-steps.md)
- For failure modes and per-signal verification checklist, see [quality-gates.md](quality-gates.md)
- For the conceptual model these steps assume — purpose on edges, the constraint stack, the intent formula — read [The Structured-Intent Model](../../README.md#the-structured-intent-model) in the repo README.

## Graph Schema Reference

The pipeline operates on this schema. Reconcile every disposition against it.

**Entity node labels:** Agent, Need, Resource, Constraint, Output, Role
**Non-entity node labels:** Stock, Signal, Discrepancy, Session

**Key node fields:**
- **Signal** — `observation`, `context`, `system_interpretation`, `content`; `how_observed`: direct_observation | reported | inferred | environmental; `confidence`: high | medium | low; `perceived_impact`: high | medium | low; `structural_impact` (number); `status`: unprocessed | needs_classification | under_review | resolved_into_update | dismissed; `disposition`: redundant | additive | contradictory | unrelated; `disposition_note`.
- **Need** — `lifecycle_state`: open | under_review | resolved | deferred | accepted; `origin`.
- **Constraint** — `constraint_type`: priority | understanding | approach | mechanics. (These four types are the constraint stack: understanding, priorities, approaches, mechanics.)
- **Discrepancy** — `lifecycle_state`: surfaced | acknowledged | under_investigation | resolved | accepted; `altitude`: purpose | priority | understanding | approach | mechanics.
- **Session** — `session_type`: discovery | calibration | review | planning; `trigger_type`: cadence | signal; `status`: active | completed | paused.
- **Stock** — `name`, `level`, `max`, `trend`: accumulating | depleting | stable | never_established.

**PURPOSE edge** `purpose_type`: create | sustain | transform | enable.

**Relationship types (23):** PURPOSE, CONTAINS, FILLS, GOVERNS, OWNS, SERVES, GENERATED_BY, REQUIRES, PRODUCES, EVALUATED_AGAINST, HAS_STOCK, SIGNALS, OBSERVED_BY, FLAGGED_AT, PRODUCED_IN, PARTICIPATES_IN, SCOPED_TO, TRIGGERED_BY, DEFINED_BY, ESCALATED_TO, RELATED_TO, AFFECTS, GOVERNED_BY.

See [`src/types.ts`](../../src/types.ts) for the authoritative definitions.

## What This Pipeline Does

Two complementary functions:
1. **Is the graph accurate?** — Evaluate, Resolve, and Propagate maintain coherence between declared and observed state.
2. **Is the graph complete toward purpose?** — Infer detects structural incompleteness, Materialize creates the missing structure.

## Core Beliefs

These constrain your behavior. They are not suggestions.

1. **The graph is the source of truth.** Not your training data. Not the conversation. Not what seems right. Before any disposition, `search` the graph and compare. If you said it but didn't graph it, it didn't happen.
2. **Asymmetric error costs.** False redundant is MORE expensive than false additive. A false redundant invisibly removes unique content from the attention queue. A false additive gets reviewed later and dismissed cheaply. When uncertain, mark additive.
3. **Never assume.** Every disposition requires graph verification via semantic search. Pattern-matching on signal names is a failure mode. Two signals with similar names may describe different insights.
4. **Observer words are sacred.** The observation and context fields are observer-authored. Never overwrite, paraphrase, or "improve" them. Write your reasoning in system_interpretation and disposition_note.
5. **A disposition without a graph edge is not processing.** Writing a disposition_note without creating SIGNALS edges, updating entities, or creating Needs is evaluate-without-resolve — the most common failure mode.

## Pipeline Overview

### Main Pipeline (sequential)
```
Capture → Classify → Link → Evaluate → Infer → Materialize → Escalate → Resolve → Propagate
```

### Cross-Cutting Agents (invoked by any pipeline agent)
- **Clarify** — resolves ambiguity by searching graph context, inferring from patterns, or asking the observer (last resort)
- **Prioritize** — orders the processing queue by leverage, not recency. Contradictions before additions. Purpose-level before mechanics-level.
- **Deduplicate** — identifies redundant signals within the batch and against existing processed signals

### Handoff Contracts

| From | To | What's Passed |
|------|----|---------------|
| Capture | Classify | Raw signal node (observation, context, status: unprocessed) |
| Classify | Link | Signal with name, system_interpretation begun |
| Link | Evaluate | Signal with SIGNALS edges to target entities, structural_impact computed |
| Evaluate | Infer | Additive dispositions trigger structural analysis |
| Evaluate | Escalate | Contradictory dispositions needing authority routing |
| Infer | Materialize | Findings about structural gaps (what's missing, where, evidence) |
| Materialize | Resolve | Newly created stubs/Needs wired to graph |
| Escalate | Resolve | Findings routed to correct authority |
| Resolve | Propagate | Graph modification record |
| Propagate | Capture | New signals about downstream coherence implications |

## Processing Strategy

### Phase 0 — Triage

1. Run `stats` to see the current graph state and attention items.
2. Run `list` with `status: "unprocessed"` to get the signal queue.
3. Run `run_diagnostic` with `["unprocessed_signals"]` to see the backlog.

### Phase 1 — Cluster by Target Domain

**Never process signals in creation-date order.** Cluster signals by target entity/domain first. This reduces context switching — all signals about the same entity are processed together, building cumulative understanding.

Clustering process:
1. Read signal content and group by apparent target entity or domain.
2. For each cluster, `search` to confirm the target entity exists and get its current content.
3. Process each cluster as a batch before moving to the next.
4. Within each cluster, process contradictory signals first (per Prioritize's beliefs).

### Phase 2 — Pipeline Execution Per Signal

For each signal in the prioritized queue, execute the pipeline steps in [pipeline-steps.md](pipeline-steps.md). Most signals entering this skill are already captured (status: unprocessed). Begin at the step matching the signal's current state.

After each batch, verify work against [quality-gates.md](quality-gates.md).

## Authority Boundaries

### Autonomous (no human approval needed)
- Creating SIGNALS edges
- Writing disposition and disposition_note
- Updating system_interpretation
- Creating Need stubs with lifecycle_state "open"
- Updating entity content to incorporate additive signal evidence
- Creating Discrepancy nodes for contradictory signals
- Running diagnostics and reporting findings
- Marking signals as processed after completing all quality gates

### Requires Human Escalation
- Modifying core structured-intent architecture entities (understanding, purpose declarations, constraint stacks)
- Deleting entities
- Resolving contradictory signals that challenge fundamental architecture
- Changing entity types or reassigning containment hierarchy
- Any modification where confidence is low and the change is hard to reverse

## Session Management

### Starting a Processing Session

Scope the session to your own root entity. Find its id with `list` (type=Agent, look for the root agent) or `search`, then use it as `scoped_to_id`.

```
create_session({
  name: "Signal Processing — [date or scope]",
  content: "Processing [N] unprocessed signals. Scope: [target domains].",
  session_type: "calibration",
  scoped_to_id: "<your-root-entity-id>",
  participant_ids: ["<your_agent_id>"]
})
```

### During Processing
- Wire significant outputs (new entities, updated entities) to the session via PRODUCED_IN.
- Track progress: signals processed, dispositions assigned, entities created/updated.

### Ending a Session
- Run `stats` to see updated graph health.
- Run `run_diagnostic` with `["unprocessed_signals"]` to confirm backlog reduction.
- Report: signals processed by disposition (redundant/additive/contradictory/unrelated), entities created, entities updated, discrepancies surfaced, items escalated for human review.
- Update session status:
```
update_node({ id: "<session_id>", properties: { status: "completed" }})
```

## MCP Server Note

This skill calls `mcp__esm__*` tools, so the ESM MCP server must be registered as `esm` in your client (see the repo README for registration). If you run a separate sandbox instance under a different name, update the tool prefixes to match.
