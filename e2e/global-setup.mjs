import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Demo registries are shared. A leftover hold from yesterday's click would
 * make a "this item is free" spec pass or fail for the wrong reason, so every
 * e2e run starts from a known seed.
 */
export default function globalSetup() {
  if (process.env.SKIP_SEED === "1") return;

  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  try {
    execSync("docker compose exec -T api python -m app.seed", {
      cwd: root,
      stdio: "inherit",
    });
  } catch {
    throw new Error(
      "e2e needs the API container and a seed. Run: npm run services:up && npm run seed",
    );
  }
}
