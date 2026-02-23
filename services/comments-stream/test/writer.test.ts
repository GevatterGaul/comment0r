import { describe, expect, it, vi } from "vitest";
import { writeCommentCreated, writeConnected, writeHeartbeat } from "../src/sse/writer.js";

function makeReply() {
  const writes: string[] = [];
  return {
    writes,
    reply: {
      raw: {
        write: vi.fn((chunk: string) => {
          writes.push(chunk);
        })
      }
    }
  };
}

describe("sse writer", () => {
  it("writes connected event payload", () => {
    const { writes, reply } = makeReply();
    writeConnected(reply as any, "thread-a");

    const text = writes.join("");
    expect(text).toContain("retry: 3000");
    expect(text).toContain("event: connected");
    expect(text).toContain('"threadId":"thread-a"');
  });

  it("writes heartbeat event payload", () => {
    const { writes, reply } = makeReply();
    writeHeartbeat(reply as any);

    const text = writes.join("");
    expect(text).toContain("event: heartbeat");
    expect(text).toContain("data: {");
  });

  it("writes comment.created event payload", () => {
    const { writes, reply } = makeReply();
    writeCommentCreated(reply as any, "seq-1", {
      type: "comment",
      commentId: "c-1",
      threadId: "thread-a",
      authorName: "Alice",
      body: "Hello",
      createdAt: "2026-01-01T00:00:00.000Z"
    });

    const text = writes.join("");
    expect(text).toContain("id: seq-1");
    expect(text).toContain("event: comment.created");
    expect(text).toContain('"commentId":"c-1"');
    expect(text).toContain('"threadId":"thread-a"');
  });
});
