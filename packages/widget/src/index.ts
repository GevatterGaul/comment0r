import type { InitOptions } from "./types.js";
import { CommentWidget } from "./widget.js";

export async function init(options: InitOptions) {
  const widget = new CommentWidget(options);
  await widget.init();
  return widget;
}
