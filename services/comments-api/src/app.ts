import Fastify from "fastify";
import cors from "@fastify/cors";
import type nano from "nano";
import { registerHealthRoute } from "./routes/health.js";
import { registerCommentRoutes } from "./routes/comments.js";
import type { CommentDoc } from "./types.js";

export async function buildApp(db: nano.DocumentScope<CommentDoc>) {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  registerHealthRoute(app);
  registerCommentRoutes(app, db);

  return app;
}
