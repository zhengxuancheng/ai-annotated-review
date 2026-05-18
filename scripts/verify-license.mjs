import { readFile } from "node:fs/promises";

const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
const blocked = [];
const blockedPattern = /\b(AGPL|GPL|LGPL)\b/i;

for (const [path, meta] of Object.entries(lock.packages ?? {})) {
  const license = String(meta.license ?? "");
  if (blockedPattern.test(license)) {
    blocked.push({ path, license });
  }
}

if (blocked.length > 0) {
  console.error(JSON.stringify({ ok: false, blocked }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, blocked }, null, 2));
