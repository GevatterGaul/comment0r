import Fastify from "fastify";
import cors from "@fastify/cors";
import type nano from "nano";
import { registerHealthRoute } from "./routes/health.js";
import { registerEventRoutes } from "./routes/events.js";
import type { CommentDoc } from "./types.js";

export async function buildApp(db: nano.DocumentScope<CommentDoc>) {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  registerHealthRoute(app);
  registerEventRoutes(app, db);

  return app;
}
