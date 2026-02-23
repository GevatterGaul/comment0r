import nano from "nano";
import type { ApiConfig } from "../config.js";
import type { CommentDoc } from "../types.js";

async function ensureDatabase(client: nano.ServerScope, dbName: string) {
  try {
    await client.db.get(dbName);
  } catch {
    await client.db.create(dbName);
  }
}

async function ensureDesignDoc(db: nano.DocumentScope<unknown>) {
  const ddocId = "_design/comments";
  const ddoc = {
    _id: ddocId,
    views: {
      byThreadNewest: {
        map: "function(doc){ if(doc.type === 'comment' && doc.threadId && doc.createdAt && !doc.deletedAt){ emit([doc.threadId, doc.createdAt], null); } }"
      },
      byThreadNewestAll: {
        map: "function(doc){ if(doc.type === 'comment' && doc.threadId && doc.createdAt){ emit([doc.threadId, doc.createdAt], null); } }"
      },
      byThreadCommentId: {
        map: "function(doc){ if(doc.type === 'comment' && doc.threadId && doc.commentId){ emit([doc.threadId, doc.commentId], null); } }"
      },
      byThreadActive: {
        map: "function(doc){ if(doc.type === 'comment' && doc.threadId && !doc.deletedAt){ emit(doc.threadId, 1); } }",
        reduce: "_count"
      }
    }
  };

  try {
    const existing = await db.get(ddocId);
    await db.insert({ ...ddoc, _rev: (existing as { _rev: string })._rev });
  } catch {
    await db.insert(ddoc);
  }
}

export async function initCommentsDb(config: ApiConfig): Promise<nano.DocumentScope<CommentDoc>> {
  const client = nano(config.couchUrl);
  await ensureDatabase(client, config.couchDb);
  const db = client.db.use<CommentDoc>(config.couchDb);
  await ensureDesignDoc(db as unknown as nano.DocumentScope<unknown>);
  return db;
}
