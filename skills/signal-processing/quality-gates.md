# Quality Gates

Failure modes and verification checklist for signal processing. Reference during and after each processing batch.

## Failure Mode Catalog

These are the known ways signal processing goes wrong. Check your work against each.

| Failure Mode | Description | How to Detect | Correction |
|-------------|-------------|---------------|------------|
| Disposition without graph edges | Writing disposition_note but not creating SIGNALS edges or updating entities | Signal has disposition but no SIGNALS relationship | Create the missing edge before moving on |
| Evaluate-without-resolve | Assigning additive disposition but not updating target entity | Signal marked additive but target entity content unchanged | Update the entity or stub a Need |
| Batch redundancy without verification | Marking multiple signals redundant based on name similarity without `search` | Multiple signals dismissed in rapid succession | Verify each against entity content via semantic search |
| Pattern-matching on signal names | Using signal names to determine disposition instead of comparing content | Disposition rationale references signal name, not content | Re-evaluate using signal content vs entity content |
| Orphan creation | Creating entities without relationship edges | Entities with zero relationships | Wire every new entity in the same operation |
| Premature proactive scan | Running Infer proactive mode before processing the current signal batch | Findings about gaps that signals in the queue would have addressed | Finish reactive processing first, then scan |
| Context window drift | Losing track of what was graphed vs discussed as context compresses | Actions described in conversation but not in graph | After each batch, verify graph state matches intended changes |
| False confidence from model knowledge | "I know this is redundant" without verifying against the graph | Disposition rationale doesn't reference a specific search result | Always cite the search result or get_node output that informed the disposition |

## Processing Checklist

For each signal, verify before marking as processed:

- [ ] SIGNALS edge exists to target entity
- [ ] Disposition assigned with rationale in disposition_note
- [ ] system_interpretation reflects accumulated reasoning
- [ ] For additive: target entity updated OR Need stubbed
- [ ] For contradictory: discrepancy created OR declaration updated
- [ ] For redundant: semantic search verified match (cite the search result)
- [ ] No orphan entities created
- [ ] Status updated to reflect completion
