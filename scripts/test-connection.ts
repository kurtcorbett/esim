import { loadEnv } from "../src/env.ts";
await loadEnv();
const uri = Deno.env.get("NEO4J_DB_CONNECTION_URI");
const user = Deno.env.get("NEO4J_DB_USERNAME");
const pass = Deno.env.get("NEO4J_DB_PASSWORD");
console.log("URI:", uri);
console.log("User:", user);
import neo4j from "neo4j-driver";
const driver = neo4j.driver(uri!, neo4j.auth.basic(user!, pass!));
try {
  const info = await driver.getServerInfo();
  console.log("Connected:", info.address, info.protocolVersion);
  const session = driver.session();
  const result = await session.run("MATCH (n) RETURN count(n) as count");
  console.log("Node count:", result.records[0].get("count").toNumber());
  await session.close();
} catch (e) {
  console.error("FULL ERROR:", e);
}
await driver.close();
