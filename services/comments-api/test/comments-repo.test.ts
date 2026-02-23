import crypto from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createComment,
  listComments,
  listThreads,
  restoreComment,
  softDeleteComment
} from "../src/db/comments-repo.js";
import type { CommentDoc } from "../src/types.js";

describe("comments repo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists comments with next cursor and thread filtering", async () => {
    const db = {
      view: vi.fn().mockResolvedValue({
        rows: [
          {
            id: "doc-a",
            key: ["thread-1", "2026-01-02T00:00:00.000Z"],
            doc: {
              _id: "doc-a",
              type: "comment",
              commentId: "a",
              threadId: "thread-1",
              body: "new",
              createdAt: "2026-01-02T00:00:00.000Z"
            }
          },
          {
            id: "doc-b",
            key: ["thread-1", "2026-01-01T00:00:00.000Z"],
            doc: {
              _id: "doc-b",
              type: "comment",
              commentId: "b",
              threadId: "thread-1",
              body: "old",
              createdAt: "2026-01-01T00:00:00.000Z"
            }
          },
          {
            id: "doc-deleted",
            key: ["thread-1", "2025-12-31T00:00:00.000Z"],
            doc: {
              _id: "doc-deleted",
              type: "comment",
              commentId: "z",
              threadId: "thread-1",
              body: "removed",
              createdAt: "2025-12-31T00:00:00.000Z",
              deletedAt: "2026-01-03T00:00:00.000Z"
            }
          },
          {
            id: "doc-foreign",
            key: ["thread-2", "2026-01-01T00:00:00.000Z"],
            doc: {
              _id: "doc-foreign",
              type: "comment",
              commentId: "c",
              threadId: "thread-2",
              body: "wrong thread",
              createdAt: "2026-01-01T00:00:00.000Z"
            }
          }
        ]
      })
    };

    const result = await listComments(db as any, "thread-1", 1);

    expect(db.view).toHaveBeenCalledOnce();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].commentId).toBe("a");
    expect(result.nextCursor).toBeTruthy();
  });

  it("lists active thread summaries", async () => {
    const db = {
      view: vi.fn().mockResolvedValue({
        rows: [
          { key: "thread-z", value: 2 },
          { key: "thread-a", value: 5 }
        ]
      })
    };

    const result = await listThreads(db as any);
    expect(result).toEqual([
      { threadId: "thread-a", commentCount: 5 },
      { threadId: "thread-z", commentCount: 2 }
    ]);
  });

  it("creates a comment document and returns API view", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("11111111-1111-4111-8111-111111111111");

    const insert = vi.fn().mockResolvedValue({ ok: true, id: "any", rev: "1-a" });
    const db = { insert };

    const created = await createComment(
      db as any,
      "thread-1",
      "Hello world",
      "Alice"
    );

    expect(insert).toHaveBeenCalledOnce();
    const doc = insert.mock.calls[0][0] as CommentDoc;
    expect(doc.type).toBe("comment");
    expect(doc.commentId).toBe("11111111-1111-4111-8111-111111111111");
    expect(doc.threadId).toBe("thread-1");
    expect(doc.body).toBe("Hello world");
    expect(doc.authorName).toBe("Alice");
    expect(doc._id).toBeDefined();
    expect((doc._id as string).startsWith("comment:thread-1:")).toBe(true);

    expect(created.commentId).toBe("11111111-1111-4111-8111-111111111111");
    expect(created.threadId).toBe("thread-1");
    expect(created.body).toBe("Hello world");
    expect(created.authorName).toBe("Alice");
  });

  it("soft-deletes an existing comment", async () => {
    const db = {
      view: vi.fn().mockResolvedValue({
        rows: [
          {
            id: "doc-a",
            key: ["thread-1", "a"],
            doc: {
              _id: "doc-a",
              _rev: "1-a",
              type: "comment",
              commentId: "a",
              threadId: "thread-1",
              body: "hello",
              createdAt: "2026-01-01T00:00:00.000Z"
            }
          }
        ]
      }),
      insert: vi.fn().mockResolvedValue({ ok: true })
    };

    const result = await softDeleteComment(db as any, "thread-1", "a");
    expect(result).toBe("deleted");
    expect(db.insert).toHaveBeenCalledOnce();
    const updated = db.insert.mock.calls[0][0] as CommentDoc;
    expect(typeof updated.deletedAt).toBe("string");
  });

  it("restores a soft-deleted comment", async () => {
    const db = {
      view: vi.fn().mockResolvedValue({
        rows: [
          {
            id: "doc-a",
            key: ["thread-1", "a"],
            doc: {
              _id: "doc-a",
              _rev: "2-a",
              type: "comment",
              commentId: "a",
              threadId: "thread-1",
              body: "hello",
              createdAt: "2026-01-01T00:00:00.000Z",
              deletedAt: "2026-01-02T00:00:00.000Z"
            }
          }
        ]
      }),
      insert: vi.fn().mockResolvedValue({ ok: true })
    };

    const result = await restoreComment(db as any, "thread-1", "a");
    expect(result).toBe("restored");
    expect(db.insert).toHaveBeenCalledOnce();
    const updated = db.insert.mock.calls[0][0] as CommentDoc;
    expect(updated.deletedAt).toBeUndefined();
  });
});
