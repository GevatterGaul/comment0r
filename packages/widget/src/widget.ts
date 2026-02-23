import { createComment, fetchComments, openEventStream } from "./api.js";
import { CommentStore } from "./state.js";
import { ensureStyle } from "./styles.js";
import type { Comment, InitOptions } from "./types.js";
import { renderComments, renderShell, resolveContainer } from "./view.js";

export class CommentWidget {
  private readonly apiBaseUrl: string;
  private readonly threadId: string;
  private readonly store = new CommentStore();
  private readonly listEl: HTMLElement;
  private readonly submitBtn: HTMLButtonElement;
  private readonly nameInput: HTMLInputElement;
  private readonly bodyInput: HTMLTextAreaElement;
  private stream?: EventSource;

  constructor(options: InitOptions) {
    this.apiBaseUrl = options.apiBaseUrl.replace(/\/$/, "");
    this.threadId = options.threadId;

    ensureStyle();
    const container = resolveContainer(options.container);
    const bindings = renderShell(container, this.threadId);

    this.listEl = bindings.listEl;
    this.submitBtn = bindings.submitBtn;
    this.nameInput = bindings.nameInput;
    this.bodyInput = bindings.bodyInput;

    bindings.form.addEventListener("submit", (event: SubmitEvent) => {
      event.preventDefault();
      void this.submitComment();
    });
  }

  async init() {
    this.store.reset();
    const comments = await fetchComments(this.apiBaseUrl, this.threadId);
    for (const comment of comments) {
      this.store.insert(comment);
    }
    this.render();

    this.stream = openEventStream(this.apiBaseUrl, this.threadId, (comment: Comment) => {
      this.store.insert(comment);
      this.render();
    });
  }

  destroy() {
    if (this.stream) {
      this.stream.close();
      this.stream = undefined;
    }
  }

  private async submitComment() {
    const body = this.bodyInput.value.trim();
    const authorName = this.nameInput.value.trim();
    if (!body) return;

    this.submitBtn.disabled = true;
    try {
      const created = await createComment(this.apiBaseUrl, this.threadId, body, authorName || undefined);
      if (!created) return;
      this.store.insert(created);
      this.bodyInput.value = "";
      this.render();
    } finally {
      this.submitBtn.disabled = false;
    }
  }

  private render() {
    renderComments(this.listEl, this.store.list());
  }
}
