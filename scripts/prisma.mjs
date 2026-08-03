#!/usr/bin/env node
/**
 * Thin wrapper around the Prisma CLI.
 *
 * Prisma 5 caches its query engine in ~/.cache/prisma. On this machine that
 * directory is owned by root (a known old-npm bug), so the CLI dies with
 * `EPERM: operation not permitted, utime`. Prisma 5 has no env var to move the
 * cache, but it derives the path from $HOME — so we point HOME at a
 * project-local directory for the duration of the command only.
 *
 * Harmless on a healthy machine: it just keeps the engine cache next to the
 * project instead of in the home directory.
 *
 * The permanent fix, which needs your password, is:
 *   sudo chown -R "$(id -u):$(id -g)" ~/.cache/prisma ~/.npm
 * Once that is done you can call `prisma` directly and delete this wrapper.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prismaHome = join(root, ".prisma-home");
mkdirSync(prismaHome, { recursive: true });

const result = spawnSync("npx", ["prisma", ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, HOME: prismaHome },
});

process.exit(result.status ?? 1);
