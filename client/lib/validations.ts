import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const movieSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000),
  genre: z.string().min(1, "Genre is required"),
  releaseYear: z.coerce.number().min(1900).max(2025),
  bannerUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  rating: z.number().min(1, "Rating is required").max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(500),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type MovieInput = z.infer<typeof movieSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
