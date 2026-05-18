import { describe, expect, it } from "vitest";
import {
  buildSpeechPhraseHints,
  createDictationContext,
  normalizeDictatedComment
} from "../src/speechPostProcessing.js";

describe("speech post processing", () => {
  it("extracts review-block terms as speech phrase hints", () => {
    const context = createDictationContext({
      text: "不要让 Codex 直接进入 Phase 1/2/3 全实现。下一步应该是 Phase 0A：仓库初始化与开发护栏。",
      headingPath: ["AI Annotated Review", "Next step"]
    });

    const hints = buildSpeechPhraseHints(context);

    expect(hints.map((hint) => hint.phrase)).toContain("Phase 0A");
    expect(hints.map((hint) => hint.phrase)).toContain("Phase 1/2/3");
    expect(hints.map((hint) => hint.phrase)).toContain("Codex");
  });

  it("normalizes likely speech mistakes using the selected block context", () => {
    const context = createDictationContext({
      text: "不要让 Codex 直接进入 Phase 1/2/3 全实现。下一步应该是一个很短的 Phase 0A：仓库初始化与开发护栏。"
    });

    const normalized = normalizeDictatedComment(
      "你要展开了啊去说一说啊就是这个下一步是一个很短的face0a那这个face01具体他要做哪些做哪些事呢是不是你要把这个说清楚一点不能这么笼统的说",
      context
    );

    expect(normalized).toContain("Phase 0A");
    expect(normalized).not.toMatch(/\bface\s*0?[a1]\b/i);
    expect(normalized).toContain("呢？是不是");
    expect(normalized.endsWith("。")).toBe(true);
  });

  it("does not replace face when the reviewed block has no Phase term", () => {
    const context = createDictationContext({
      text: "请补充人物表情和画面描述。"
    });

    expect(normalizeDictatedComment("这个 face 不要改", context)).toContain("face");
  });
});
