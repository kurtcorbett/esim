// Migrate signal nodes from schema v1 to v2 field names
// concrete_data → observation, interpretation → context,
// source_type → how_observed, altitude removed

import { loadEnv } from "../src/env.ts";
import { runQuery, closeDriver } from "../src/db.ts";

loadEnv();

const r1 = await runQuery({
  cypher: `MATCH (s:Signal) WHERE s.concrete_data IS NOT NULL
SET s.observation = s.concrete_data REMOVE s.concrete_data
RETURN count(s) AS migrated`,
  params: {},
});
console.log("concrete_data → observation:", r1);

const r2 = await runQuery({
  cypher: `MATCH (s:Signal) WHERE s.interpretation IS NOT NULL
SET s.context = s.interpretation REMOVE s.interpretation
RETURN count(s) AS migrated`,
  params: {},
});
console.log("interpretation → context:", r2);

const r3 = await runQuery({
  cypher: `MATCH (s:Signal) WHERE s.source_type IS NOT NULL AND s.how_observed IS NULL
SET s.how_observed = s.source_type REMOVE s.source_type
RETURN count(s) AS migrated`,
  params: {},
});
console.log("source_type → how_observed (new):", r3);

const r4 = await runQuery({
  cypher: `MATCH (s:Signal) WHERE s.source_type IS NOT NULL AND s.how_observed IS NOT NULL
REMOVE s.source_type RETURN count(s) AS cleaned`,
  params: {},
});
console.log("source_type cleanup (already had how_observed):", r4);

const r5 = await runQuery({
  cypher: `MATCH (s:Signal) WHERE s.altitude IS NOT NULL
REMOVE s.altitude RETURN count(s) AS cleaned`,
  params: {},
});
console.log("altitude removed:", r5);

await closeDriver();
console.log("Migration complete.");
