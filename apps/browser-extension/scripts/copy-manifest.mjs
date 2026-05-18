import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

await mkdir("dist", { recursive: true });
await copyFile(path.join("public", "manifest.json"), path.join("dist", "manifest.json"));
await rm(path.join("dist", "_locales"), { force: true, recursive: true });
await cp(path.join("public", "_locales"), path.join("dist", "_locales"), { recursive: true });
