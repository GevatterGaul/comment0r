type ThreadSummary = {
  threadId: string;
  commentCount: number;
};

type CommentView = {
  commentId: string;
  threadId: string;
  authorName?: string;
  body: string;
  createdAt: string;
  deletedAt?: string;
};

type ListResponse = {
  items: CommentView[];
  nextCursor?: string;
};

type ThreadsResponse = {
  items: ThreadSummary[];
};

const STYLE_ID = "comment0r-admin-style";

const CSS = `
.c0a-root{font-family:Georgia,"Times New Roman",serif;background:#fffdf8;border:1px solid #d9cbb3;border-radius:12px;padding:14px;color:#2d2518;}
.c0a-head{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px;}
.c0a-select,.c0a-btn{font:inherit;border:1px solid #cdbb9d;border-radius:10px;padding:8px 10px;background:#fff;}
.c0a-btn{cursor:pointer;background:#2e6e5c;color:#fff;border-color:#255849;}
.c0a-meta{font-size:.9rem;color:#5d543f;}
.c0a-list{display:grid;gap:10px;}
.c0a-item{border:1px solid #e7dcc7;border-radius:10px;padding:10px;background:#fff;}
.c0a-row{display:flex;justify-content:space-between;align-items:center;gap:8px;}
.c0a-name{font-weight:700;}
.c0a-date{font-size:.85rem;color:#6f6249;}
.c0a-body{margin-top:8px;white-space:pre-wrap;line-height:1.35;}
.c0a-empty{padding:6px 0;color:#6f6249;}
.c0a-item-removed{background:#f4f0ea;border-color:#d8c4b2;}
.c0a-removed-tag{display:inline-block;margin-left:8px;font-size:.78rem;padding:1px 6px;border-radius:999px;background:#b85f41;color:#fff;}
.c0a-toggle{display:flex;align-items:center;gap:6px;font-size:.9rem;color:#5d543f;}
`;

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

class ManagementApp {
  private readonly apiBaseUrl: string;
  private readonly root: HTMLElement;
  private readonly threadSelect: HTMLSelectElement;
  private readonly reloadButton: HTMLButtonElement;
  private readonly showRemovedToggle: HTMLInputElement;
  private readonly metaEl: HTMLElement;
  private readonly listEl: HTMLElement;

  constructor(apiBaseUrl: string, root: HTMLElement) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/$/, "");
    this.root = root;

    ensureStyle();
    this.root.innerHTML = `
      <section class="c0a-root">
        <div class="c0a-head">
          <select class="c0a-select"></select>
          <button class="c0a-btn" type="button">Reload</button>
          <label class="c0a-toggle">
            <input class="c0a-show-removed" type="checkbox" />
            Show removed
          </label>
          <div class="c0a-meta"></div>
        </div>
        <div class="c0a-list"></div>
      </section>
    `;

    this.threadSelect = this.root.querySelector(".c0a-select") as HTMLSelectElement;
    this.reloadButton = this.root.querySelector(".c0a-btn") as HTMLButtonElement;
    this.showRemovedToggle = this.root.querySelector(".c0a-show-removed") as HTMLInputElement;
    this.metaEl = this.root.querySelector(".c0a-meta") as HTMLElement;
    this.listEl = this.root.querySelector(".c0a-list") as HTMLElement;
  }

  async init() {
    this.threadSelect.addEventListener("change", () => {
      void this.loadCurrentThread();
    });
    this.reloadButton.addEventListener("click", () => {
      void this.refresh();
    });
    this.showRemovedToggle.addEventListener("change", () => {
      void this.loadCurrentThread();
    });

    await this.refresh();
  }

  private async refresh() {
    const selectedBefore = this.threadSelect.value;
    const threads = await this.fetchThreads();
    this.threadSelect.innerHTML = "";

    if (threads.length === 0) {
      this.threadSelect.innerHTML = `<option value="">No threads</option>`;
      this.metaEl.textContent = "No active comments found.";
      this.listEl.innerHTML = `<div class="c0a-empty">Nothing to manage yet.</div>`;
      return;
    }

    for (const thread of threads) {
      const option = document.createElement("option");
      option.value = thread.threadId;
      option.textContent = `${thread.threadId} (${thread.commentCount})`;
      this.threadSelect.appendChild(option);
    }

    if (selectedBefore && threads.some((thread) => thread.threadId === selectedBefore)) {
      this.threadSelect.value = selectedBefore;
    }

    await this.loadCurrentThread();
  }

  private async loadCurrentThread() {
    const threadId = this.threadSelect.value;
    if (!threadId) {
      this.listEl.innerHTML = `<div class="c0a-empty">Select a thread.</div>`;
      return;
    }

    const includeDeleted = this.showRemovedToggle.checked;
    const comments = await this.fetchAllComments(threadId, includeDeleted);
    const removedCount = comments.filter((comment) => Boolean(comment.deletedAt)).length;
    const activeCount = comments.length - removedCount;
    this.metaEl.textContent = includeDeleted
      ? `Thread ${threadId} | ${activeCount} active | ${removedCount} removed`
      : `Thread ${threadId} | ${activeCount} active comments`;
    this.renderComments(comments);
  }

  private async fetchThreads(): Promise<ThreadSummary[]> {
    const response = await fetch(`${this.apiBaseUrl}/api/threads`);
    if (!response.ok) return [];
    const data = (await response.json()) as ThreadsResponse;
    return data.items;
  }

  private async fetchAllComments(threadId: string, includeDeleted: boolean): Promise<CommentView[]> {
    const items: CommentView[] = [];
    let cursor: string | undefined;

    for (;;) {
      const query = new URLSearchParams({ limit: "100" });
      if (includeDeleted) {
        query.set("includeDeleted", "true");
      }
      if (cursor) {
        query.set("cursor", cursor);
      }

      const response = await fetch(
        `${this.apiBaseUrl}/api/threads/${encodeURIComponent(threadId)}/comments?${query.toString()}`
      );
      if (!response.ok) break;

      const page = (await response.json()) as ListResponse;
      items.push(...page.items);

      if (!page.nextCursor) break;
      cursor = page.nextCursor;
    }

    return items;
  }

  private renderComments(comments: CommentView[]) {
    if (comments.length === 0) {
      this.listEl.innerHTML = `<div class="c0a-empty">No comments for this filter.</div>`;
      return;
    }

    this.listEl.innerHTML = comments
      .map(
        (comment) => `
      <article class="c0a-item ${comment.deletedAt ? "c0a-item-removed" : ""}">
        <div class="c0a-row">
          <div>
            <span class="c0a-name">${escapeHtml(comment.authorName?.trim() || "Anonymous")}</span>
            <span class="c0a-date">${new Date(comment.createdAt).toLocaleString()}</span>
            ${comment.deletedAt ? '<span class="c0a-removed-tag">Removed</span>' : ""}
          </div>
          <button class="c0a-btn" data-comment-id="${escapeHtml(comment.commentId)}" data-action="${
          comment.deletedAt ? "restore" : "remove"
        }" type="button">${comment.deletedAt ? "Re-enable" : "Remove"}</button>
        </div>
        <div class="c0a-body">${escapeHtml(comment.body)}</div>
      </article>
    `
      )
      .join("");

    Array.from(this.listEl.querySelectorAll("button[data-comment-id]")).forEach((button) => {
      button.addEventListener("click", () => {
        const id = (button as HTMLButtonElement).dataset.commentId;
        const action = (button as HTMLButtonElement).dataset.action;
        if (!id) return;
        if (action === "restore") {
          void this.restoreComment(id);
          return;
        }
        void this.removeComment(id);
      });
    });
  }

  private async removeComment(commentId: string) {
    const threadId = this.threadSelect.value;
    if (!threadId) return;

    const response = await fetch(
      `${this.apiBaseUrl}/api/threads/${encodeURIComponent(threadId)}/comments/${encodeURIComponent(commentId)}`,
      { method: "DELETE" }
    );

    if (!response.ok && response.status !== 404) {
      return;
    }

    await this.refresh();
  }

  private async restoreComment(commentId: string) {
    const threadId = this.threadSelect.value;
    if (!threadId) return;

    const response = await fetch(
      `${this.apiBaseUrl}/api/threads/${encodeURIComponent(threadId)}/comments/${encodeURIComponent(commentId)}/restore`,
      { method: "POST" }
    );

    if (!response.ok && response.status !== 404) {
      return;
    }

    await this.refresh();
  }
}

export async function init(options: { apiBaseUrl: string; container: string | HTMLElement }) {
  const root =
    typeof options.container === "string"
      ? (document.querySelector(options.container) as HTMLElement)
      : options.container;

  if (!root) {
    throw new Error("Comment0rAdmin: container not found");
  }

  const app = new ManagementApp(options.apiBaseUrl, root);
  await app.init();
  return app;
}
