import crypto from "node:crypto";
import type nano from "nano";
import { decodeCursor, encodeCursor } from "../utils/cursor.js";
import type { CommentDoc, CommentView, ListCommentsResult, ThreadSummary } from "../types.js";

type ViewRow = {
  id: string;
  key: unknown;
  doc?: CommentDoc;
  value?: unknown;
};

function toCommentView(doc: CommentDoc): CommentView {
  return {
    commentId: doc.commentId,
    threadId: doc.threadId,
    authorName: doc.authorName,
    body: doc.body,
    createdAt: doc.createdAt,
    deletedAt: doc.deletedAt
  };
}

export async function listComments(
  db: nano.DocumentScope<CommentDoc>,
  threadId: string,
  limit: number,
  cursor?: string,
  includeDeleted = false
): Promise<ListCommentsResult> {
  const decodedCursor = decodeCursor(cursor);
  const response = await db.view("comments", includeDeleted ? "byThreadNewestAll" : "byThreadNewest", {
    include_docs: true,
    descending: true,
    limit: limit + 1,
    startkey: decodedCursor?.startkey ?? [threadId, "\ufff0"],
    endkey: [threadId],
    startkey_docid: decodedCursor?.startkey_docid,
    skip: decodedCursor ? 1 : 0
  });

  const rows = (response.rows as unknown as ViewRow[]).filter((row) => {
    if (!row.doc || row.doc.threadId !== threadId) return false;
    if (!includeDeleted && row.doc.deletedAt) return false;
    return true;
  });
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const items = pageRows.map((row) => toCommentView(row.doc as CommentDoc));

  const last = pageRows[pageRows.length - 1];
  const nextCursor =
    hasMore && last
      ? encodeCursor({ startkey: last.key as unknown as [string, string], startkey_docid: last.id })
      : undefined;

  return { items, nextCursor };
}

export async function listThreads(db: nano.DocumentScope<CommentDoc>): Promise<ThreadSummary[]> {
  const response = await db.view("comments", "byThreadActive", {
    reduce: true,
    group: true
  });

  return (response.rows as unknown as ViewRow[])
    .map((row) => ({
      threadId: String(row.key),
      commentCount: Number(row.value ?? 0)
    }))
    .filter((row) => row.threadId.length > 0)
    .sort((a, b) => a.threadId.localeCompare(b.threadId));
}

export async function createComment(
  db: nano.DocumentScope<CommentDoc>,
  threadId: string,
  body: string,
  authorName?: string
): Promise<CommentView> {
  const createdAt = new Date().toISOString();
  const commentId = crypto.randomUUID();

  const doc: CommentDoc = {
    _id: `comment:${threadId}:${createdAt}:${commentId}`,
    type: "comment",
    commentId,
    threadId,
    authorName,
    body,
    createdAt
  };

  await db.insert(doc);
  return toCommentView(doc);
}

export async function softDeleteComment(
  db: nano.DocumentScope<CommentDoc>,
  threadId: string,
  commentId: string
): Promise<"deleted" | "not_found" | "already_deleted"> {
  const response = await db.view("comments", "byThreadCommentId", {
    include_docs: true,
    key: [threadId, commentId],
    limit: 1
  });

  const row = (response.rows as unknown as ViewRow[])[0];
  if (!row?.doc) {
    return "not_found";
  }

  if (row.doc.deletedAt) {
    return "already_deleted";
  }

  await db.insert({
    ...row.doc,
    deletedAt: new Date().toISOString()
  });

  return "deleted";
}

export async function restoreComment(
  db: nano.DocumentScope<CommentDoc>,
  threadId: string,
  commentId: string
): Promise<"restored" | "not_found" | "already_active"> {
  const response = await db.view("comments", "byThreadCommentId", {
    include_docs: true,
    key: [threadId, commentId],
    limit: 1
  });

  const row = (response.rows as unknown as ViewRow[])[0];
  if (!row?.doc) {
    return "not_found";
  }

  if (!row.doc.deletedAt) {
    return "already_active";
  }

  const { deletedAt: _deletedAt, ...activeDoc } = row.doc;
  await db.insert(activeDoc);
  return "restored";
}
