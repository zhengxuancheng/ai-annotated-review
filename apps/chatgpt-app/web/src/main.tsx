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
  Send,
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

type Draft = {
  title: string;
  body: string;
  priority: AnnotationPriority;
  status: AnnotationStatus;
};

type SendState = "idle" | "sent" | "copied" | "fallback" | "error";
type ImportDraft = {
  title: string;
  sourceLabel: string;
  markdown: string;
};

const EMPTY_DRAFT: Draft = {
  title: "",
  body: "",
  priority: "P2",
  status: "open"
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

  const [session, setSession] = useState<ReviewSession>(restored);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    restoreSelectedBlockId(restored, initialWidgetState)
  );
  const [statusFilter, setStatusFilter] = useState<AnnotationStatus | "all">(
    restoreStatusFilter(initialWidgetState)
  );
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
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
  const selectedBlock = useMemo(
    () => session.document.blocks.find((block) => block.id === selectedBlockId) ?? null,
    [session.document.blocks, selectedBlockId]
  );
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

  const canAddAnnotation =
    Boolean(selectedBlock) && draft.title.trim().length > 0 && draft.body.trim().length > 0;
  const confirmedCount = summary.countsByStatus.confirmed;
  const canSend = Boolean(revisionPack && revisionPack.itemCount > 0);
  const revisionDeliveryMode = getRevisionDeliveryMode();
  const revisionActionLabel =
    revisionDeliveryMode === "send" ? "Send revision request" : "Copy revision request";

  function handleAddAnnotation() {
    if (!selectedBlock || !canAddAnnotation) return;
    const next = addAnnotation(session, {
      blockId: selectedBlock.id,
      title: draft.title,
      body: draft.body,
      priority: draft.priority,
      status: draft.status
    });
    setSession(next);
    setDraft(EMPTY_DRAFT);
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
    setDraft(EMPTY_DRAFT);
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

  async function handleConfirmedSend() {
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
          annotationsByBlock={annotationsByBlock}
          onSelectBlock={setSelectedBlockId}
        />

        <aside className="side-panel">
          <section className="panel-section selected-block">
            <div className="section-heading">
              <span>Selected block</span>
              {selectedBlock ? <code>{selectedBlock.id}</code> : null}
            </div>
            {selectedBlock ? (
              <>
                <blockquote>{selectedBlock.quote}</blockquote>
                <div className="draft-grid">
                  <label>
                    Title
                    <input
                      value={draft.title}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, title: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Priority
                    <select
                      value={draft.priority}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          priority: event.target.value as AnnotationPriority
                        }))
                      }
                    >
                      <option value="P0">P0</option>
                      <option value="P1">P1</option>
                      <option value="P2">P2</option>
                      <option value="P3">P3</option>
                    </select>
                  </label>
                  <label>
                    Status
                    <select
                      value={draft.status}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          status: event.target.value as AnnotationStatus
                        }))
                      }
                    >
                      <option value="open">open</option>
                      <option value="confirmed">confirmed</option>
                      <option value="resolved">resolved</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </label>
                  <label className="wide">
                    Comment
                    <textarea
                      value={draft.body}
                      rows={4}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, body: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <button
                  className="primary-button full-width"
                  type="button"
                  disabled={!canAddAnnotation}
                  onClick={handleAddAnnotation}
                >
                  <MessageSquarePlus size={16} />
                  Add annotation
                </button>
              </>
            ) : (
              <p className="muted">No block selected.</p>
            )}
          </section>

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

          <section className="panel-section revision-section">
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
                    disabled={!canSend}
                    onClick={() => setConfirmingSend(true)}
                  >
                    <Send size={16} />
                    {revisionActionLabel}
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
              {revisionDeliveryMode === "send"
                ? "This sends the previewed revision request to ChatGPT. It includes confirmed annotations only and does not resend the full document by default."
                : "This copies the previewed revision request. You can paste it into ChatGPT, Claude, Codex, or Claude Code yourself. It includes confirmed annotations only and does not resend the full document by default."}
            </p>
            <textarea className="modal-preview" readOnly value={revisionPack.prompt} />
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setConfirmingSend(false)}>
                Cancel
              </button>
              <button className="send-button" type="button" disabled={isSending} onClick={handleConfirmedSend}>
                <Send size={16} />
                {isSending
                  ? revisionDeliveryMode === "send"
                    ? "Sending..."
                    : "Copying..."
                  : revisionDeliveryMode === "send"
                    ? "Confirm and send"
                    : "Confirm and copy"}
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
  annotationsByBlock,
  onSelectBlock
}: {
  blocks: ReviewBlock[];
  selectedBlockId: string | null;
  annotationsByBlock: Map<string, Annotation[]>;
  onSelectBlock: (id: string) => void;
}) {
  return (
    <section className="document-pane" aria-label="Review document">
      {blocks.map((block) => {
        const annotations = annotationsByBlock.get(block.id) ?? [];
        const selected = block.id === selectedBlockId;
        return (
          <article
            key={block.id}
            className={`review-block ${selected ? "selected" : ""}`}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            onClick={() => onSelectBlock(block.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectBlock(block.id);
              }
            }}
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
                  onSelectBlock(block.id);
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
          </article>
        );
      })}
    </section>
  );
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
