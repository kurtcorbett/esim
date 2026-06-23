// Migrate to the canonical six-layer / purpose-primitive naming:
//   constraint_type:      belief    → understanding,  structure → mechanics
//   Discrepancy.altitude: belief    → understanding,  structure → mechanics
//   PURPOSE.purpose_type: change    → transform
//
// Run once against an existing graph after upgrading to the renamed enums.
// Idempotent: re-running it is a no-op (nothing left matches the old values).
//
//   deno run --allow-net --allow-env --allow-read --allow-sys scripts/migrate-constraint-naming.ts

import { loadEnv } from "../src/env.ts";
import { runQuery, closeDriver } from "../src/db.ts";

loadEnv();

const c1 = await runQuery({
  cypher: `MATCH (c:Constraint) WHERE c.constraint_type = 'belief'
SET c.constraint_type = 'understanding' RETURN count(c) AS migrated`,
  params: {},
});
console.log("Constraint belief → understanding:", c1);

const c2 = await runQuery({
  cypher: `MATCH (c:Constraint) WHERE c.constraint_type = 'structure'
SET c.constraint_type = 'mechanics' RETURN count(c) AS migrated`,
  params: {},
});
console.log("Constraint structure → mechanics:", c2);

const d1 = await runQuery({
  cypher: `MATCH (d:Discrepancy) WHERE d.altitude = 'belief'
SET d.altitude = 'understanding' RETURN count(d) AS migrated`,
  params: {},
});
console.log("Discrepancy altitude belief → understanding:", d1);

const d2 = await runQuery({
  cypher: `MATCH (d:Discrepancy) WHERE d.altitude = 'structure'
SET d.altitude = 'mechanics' RETURN count(d) AS migrated`,
  params: {},
});
console.log("Discrepancy altitude structure → mechanics:", d2);

const p1 = await runQuery({
  cypher: `MATCH ()-[r:PURPOSE]->() WHERE r.purpose_type = 'change'
SET r.purpose_type = 'transform' RETURN count(r) AS migrated`,
  params: {},
});
console.log("PURPOSE purpose_type change → transform:", p1);

await closeDriver();
console.log("Migration complete.");
