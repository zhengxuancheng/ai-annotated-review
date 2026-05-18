import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";

const execFileAsync = promisify(execFile);

const root = process.cwd();
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const version = packageJson.version;
const distDir = path.join(root, "apps", "browser-extension", "dist");
const outputDir = path.join(root, "release-artifacts");
const zipName = `ai-annotated-review-companion-v${version}.zip`;
const zipPath = path.join(outputDir, zipName);
const shaPath = `${zipPath}.sha256`;

await mkdir(outputDir, { recursive: true });
await rm(zipPath, { force: true });
await rm(shaPath, { force: true });

await execFileAsync("zip", ["-r", zipPath, "."], { cwd: distDir });

const zipBuffer = await readFile(zipPath);
const digest = createHash("sha256").update(zipBuffer).digest("hex");
await writeFile(shaPath, `${digest}  ${zipName}\n`, "utf8");

console.log(
  JSON.stringify(
    {
      ok: true,
      version,
      zipPath,
      shaPath,
      sha256: digest,
      bytes: zipBuffer.length
    },
    null,
    2
  )
);
