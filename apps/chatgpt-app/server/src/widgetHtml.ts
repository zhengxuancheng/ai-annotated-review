import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadWidgetHtml(): string {
  const distDir = path.resolve(__dirname, "../../web/dist");
  const indexPath = path.join(distDir, "index.html");

  if (!existsSync(indexPath)) {
    return fallbackHtml(
      `Widget build not found at ${distDir}. Run "npm run build -w @ai-annotated-review/chatgpt-app-web" first.`
    );
  }

  const html = readFileSync(indexPath, "utf8");
  return inlineViteAssets(html, distDir);
}

function inlineViteAssets(html: string, distDir: string): string {
  const withStyles = html.replace(
    /<link rel="stylesheet" crossorigin href="([^"]+)">/g,
	    (_match, href: string) => {
	      const cssPath = resolveAssetPath(distDir, href);
	      return `<style>${escapeStyleContent(readFileSync(cssPath, "utf8"))}</style>`;
	    }
	  );

  return withStyles.replace(
    /<script type="module" crossorigin src="([^"]+)"><\/script>/g,
	    (_match, src: string) => {
	      const scriptPath = resolveAssetPath(distDir, src);
	      return `<script type="module">${escapeScriptContent(readFileSync(scriptPath, "utf8"))}</script>`;
	    }
	  );
}

function resolveAssetPath(distDir: string, assetHref: string): string {
  const normalized = assetHref.replace(/^\//, "");
  const direct = path.join(distDir, normalized);
  if (existsSync(direct)) return direct;

  throw new Error(`Could not resolve widget asset ${assetHref}`);
}

function escapeScriptContent(value: string): string {
  return value.replace(/<\/script/gi, "<\\/script");
}

function escapeStyleContent(value: string): string {
  return value.replace(/<\/style/gi, "<\\/style");
}

function fallbackHtml(message: string): string {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; font: 14px system-ui, sans-serif; color: #172033; background: #f7f8fa; }
      main { padding: 20px; border: 1px solid #d9dee8; background: white; }
      code { background: #eef1f6; padding: 2px 4px; border-radius: 4px; }
    </style>
  </head>
  <body>
    <main>
      <strong>AI Annotated Review widget is not built.</strong>
      <p>${escapeHtml(message)}</p>
    </main>
  </body>
</html>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
