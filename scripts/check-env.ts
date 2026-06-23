import { loadEnv } from "../src/env.ts";
import { getLlmConfig } from "../src/llm.ts";
await loadEnv();
console.log(getLlmConfig());
