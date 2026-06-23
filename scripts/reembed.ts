// Re-embed all nodes whose embedding dimensions don't match the configured model

import { runQuery, closeDriver } from "../src/db.ts";
import { loadEnv } from "../src/env.ts";
import { getEmbedding, getLlmConfig } from "../src/llm.ts";

await loadEnv();

const { embeddingDimensions } = getLlmConfig();
console.log(`Target dimensions: ${embeddingDimensions}`);

// Find all nodes with embeddings that need updating
const stale = await runQuery<{ id: string; label: string; content: string; dims: number }>({
  cypher: `
    MATCH (n)
    WHERE n.embedding IS NOT NULL AND n.content IS NOT NULL AND size(n.embedding) <> $dims
    RETURN n.id AS id, head(labels(n)) AS label, n.content AS content, size(n.embedding) AS dims
  `,
  params: { dims: embeddingDimensions },
});

console.log(`Found ${stale.length} nodes to re-embed (currently wrong dimensions)\n`);

let success = 0;
let failed = 0;

for (const node of stale) {
  try {
    const embedding = await getEmbedding(node.content);
    await runQuery({
      cypher: `MATCH (n {id: $id}) SET n.embedding = $embedding`,
      params: { id: node.id, embedding },
    });
    success++;
    console.log(`  [${success}/${stale.length}] ${node.label}: ${node.id.slice(0, 8)}… (${node.dims} → ${embedding.length})`);
  } catch (e) {
    failed++;
    console.error(`  FAILED: ${node.id} — ${(e as Error).message}`);
  }
}

console.log(`\nDone. ${success} re-embedded, ${failed} failed.`);
await closeDriver();
