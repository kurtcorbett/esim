// ESIM — Export all nodes and relationships to a JSON backup file

import { runQuery, closeDriver } from "../src/db.ts";
import { loadEnv } from "../src/env.ts";

await loadEnv();

console.log("Exporting nodes...");
const nodes = await runQuery({
  cypher: `MATCH (n) RETURN n, labels(n) AS labels`,
  params: {},
});

console.log(`  Found ${nodes.length} nodes`);

console.log("Exporting relationships...");
const rels = await runQuery({
  cypher: `MATCH (a)-[r]->(b) RETURN a.id AS from, type(r) AS type, properties(r) AS props, b.id AS to`,
  params: {},
});

console.log(`  Found ${rels.length} relationships`);

const backup = {
  exportedAt: new Date().toISOString(),
  nodes,
  relationships: rels,
};

const outPath = `backups/esim-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
await Deno.mkdir("backups", { recursive: true });
await Deno.writeTextFile(outPath, JSON.stringify(backup, null, 2));

console.log(`Backup written to ${outPath}`);
await closeDriver();
