import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),

  email: z
    .string()
    .min(1, "Email là bắt buộc")
    .refine((val) => /\S+@\S+\.\S+/.test(val), {
      message: "Email không hợp lệ",
    }),

  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9+\-() ]+$/.test(val), {
      message: "Số điện thoại không hợp lệ",
    }),

  website: z
    .string()
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: "Website không hợp lệ",
    }),

  company: z.object({
    name: z.string().min(2, "Tên công ty phải có ít nhất 2 ký tự"),
  }),
});

export type UserFormValues = z.infer<typeof userSchema>;