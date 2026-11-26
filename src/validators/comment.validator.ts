import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, { message: 'Comment content cannot be empty' })
    .max(5000, { message: 'Comment cannot exceed 5000 characters' })
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
