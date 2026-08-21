import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";

async function copyIfExists(source, destination) {
  if (!existsSync(source)) return;
  await rm(destination, { force: true, recursive: true });
  await mkdir(destination.replace(/\/[^/]+$/, ""), { recursive: true });
  await cp(source, destination, { recursive: true });
}

await copyIfExists(".next/static", ".next/standalone/.next/static");
await copyIfExists("public", ".next/standalone/public");
await mkdir(".next/standalone/.next/cache", { recursive: true });
