import type { Comment, CommentListResponse } from "./types.js";

function commentsUrl(apiBaseUrl: string, threadId: string): string {
  return `${apiBaseUrl}/api/threads/${encodeURIComponent(threadId)}/comments`;
}

function eventsUrl(apiBaseUrl: string, threadId: string): string {
  return `${apiBaseUrl}/events/threads/${encodeURIComponent(threadId)}/events`;
}

export async function fetchComments(apiBaseUrl: string, threadId: string): Promise<Comment[]> {
  const response = await fetch(`${commentsUrl(apiBaseUrl, threadId)}?limit=50`);
  if (!response.ok) return [];
  const data = (await response.json()) as CommentListResponse;
  return data.items;
}

export async function createComment(
  apiBaseUrl: string,
  threadId: string,
  body: string,
  authorName?: string
): Promise<Comment | null> {
  const response = await fetch(commentsUrl(apiBaseUrl, threadId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, authorName: authorName || undefined })
  });

  if (!response.ok) return null;
  return (await response.json()) as Comment;
}

export function openEventStream(
  apiBaseUrl: string,
  threadId: string,
  onCommentCreated: (comment: Comment) => void
): EventSource {
  const stream = new EventSource(eventsUrl(apiBaseUrl, threadId));
  stream.addEventListener("comment.created", (event) => {
    const payload = JSON.parse((event as MessageEvent).data) as Comment;
    onCommentCreated(payload);
  });
  return stream;
}
