import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { chromium } from "playwright-core";

const PORT = parsePort(process.env.SMOKE_UI_PORT, 5174);
const URL = `http://127.0.0.1:${PORT}/`;
const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
];

const executablePath = process.env.CHROME_PATH ?? CHROME_CANDIDATES.find(existsSync);
if (!executablePath) {
  throw new Error("No local Chromium-compatible browser found. Set CHROME_PATH to run smoke:ui.");
}

const vite = spawn(
  "npm",
  [
    "run",
    "dev",
    "-w",
    "@ai-annotated-review/chatgpt-app-web",
    "--",
    "--port",
    String(PORT),
    "--strictPort"
  ],
  { stdio: ["ignore", "pipe", "pipe"] }
);

const logs = [];
vite.stdout.on("data", (chunk) => logs.push(String(chunk)));
vite.stderr.on("data", (chunk) => logs.push(String(chunk)));

let browser;

try {
  await waitForHttp(URL);
  browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.addInitScript((session) => {
    const bridge = {
      toolResponseMetadata: { reviewSession: session },
      widgetState: null,
      setWidgetState(state) {
        this.widgetState = state;
        window.dispatchEvent(
          new CustomEvent("openai:set_globals", {
            detail: { globals: this }
          })
        );
      },
      sendFollowUpMessage(message) {
        window.__lastFollowUpMessage = message;
      },
      requestDisplayMode(input) {
        window.__lastDisplayMode = input;
      }
    };
    window.openai = bridge;
  }, createBridgeEchoSession());
  const consoleMessages = [];
  page.on("console", (message) => {
    const text = `${message.type()}: ${message.text()}`;
    if (!text.includes("[vite]") && !text.includes("React DevTools")) {
      consoleMessages.push(text);
    }
  });

  await page.goto(URL, { waitUntil: "networkidle" });
  await page.getByText("AI Annotated Review Demo Report").first().waitFor();

  await addAnnotation(page, 2, {
    body: "Name the actual review failure mode instead of staying abstract."
  });
  await addAnnotation(page, 4, {
    body: "State that the app renders its own iframe review UI and does not modify native ChatGPT bubbles."
  });
  await addAnnotation(page, 6, {
    body: "Do not add accounts or sync to this demo."
  });
  await page.locator(".annotation-row").last().locator("select").nth(1).selectOption("rejected");

  const rowCount = await page.locator(".annotation-row").count();
  await page.getByRole("button", { name: /Build pack/ }).click();
  const packText = await page.locator(".pack-preview").inputValue();
  await page.getByRole("button", { name: /Export pack/ }).waitFor();
  await page.getByRole("button", { name: /Send revision request/ }).click();
  await page.getByRole("dialog", { name: /Confirm send/ }).waitFor();
  const modalText = await page.locator(".modal-preview").inputValue();
  await page.getByRole("button", { name: /Confirm and send/ }).click();
  await page.getByText("Revision request sent.").waitFor();
  const sentFollowUp = await page.evaluate(() => window.__lastFollowUpMessage ?? null);

  const errorMessages = consoleMessages.filter((line) => line.startsWith("error:"));
  assert(rowCount === 3, `expected 3 annotation rows, got ${rowCount}`);
  assert(packText.includes("Name the actual review failure mode"), "pack missing first confirmed annotation");
  assert(packText.includes("renders its own iframe review UI"), "pack missing second confirmed annotation");
  assert(!packText.includes("Do not add accounts or sync"), "pack included rejected annotation");
  assert(modalText === packText, "confirmation modal did not match pack preview");
  assert(sentFollowUp?.prompt === packText, "sendFollowUpMessage did not receive the pack prompt");
  assert(sentFollowUp?.scrollToBottom === true, "sendFollowUpMessage did not request scrollToBottom");
  assert(errorMessages.length === 0, `browser console errors:\n${errorMessages.join("\n")}`);

  const standalonePage = await browser.newPage({ viewport: { width: 390, height: 860 } });
  const standaloneConsoleMessages = [];
  standalonePage.on("console", (message) => {
    const text = `${message.type()}: ${message.text()}`;
    if (!text.includes("[vite]") && !text.includes("React DevTools")) {
      standaloneConsoleMessages.push(text);
    }
  });
  await standalonePage.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        async writeText(text) {
          window.__copiedRevisionRequest = text;
        }
      }
    });
  });
  await standalonePage.goto(URL, { waitUntil: "networkidle" });
  await standalonePage.getByText("AI Annotated Review Demo Report").first().waitFor();
  await addAnnotation(standalonePage, 2, {
    body: "Make this paragraph concrete with one before-and-after example."
  });
  await standalonePage.getByRole("button", { name: /Build pack/ }).click();
  const copyButton = standalonePage.getByRole("button", { name: /^Copy$/ });
  await copyButton.waitFor();
  await standalonePage.waitForTimeout(250);
  const copyButtonBox = await copyButton.boundingBox();
  assert(copyButtonBox && copyButtonBox.y >= 0 && copyButtonBox.y < 860, "Build pack did not scroll the copy action into view.");
  const standalonePackText = await standalonePage.locator(".pack-preview").inputValue();
  await copyButton.click();
  assert(
    (await standalonePage.getByRole("dialog", { name: /Confirm send/ }).count()) === 0,
    "Copy must not open a confirmation dialog in copy mode."
  );
  const copiedText = await standalonePage.evaluate(() => window.__copiedRevisionRequest ?? null);
  assert(copiedText === standalonePackText, "Copy did not copy the pack directly.");
  const copiedToast = standalonePage.getByRole("status").filter({ hasText: /^(Copied|已复制)$/ });
  await copiedToast.waitFor();
  await copiedToast.waitFor({ state: "hidden", timeout: 5_000 });
  const standaloneErrorMessages = standaloneConsoleMessages.filter((line) => line.startsWith("error:"));
  assert(
    standaloneErrorMessages.length === 0,
    `standalone browser console errors:\n${standaloneErrorMessages.join("\n")}`
  );

  const extensionPage = await browser.newPage({ viewport: { width: 390, height: 860 } });
  await extensionPage.addInitScript(() => {
    const fakeChrome = {
      runtime: {
        id: "test-extension",
        getURL(path) {
          return `chrome-extension://test-extension/${path}`;
        }
      },
      tabs: {
        async query() {
          return [{ id: 1, title: "ChatGPT", url: "https://chatgpt.com/" }];
        },
        async create(input) {
          window.__openedMicrophonePermissionUrl = input.url;
          return { id: 2, url: input.url };
        }
      },
      scripting: {
        async executeScript() {
          return [{ result: "" }];
        }
      }
    };
    Object.assign(window.chrome, fakeChrome);
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: {
        async query(input) {
          if (input.name === "microphone") return { state: "prompt" };
          return { state: "granted" };
        }
      }
    });
    class FakeSpeechRecognition {
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      lang = "en-US";
      onend = null;
      onerror = null;
      onresult = null;
      abort() {}
      stop() {}
      start() {
        window.__speechRecognitionStarted = true;
      }
    }
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition
    });
  });
  await extensionPage.goto(URL, { waitUntil: "networkidle" });
  await extensionPage.getByText("AI Annotated Review Demo Report").first().waitFor();
  const extensionBlock = extensionPage.locator(".review-block").nth(2);
  await extensionBlock.locator(".add-block-button").click();
  const extensionComposer = extensionBlock.locator(".inline-composer");
  await extensionComposer.waitFor();
  await extensionComposer.getByRole("button", { name: /Dictate/ }).click();
  const openedPermissionUrl = await extensionPage.evaluate(
    () => window.__openedMicrophonePermissionUrl ?? null
  );
  const speechStartedBeforePermission = await extensionPage.evaluate(
    () => Boolean(window.__speechRecognitionStarted)
  );
  assert(
    openedPermissionUrl === "chrome-extension://test-extension/voice-permission.html",
    `Dictate must open the extension microphone permission page before listening, got ${openedPermissionUrl}`
  );
  assert(
    !speechStartedBeforePermission,
    "Dictate must not start speech recognition before extension microphone permission is granted."
  );
  await extensionComposer.getByText(/microphone permission/i).waitFor();

  const dictationPage = await browser.newPage({ viewport: { width: 390, height: 860 } });
  await dictationPage.addInitScript(() => {
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: {
        async query(input) {
          if (input.name === "microphone") return { state: "granted" };
          return { state: "granted" };
        }
      }
    });
    window.__speechRecognitionInstances = [];
    window.__speechPhraseHints = [];
    window.__speechRecognitionStartCount = 0;
    window.__speechRecognitionStopCount = 0;
    class FakeSpeechRecognitionPhrase {
      constructor(phrase, boost) {
        this.phrase = phrase;
        this.boost = boost;
        window.__speechPhraseHints.push({ phrase, boost });
      }
    }
    class FakeSpeechRecognition {
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      lang = "en-US";
      onend = null;
      onerror = null;
      onresult = null;
      abort() {}
      stop() {
        window.__speechRecognitionStopCount += 1;
        this.onend?.();
      }
      start() {
        window.__speechRecognitionStartCount += 1;
      }
    }
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition
    });
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition
    });
    Object.defineProperty(window, "SpeechRecognitionPhrase", {
      configurable: true,
      value: FakeSpeechRecognitionPhrase
    });
    const OriginalFakeSpeechRecognition = FakeSpeechRecognition;
    const TrackedSpeechRecognition = class TrackedSpeechRecognition extends OriginalFakeSpeechRecognition {
      constructor() {
        super();
        window.__speechRecognitionInstances.push(this);
      }
    };
    window.webkitSpeechRecognition = TrackedSpeechRecognition;
    window.SpeechRecognition = TrackedSpeechRecognition;
  });
  await dictationPage.goto(URL, { waitUntil: "networkidle" });
  await dictationPage.getByText("AI Annotated Review Demo Report").first().waitFor();
  const dictationBlock = dictationPage.locator(".review-block").nth(4);
  await dictationBlock.locator(".add-block-button").click();
  const dictationComposer = dictationBlock.locator(".inline-composer");
  await dictationComposer.waitFor();
  await dictationComposer.getByRole("button", { name: /Dictate/ }).click();
  await dictationComposer.getByRole("button", { name: /Stop/ }).waitFor();
  const recognitionConfig = await dictationPage.evaluate(() => {
    const instance = window.__speechRecognitionInstances[0];
    return {
      continuous: instance?.continuous,
      interimResults: instance?.interimResults,
      startCount: window.__speechRecognitionStartCount,
      phraseHints: window.__speechPhraseHints
    };
  });
  assert(recognitionConfig.continuous === true, "Dictation must request continuous recognition.");
  assert(recognitionConfig.interimResults === true, "Dictation must request interim recognition results.");
  assert(recognitionConfig.startCount === 1, `expected one recognition start, got ${recognitionConfig.startCount}`);
  assert(
    recognitionConfig.phraseHints.some((hint) => hint.phrase === "ChatGPT") &&
      recognitionConfig.phraseHints.some((hint) => hint.phrase === "SDK"),
    "Dictation must pass review-block terms as speech phrase hints."
  );
  await dictationPage.evaluate(() => {
    const instance = window.__speechRecognitionInstances[0];
    const resultFor = (text) => ({ isFinal: true, 0: { transcript: text } });
    instance.onresult?.({ resultIndex: 0, results: [resultFor("第一段")] });
    instance.onresult?.({ resultIndex: 0, results: [resultFor("第二段")] });
  });
  await dictationPage.waitForFunction(() => {
    const textarea = document.querySelector(".inline-composer textarea");
    return textarea?.value.includes("第一段") && textarea.value.includes("第二段");
  });
  const dictatedText = await dictationComposer.locator("label").filter({ hasText: "Comment" }).locator("textarea").inputValue();
  assert(
    dictatedText.includes("第一段") && dictatedText.includes("第二段"),
    `Dictation must keep multiple final speech segments, got ${dictatedText}`
  );
  await dictationPage.evaluate(() => {
    window.__speechRecognitionInstances[0].onend?.();
  });
  await dictationPage.waitForFunction(() => window.__speechRecognitionStartCount === 2);
  await dictationComposer.getByRole("button", { name: /Stop/ }).waitFor();
  await dictationComposer.getByRole("button", { name: /Stop/ }).click();
  await dictationComposer.getByRole("button", { name: /Dictate/ }).waitFor();
  const stopState = await dictationPage.evaluate(() => ({
    startCount: window.__speechRecognitionStartCount,
    stopCount: window.__speechRecognitionStopCount
  }));
  assert(stopState.startCount === 2, `Dictation restarted after user stop; start count ${stopState.startCount}`);
  assert(stopState.stopCount === 1, `expected one user stop, got ${stopState.stopCount}`);

  const phraseFallbackPage = await browser.newPage({ viewport: { width: 390, height: 860 } });
  await phraseFallbackPage.addInitScript(() => {
    window.__speechRecognitionInstances = [];
    window.__speechRecognitionStartCount = 0;
    window.__speechPhraseHintAssignmentCount = 0;
    class FakeSpeechRecognitionPhrase {
      constructor(phrase, boost) {
        this.phrase = phrase;
        this.boost = boost;
      }
    }
    class FakeSpeechRecognition {
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      lang = "en-US";
      onend = null;
      onerror = null;
      onresult = null;
      set phrases(value) {
        this._phrases = value;
        window.__speechPhraseHintAssignmentCount += 1;
      }
      get phrases() {
        return this._phrases;
      }
      abort() {}
      stop() {
        this.onend?.();
      }
      start() {
        window.__speechRecognitionStartCount += 1;
        if (this._phrases?.length) {
          queueMicrotask(() => this.onerror?.({ error: "phrases-not-supported" }));
        }
      }
    }
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition
    });
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: FakeSpeechRecognition
    });
    Object.defineProperty(window, "SpeechRecognitionPhrase", {
      configurable: true,
      value: FakeSpeechRecognitionPhrase
    });
    const OriginalFakeSpeechRecognition = FakeSpeechRecognition;
    const TrackedSpeechRecognition = class TrackedSpeechRecognition extends OriginalFakeSpeechRecognition {
      constructor() {
        super();
        window.__speechRecognitionInstances.push(this);
      }
    };
    window.webkitSpeechRecognition = TrackedSpeechRecognition;
    window.SpeechRecognition = TrackedSpeechRecognition;
  });
  await phraseFallbackPage.goto(URL, { waitUntil: "networkidle" });
  await phraseFallbackPage.getByText("AI Annotated Review Demo Report").first().waitFor();
  const fallbackBlock = phraseFallbackPage.locator(".review-block").nth(4);
  await fallbackBlock.locator(".add-block-button").click();
  const fallbackComposer = fallbackBlock.locator(".inline-composer");
  await fallbackComposer.waitFor();
  await fallbackComposer.getByRole("button", { name: /Dictate/ }).click();
  await phraseFallbackPage.waitForFunction(() => window.__speechRecognitionStartCount === 2);
  await fallbackComposer.getByRole("button", { name: /Stop/ }).waitFor();
  const fallbackState = await phraseFallbackPage.evaluate(() => ({
    instanceCount: window.__speechRecognitionInstances.length,
    phraseHintAssignmentCount: window.__speechPhraseHintAssignmentCount
  }));
  assert(
    fallbackState.instanceCount === 2,
    `expected phrase-hint failure to restart with a fresh recognition instance, got ${fallbackState.instanceCount}`
  );
  assert(
    fallbackState.phraseHintAssignmentCount === 1,
    `expected phrase hints only on the first attempt, got ${fallbackState.phraseHintAssignmentCount}`
  );
  assert(
    (await fallbackComposer.getByText("Voice input stopped.").count()) === 0,
    "Phrase-hint fallback must not leave the user at Voice input stopped."
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        rowCount,
        packIncludesConfirmedOnly: true,
        exportPackAvailable: true,
        confirmationRequired: true,
        buildPackScrollsToRevisionPack: true,
        copyButtonLabelIsShort: true,
        copyToastAutoDismisses: true,
        copyModeSkipsSecondConfirmation: true,
        extensionVoicePermissionPageOpens: true,
        voiceDictationIsContinuous: true,
        voiceDictationKeepsMultipleSegments: true,
        voiceDictationRestartsAfterPause: true,
        voiceDictationStopsOnlyByUser: true,
        voicePhraseHintsUseBlockContext: true,
        voicePhraseHintFailureFallsBack: true,
        bridgeEchoPreservesSelection: true,
        sendFollowUpMessageCalled: true,
        consoleErrors: errorMessages.length + standaloneErrorMessages.length
      },
      null,
      2
    )
  );
} finally {
  if (browser) await browser.close();
  vite.kill("SIGTERM");
}

async function addAnnotation(page, blockIndex, annotation) {
  const targetBlock = page.locator(".review-block").nth(blockIndex);
  await targetBlock.locator(".add-block-button").click();
  const composer = targetBlock.locator(".inline-composer");
  await composer.waitFor();
  await composer.locator("label").filter({ hasText: "Comment" }).locator("textarea").fill(annotation.body);
  await composer.getByRole("button", { name: /Add comment/ }).click();
  await targetBlock.locator(".block-annotation-preview", { hasText: annotation.body }).waitFor();
}

async function waitForHttp(url) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
    }
    await sleep(100);
  }
  throw new Error(`Vite did not become ready. Logs:\n${logs.join("")}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parsePort(value, fallback) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid port: ${value ?? fallback}`);
  }
  return parsed;
}

function createBridgeEchoSession() {
  const now = "2026-05-18T00:00:00.000Z";
  const blocks = [
    heading("b0001_title", 0, "AI Annotated Review Demo Report", 1, [
      "AI Annotated Review Demo Report"
    ]),
    heading("b0002_context", 1, "Context", 2, ["AI Annotated Review Demo Report", "Context"]),
    paragraph(
      "b0003_context_body",
      2,
      "AI tools can generate long reports quickly, but paragraph-level revision feedback is still hard to capture in a normal chat box.",
      ["AI Annotated Review Demo Report", "Context"]
    ),
    heading("b0004_proposal", 3, "Proposal", 2, ["AI Annotated Review Demo Report", "Proposal"]),
    paragraph(
      "b0005_proposal_body",
      4,
      "Build a ChatGPT Apps SDK widget that renders a long response as review blocks. Each block can receive comments, statuses, and priorities.",
      ["AI Annotated Review Demo Report", "Proposal"]
    ),
    heading("b0006_boundary", 5, "Boundary", 2, ["AI Annotated Review Demo Report", "Boundary"]),
    paragraph(
      "b0007_boundary_body",
      6,
      "The app should not claim it modifies ChatGPT native message bubbles. It renders its own embedded review surface and sends a revision request only after confirmation.",
      ["AI Annotated Review Demo Report", "Boundary"]
    )
  ];

  return {
    schemaVersion: "1.0",
    id: "session_bridge_echo",
    createdAt: now,
    updatedAt: now,
    document: {
      id: "doc_bridge_echo",
      title: "AI Annotated Review Demo Report",
      sourceLabel: "ChatGPT bridge echo smoke",
      createdAt: now,
      originalCharCount: blocks.reduce((count, block) => count + block.markdown.length, 0),
      normalizedCharCount: blocks.reduce((count, block) => count + block.text.length, 0),
      limits: { charHardCap: 100000, blockHardCap: 300 },
      outline: blocks
        .filter((block) => block.type === "heading")
        .map((block) => ({
          id: block.id,
          title: block.text,
          depth: block.depth,
          ordinal: block.ordinal,
          headingPath: block.headingPath
        })),
      blocks
    },
    annotations: []
  };
}

function heading(id, ordinal, text, depth, headingPath) {
  return {
    id,
    ordinal,
    type: "heading",
    depth,
    headingPath,
    markdown: `${"#".repeat(depth)} ${text}`,
    text,
    quote: text,
    position: { startLine: ordinal + 1, endLine: ordinal + 1 }
  };
}

function paragraph(id, ordinal, text, headingPath) {
  return {
    id,
    ordinal,
    type: "paragraph",
    headingPath,
    markdown: text,
    text,
    quote: text,
    position: { startLine: ordinal + 1, endLine: ordinal + 1 }
  };
}
