import type {
  Annotation,
  AnnotationPriority,
  AnnotationStatus,
  ReviewBlock,
  ReviewSession,
  RevisionPack
} from "@ai-annotated-review/annotation-model";
import {
  annotationSchema,
  annotationStatusSchema,
  makeStableId
} from "@ai-annotated-review/annotation-model";
import { parseMarkdownToReviewDocument } from "@ai-annotated-review/markdown-block-parser";
import {
  addAnnotation,
  createReviewSession,
  exportReviewSessionJson,
  summarizeSession,
  updateAnnotationPriority,
  updateAnnotationStatus
} from "@ai-annotated-review/review-core";
import {
  buildRevisionPack,
  summarizeRevisionPack
} from "@ai-annotated-review/revision-prompt-builder";
import {
  CheckCircle2,
  Clipboard,
  Download,
  ExternalLink,
  FileText,
  Flag,
  Maximize2,
  MessageSquarePlus,
  Mic,
  Send,
  Square,
  Upload,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  getInitialReviewSession,
  getInitialWidgetState,
  getRevisionDeliveryMode,
  initializeMcpBridge,
  persistPrivateWidgetState,
  requestFullscreen,
  sendRevisionFollowUp,
  subscribeToReviewSession
} from "./openaiBridge.js";
import { createSampleSession } from "./sampleSession.js";
import { isBrowserExtensionHost, readActiveTabSelection } from "./hostIntegrations.js";
import "./styles.css";

type SendState = "idle" | "sent" | "copied" | "fallback" | "error";
type ImportDraft = {
  title: string;
  sourceLabel: string;
  markdown: string;
};

const EMPTY_IMPORT_DRAFT: ImportDraft = {
  title: "",
  sourceLabel: "Manual import",
  markdown: ""
};

function App() {
  const initialSession = getInitialReviewSession() ?? createSampleSession();
  const initialWidgetState = getInitialWidgetState();
  const restored = restoreSessionFromWidgetState(initialSession, initialWidgetState);
  const activeHostSessionId = useRef(restored.id);
  const revisionSectionRef = useRef<HTMLElement | null>(null);

  const [session, setSession] = useState<ReviewSession>(restored);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    restoreSelectedBlockId(restored, initialWidgetState)
  );
  const [activeComposerBlockId, setActiveComposerBlockId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<AnnotationStatus | "all">(
    restoreStatusFilter(initialWidgetState)
  );
  const [revisionPack, setRevisionPack] = useState<RevisionPack | null>(null);
  const [confirmingSend, setConfirmingSend] = useState(false);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [isSending, setIsSending] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importDraft, setImportDraft] = useState<ImportDraft>(EMPTY_IMPORT_DRAFT);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const browserExtensionHost = isBrowserExtensionHost();

  useEffect(() => {
    initializeMcpBridge();
    return subscribeToReviewSession((nextSession) => {
      if (activeHostSessionId.current === nextSession.id) {
        return;
      }
      activeHostSessionId.current = nextSession.id;
      setSession(nextSession);
      setSelectedBlockId(nextSession.document.blocks[0]?.id ?? null);
      setActiveComposerBlockId(null);
      setCommentDrafts({});
      setRevisionPack(null);
      setSendState("idle");
    });
  }, []);

  useEffect(() => {
    persistPrivateWidgetState({
      sessionId: session.id,
      annotations: session.annotations,
      selectedBlockId,
      statusFilter
    });
  }, [session, selectedBlockId, statusFilter]);

  const summary = useMemo(() => summarizeSession(session), [session]);
  const annotationsByBlock = useMemo(() => groupAnnotationsByBlock(session.annotations), [
    session.annotations
  ]);
  const visibleAnnotations = useMemo(
    () =>
      session.annotations.filter((annotation) =>
        statusFilter === "all" ? true : annotation.status === statusFilter
      ),
    [session.annotations, statusFilter]
  );

  const confirmedCount = summary.countsByStatus.confirmed;
  const canSend = Boolean(revisionPack && revisionPack.itemCount > 0);
  const revisionDeliveryMode = getRevisionDeliveryMode();
  const revisionActionLabel =
    revisionDeliveryMode === "send" ? "Send revision request" : "Copy revision request";

  function handleOpenComposer(blockId: string) {
    setSelectedBlockId(blockId);
    setActiveComposerBlockId(blockId);
  }

  function handleCommentDraftChange(blockId: string, body: string) {
    setCommentDrafts((current) => ({ ...current, [blockId]: body }));
  }

  function handleCancelComposer(blockId: string) {
    setActiveComposerBlockId((current) => (current === blockId ? null : current));
  }

  function handleAddAnnotation(block: ReviewBlock) {
    const body = commentDrafts[block.id]?.trim() ?? "";
    if (!body) return;
    const next = addAnnotation(session, {
      blockId: block.id,
      title: inferAnnotationTitle(body),
      body,
      priority: inferAnnotationPriority(body),
      status: "confirmed"
    });
    setSession(next);
    setCommentDrafts((current) => {
      const { [block.id]: _removed, ...rest } = current;
      return rest;
    });
    setSelectedBlockId(block.id);
    setActiveComposerBlockId(null);
    setRevisionPack(null);
    setSendState("idle");
  }

  function handleStatusChange(id: string, status: AnnotationStatus) {
    setSession(updateAnnotationStatus(session, id, status));
    setRevisionPack(null);
    setSendState("idle");
  }

  function handlePriorityChange(id: string, priority: AnnotationPriority) {
    setSession(updateAnnotationPriority(session, id, priority));
    setRevisionPack(null);
    setSendState("idle");
  }

  function handleBuildPack() {
    setRevisionPack(buildRevisionPack(session));
    setSendState("idle");
    window.setTimeout(() => {
      revisionSectionRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 0);
  }

  function handleImportDocument() {
    const markdown = importDraft.markdown.trim();
    const title = importDraft.title.trim();
    const sourceLabel = importDraft.sourceLabel.trim();
    const parsed = parseMarkdownToReviewDocument(markdown, {
      ...(title ? { title } : {}),
      ...(sourceLabel ? { sourceLabel } : {})
    });
    if (!parsed.ok) {
      setImportError(parsed.errors.join(" "));
      return;
    }

    const next = createReviewSession(parsed.document, {
      sessionId: makeStableId("session", parsed.document.id),
      now: parsed.document.createdAt
    });
    activeHostSessionId.current = next.id;
    setSession(next);
    setSelectedBlockId(next.document.blocks[0]?.id ?? null);
    setActiveComposerBlockId(null);
    setCommentDrafts({});
    setRevisionPack(null);
    setSendState("idle");
    setImportError(null);
    setImportNotice(null);
    setImporting(false);
  }

  async function handleUseSelectedText() {
    setImportError(null);
    setImportNotice(null);
    try {
      const selection = await readActiveTabSelection();
      setImporting(true);
      setImportDraft({
        title: selection.title,
        sourceLabel: selection.sourceLabel,
        markdown: selection.text
      });
      if (!selection.text) {
        setImportError("Select the AI output text in ChatGPT or Claude first, then click this button again.");
      } else {
        setImportNotice("Selected text imported from the active browser tab. Review it before creating the session.");
      }
    } catch (error) {
      setImporting(true);
      setImportError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleRevisionDelivery() {
    if (!revisionPack || isSending) return;
    setSendState("idle");
    setIsSending(true);
    try {
      const result = await sendRevisionFollowUp(revisionPack.prompt);
      setSendState(result);
      setConfirmingSend(false);
    } catch {
      setSendState("error");
    } finally {
      setIsSending(false);
    }
  }

  function handleRevisionAction() {
    if (revisionDeliveryMode === "send") {
      setConfirmingSend(true);
      return;
    }
    void handleRevisionDelivery();
  }

  function handleExportSession() {
    downloadTextFile(
      `${safeDownloadBaseName(session.document.title ?? "review-session")}.json`,
      exportReviewSessionJson(session),
      "application/json"
    );
  }

  function handleExportRevisionPack() {
    if (!revisionPack) return;
    downloadTextFile(
      `${safeDownloadBaseName(session.document.title ?? "revision-pack")}.md`,
      revisionPack.prompt,
      "text/markdown"
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <FileText aria-hidden="true" size={20} />
          <div>
            <h1>{session.document.title ?? "Untitled Review"}</h1>
            <p>
              {summary.blockCount} blocks · {summary.annotationCount} annotations ·{" "}
              {confirmedCount} confirmed
            </p>
          </div>
        </div>
        <div className="topbar-actions">
          {browserExtensionHost ? (
            <button className="secondary-button" type="button" onClick={handleUseSelectedText}>
              <Clipboard size={16} />
              Use selected text
            </button>
          ) : null}
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setImportDraft(EMPTY_IMPORT_DRAFT);
              setImportError(null);
              setImportNotice(null);
              setImporting(true);
            }}
          >
            <Upload size={16} />
            New document
          </button>
          <button className="icon-button" type="button" onClick={() => requestFullscreen()} title="Fullscreen">
            <Maximize2 size={17} />
          </button>
          <button className="secondary-button" type="button" onClick={handleExportSession}>
            <Download size={16} />
            Export JSON
          </button>
          <button className="primary-button" type="button" onClick={handleBuildPack}>
            <CheckCircle2 size={16} />
            Build pack
          </button>
        </div>
      </header>

      <section className="workspace">
        <DocumentPane
          blocks={session.document.blocks}
          selectedBlockId={selectedBlockId}
          activeComposerBlockId={activeComposerBlockId}
          commentDrafts={commentDrafts}
          annotationsByBlock={annotationsByBlock}
          onSelectBlock={setSelectedBlockId}
          onOpenComposer={handleOpenComposer}
          onCommentDraftChange={handleCommentDraftChange}
          onCancelComposer={handleCancelComposer}
          onAddAnnotation={handleAddAnnotation}
        />

        <aside className="side-panel">
          <section className="panel-section">
            <div className="section-heading">
              <span>Annotations</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as AnnotationStatus | "all")
                }
              >
                <option value="all">all</option>
                <option value="open">open</option>
                <option value="confirmed">confirmed</option>
                <option value="resolved">resolved</option>
                <option value="rejected">rejected</option>
              </select>
            </div>
            <div className="annotation-list">
              {visibleAnnotations.length === 0 ? (
                <p className="muted">No annotations in this filter.</p>
              ) : (
                visibleAnnotations.map((annotation) => (
                  <AnnotationRow
                    key={annotation.id}
                    annotation={annotation}
                    onSelectBlock={setSelectedBlockId}
                    onStatusChange={handleStatusChange}
                    onPriorityChange={handlePriorityChange}
                  />
                ))
              )}
            </div>
          </section>

          <section className="panel-section revision-section" ref={revisionSectionRef}>
            <div className="section-heading">
              <span>Revision pack</span>
              <span className="metric">{confirmedCount} confirmed</span>
            </div>
            {revisionPack ? (
              <>
                <p className="pack-summary">{summarizeRevisionPack(revisionPack)}</p>
                <textarea className="pack-preview" readOnly value={revisionPack.prompt} />
                <div className="pack-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={handleExportRevisionPack}
                  >
                    <Download size={16} />
                    Export pack
                  </button>
                  <button
                    className="send-button"
                    type="button"
                    disabled={!canSend || isSending}
                    onClick={handleRevisionAction}
                  >
                    <Send size={16} />
                    {isSending && revisionDeliveryMode === "copy" ? "Copying..." : revisionActionLabel}
                  </button>
                </div>
              </>
            ) : (
              <p className="muted">Build a pack after confirming the comments that should drive revision.</p>
            )}
            {sendState === "sent" ? (
              <p className="status-note success">Revision request sent.</p>
            ) : null}
            {sendState === "copied" ? (
              <p className="status-note success">Revision request copied to clipboard.</p>
            ) : null}
            {sendState === "fallback" ? (
              <p className="status-note">Copy was unavailable. Export the pack instead.</p>
            ) : null}
            {sendState === "error" ? (
              <p className="status-note error">Send failed. The preview is still available.</p>
            ) : null}
          </section>
        </aside>
      </section>

      {importing ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
            <div className="modal-header">
              <h2 id="import-title">Import document</h2>
              <button className="icon-button" type="button" onClick={() => setImporting(false)} title="Close">
                <X size={17} />
              </button>
            </div>
            <p>
              Paste Markdown or selected AI output. The review session stays in this browser surface until you export it.
            </p>
            <div className="import-grid">
              <label>
                Title
                <input
                  value={importDraft.title}
                  onChange={(event) =>
                    setImportDraft((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>
              <label>
                Source
                <input
                  value={importDraft.sourceLabel}
                  onChange={(event) =>
                    setImportDraft((current) => ({ ...current, sourceLabel: event.target.value }))
                  }
                />
              </label>
              <label className="wide">
                Document text
                <textarea
                  className="import-textarea"
                  value={importDraft.markdown}
                  onChange={(event) =>
                    setImportDraft((current) => ({ ...current, markdown: event.target.value }))
                  }
                />
              </label>
            </div>
            {importNotice ? <p className="status-note success">{importNotice}</p> : null}
            {importError ? <p className="status-note error">{importError}</p> : null}
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setImporting(false)}>
                Cancel
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={importDraft.markdown.trim().length === 0}
                onClick={handleImportDocument}
              >
                <CheckCircle2 size={16} />
                Create review session
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {confirmingSend && revisionPack ? (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <div className="modal-header">
              <h2 id="confirm-title">Confirm send</h2>
              <button className="icon-button" type="button" onClick={() => setConfirmingSend(false)} title="Close">
                <X size={17} />
              </button>
            </div>
            <p>
              This sends the previewed revision request to ChatGPT. It includes confirmed annotations only
              and does not resend the full document by default.
            </p>
            <textarea className="modal-preview" readOnly value={revisionPack.prompt} />
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setConfirmingSend(false)}>
                Cancel
              </button>
              <button className="send-button" type="button" disabled={isSending} onClick={handleRevisionDelivery}>
                <Send size={16} />
                {isSending ? "Sending..." : "Confirm and send"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function DocumentPane({
  blocks,
  selectedBlockId,
  activeComposerBlockId,
  commentDrafts,
  annotationsByBlock,
  onSelectBlock,
  onOpenComposer,
  onCommentDraftChange,
  onCancelComposer,
  onAddAnnotation
}: {
  blocks: ReviewBlock[];
  selectedBlockId: string | null;
  activeComposerBlockId: string | null;
  commentDrafts: Record<string, string>;
  annotationsByBlock: Map<string, Annotation[]>;
  onSelectBlock: (id: string) => void;
  onOpenComposer: (id: string) => void;
  onCommentDraftChange: (id: string, body: string) => void;
  onCancelComposer: (id: string) => void;
  onAddAnnotation: (block: ReviewBlock) => void;
}) {
  return (
    <section className="document-pane" aria-label="Review document">
      {blocks.map((block) => {
        const annotations = annotationsByBlock.get(block.id) ?? [];
        const selected = block.id === selectedBlockId;
        const composerOpen = block.id === activeComposerBlockId;
        const commentDraft = commentDrafts[block.id] ?? "";
        return (
          <article
            key={block.id}
            className={`review-block ${selected ? "selected" : ""}`}
            role="group"
            aria-label={`Review block ${block.id}`}
            onClick={() => onSelectBlock(block.id)}
          >
            <div className="block-meta">
              <span>{block.type}</span>
              <code>{block.id}</code>
              {annotations.length > 0 ? (
                <span className="annotation-count">
                  <Flag size={13} />
                  {annotations.length}
                </span>
              ) : null}
              <button
                className="icon-button add-block-button"
                type="button"
                title="Annotate block"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenComposer(block.id);
                }}
              >
                <MessageSquarePlus size={15} />
              </button>
            </div>
            {block.type === "heading" ? (
              <h2 className={`heading-depth-${block.depth ?? 1}`}>{block.text}</h2>
            ) : block.type === "code" ? (
              <pre>{block.markdown}</pre>
            ) : block.type === "table" ? (
              <pre className="table-block">{block.markdown}</pre>
            ) : (
              <p>{block.text}</p>
            )}
            {annotations.length > 0 ? (
              <div className="block-annotation-previews" aria-label="Block annotations">
                {annotations.map((annotation) => (
                  <div key={annotation.id} className={`block-annotation-preview ${annotation.status}`}>
                    <Flag size={13} />
                    <span>{annotation.body}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {composerOpen ? (
              <InlineAnnotationComposer
                block={block}
                value={commentDraft}
                onChange={(body) => onCommentDraftChange(block.id, body)}
                onCancel={() => onCancelComposer(block.id)}
                onSubmit={() => onAddAnnotation(block)}
              />
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

function InlineAnnotationComposer({
  block,
  value,
  onChange,
  onCancel,
  onSubmit
}: {
  block: ReviewBlock;
  value: string;
  onChange: (body: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const dictation = useSpeechDictation((transcript) => {
    onChange(appendTranscript(value, transcript));
  });
  const canSubmit = value.trim().length > 0;

  return (
    <div
      className="inline-composer"
      role="form"
      aria-label={`Add annotation to ${block.id}`}
      onClick={(event) => event.stopPropagation()}
    >
      <label>
        Comment
        <textarea
          autoFocus
          value={value}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <div className="inline-composer-actions">
        <button
          className={`secondary-button voice-button ${dictation.listening ? "listening" : ""}`}
          type="button"
          disabled={!dictation.supported}
          onClick={dictation.toggle}
          title={dictation.supported ? "Dictate comment" : "Voice input is not available in this browser"}
        >
          {dictation.listening ? <Square size={15} /> : <Mic size={15} />}
          {dictation.listening ? "Stop" : "Dictate"}
        </button>
        <div className="inline-composer-spacer" />
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="primary-button" type="button" disabled={!canSubmit} onClick={onSubmit}>
          <MessageSquarePlus size={16} />
          Add comment
        </button>
      </div>
      {dictation.message ? <p className="status-note">{dictation.message}</p> : null}
    </div>
  );
}

type SpeechRecognitionConstructor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<{
          isFinal: boolean;
          0?: { transcript: string };
        }>;
      }) => void)
    | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};

function useSpeechDictation(onTranscript: (transcript: string) => void): {
  supported: boolean;
  listening: boolean;
  message: string | null;
  toggle: () => void;
} {
  const recognitionRef = useRef<InstanceType<SpeechRecognitionConstructor> | null>(null);
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const supported = typeof window !== "undefined" && getSpeechRecognitionConstructor() !== null;

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  function toggle() {
    const recognition = recognitionRef.current;
    if (listening && recognition) {
      recognition.stop();
      setListening(false);
      return;
    }

    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setMessage("Voice input is not available in this browser.");
      return;
    }

    const next = new Recognition();
    recognitionRef.current = next;
    next.lang = navigator.language || "zh-CN";
    next.continuous = false;
    next.interimResults = true;
    next.maxAlternatives = 1;
    next.onresult = (event) => {
      let finalTranscript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result?.isFinal) {
          finalTranscript += result[0]?.transcript ?? "";
        }
      }
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
    };
    next.onerror = (event) => {
      setListening(false);
      setMessage(event.error === "not-allowed" ? "Microphone permission was blocked." : "Voice input stopped.");
    };
    next.onend = () => {
      setListening(false);
    };

    try {
      next.start();
      setMessage(null);
      setListening(true);
    } catch {
      setListening(false);
      setMessage("Voice input could not start.");
    }
  }

  return { supported, listening, message, toggle };
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const candidateWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return candidateWindow.SpeechRecognition ?? candidateWindow.webkitSpeechRecognition ?? null;
}

function appendTranscript(current: string, transcript: string): string {
  const trimmedCurrent = current.trimEnd();
  if (!trimmedCurrent) return transcript;
  return `${trimmedCurrent} ${transcript}`;
}

function inferAnnotationTitle(body: string): string {
  const normalized = body.replace(/\s+/g, " ").trim();
  const firstSentence = normalized.split(/[。.!?？]/)[0]?.trim() ?? normalized;
  return firstSentence.slice(0, 42) || "Review comment";
}

function inferAnnotationPriority(body: string): AnnotationPriority {
  const normalized = body.toLowerCase();
  if (/崩溃|泄露|违法|数据丢失|security|privacy leak|crash|data loss|p0/.test(normalized)) {
    return "P0";
  }
  if (/必须|严重|错误|不能|隐私|安全|阻塞|blocker|critical|important|p1/.test(normalized)) {
    return "P1";
  }
  if (/小问题|建议|可选|polish|minor|p3/.test(normalized)) {
    return "P3";
  }
  return "P2";
}

function AnnotationRow({
  annotation,
  onSelectBlock,
  onStatusChange,
  onPriorityChange
}: {
  annotation: Annotation;
  onSelectBlock: (id: string) => void;
  onStatusChange: (id: string, status: AnnotationStatus) => void;
  onPriorityChange: (id: string, priority: AnnotationPriority) => void;
}) {
  return (
    <article className={`annotation-row ${annotation.status}`}>
      <button
        className="annotation-title"
        type="button"
        onClick={() => onSelectBlock(annotation.blockId)}
      >
        <span>{annotation.title}</span>
        <ExternalLink size={13} />
      </button>
      <p>{annotation.body}</p>
      <q>{annotation.quote}</q>
      <div className="annotation-controls">
        <select
          value={annotation.priority}
          onChange={(event) =>
            onPriorityChange(annotation.id, event.target.value as AnnotationPriority)
          }
        >
          <option value="P0">P0</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
        </select>
        <select
          value={annotation.status}
          onChange={(event) =>
            onStatusChange(annotation.id, event.target.value as AnnotationStatus)
          }
        >
          <option value="open">open</option>
          <option value="confirmed">confirmed</option>
          <option value="resolved">resolved</option>
          <option value="rejected">rejected</option>
        </select>
      </div>
    </article>
  );
}

function groupAnnotationsByBlock(annotations: Annotation[]): Map<string, Annotation[]> {
  const result = new Map<string, Annotation[]>();
  for (const annotation of annotations) {
    const current = result.get(annotation.blockId) ?? [];
    current.push(annotation);
    result.set(annotation.blockId, current);
  }
  return result;
}

function downloadTextFile(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function restoreSessionFromWidgetState(
  initialSession: ReviewSession,
  initialWidgetState: ReturnType<typeof getInitialWidgetState>
): ReviewSession {
  if (initialWidgetState?.privateContent?.sessionId !== initialSession.id) {
    return initialSession;
  }

  const parsedAnnotations = annotationSchema
    .array()
    .safeParse(initialWidgetState.privateContent.annotations);
  if (!parsedAnnotations.success) {
    return initialSession;
  }

  const validBlockIds = new Set(initialSession.document.blocks.map((block) => block.id));
  return {
    ...initialSession,
    annotations: parsedAnnotations.data.filter((annotation) =>
      validBlockIds.has(annotation.blockId)
    )
  };
}

function restoreSelectedBlockId(
  session: ReviewSession,
  initialWidgetState: ReturnType<typeof getInitialWidgetState>
): string | null {
  const candidate = initialWidgetState?.privateContent?.selectedBlockId;
  if (typeof candidate === "string" && session.document.blocks.some((block) => block.id === candidate)) {
    return candidate;
  }
  return session.document.blocks[0]?.id ?? null;
}

function restoreStatusFilter(
  initialWidgetState: ReturnType<typeof getInitialWidgetState>
): AnnotationStatus | "all" {
  const candidate = initialWidgetState?.privateContent?.statusFilter;
  if (candidate === "all") return "all";
  const parsed = annotationStatusSchema.safeParse(candidate);
  return parsed.success ? parsed.data : "all";
}

function safeDownloadBaseName(value: string): string {
  const sanitized = value
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return sanitized || "ai-annotated-review";
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Widget root element not found.");
}

createRoot(rootElement).render(<App />);
