#!/usr/bin/env node
/**
 * Starts `next dev` in its own session and returns once it answers.
 *
 * Exists because a dev server has no completion event: anything that starts it
 * in the foreground waits forever, and `nohup ... &` is not enough either, since
 * the server stays in the caller's process group and dies with it. `detached`
 * gives it a new session, so it outlives whatever shell started it.
 *
 * Waiting for the port before exiting is the other half: a caller that takes
 * screenshots needs the server up, not merely spawned.
 *
 * Usage: node tools/dev-bg.mjs        (PORT=3000)
 *        npm run dev:stop             to stop it
 */
import { spawn } from "node:child_process";
import { mkdirSync, openSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PORT = Number(process.env.PORT ?? 3000);
const LOG_DIR = ".logs";
const LOG = join(LOG_DIR, "web-dev.log");
const PID = join(LOG_DIR, "web-dev.pid");
const BASE = `http://localhost:${PORT}`;

async function answers() {
  try {
    const res = await fetch(BASE, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

if (await answers()) {
  console.log(`already up on ${BASE}`);
  process.exit(0);
}

mkdirSync(LOG_DIR, { recursive: true });
const log = openSync(LOG, "a");

const child = spawn("npm", ["run", "dev"], {
  detached: true,
  stdio: ["ignore", log, log],
  env: { ...process.env, PORT: String(PORT) },
});
child.unref();
writeFileSync(PID, `${child.pid}\n`);

for (let attempt = 0; attempt < 60; attempt++) {
  await new Promise((r) => setTimeout(r, 1000));
  if (await answers()) {
    console.log(`up on ${BASE} (pid ${child.pid}, log ${LOG})`);
    process.exit(0);
  }
}

console.error(`no answer from ${BASE} after 60s — see ${LOG}`);
process.exit(1);
