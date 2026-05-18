import { describe, expect, it, vi } from "vitest";
import {
  buildOpenAiTranscriptionPrompt,
  transcribeAudioWithOpenAI
} from "../src/highAccuracyTranscription.js";
import { createDictationContext } from "../src/speechPostProcessing.js";

describe("high accuracy transcription", () => {
  it("builds a transcription prompt with review-block context and punctuation guidance", () => {
    const context = createDictationContext({
      text: "我建议下一步怎么走 不要让 Codex 直接进入 Phase 1/2/3 全实现。下一步应该是 Phase 0A：仓库初始化与开发护栏。"
    });

    const prompt = buildOpenAiTranscriptionPrompt(context);

    expect(prompt).toContain("Phase 0A");
    expect(prompt).toContain("Phase 1/2/3");
    expect(prompt).toContain("Codex");
    expect(prompt).toContain("简体中文标点");
    expect(prompt).toContain("当前被批注段落");
  });

  it("sends recorded audio to OpenAI with context prompt and returns transcript text", async () => {
    const context = createDictationContext({
      text: "下一步应该是 Phase 0A：仓库初始化与开发护栏。"
    });
    const fetchImpl = vi.fn(async () => {
      return new Response(JSON.stringify({ text: "请把 Phase 0A 拆成可执行步骤。" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });

    const transcript = await transcribeAudioWithOpenAI({
      apiKey: "sk-test",
      audioBlob: new Blob(["fake audio"], { type: "audio/webm" }),
      context,
      fetchImpl
    });

    expect(transcript).toBe("请把 Phase 0A 拆成可执行步骤。");
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe("https://api.openai.com/v1/audio/transcriptions");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ Authorization: "Bearer sk-test" });
    expect(init?.body).toBeInstanceOf(FormData);
    const body = init?.body as FormData;
    expect(body.get("model")).toBe("gpt-4o-mini-transcribe");
    expect(body.get("language")).toBe("zh");
    expect(body.get("response_format")).toBe("json");
    expect(String(body.get("prompt"))).toContain("Phase 0A");
  });
});
