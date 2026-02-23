import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";

describe("comments-stream integration", () => {
  it("serves health endpoint", async () => {
    const db = { changes: async () => ({ last_seq: "now", results: [] }) };
    const app = await buildApp(db as any);

    try {
      const response = await app.inject({ method: "GET", url: "/health" });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ ok: true });
    } finally {
      await app.close();
    }
  });
});
