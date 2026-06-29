# ESIM Skills

[Agent Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills) that turn ESIM's raw graph into a guided, **structured-intent** practice. Each skill is a `SKILL.md` file with frontmatter (name, description, and — for Claude — allowed ESIM tools) and a body of operating instructions the assistant follows.

They use the standard Agent Skills format, so they work in any client that implements it — both **[Claude Code](https://claude.com/claude-code)** and the **[Antigravity CLI (agy)](https://antigravity.google)**. The skill bodies refer to ESIM tools by their bare names (`create_signal`, `get_context`, …), so they're portable across clients even though each client prefixes MCP tools differently. The Claude-only frontmatter fields (`model`, `allowed-tools`) are simply ignored by Antigravity.

## Skills

| Skill | What it does |
|-------|--------------|
| [`purpose-discovery`](purpose-discovery/SKILL.md) | Facilitates a first structured-intent session — discover an entity's core purpose, constraint stack, needs, and friction, and write the foundational graph. A one-time (or occasional) facilitated session. |
| [`session-protocol`](session-protocol/SKILL.md) | Operational protocol for *any* ESIM session — how to load context, calibrate intent, capture signals richly, and keep the graph synchronized with the live conversation. Best loaded as standing context for every session. |
| [`signal-processing`](signal-processing/SKILL.md) | Processes the backlog of captured `Signal`s into graph updates — classify, link, evaluate, resolve. The engine that keeps the graph calibrated. Run periodically. |

## Loading a skill

**Step 0 — register the ESIM MCP server (both clients).** The skills drive the ESIM tools, so the server must be registered as `esim` first (see the repo [README](../README.md#mcp-connection)).

### Claude Code

1. **Copy the skill into a directory Claude reads** — your project's `.claude/skills/` or `~/.claude/skills/`:
   ```bash
   cp -r skills/purpose-discovery ~/.claude/skills/
   cp -r skills/session-protocol ~/.claude/skills/
   cp -r skills/signal-processing ~/.claude/skills/
   ```
2. **Use it:**
   - `purpose-discovery` — invoke with `/purpose-discovery`.
   - `session-protocol` — reference it from your project's `CLAUDE.md` so it loads as standing context at the start of every ESIM session.
   - `signal-processing` — invoke with `/signal-processing` to process the unprocessed-signal backlog.

### Antigravity CLI (`agy`)

The same `SKILL.md` files work unchanged — Antigravity reads the standard Agent Skills format and ignores the Claude-only frontmatter.

To load the skills in `agy`, register them via `skills.json` in your workspace's customizations directory:

1. **Create the workspace customization directory**:
   ```bash
   mkdir -p .agents
   ```
2. **Create/update `.agents/skills.json`** to reference the `esim/skills` path:
   ```json
   {
     "entries": [
       { "path": "/absolute/path/to/esim/skills" }
     ]
   }
   ```
   *Note: You can use an absolute path or a path relative to the active workspace.*

3. **Verify and Use**:
   Start `agy` and type `/skills` to verify that the three skills appear as active. They will activate automatically when a user request matches their `description`, or they can be standing context if referenced in your workspace instructions.

## The model these skills assume

Both skills operate on the **structured-intent** model ESIM implements: purpose lives on edges, every output reads through `(Needs + Resources) / Constraints = Output`, and constraints come in four types (belief, priority, approach, structure). If those terms are new, read [The Structured-Intent Model](../README.md#the-structured-intent-model) in the repo README first — it's the conceptual on-ramp the skills build on.
