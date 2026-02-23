import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "../src/app.js";

describe("comments-api integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("serves health endpoint", async () => {
    const db = { view: vi.fn(), insert: vi.fn() };
    const app = await buildApp(db as any);

    try {
      const response = await app.inject({ method: "GET", url: "/health" });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ ok: true });
    } finally {
      await app.close();
    }
  });

  it("returns 400 for invalid query payload", async () => {
    const db = { view: vi.fn(), insert: vi.fn() };
    const app = await buildApp(db as any);

    try {
      const response = await app.inject({
        method: "GET",
        url: "/api/threads/test-thread/comments?limit=0"
      });
      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe("invalid_query");
    } finally {
      await app.close();
    }
  });

  it("lists comments from repository view", async () => {
    const db = {
      view: vi.fn().mockResolvedValue({
        rows: [
          {
            id: "doc-1",
            key: ["test-thread", "2026-01-02T00:00:00.000Z"],
            doc: {
              _id: "doc-1",
              type: "comment",
              commentId: "c-1",
              threadId: "test-thread",
              authorName: "Alice",
              body: "Hello",
              createdAt: "2026-01-02T00:00:00.000Z"
            }
          }
        ]
      }),
      insert: vi.fn()
    };

    const app = await buildApp(db as any);

    try {
      const response = await app.inject({
        method: "GET",
        url: "/api/threads/test-thread/comments?limit=50"
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json();
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0]).toMatchObject({
        commentId: "c-1",
        threadId: "test-thread",
        body: "Hello"
      });
    } finally {
      await app.close();
    }
  });

  it("includes removed comments when includeDeleted=true", async () => {
    const db = {
      view: vi.fn().mockResolvedValue({
        rows: [
          {
            id: "doc-1",
            key: ["test-thread", "2026-01-02T00:00:00.000Z"],
            doc: {
              _id: "doc-1",
              type: "comment",
              commentId: "c-1",
              threadId: "test-thread",
              body: "Hello",
              createdAt: "2026-01-02T00:00:00.000Z",
              deletedAt: "2026-01-03T00:00:00.000Z"
            }
          }
        ]
      }),
      insert: vi.fn()
    };

    const app = await buildApp(db as any);
    try {
      const response = await app.inject({
        method: "GET",
        url: "/api/threads/test-thread/comments?includeDeleted=true"
      });

      expect(response.statusCode).toBe(200);
      const payload = response.json();
      expect(payload.items).toHaveLength(1);
      expect(payload.items[0].deletedAt).toBe("2026-01-03T00:00:00.000Z");
    } finally {
      await app.close();
    }
  });

  it("creates comments and returns created payload", async () => {
    const db = {
      view: vi.fn(),
      insert: vi.fn().mockResolvedValue({ ok: true, id: "doc-1", rev: "1-a" })
    };
    const app = await buildApp(db as any);

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/threads/test-thread/comments",
        payload: {
          body: "Integration hello",
          authorName: "Tester"
        }
      });

      expect(response.statusCode).toBe(201);
      const payload = response.json();
      expect(payload.threadId).toBe("test-thread");
      expect(payload.body).toBe("Integration hello");
      expect(payload.authorName).toBe("Tester");
      expect(typeof payload.commentId).toBe("string");
      expect(db.insert).toHaveBeenCalledOnce();
    } finally {
      await app.close();
    }
  });

  it("lists threads for management selector", async () => {
    const db = {
      view: vi.fn().mockResolvedValue({
        rows: [
          { key: "thread-z", value: 2 },
          { key: "thread-a", value: 1 }
        ]
      }),
      insert: vi.fn()
    };

    const app = await buildApp(db as any);
    try {
      const response = await app.inject({ method: "GET", url: "/api/threads" });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        items: [
          { threadId: "thread-a", commentCount: 1 },
          { threadId: "thread-z", commentCount: 2 }
        ]
      });
    } finally {
      await app.close();
    }
  });

  it("soft-deletes a comment", async () => {
    const db = {
      view: vi.fn().mockResolvedValue({
        rows: [
          {
            id: "doc-1",
            key: ["test-thread", "c-1"],
            doc: {
              _id: "doc-1",
              _rev: "1-a",
              type: "comment",
              commentId: "c-1",
              threadId: "test-thread",
              body: "Hello",
              createdAt: "2026-01-01T00:00:00.000Z"
            }
          }
        ]
      }),
      insert: vi.fn().mockResolvedValue({ ok: true })
    };

    const app = await buildApp(db as any);
    try {
      const response = await app.inject({
        method: "DELETE",
        url: "/api/threads/test-thread/comments/c-1"
      });
      expect(response.statusCode).toBe(204);
      expect(db.insert).toHaveBeenCalledOnce();
      const updated = db.insert.mock.calls[0][0] as { deletedAt?: string };
      expect(typeof updated.deletedAt).toBe("string");
    } finally {
      await app.close();
    }
  });

  it("restores a removed comment", async () => {
    const db = {
      view: vi.fn().mockResolvedValue({
        rows: [
          {
            id: "doc-1",
            key: ["test-thread", "c-1"],
            doc: {
              _id: "doc-1",
              _rev: "2-a",
              type: "comment",
              commentId: "c-1",
              threadId: "test-thread",
              body: "Hello",
              createdAt: "2026-01-01T00:00:00.000Z",
              deletedAt: "2026-01-02T00:00:00.000Z"
            }
          }
        ]
      }),
      insert: vi.fn().mockResolvedValue({ ok: true })
    };

    const app = await buildApp(db as any);
    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/threads/test-thread/comments/c-1/restore"
      });
      expect(response.statusCode).toBe(204);
      expect(db.insert).toHaveBeenCalledOnce();
    } finally {
      await app.close();
    }
  });
});
