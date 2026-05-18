export type DictationContext = {
  text: string;
  terms: string[];
};

export type SpeechPhraseHint = {
  phrase: string;
  boost: number;
};

type DictationContextInput = {
  text?: string;
  markdown?: string;
  headingPath?: readonly string[];
  documentTitle?: string;
};

const MAX_HINTS = 40;
const CHINESE_CHAR_PATTERN = /[\u3400-\u9fff]/;
const SENTENCE_END_PATTERN = /[。！？.!?]$/;
const PHASE_0A_PATTERN = /\bPhase\s*0A\b/i;
const PHASE_123_PATTERN = /\bPhase\s*1\s*\/\s*2\s*\/\s*3\b/i;
const TECH_TERM_PATTERN = /\b[A-Za-z][A-Za-z0-9]*(?:[._/-][A-Za-z0-9]+)*\b/g;

export function createDictationContext(input: DictationContextInput): DictationContext {
  const text = [
    input.documentTitle,
    ...(input.headingPath ?? []),
    input.text,
    input.markdown
  ]
    .filter(Boolean)
    .join("\n");
  return {
    text,
    terms: extractContextTerms(text)
  };
}

export function buildSpeechPhraseHints(context: DictationContext): SpeechPhraseHint[] {
  return context.terms.slice(0, MAX_HINTS).map((phrase) => ({
    phrase,
    boost: /^Phase\b/i.test(phrase) ? 8 : 5
  }));
}

export function normalizeDictatedComment(transcript: string, context: DictationContext): string {
  const compacted = transcript.replace(/\s+/g, " ").trim();
  if (!compacted) return "";

  let normalized = compacted;
  normalized = normalizePhaseMisrecognition(normalized, context);
  normalized = normalizeSpacingAroundAsciiTerms(normalized);
  normalized = restoreLightChinesePunctuation(normalized);
  return normalized;
}

function extractContextTerms(contextText: string): string[] {
  const terms = new Map<string, string>();
  addTermMatches(terms, contextText.match(/\bPhase\s+[0-9A-Za-z]+(?:\/[0-9A-Za-z]+)*\b/g));
  addTermMatches(terms, contextText.match(TECH_TERM_PATTERN));
  return [...terms.values()].filter(shouldKeepContextTerm);
}

function addTermMatches(terms: Map<string, string>, matches: RegExpMatchArray | null) {
  for (const match of matches ?? []) {
    const term = match.replace(/\s+/g, " ").trim();
    const key = term.toLowerCase();
    if (term && !terms.has(key)) {
      terms.set(key, term);
    }
  }
}

function shouldKeepContextTerm(term: string): boolean {
  if (term.length < 2) return false;
  if (/^Phase\b/i.test(term)) return true;
  if (/[0-9._/-]/.test(term)) return true;
  if (/[A-Z].*[A-Z]/.test(term)) return true;
  return /^(Codex|Claude|ChatGPT|Cursor|MCP|CLI|SDK|README|AGENTS)$/i.test(term);
}

function normalizePhaseMisrecognition(text: string, context: DictationContext): string {
  const hasPhase = context.terms.some((term) => /^Phase\b/i.test(term));
  if (!hasPhase) return text;

  let normalized = text.replace(/\bface\s*(?=(?:0\s*a|0a|o\s*a|oa|0\s*1|01|1\s*2\s*3|123)\b)/gi, "Phase ");
  if (PHASE_0A_PATTERN.test(context.text)) {
    normalized = normalized.replace(/\bPhase\s*(?:0\s*a|0a|o\s*a|oa|0\s*1|01)\b/gi, "Phase 0A");
  }
  if (PHASE_123_PATTERN.test(context.text)) {
    normalized = normalized.replace(/\bPhase\s*(?:1\s*2\s*3|123)\b/gi, "Phase 1/2/3");
  }
  return normalized;
}

function normalizeSpacingAroundAsciiTerms(text: string): string {
  return text
    .replace(/([\u3400-\u9fff])([A-Za-z][A-Za-z0-9._/-]*)/g, "$1 $2")
    .replace(/([A-Za-z0-9._/-])([\u3400-\u9fff])/g, "$1 $2")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function restoreLightChinesePunctuation(text: string): string {
  if (!CHINESE_CHAR_PATTERN.test(text)) return text;

  let punctuated = text
    .replace(/这个这个/g, "这个")
    .replace(/(?<=你刚打开了)(?=所以|那|然后|就是|这个)/g, "，")
    .replace(/(?<=所以说呀)(?=就是|这个|你|我|他|它|要|应该|可以|能够|Phase)/g, "，")
    .replace(/(?<=所以说)(?=就是|这个|你|我|他|它|要|应该|可以|能够|Phase)/g, "，")
    .replace(/(?<=然后)(?=就是|这个|你|我|他|它|要|应该|可以|能够|Phase)/g, "，")
    .replace(/(?<=但是)(?=就是|这个|你|我|他|它|要|应该|可以|能够|Phase)/g, "，")
    .replace(/(?<=不过)(?=就是|这个|你|我|他|它|要|应该|可以|能够|Phase)/g, "，")
    .replace(/(?<=就是)(?=这个|你|我|他|它|要|应该|可以|能够|Phase)/g, "，")
    .replace(/\b(Phase\s0A)(?=\s*(?:怎么|他|它|到底|具体|包含|要|应该))/gi, "$1，")
    .replace(/(?<=开发护栏)(?=这个|那|它|他|Phase)/g, "，")
    .replace(/(?<=包含哪些)(?=就|这个|那|具体|到底|要)/g, "，")
    .replace(/(?<=就这个环节)(?=对吧|到底|要|应该)/g, "，")
    .replace(/(?<=对吧)(?=到底|你|这个|那|要|应该|可以|能够|$)/g, "？")
    .replace(/(?<=到底要怎么开放)(?=你|这个|那|要|应该|可以|能够)/g, "，")
    .replace(/(?<=说一说)(?=不要|不能|但是|不过|然后|所以|$)/g, "，")
    .replace(/啊(?=(就是|那|然后|所以|但是|不过|你要|去))/g, "，")
    .replace(/呢(?=(是不是|对不对|然后|那|所以|但是))/g, "呢？")
    .replace(/(?<!^)(是不是)(?=你|这个|那|要|应该|可以|能够)/g, "是不是，")
    .replace(/(?<=清楚一点)(?=不能)/g, "，")
    .replace(/(?<=说一说)(?=啊|就是|这个|下一步)/g, "，")
    .replace(/(?<=具体)(?=要|他|它|这|那)/g, "，")
    .replace(/(?<=做哪些)(?=事|事情)/g, "，")
    .replace(/(?<=对不对)(?=你|这个|那|要|应该|可以|能够|$)/g, "？")
    .replace(/，{2,}/g, "，")
    .replace(/？{2,}/g, "？")
    .replace(/，(?=[。？！])/g, "")
    .replace(/([，。？！])\s+([\u3400-\u9fff])/g, "$1$2");

  if (punctuated.length >= 18 && !SENTENCE_END_PATTERN.test(punctuated)) {
    punctuated += "。";
  }
  return punctuated;
}
