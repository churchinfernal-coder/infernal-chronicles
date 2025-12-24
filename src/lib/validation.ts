import { z } from "zod";

export const postSchema = z. object({
  content: z. string().min(1, "Post cannot be empty"). max(5000, "Max 5000 characters"),
  privacy: z.enum(["public", "friends", "private"]),
});

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be less than 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed");

export const bioSchema = z.string().max(500, "Bio must be less than 500 characters").optional();

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000, "Max 2000 characters"),
});
