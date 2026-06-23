// Drop existing vector indexes so they can be recreated with new dimensions

import { runQuery, closeDriver } from "../src/db.ts";
import { loadEnv } from "../src/env.ts";

await loadEnv();

const indexes = [
  "entity_embeddings",
  "signal_embeddings",
  "session_embeddings",
  "discrepancy_embeddings",
];

for (const idx of indexes) {
  try {
    await runQuery({ cypher: `DROP INDEX ${idx}`, params: {} });
    console.log(`Dropped: ${idx}`);
  } catch (e) {
    console.log(`Skip ${idx}: ${(e as Error).message}`);
  }
}

await closeDriver();
