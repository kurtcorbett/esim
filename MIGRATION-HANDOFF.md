# ESM Schema Migration — Handoff

> **Purpose of this doc.** Carry the deferred ESM schema migration into a fresh Claude Code
> session without losing context. The intent-framing plugin build (in `../sia-plugins`)
> deliberately does **not** depend on this migration — it writes correct vocabulary via a
> backwards-compatible **property overlay**, so it runs on today's unmodified `esm` server.
> This migration is the separate, durable cleanup that brings the ESM runtime up to the
> canonical six-layer / Intent Resolution model.
>
> **Before executing anything here, re-verify current state** — read the cited graph nodes
> (`get_node`) and source files. The model evolves; this doc is a map made 2026-06-17, not
> ground truth.

---

## 1 Why this was deferred

The live ESM database/MCP still speaks the **pre-six-layer vocabulary**:

- `esm/src/types.ts` (~line 95): `constraint_type: "priority" | "belief" | "approach" | "structure"`
- `create_entity` exposes `ENTITY_LABELS` (Agent / Need / Resource / Constraint / Output / Role) — **no `Frame` label**.

The renames below were **decided and documented in the graph (and built in gravitas) but never migrated into the ESM runtime.** See provenance signal `d4657657-402d-4f13-a314-60731fa47b5e`.

Because the plugin build uses the property overlay (carry `layer`, `frame_key`, `dimension`,
`node_role` in node **properties** over the old `constraint_type` enum), it is decoupled from
this work and can proceed on `main` while this migration happens on a branch.

---

## 2 Canonical target (read these first — full UUIDs)

| Node | What it defines |
|---|---|
| `925d301f-4e92-4a09-b46f-43997308085e` | Canonical six-layer intent frame model — updated naming + evaluation mechanics |
| `fb93817a-7d33-4bb3-9aef-347395bf8672` | **Neo4j data-model spec** — the target node/edge/property shapes (this is the blueprint) |
| `d3171f1b-f624-4792-b8cb-9dbad5ce2ff7` | Purpose Types as Dimension Interpreters |
| `a2efd445-2b63-4d8b-99c9-8739174049e7` | Alignment Dimensions & Evaluation Mechanics |
| `7f9a464e-...` (open Need) | **Rename wave: SIA → Intent Resolution** across ESM + docs + gravitas — this migration is its ESM leg |

Naming hierarchy now lives in **gravitas** (leave the gravitas graph alone — it's already canonical):
root `d2918a18-aaed-413f-8df2-e842f26cc455` · Intent Framing `4721b37d-89b7-4023-bfe7-60caf0d7c9c3` ·
Intent Dynamics `0f0d4f15-56e7-4e24-adf2-cb1eae427686` · CIR `bd4e9132-ca8b-4a8d-979f-4b0b84038361`.

---

## 3 The changes

### 3.1 Layer / constraint_type renames (code)
Per `925d301f` and `fb93817a`:

| Old (live) | New (target) | Notes |
|---|---|---|
| `belief` | `understanding` | layer rename; dimensions: need, recipient, landscape, constraints |
| `structure` | `mechanic` | + **`composition`** added as a distinct sixth layer |
| `priority` | `priority` | unchanged |
| `approach` | `approach` | unchanged |

Files to touch (verify before editing):
- `esm/src/types.ts` — `constraint_type` enum (~L95) and the `altitude` enum (~L141).
- `esm/src/server.ts` — `create_entity` input enum + `ENTITY_LABELS` / `RELATIONSHIP_TYPES`.
- `esm/src/queries.ts` — schema-setup queries (indexes/constraints) + any classification/diagnostic Cypher keyed on the old terms.
- `esm/src/classify.ts` — classifier prompts that name the old constraint types.

### 3.2 Node-label renames (decided, not applied)
- **Constraint → Declaration** — decided in `07ca790b-f7a3-4726-a3f9-2385e7ebcdc6`, resolved via `34bfda71` / `953781ce`. Relabel + update MCP enum + queries.
- **Discrepancy → Gap** — same signal `07ca790b`, item 3.
- Product → Output — already done (precedent: Need `97b1cc4d-...`); use it as the migration template.

### 3.3 Frame representation (decision needed)
Frames were materialized as `:Constraint` nodes with a property overlay (`node_role:"frame"`,
`layer`, `frame_key`, `primary_dimension`) — e.g. `036f156a-...` (understanding.trajectory),
`6041d459-...` (composition.dependencies) — then **demoted to "dialect."** Decide whether to:
- (a) keep frames as the property overlay (no new label) — **matches the plugin build, lowest friction**; or
- (b) introduce a first-class `Frame` label/type.
Recommend (a) unless a concrete query need forces (b).

---

## 4 Data migration (the personal Aura graph)

The only part needing a real data migration is Kurt's personal graph (~792 signals on Aura).
Overlay-written nodes already carry `layer`/`frame_key`, so they are forward-compatible — the
migration is mostly relabeling + `constraint_type` value updates.

Pairs with the planned **Aura → local Neo4j** move:
1. Snapshot Aura (`neo4j-admin database dump`, or APOC `apoc.export.cypher.all`).
2. Stand up local Neo4j (`docker compose up -d` in `esm/`; `bolt://localhost:7687`).
3. Restore the snapshot locally.
4. Run the relabel/rename Cypher (3.1–3.2) against the **local** copy.
5. Repoint `esm/.env` `NEO4J_DB_CONNECTION_URI` to local; keep the Aura snapshot as backup.
6. Re-embed if embedding model/dimensions change (`esm/scripts/reembed.ts`).

**Never run the rename/relabel Cypher against Aura directly without a verified dump first.**

---

## 5 Strategy-test target (no migration needed)

Kurt's first real test (Appfire strategy session) runs on a **fresh local ESM install** =
greenfield. Either deploy this branch to it (clean vocabulary) or just use the overlay on
`main`. No data migration required for a fresh DB.

---

## 6 Branch + sequencing

- Cut a breaking-change branch of `esm` (e.g. `schema/intent-resolution-v6`). Do **not** merge until tested.
- The overlay-based plugin keeps working on `main` throughout.
- Cross-repo scope of the full rename wave (Need `7f9a464e-...`), out of scope for the ESM-code leg but track it:
  `sia-plugins/SIA-SESSION-PROTOCOL.md` (stale vocabulary), gravitas docs, Kurt's global `CLAUDE.md`.

---

## 7 Verification checklist

- [ ] `deno task test` passes (`esm/`)
- [ ] `create_entity` accepts `understanding` / `composition` / `mechanic`; rejects nothing it accepted before that still exists
- [ ] Existing nodes relabeled (no orphaned `:Constraint` / `:Discrepancy` if renamed); edge integrity intact
- [ ] `run_diagnostic` clean (no phantom sessions, no broken purpose edges)
- [ ] Overlay nodes (`node_role:"frame"`) still resolve by `layer` / `frame_key`
- [ ] Local DB reachable; `.env` repointed; Aura dump archived
- [ ] Re-embedding done if model/dimensions changed
