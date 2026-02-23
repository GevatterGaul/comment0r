import { describe, expect, it } from "vitest";
import { createCommentSchema, listCommentsQuerySchema } from "../src/schemas/comments.js";

describe("comment schemas", () => {
  it("accepts valid create payload", () => {
    const parsed = createCommentSchema.safeParse({ body: "Hello", authorName: "Alice" });
    expect(parsed.success).toBe(true);
  });

  it("rejects blank or oversized create payload", () => {
    expect(createCommentSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(createCommentSchema.safeParse({ body: "x".repeat(2001) }).success).toBe(false);
  });

  it("accepts limit and cursor query", () => {
    const parsed = listCommentsQuerySchema.safeParse({
      limit: "25",
      cursor: "abc",
      includeDeleted: "true"
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.limit).toBe(25);
      expect(parsed.data.cursor).toBe("abc");
      expect(parsed.data.includeDeleted).toBe(true);
    }
  });

  it("rejects invalid query limits", () => {
    expect(listCommentsQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
    expect(listCommentsQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });
});
