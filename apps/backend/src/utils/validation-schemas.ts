import { z } from "zod";

export const createBlogSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters long")
    .max(100, "Title must not exceed 200 characters")
    .trim(),

  content: z
    .string()
    .min(20, "content at least 20 characters long")
    .max(1000, "content must not exceed 1000 characters")
    .trim(),

  image: z
    .string()
    .url("image must be a valid url")
    .optional()
    .or(z.literal("")),

  tags: z
    .array(
      z
        .string()
        .min(2, "tag must be least 2 characters")
        .max(20, "tag must not exceed 20 characters")
        .trim()
        .toLowerCase()
    )
    .max(5, "maximum 5 tags allowed")
    .optional()
    .default([]),
});

export const updateBlogSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters long")
    .max(100, "Title must not exceed 200 characters")
    .trim()
    .optional(),

  content: z
    .string()
    .min(20, "content at least 20 characters long")
    .max(1000, "content must not exceed 1000 characters")
    .trim()
    .optional(),

  image: z
    .string()
    .url("image must be a valid url")
    .optional()
    .or(z.literal("")),

  tags: z
    .array(
      z
        .string()
        .min(2, "tag must be least 2 characters")
        .max(20, "tag must not exceed 20 characters")
        .trim()
        .toLowerCase()
    )
    .max(5, "maximum 5 tags allowed")
    .optional(),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => Math.max(1, parseInt(val) || 1)),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => Math.min(10, Math.max(1, parseInt(val) || 10))), // max 10 per page
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

// comment validation schema
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "comment cannot be empty")
    .max(300, "comment must not exceed 300 characters")
    .trim(),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "comment cannot be empty")
    .max(300, "comment must not exceed 300 characters")
    .trim(),
});

export const commentPaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => Math.max(1, parseInt(val) || 1)),
  limit: z
    .string()
    .optional()
    .default("1")
    .transform((val) => Math.min(50, Math.max(1,parseInt(val) || 20))),
});

export type createCommentInput = z.infer<typeof createCommentSchema>;
export type updateCommentInput = z.infer<typeof updateCommentSchema>;
export type commentPagination = z.infer<typeof commentPaginationSchema>;

// notification validation schemas
export const notificationPaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => Math.max(1, parseInt(val) || 1)),
  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => Math.min(50, Math.max(1, parseInt(val) || 20))), // max 50 notifications per page
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .default("false"),
});

export const markNotificationReadSchema = z.object({
  notificationIds: z
    .array(z.string().uuid("Invalid notification ID"))
    .min(1, "At least one notification ID is required")
    .max(50, "Cannot mark more than 50 notifications at once"),
});

export type NotificationPaginationInput = z.infer<typeof notificationPaginationSchema>;
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;
