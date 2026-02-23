import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "../src/utils/cursor.js";
import type { Cursor } from "../src/types.js";

describe("cursor helpers", () => {
  it("roundtrips cursor values", () => {
    const value: Cursor = {
      startkey: ["thread-1", "2026-01-01T00:00:00.000Z"],
      startkey_docid: "doc-1"
    };
    const encoded = encodeCursor(value);
    expect(decodeCursor(encoded)).toEqual(value);
  });

  it("returns undefined for invalid encoded cursor", () => {
    expect(decodeCursor("not-base64")).toBeUndefined();
  });
});
