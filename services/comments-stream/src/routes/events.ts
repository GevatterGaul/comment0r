import type { FastifyInstance } from "fastify";
import type nano from "nano";
import { setSseHeaders } from "../sse/headers.js";
import { writeCommentCreated, writeConnected, writeHeartbeat } from "../sse/writer.js";
import { pollChanges } from "../stream/changes-poller.js";
import type { CommentDoc } from "../types.js";

const HEARTBEAT_INTERVAL_MS = 15000;

export function registerEventRoutes(app: FastifyInstance, db: nano.DocumentScope<CommentDoc>) {
  app.get("/events/threads/:threadId/events", async (request, reply) => {
    const threadId = (request.params as { threadId: string }).threadId;
    const lastEventId = request.headers["last-event-id"];
    let closed = false;
    let since: string | number = typeof lastEventId === "string" ? lastEventId : "now";

    setSseHeaders(reply);
    writeConnected(reply, threadId);

    const heartbeat = setInterval(() => {
      if (!closed) {
        writeHeartbeat(reply);
      }
    }, HEARTBEAT_INTERVAL_MS);

    request.raw.on("close", () => {
      closed = true;
      clearInterval(heartbeat);
    });

    while (!closed) {
      since = await pollChanges({
        db,
        since,
        threadId,
        logger: request.log,
        onComment: (seq, doc) => writeCommentCreated(reply, seq, doc)
      });
    }

    return reply;
  });
}
