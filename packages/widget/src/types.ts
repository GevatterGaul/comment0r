export type Comment = {
  commentId: string;
  threadId: string;
  authorName?: string;
  body: string;
  createdAt: string;
};

export type InitOptions = {
  apiBaseUrl: string;
  threadId: string;
  container: string | HTMLElement;
};

export type CommentListResponse = {
  items: Comment[];
};
