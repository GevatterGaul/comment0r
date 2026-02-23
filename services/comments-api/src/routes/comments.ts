import type { FastifyInstance } from "fastify";
import type nano from "nano";
import { listCommentsQuerySchema, createCommentSchema } from "../schemas/comments.js";
import {
  createComment,
  listComments,
  listThreads,
  restoreComment,
  softDeleteComment
} from "../db/comments-repo.js";
import type { CommentDoc } from "../types.js";

const adminEmailAllowlist = (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter((value) => value.length > 0);

function isAdminRequest(request: { headers: Record<string, unknown> }): boolean {
  const role = request.headers["x-auth-request-role"];
  if (role === "admin") {
    return true;
  }

  const email = request.headers["x-auth-request-email"];
  if (typeof email === "string" && adminEmailAllowlist.length > 0) {
    return adminEmailAllowlist.includes(email.toLowerCase());
  }

  return false;
}

export function registerCommentRoutes(app: FastifyInstance, db: nano.DocumentScope<CommentDoc>) {
  app.get("/api/threads", async () => {
    const items = await listThreads(db);
    return { items };
  });

  app.get("/api/threads/:threadId/comments", async (request, reply) => {
    const threadId = (request.params as { threadId: string }).threadId;
    const parsedQuery = listCommentsQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.code(400).send({ error: "invalid_query", details: parsedQuery.error.flatten() });
    }

    const result = await listComments(
      db,
      threadId,
      parsedQuery.data.limit ?? 50,
      parsedQuery.data.cursor,
      parsedQuery.data.includeDeleted ?? false
    );
    return result;
  });

  app.post("/api/threads/:threadId/comments", async (request, reply) => {
    const threadId = (request.params as { threadId: string }).threadId;
    const parsedBody = createCommentSchema.safeParse(request.body);

    if (!parsedBody.success) {
      return reply.code(400).send({ error: "invalid_body", details: parsedBody.error.flatten() });
    }

    const authenticatedUser = request.headers["x-auth-request-user"];
    const authorName = parsedBody.data.authorName ?? (typeof authenticatedUser === "string" ? authenticatedUser : undefined);

    const created = await createComment(
      db,
      threadId,
      parsedBody.data.body,
      authorName
    );
    return reply.code(201).send(created);
  });

  app.delete("/api/threads/:threadId/comments/:commentId", async (request, reply) => {
    if (!isAdminRequest(request as { headers: Record<string, unknown> })) {
      return reply.code(403).send({ error: "forbidden" });
    }

    const params = request.params as { threadId: string; commentId: string };
    const result = await softDeleteComment(db, params.threadId, params.commentId);

    if (result === "not_found") {
      return reply.code(404).send({ error: "comment_not_found" });
    }

    return reply.code(204).send();
  });

  app.post("/api/threads/:threadId/comments/:commentId/restore", async (request, reply) => {
    if (!isAdminRequest(request as { headers: Record<string, unknown> })) {
      return reply.code(403).send({ error: "forbidden" });
    }

    const params = request.params as { threadId: string; commentId: string };
    const result = await restoreComment(db, params.threadId, params.commentId);

    if (result === "not_found") {
      return reply.code(404).send({ error: "comment_not_found" });
    }

    return reply.code(204).send();
  });
}
