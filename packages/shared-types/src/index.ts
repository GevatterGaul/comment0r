export type CommentDoc = {
  _id?: string;
  _rev?: string;
  type: "comment";
  commentId: string;
  threadId: string;
  authorName?: string;
  body: string;
  createdAt: string;
  deletedAt?: string;
};
