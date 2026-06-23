# ESIM Skills

[Claude Code](https://claude.com/claude-code) skills that turn ESIM's raw graph into a guided, **structured-intent** practice. Each skill is a `SKILL.md` file with frontmatter (name, description, allowed ESIM tools) and a body of operating instructions the assistant follows.

## Skills

| Skill | What it does |
|-------|--------------|
| [`purpose-discovery`](purpose-discovery/SKILL.md) | Facilitates a first structured-intent session — discover an entity's core purpose, constraint stack, needs, and friction, and write the foundational graph. A one-time (or occasional) facilitated session. |
| [`session-protocol`](session-protocol/SKILL.md) | Operational protocol for *any* ESIM session — how to load context, calibrate intent, capture signals richly, and keep the graph synchronized with the live conversation. Best loaded as standing context for every session. |
| [`signal-processing`](signal-processing/SKILL.md) | Processes the backlog of captured `Signal`s into graph updates — classify, link, evaluate, resolve. The engine that keeps the graph calibrated. Run periodically. |

## Loading a skill

1. **Register the ESIM MCP server.** The skills call `mcp__esim__*` tools, so the server must be registered as `esim` (see the repo [README](../README.md#mcp-connection)).
2. **Copy the skill into a directory your client reads** — your project's `.claude/skills/` or `~/.claude/skills/`:
   ```bash
   cp -r skills/purpose-discovery ~/.claude/skills/
   cp -r skills/session-protocol ~/.claude/skills/
   cp -r skills/signal-processing ~/.claude/skills/
   ```
3. **Use it:**
   - `purpose-discovery` — invoke with `/purpose-discovery`.
   - `session-protocol` — reference it from your project's `CLAUDE.md` so it loads as standing context at the start of every ESIM session.
   - `signal-processing` — invoke with `/signal-processing` to process the unprocessed-signal backlog.

## The model these skills assume

Both skills operate on the **structured-intent** model ESIM implements: purpose lives on edges, every output reads through `(Needs + Resources) / Constraints = Output`, and constraints come in four types (belief, priority, approach, structure). If those terms are new, read [The Structured-Intent Model](../README.md#the-structured-intent-model) in the repo README first — it's the conceptual on-ramp the skills build on.
