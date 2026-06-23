// Restore deleted Signal nodes from backup extract

import { runQuery, closeDriver } from "../src/db.ts";
import { loadEnv } from "../src/env.ts";

await loadEnv();

const raw = await Deno.readTextFile("backups/signals-to-restore.json");
const signals: { labels: string[]; properties: Record<string, unknown> }[] = JSON.parse(raw);

console.log(`Restoring ${signals.length} signals...`);

for (const signal of signals) {
  const props = signal.properties;
  // Remove the 'labels' key that got serialized as a node property (artifact of toPlain)
  delete props.labels;

  const id = props.id as string;
  const name = (props.name as string) || id;

  try {
    // Use MERGE to avoid duplicates if run twice
    await runQuery({
      cypher: `
        MERGE (s:Signal {id: $id})
        SET s = $props
      `,
      params: { id, props },
    });
    console.log(`  Restored: ${name}`);
  } catch (e) {
    console.error(`  FAILED: ${name} — ${(e as Error).message}`);
  }
}

console.log("Done.");
await closeDriver();
