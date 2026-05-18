import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

await mkdir("dist", { recursive: true });
await copyFile(path.join("public", "manifest.json"), path.join("dist", "manifest.json"));
