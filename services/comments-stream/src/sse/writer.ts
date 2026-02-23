import type { FastifyReply } from "fastify";
import type { CommentDoc } from "../types.js";

export function writeConnected(reply: FastifyReply, threadId: string) {
  reply.raw.write("retry: 3000\n");
  reply.raw.write("event: connected\n");
  reply.raw.write(`data: ${JSON.stringify({ threadId })}\n\n`);
}

export function writeHeartbeat(reply: FastifyReply) {
  reply.raw.write("event: heartbeat\n");
  reply.raw.write(`data: ${JSON.stringify({ ts: new Date().toISOString() })}\n\n`);
}

export function writeCommentCreated(reply: FastifyReply, seq: string | number, doc: CommentDoc) {
  reply.raw.write(`id: ${String(seq)}\n`);
  reply.raw.write("event: comment.created\n");
  reply.raw.write(
    `data: ${JSON.stringify({
      commentId: doc.commentId,
      threadId: doc.threadId,
      authorName: doc.authorName,
      body: doc.body,
      createdAt: doc.createdAt
    })}\n\n`
  );
}
