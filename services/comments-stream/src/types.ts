import type { CommentDoc } from "@comment0r/shared-types";

export type { CommentDoc };

export type ChangeRow = {
  seq: string | number;
  doc?: CommentDoc;
};

export type ChangesResponse = {
  last_seq: string | number;
  results: ChangeRow[];
};
