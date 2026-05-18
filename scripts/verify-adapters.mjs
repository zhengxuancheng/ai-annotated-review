import { execFile } from "node:child_process";
import { access, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const evidence = [];

await verifyBrowserExtension();
await verifyCliAdapter();

console.log(
  JSON.stringify(
    {
      ok: true,
      evidenceCount: evidence.length,
      evidence
    },
    null,
    2
  )
);

async function verifyBrowserExtension() {
  const manifest = JSON.parse(await readFile("apps/browser-extension/dist/manifest.json", "utf8"));
  const expectedHostPermissions = [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://claude.ai/*"
  ];
  const expectedPermissions = ["activeTab", "scripting", "sidePanel"];

  assert(manifest.manifest_version === 3, "browser extension must use Manifest V3.");
  assert(
    manifest.side_panel?.default_path === "index.html",
    "browser extension must declare an index.html side panel."
  );
  assertSetsEqual(
    manifest.host_permissions ?? [],
    expectedHostPermissions,
    "browser extension host permissions must stay exact."
  );
  assertSetsEqual(
    manifest.permissions ?? [],
    expectedPermissions,
    "browser extension permissions must stay minimal."
  );
  assert(
    !(manifest.host_permissions ?? []).some((permission) =>
      permission === "<all_urls>" || permission.startsWith("*://")
    ),
    "browser extension must not request broad host access."
  );
  await access("apps/browser-extension/dist/service-worker.js");
  await access("apps/browser-extension/dist/voice-permission.html");

  const hostIntegration = await readFile("apps/chatgpt-app/web/src/hostIntegrations.ts", "utf8");
  assert(
    hostIntegration.includes("window.getSelection()?.toString()"),
    "browser extension must read user-selected text only."
  );
  assert(
    hostIntegration.includes("voice-permission.html"),
    "browser extension must open a dedicated microphone permission page for voice dictation."
  );
  assert(
    !hostIntegration.includes("document.body.innerText") &&
      !hostIntegration.includes("document.documentElement.innerText"),
    "browser extension must not scrape whole page text."
  );
  record("Browser extension manifest and selection boundary verified", {
    hostPermissions: manifest.host_permissions,
    permissions: manifest.permissions,
    microphonePermissionPage: "voice-permission.html"
  });
}

async function verifyCliAdapter() {
  const workspace = await mkdtemp(path.join(tmpdir(), "aiar-cli-"));
  const sessionPath = path.join(workspace, "review-session.json");
  const packPath = path.join(workspace, "revision-pack.md");

  await runNode([
    "apps/cli/dist/index.js",
    "create",
    "examples/fixtures/product-plan.md",
    "--out",
    sessionPath,
    "--title",
    "Adapter Smoke",
    "--source-label",
    "CLI smoke"
  ]);

  const session = JSON.parse(await readFile(sessionPath, "utf8"));
  assert(session.document.blocks.length >= 5, "CLI create must produce review blocks.");
  const blockId = session.document.blocks[1]?.id ?? session.document.blocks[0]?.id;
  assert(typeof blockId === "string" && blockId.length > 0, "CLI smoke needs a block id.");

  const blocksOutput = await runNode(["apps/cli/dist/index.js", "blocks", sessionPath]);
  assert(blocksOutput.stdout.includes(blockId), "CLI blocks output must include real block ids.");

  await runNode([
    "apps/cli/dist/index.js",
    "annotate",
    sessionPath,
    "--block",
    blockId,
    "--title",
    "Clarify CLI workflow",
    "--body",
    "Make this section usable from terminal-based assistants.",
    "--priority",
    "P1",
    "--status",
    "confirmed",
    "--out",
    sessionPath
  ]);

  const annotated = JSON.parse(await readFile(sessionPath, "utf8"));
  assert(
    annotated.annotations.some(
      (annotation) =>
        annotation.blockId === blockId &&
        annotation.title === "Clarify CLI workflow" &&
        annotation.status === "confirmed"
    ),
    "CLI annotate must attach a confirmed annotation to the target block."
  );

  await runNode(["apps/cli/dist/index.js", "pack", sessionPath, "--out", packPath]);
  const pack = await readFile(packPath, "utf8");
  assert(pack.includes("Clarify CLI workflow"), "CLI pack must include confirmed annotations.");
  assert(
    pack.includes("Make this section usable from terminal-based assistants."),
    "CLI pack must preserve the annotation body."
  );
  record("CLI adapter create, blocks, annotate, and pack commands verified", {
    blockId,
    packChars: pack.length
  });
}

async function runNode(args) {
  return execFileAsync(process.execPath, args, {
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024
  });
}

function record(name, details) {
  evidence.push({ name, details });
}

function assertSetsEqual(actual, expected, message) {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  assert(
    actualSorted.length === expectedSorted.length &&
      actualSorted.every((value, index) => value === expectedSorted[index]),
    `${message} Actual: ${JSON.stringify(actualSorted)}`
  );
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
