import { z } from "zod";

export const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  authorName: z.string().trim().min(1).max(80).optional()
});

export const listCommentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
  includeDeleted: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((value) => value === true || value === "true")
    .optional()
});

export type CreateCommentPayload = z.infer<typeof createCommentSchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;
