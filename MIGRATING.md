# Migrating to ESIM

This release renames the project — **ESM → ESIM** (External Structured Intent Memory) — and makes two breaking schema changes. If you were running the previous `esm` master, follow this guide to upgrade. Budget ~10 minutes.

## What changed

**Breaking — require action:**

| # | Change | Affects |
|---|--------|---------|
| 1 | **Project renamed `ESM` → `ESIM`** | MCP server registration, env var/file names, repo/dir name |
| 2 | **Constraint layer naming** — `Constraint.constraint_type` and `Discrepancy.altitude`: `belief` → `understanding`, `structure` → `mechanics` | existing graph data |
| 3 | **Purpose primitive naming** — `PURPOSE.purpose_type`: `change` → `transform` | existing graph data |

**Non-breaking — no action needed** (listed for awareness):

- The Signal metadata extractor now emits `how_observed` instead of `source_type`, matching the `SignalNode` schema. New captures are correct automatically. Only act if you have legacy `source_type` fields from earlier `capture` calls — see [step 4](#4-optional-legacy-signal-fields).

> The constraint-layer model is now documented in the README under [The Structured-Intent Model](README.md#the-structured-intent-model) — the six layers (Purpose, Understanding, Priorities, Approaches, Composition, Mechanics) mapped onto ESIM's existing primitives.

---

## 1. Back up your graph first

```bash
deno run --allow-net --allow-env --allow-read --allow-sys scripts/backup.ts
```

This writes a full JSON export to `backups/`. Restore tooling lives in `scripts/restore-signals.ts` if you need it.

## 2. Update the code

```bash
git pull        # on the renamed repo (origin will be github.com/<you>/esim)
deno task test  # sanity check — should be all green
```

## 3. Migrate your graph data (the breaking value renames)

One idempotent script handles all three value renames (constraint types, discrepancy altitudes, and purpose types):

```bash
deno run --allow-net --allow-env --allow-read --allow-sys scripts/migrate-constraint-naming.ts
```

It rewrites, in place:

- `Constraint.constraint_type`: `belief` → `understanding`, `structure` → `mechanics`
- `Discrepancy.altitude`: `belief` → `understanding`, `structure` → `mechanics`
- `PURPOSE.purpose_type`: `change` → `transform`

It prints how many nodes/edges it touched per rename. It's safe to run more than once — a second run reports `0` for everything, which is also how you verify a clean migration.

## 4. (Optional) Legacy Signal fields

If you ever created Signals via `capture` (auto-classification) on an older build, you may have stale field names. Migrate them with:

```bash
deno run --allow-net --allow-env --allow-read --allow-sys scripts/migrate-signal-v2.ts
```

(`source_type` → `how_observed`, plus older v1→v2 field renames.) Skip this if you only ever used `create_signal`.

## 5. Update your environment for the rename

**Env file / variable.** The default env file is now `esim.env` and the override variable is `ESIM_ENV_FILE`:

```bash
mv ~/.config/env/esm.env ~/.config/env/esim.env
# if you set the override var anywhere, rename ESM_ENV_FILE -> ESIM_ENV_FILE
```

**MCP server registration.** The bundled skills call `mcp__esim__*` tools, so the server must be registered as `esim`:

```bash
claude mcp remove esm
claude mcp add esim -- deno run --allow-net --allow-env --allow-read --allow-sys \
  /absolute/path/to/esim/src/main.ts
```

> Prefer to keep the registration name `esm`? You can — just update the `mcp__esim__` prefixes in the `skills/**/SKILL.md` `allowed-tools` (and bodies) back to `mcp__esm__`. Re-registering as `esim` is the lower-friction path.

**Repo / directory.** Optional but recommended for consistency: rename your local clone directory to `esim`, and (if you forked) the GitHub repo to `esim`, then `git remote set-url origin …/esim.git`.

## 6. Verify

```bash
deno run --allow-net --allow-env --allow-read --allow-sys scripts/test-connection.ts   # connection OK
deno run --allow-net --allow-env --allow-read --allow-sys scripts/migrate-constraint-naming.ts  # should report 0 across the board
```

In your AI client, confirm the `esim` tools are available and a quick `stats` call succeeds. You're migrated.
