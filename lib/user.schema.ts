// lib/validations/user.schema.ts
// ────────────────────────────────────────────────────────────────────────────
// Tập trung toàn bộ Zod schema liên quan đến User vào 1 file.
// Lợi ích:
//   1. Dễ tái sử dụng giữa Create form và Edit form
//   2. Type tự infer từ schema — không viết interface riêng
//   3. Dễ test độc lập (schema không phụ thuộc React)

import { z } from "zod";

// ─── Bài 1: Schema cơ bản ────────────────────────────────────────────────────
export const createUserSchema = z.object({
  name: z
    .string({ message: "Tên là bắt buộc" })
    .min(2, "Tên ít nhất 2 ký tự")
    .max(50, "Tên tối đa 50 ký tự")
    .trim(),

  username: z
    .string()
    .min(3, "Username ít nhất 3 ký tự")
    .max(20, "Username tối đa 20 ký tự")
    .regex(/^[a-z0-9_]+$/, "Username chỉ gồm chữ thường, số và _")
    .optional()
    .or(z.literal("")), // cho phép empty string (không bắt buộc)

  email: z
    .string({ message: "Email là bắt buộc" })
    .min(1)
    .toLowerCase() // auto normalize về lowercase
    .pipe(z.email({ message: "Email không đúng định dạng" })),

  phone: z
    .string()
    .regex(
      /^\+?[0-9\s\-\(\)]{7,15}$/,
      "Số điện thoại không hợp lệ (VD: 0901234567)"
    )
    .optional()
    .or(z.literal("")),

  website: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      val => !val || /^https?:\/\/.+/.test(val),
      "Website phải là URL hợp lệ"
    ),

  company: z.string().max(100, "Tên công ty tối đa 100 ký tự").optional(),

  city: z.string().max(50).optional(),
});

// ─── Bài 2: Schema nâng cao với superRefine ──────────────────────────────────
// Rule: phone HOẶC website phải có ít nhất 1
export const createUserSchemaStrict = createUserSchema.superRefine(
  (data, ctx) => {
    const hasPhone = data.phone && data.phone.trim() !== "";
    const hasWebsite = data.website && data.website.trim() !== "";

    // Cross-field validation: bắt buộc có ít nhất 1 trong 2
    if (!hasPhone && !hasWebsite) {
      ctx.addIssue({
        code: 'custom',
        message: "Phải có ít nhất Phone hoặc Website",
        path: ["phone"],
      });
      ctx.addIssue({
        code: 'custom',
        message: "Phải có ít nhất Phone hoặc Website",
        path: ["website"],
      });
    }

    // Website phải là HTTPS (chỉ validate khi có giá trị)
    if (hasWebsite && !data.website!.startsWith("https://")) {
      ctx.addIssue({
        code: 'custom',
        message: "Website phải dùng HTTPS (bắt đầu bằng https://)",
        path: ["website"],
      });
    }
  }
);

// ─── Edit schema — tất cả field đều optional (chỉ submit field đã thay đổi) ──
export const editUserSchema = createUserSchema.partial().extend({
  // Nhưng name và email vẫn required nếu được cung cấp
  name: z.string().min(2, "Tên ít nhất 2 ký tự").optional(),
  email: z.string().pipe(z.email("Email không đúng định dạng")).optional(),
});

// ─── TypeScript types tự infer từ schema ─────────────────────────────────────
export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type CreateUserStrictFormValues = z.infer<typeof createUserSchemaStrict>;
export type EditUserFormValues = z.infer<typeof editUserSchema>;

// ─── Helper: giá trị mặc định cho form Create ────────────────────────────────
export const createUserDefaultValues: CreateUserFormValues = {
  name: "",
  username: "",
  email: "",
  phone: "",
  website: "",
  company: "",
  city: "",
};
