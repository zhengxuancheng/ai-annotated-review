import {
  REVIEW_SCHEMA_VERSION,
  type Annotation,
  type AnnotationPriority,
  type AnnotationStatus,
  type AnnotationThreadMessage,
  type ReviewDocument,
  type ReviewSession,
  makeRuntimeId,
  nowIso,
  reviewSessionSchema
} from "@ai-annotated-review/annotation-model";

export type CreateSessionOptions = {
  now?: string;
  sessionId?: string;
};

export type AddAnnotationInput = {
  blockId: string;
  title: string;
  body: string;
  priority?: AnnotationPriority;
  status?: AnnotationStatus;
  now?: string;
};

export type SessionSummary = {
  sessionId: string;
  title?: string;
  blockCount: number;
  annotationCount: number;
  countsByStatus: Record<AnnotationStatus, number>;
  countsByPriority: Record<AnnotationPriority, number>;
  confirmedCount: number;
};

const STATUSES: AnnotationStatus[] = [
  "open",
  "confirmed",
  "resolved",
  "rejected"
];

const PRIORITIES: AnnotationPriority[] = ["P0", "P1", "P2", "P3"];

export function createReviewSession(
  document: ReviewDocument,
  options: CreateSessionOptions = {}
): ReviewSession {
  const timestamp = options.now ?? nowIso();
  return {
    schemaVersion: REVIEW_SCHEMA_VERSION,
    id: options.sessionId ?? makeRuntimeId("session"),
    createdAt: timestamp,
    updatedAt: timestamp,
    document,
    annotations: []
  };
}

export function addAnnotation(
  session: ReviewSession,
  input: AddAnnotationInput
): ReviewSession {
  const block = session.document.blocks.find((candidate) => candidate.id === input.blockId);
  if (!block) {
    throw new Error(`Cannot annotate unknown block "${input.blockId}".`);
  }

  const timestamp = input.now ?? nowIso();
  const annotation: Annotation = {
    id: makeRuntimeId("ann"),
    blockId: block.id,
    status: input.status ?? "open",
    priority: input.priority ?? "P2",
    title: input.title.trim(),
    body: input.body.trim(),
    quote: block.quote,
    headingPath: block.headingPath,
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: []
  };

  if (!annotation.title) {
    throw new Error("Annotation title is required.");
  }
  if (!annotation.body) {
    throw new Error("Annotation body is required.");
  }

  return touch({
    ...session,
    annotations: [...session.annotations, annotation]
  }, timestamp);
}

export function updateAnnotationStatus(
  session: ReviewSession,
  annotationId: string,
  status: AnnotationStatus,
  now = nowIso()
): ReviewSession {
  return updateAnnotation(session, annotationId, now, (annotation) => ({
    ...annotation,
    status,
    updatedAt: now
  }));
}

export function updateAnnotationPriority(
  session: ReviewSession,
  annotationId: string,
  priority: AnnotationPriority,
  now = nowIso()
): ReviewSession {
  return updateAnnotation(session, annotationId, now, (annotation) => ({
    ...annotation,
    priority,
    updatedAt: now
  }));
}

export function updateAnnotationText(
  session: ReviewSession,
  annotationId: string,
  patch: { title?: string; body?: string },
  now = nowIso()
): ReviewSession {
  return updateAnnotation(session, annotationId, now, (annotation) => {
    const title = patch.title?.trim() ?? annotation.title;
    const body = patch.body?.trim() ?? annotation.body;
    if (!title) throw new Error("Annotation title is required.");
    if (!body) throw new Error("Annotation body is required.");
    return {
      ...annotation,
      title,
      body,
      updatedAt: now
    };
  });
}

export function addAnnotationMessage(
  session: ReviewSession,
  annotationId: string,
  input: Omit<AnnotationThreadMessage, "id" | "createdAt"> & { now?: string }
): ReviewSession {
  const timestamp = input.now ?? nowIso();
  const message: AnnotationThreadMessage = {
    id: makeRuntimeId("msg"),
    author: input.author,
    body: input.body.trim(),
    createdAt: timestamp
  };

  if (!message.body) throw new Error("Thread message body is required.");

  return updateAnnotation(session, annotationId, timestamp, (annotation) => ({
    ...annotation,
    updatedAt: timestamp,
    messages: [...annotation.messages, message]
  }));
}

export function removeAnnotation(
  session: ReviewSession,
  annotationId: string,
  now = nowIso()
): ReviewSession {
  const nextAnnotations = session.annotations.filter(
    (annotation) => annotation.id !== annotationId
  );
  if (nextAnnotations.length === session.annotations.length) {
    throw new Error(`Annotation "${annotationId}" was not found.`);
  }
  return touch({ ...session, annotations: nextAnnotations }, now);
}

export function getAnnotationsByStatus(
  session: ReviewSession,
  statuses: AnnotationStatus[]
): Annotation[] {
  const selected = new Set(statuses);
  return session.annotations.filter((annotation) => selected.has(annotation.status));
}

export function summarizeSession(session: ReviewSession): SessionSummary {
  const countsByStatus = Object.fromEntries(
    STATUSES.map((status) => [status, 0])
  ) as Record<AnnotationStatus, number>;
  const countsByPriority = Object.fromEntries(
    PRIORITIES.map((priority) => [priority, 0])
  ) as Record<AnnotationPriority, number>;

  for (const annotation of session.annotations) {
    countsByStatus[annotation.status] += 1;
    countsByPriority[annotation.priority] += 1;
  }

  return {
    sessionId: session.id,
    ...(session.document.title ? { title: session.document.title } : {}),
    blockCount: session.document.blocks.length,
    annotationCount: session.annotations.length,
    countsByStatus,
    countsByPriority,
    confirmedCount: countsByStatus.confirmed
  };
}

export function exportReviewSessionJson(session: ReviewSession): string {
  return JSON.stringify(reviewSessionSchema.parse(session), null, 2);
}

export function importReviewSessionJson(json: string): ReviewSession {
  return reviewSessionSchema.parse(JSON.parse(json));
}

function updateAnnotation(
  session: ReviewSession,
  annotationId: string,
  now: string,
  updater: (annotation: Annotation) => Annotation
): ReviewSession {
  let found = false;
  const annotations = session.annotations.map((annotation) => {
    if (annotation.id !== annotationId) return annotation;
    found = true;
    return updater(annotation);
  });

  if (!found) throw new Error(`Annotation "${annotationId}" was not found.`);
  return touch({ ...session, annotations }, now);
}

function touch(session: ReviewSession, now: string): ReviewSession {
  return reviewSessionSchema.parse({
    ...session,
    updatedAt: now
  });
}
