# Pipeline Steps — MCP Tool Sequences

Step-by-step execution instructions for each pipeline agent. Read the relevant step when you reach it during processing — you don't need all steps loaded at once.

## Step 1: Capture
*Only needed for new observations during processing (e.g., Propagate generating new signals).*

```
capture({ content: "...", hints: { node_type: "Signal", name: "..." } })
```
Or for richer signals:
```
create_signal({
  observation: "factual description",
  context: "situational context",
  observed_by_agent_id: "...",
  signals_entity_id: "...",
  produced_in_session_id: "...",
  properties: { how_observed: "inferred", confidence: "high" }
})
```

## Step 2: Classify

Determine the signal's structural identity — what is it about?

1. Read the signal content.
2. `search` with signal content to find related entities.
3. Determine: Is this about an existing entity? A new one? A relationship?
4. Update system_interpretation with classification reasoning:
```
update_node({ id: "<signal_id>", properties: {
  system_interpretation: "Targets [entity name]. Classification: [rationale]."
}})
```

## Step 3: Link

Connect the signal to its target entities in the graph.

1. `search` for target entity by name and content.
2. If found: `get_node` to verify it's the right target.
3. Create SIGNALS edge:
```
create_relationship({
  from_id: "<signal_id>",
  to_id: "<target_entity_id>",
  relationship_type: "SIGNALS"
})
```
4. If target is ambiguous → invoke Clarify (search graph for context, route to observer if needed).
5. If target not found → note for Infer (may need Materialize to create it).

## Step 4: Deduplicate (cross-cutting)

Before evaluation, check for duplicates.

1. `search` with signal content against the signal index:
```
search({ query: "<signal content>", index: "signal", limit: 5, threshold: 0.85 })
```
2. For high-similarity matches, `get_node` on each match to compare content in context.
3. **Semantic similarity is not duplicate.** Same words in different contexts may describe different insights. Check: same target entity? Same time period? Same observer? Same observation?
4. Flag potential duplicates in system_interpretation. Do NOT auto-dismiss — Evaluate decides disposition.

## Step 5: Prioritize (cross-cutting)

Order the remaining queue for Evaluate.

1. Contradictory signals first (the graph may be actively wrong).
2. Purpose-level signals before mechanics-level.
3. Signals with high structural_impact before low.
4. Group by target entity for batch evaluation.

## Step 6: Evaluate

The core processing step. Compare signal evidence against existing graph declarations.

**For each signal:**

1. **Verify target entity exists.** `search` with the signal's target content:
```
search({ query: "<target entity name and content>", index: "entity", limit: 3 })
```

2. **Get target entity's current state.** `get_node` on the target:
```
get_node({ id: "<target_entity_id>" })
```

3. **Compare signal content against entity content.** Ask:
   - Does the signal duplicate what the entity already declares? → **redundant**
   - Does the signal add information the entity doesn't contain? → **additive**
   - Does the signal conflict with what the entity declares? → **contradictory**
   - Does the signal have nothing to do with this entity? → **unrelated**

4. **Write disposition:**
```
update_node({ id: "<signal_id>", properties: {
  disposition: "additive",
  disposition_note: "Extends [entity name] with [specific new information]. Entity content lacks [what the signal adds].",
  status: "under_review",
  system_interpretation: "<accumulated reasoning from prior steps + evaluation reasoning>"
}})
```

**Quality gates per disposition:**

| Disposition | Required Before Marking | What Must Follow |
|-------------|------------------------|------------------|
| redundant | SIGNALS edge exists AND semantic search verified match against entity content | Nothing — confirm and mark processed |
| additive | SIGNALS edge exists | Target entity updated OR Need stubbed (signal is NOT processed until this happens) |
| contradictory | SIGNALS edge exists | Discrepancy created OR declaration updated |
| unrelated | Evaluation reasoning documented | Re-link attempt or dismiss with rationale |

## Step 7: Infer

**Reactive mode** (triggered by additive dispositions):

For each additive signal:
1. Does the target entity exist? If not → finding: missing entity.
2. Does the signal imply unmet needs? Check signal content for language like "needs," "requires," "missing," "should have," "friction," "gap."
3. Does the signal reveal undeclared expectations? Look for assumptions about how things should work that aren't in the constraint stack.
4. `traverse` from target entity to check structural completeness:
```
traverse({ id: "<target_entity_id>", max_depth: 2 })
```
5. Check: Does the target role have Need children? Does the relationship have PURPOSE edges? Are there Constraint nodes governing this entity?

**Proactive mode** (run after batch processing or on explicit request):

Scan graph for structural incompleteness independently of signal flow:
```
run_diagnostic({ checks: [
  "hollow_middle",
  "roles_without_needs",
  "missing_purpose",
  "entities_without_purpose",
  "incomplete_purpose_edges",
  "relationships_without_purpose",
  "depleting_stocks_without_signals"
]})
```

For each diagnostic finding: produce a finding specifying what's missing, where it belongs, what evidence triggered it, and confidence level.

**When to run proactive scans:**
- After processing a signal batch (all reactive work complete)
- At the start of a session with a large backlog (to understand graph health before processing)
- When explicitly requested by the user

**Proactive scan sequence:**
1. `run_diagnostic` with all structural checks.
2. For each finding, assess: Is this a real gap or an expected absence?
3. For real gaps, produce findings for Materialize.
4. For the most critical findings (purpose-level gaps, depleting stocks), flag for human attention.

## Step 8: Materialize

Act on Infer's findings by creating graph structure.

**Before creating anything:**
1. `search` to verify the entity doesn't already exist:
```
search({ query: "<proposed entity name and content>", index: "entity", limit: 3 })
```
2. If a match exists → this is a Link problem, not a Materialize problem. Wire the signal to the existing entity instead.

**Creating a stub entity:**
```
create_entity({
  entity_type: "Need",
  name: "Short descriptive name",
  content: "Minimum viable description sufficient for semantic search.",
  properties: { lifecycle_state: "open", origin: "Inferred from signal [signal name]" }
})
```

Then wire it:
```
create_relationship({
  from_id: "<parent_entity_id>",
  to_id: "<new_entity_id>",
  relationship_type: "CONTAINS"
})
create_relationship({
  from_id: "<originating_signal_id>",
  to_id: "<new_entity_id>",
  relationship_type: "SIGNALS"
})
```

**Materialize priorities:**
1. Needs over entities — if a finding reveals both, create the Need first.
2. Purpose-connected stubs over orphans — always wire to the purpose tree.
3. Minimal viable structure — stubs get refined through future calibration. Don't over-specify.

**Never create an orphan.** Every new entity must have at least one relationship edge in the same operation.

## Step 9: Escalate

Route findings that exceed processing authority.

1. Check: Does the processing engine have authority to modify the target entity? For the core structured-intent architecture entities (purpose declarations, constraint stacks), the engine has read access but modifications require human authority.
2. If authority held → pass directly to Resolve.
3. If authority not held → flag for human review:
```
update_node({ id: "<signal_id>", properties: {
  status: "under_review",
  disposition_note: "<existing note> | ESCALATED: Requires human authority to modify [entity name]. Finding: [what needs to change and why]."
}})
```

## Step 10: Resolve

Act on dispositions with appropriate authority.

**For redundant signals:**
```
update_node({ id: "<signal_id>", properties: { status: "resolved_into_update" }})
```
(No graph change needed — the declaration already reflects this evidence.)

**For additive signals:**
1. Update target entity content to incorporate the new information:
```
get_node({ id: "<target_entity_id>" })
// Read current content, determine what to add
update_node({ id: "<target_entity_id>", properties: {
  content: "<updated content incorporating signal's new information>"
}})
```
2. Mark signal as processed:
```
update_node({ id: "<signal_id>", properties: { status: "resolved_into_update" }})
```

**For contradictory signals:**
Either update the declaration (if evidence is strong enough):
```
update_node({ id: "<target_entity_id>", properties: {
  content: "<corrected content>"
}})
```
Or create an acknowledged discrepancy:
```
create_entity({
  entity_type: "Discrepancy",
  name: "...",
  content: "Declared: [X]. Observed: [Y]. Signal: [signal name].",
  properties: { lifecycle_state: "surfaced", altitude: "..." }
})
```

## Step 11: Propagate

Check whether resolution created downstream coherence issues.

1. `traverse` outward from each modified entity:
```
traverse({
  id: "<modified_entity_id>",
  relationship_types: ["SERVES", "REQUIRES", "CONTAINS"],
  max_depth: 2,
  direction: "both"
})
```
2. For each connected node: does the modification change the meaning of this connection?
3. If yes → generate a new signal that re-enters the pipeline:
```
capture({
  content: "Coherence check: [modified entity] was updated with [change]. Connected entity [name] may need review because [reason].",
  hints: { node_type: "Signal", name: "Propagation — [affected entity]" }
})
```
