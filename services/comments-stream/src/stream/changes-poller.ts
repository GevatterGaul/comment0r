import type { FastifyBaseLogger } from "fastify";
import type nano from "nano";
import type { ChangeRow, ChangesResponse, CommentDoc } from "../types.js";

type PollOptions = {
  db: nano.DocumentScope<CommentDoc>;
  since: string | number;
  threadId: string;
  logger: FastifyBaseLogger;
  onComment: (seq: string | number, doc: CommentDoc) => void;
};

export async function pollChanges(options: PollOptions): Promise<string | number> {
  const { db, since, threadId, logger, onComment } = options;

  try {
    const changes = (await db.changes({
      since,
      include_docs: true,
      feed: "longpoll",
      timeout: 25000,
      limit: 100
    })) as unknown as ChangesResponse;

    for (const row of changes.results as ChangeRow[]) {
      if (!row.doc) continue;
      const doc = row.doc;
      if (doc.type !== "comment" || doc.threadId !== threadId || doc.deletedAt) continue;
      onComment(row.seq, doc);
    }

    return changes.last_seq;
  } catch (error) {
    logger.error({ error }, "error while streaming events");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return since;
  }
}
