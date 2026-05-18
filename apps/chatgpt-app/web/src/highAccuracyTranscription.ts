import { trimToLimit } from "@ai-annotated-review/annotation-model";
import type { DictationContext } from "./speechPostProcessing.js";

export const OPENAI_API_KEY_STORAGE_KEY = "aiar.openaiApiKey";

type TranscribeAudioOptions = {
  apiKey: string;
  audioBlob: Blob;
  context: DictationContext;
  fetchImpl?: typeof fetch;
};

type OpenAiTranscriptionResponse = {
  text?: unknown;
  error?: {
    message?: unknown;
  };
};

const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";
const OPENAI_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";

export function getStoredOpenAiApiKey(): string {
  try {
    return window.localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function storeOpenAiApiKey(apiKey: string) {
  try {
    const trimmed = apiKey.trim();
    if (trimmed) {
      window.localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, trimmed);
    } else {
      window.localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
    }
  } catch {
    // Local storage can be unavailable in hardened browser contexts.
  }
}

export function buildOpenAiTranscriptionPrompt(context: DictationContext): string {
  const terms = context.terms.length > 0 ? context.terms.join(", ") : "无";
  const excerpt = trimToLimit(context.text.replace(/\s+/g, " ").trim(), 700);
  return [
    "这是一段中文语音批注意见，请转写成自然、可读的简体中文。",
    "请添加简体中文标点，保留用户原意，不要扩写。",
    "请结合当前被批注段落校正明显的语音识别错词，尤其是英文产品名、阶段名、缩写和代码术语。",
    `当前被批注段落的关键术语：${terms}`,
    `当前被批注段落：${excerpt}`
  ].join("\n");
}

export function selectSupportedAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    return undefined;
  }
  return [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/wav"
  ].find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

export async function transcribeAudioWithOpenAI({
  apiKey,
  audioBlob,
  context,
  fetchImpl = fetch
}: TranscribeAudioOptions): Promise<string> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    throw new Error("OpenAI API key is required for AI dictation.");
  }
  if (audioBlob.size === 0) {
    throw new Error("No audio was recorded.");
  }

  const form = new FormData();
  form.append("file", audioBlob, `comment.${audioFileExtension(audioBlob.type)}`);
  form.append("model", OPENAI_TRANSCRIPTION_MODEL);
  form.append("language", "zh");
  form.append("response_format", "json");
  form.append("prompt", buildOpenAiTranscriptionPrompt(context));

  const response = await fetchImpl(OPENAI_TRANSCRIPTION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${trimmedKey}`
    },
    body: form
  });
  const data = (await response.json().catch(() => null)) as OpenAiTranscriptionResponse | null;
  if (!response.ok) {
    const message =
      typeof data?.error?.message === "string"
        ? data.error.message
        : `OpenAI transcription failed with HTTP ${response.status}.`;
    throw new Error(message);
  }
  if (typeof data?.text !== "string" || !data.text.trim()) {
    throw new Error("OpenAI transcription returned no text.");
  }
  return data.text.trim();
}

function audioFileExtension(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}
