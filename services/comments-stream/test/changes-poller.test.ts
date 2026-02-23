import { describe, expect, it, vi } from "vitest";
import { pollChanges } from "../src/stream/changes-poller.js";

describe("changes poller", () => {
  it("emits callback only for matching comment/thread docs", async () => {
    const db = {
      changes: vi.fn().mockResolvedValue({
        last_seq: "9-abc",
        results: [
          {
            seq: "1-a",
            doc: {
              type: "comment",
              commentId: "c-1",
              threadId: "thread-a",
              body: "hello",
              createdAt: "2026-01-01T00:00:00.000Z"
            }
          },
          {
            seq: "2-b",
            doc: {
              type: "comment",
              commentId: "c-2",
              threadId: "thread-b",
              body: "wrong thread",
              createdAt: "2026-01-01T00:00:00.000Z"
            }
          },
          {
            seq: "2-c",
            doc: {
              type: "comment",
              commentId: "c-removed",
              threadId: "thread-a",
              body: "deleted",
              createdAt: "2026-01-01T00:00:00.000Z",
              deletedAt: "2026-01-02T00:00:00.000Z"
            }
          },
          {
            seq: "3-c",
            doc: {
              type: "other",
              commentId: "c-3",
              threadId: "thread-a",
              body: "wrong type",
              createdAt: "2026-01-01T00:00:00.000Z"
            }
          },
          { seq: "4-d" }
        ]
      })
    };

    const received: Array<{ seq: string | number; commentId: string }> = [];
    const logger = { error: vi.fn() };

    const nextSince = await pollChanges({
      db: db as any,
      since: "now",
      threadId: "thread-a",
      logger: logger as any,
      onComment: (seq, doc) => {
        received.push({ seq, commentId: doc.commentId });
      }
    });

    expect(db.changes).toHaveBeenCalledOnce();
    expect(received).toEqual([{ seq: "1-a", commentId: "c-1" }]);
    expect(nextSince).toBe("9-abc");
    expect(logger.error).not.toHaveBeenCalled();
  });
});
