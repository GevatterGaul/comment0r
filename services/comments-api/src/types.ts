export type { CommentDoc } from "@comment0r/shared-types";

export type CommentView = {
  commentId: string;
  threadId: string;
  authorName?: string;
  body: string;
  createdAt: string;
  deletedAt?: string;
};

export type Cursor = {
  startkey: [string, string];
  startkey_docid: string;
};

export type ListCommentsResult = {
  items: CommentView[];
  nextCursor?: string;
};

export type ThreadSummary = {
  threadId: string;
  commentCount: number;
};
