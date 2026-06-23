// ESIM — Environment variable loading
import { resolve } from "node:path";

export async function loadEnv(): Promise<void> {
  const alreadyLoaded = Deno.env.get("ESIM_ENV_LOADED");
  const explicit = Deno.env.get("ESIM_ENV_FILE");
  // Skip reload only if no explicit override is requested
  if (alreadyLoaded && !explicit) return;

  // Resolve repo root from script location (works regardless of cwd)
  const repoRoot = resolve(import.meta.dirname!, "..");

  // Explicit override first, then config directory, then repo-local fallback
  const home = Deno.env.get("HOME");
  const candidates = [
    ...(explicit ? [explicit.replace(/^~/, home!)] : []),
    `${home}/.config/env/esim.env`,
    `${repoRoot}/.env`,
  ];

  for (const envPath of candidates) {
    try {
      const envContent = await Deno.readTextFile(envPath);
      for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        // Handle "export KEY=VALUE" or "KEY=VALUE", with optional quotes
        const match = trimmed.match(/^(?:export\s+)?(\w+)=(.*)$/);
        if (match) {
          let value = match[2];
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          Deno.env.set(match[1], value);
        }
      }
      Deno.env.set("ESIM_ENV_LOADED", "1");
      console.error(`[esim] env loaded from: ${envPath}`);
      return; // Stop after first successful load
    } catch {
      // Try next candidate
    }
  }
}
