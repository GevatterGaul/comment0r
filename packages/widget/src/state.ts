import type { Comment } from "./types.js";

export class CommentStore {
  private comments: Comment[] = [];
  private commentIds = new Set<string>();

  reset() {
    this.comments = [];
    this.commentIds.clear();
  }

  insert(comment: Comment) {
    if (this.commentIds.has(comment.commentId)) return;
    this.commentIds.add(comment.commentId);
    this.comments.push(comment);
    this.comments.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }

  list(): Comment[] {
    return this.comments;
  }
}
