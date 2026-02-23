import { escapeHtml } from "./escape.js";
import type { Comment } from "./types.js";

type ViewBindings = {
  listEl: HTMLElement;
  submitBtn: HTMLButtonElement;
  nameInput: HTMLInputElement;
  bodyInput: HTMLTextAreaElement;
  form: HTMLFormElement;
};

export function resolveContainer(target: string | HTMLElement): HTMLElement {
  if (typeof target === "string") {
    const el = document.querySelector(target);
    if (!el || !(el instanceof HTMLElement)) {
      throw new Error("Comment0r: container not found");
    }
    return el;
  }
  return target;
}

export function renderShell(container: HTMLElement, threadId: string): ViewBindings {
  container.innerHTML = `
    <section class="c0r-root">
      <header class="c0r-header">
        <div class="c0r-title">Comments</div>
        <div class="c0r-thread">Thread: ${escapeHtml(threadId)}</div>
      </header>
      <form class="c0r-form">
        <input class="c0r-input" maxlength="80" placeholder="Display name (optional)" />
        <textarea class="c0r-textarea" maxlength="2000" placeholder="Write a comment..."></textarea>
        <button class="c0r-btn" type="submit">Post comment</button>
      </form>
      <div class="c0r-list"></div>
    </section>
  `;

  return {
    listEl: container.querySelector(".c0r-list") as HTMLElement,
    submitBtn: container.querySelector(".c0r-btn") as HTMLButtonElement,
    nameInput: container.querySelector(".c0r-input") as HTMLInputElement,
    bodyInput: container.querySelector(".c0r-textarea") as HTMLTextAreaElement,
    form: container.querySelector(".c0r-form") as HTMLFormElement
  };
}

export function renderComments(listEl: HTMLElement, comments: Comment[]) {
  if (comments.length === 0) {
    listEl.innerHTML = `<div class="c0r-empty">No comments yet. Start the discussion.</div>`;
    return;
  }

  listEl.innerHTML = comments
    .map(
      (comment) => `
      <article class="c0r-comment" data-comment-id="${escapeHtml(comment.commentId)}">
        <div class="c0r-meta">
          <span class="c0r-name">${escapeHtml(comment.authorName?.trim() || "Anonymous")}</span>
          <span>${new Date(comment.createdAt).toLocaleString()}</span>
        </div>
        <div class="c0r-body">${escapeHtml(comment.body)}</div>
      </article>
    `
    )
    .join("");
}
