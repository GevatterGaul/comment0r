import nano from "nano";
import type { StreamConfig } from "../config.js";
import type { CommentDoc } from "../types.js";

export function initCommentsDb(config: StreamConfig): nano.DocumentScope<CommentDoc> {
  const client = nano(config.couchUrl);
  return client.db.use<CommentDoc>(config.couchDb);
}
