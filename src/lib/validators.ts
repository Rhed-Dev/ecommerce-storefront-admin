import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/orders";

/** Zod schemas for every API boundary. Nothing client-supplied is trusted raw. */

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const addToCartSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(99), // 0 removes the line
});

const variantInputSchema = z.object({
  id: z.string().min(1).optional(), // present = update existing, absent = create
  name: z.string().trim().min(1).max(80),
  sku: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "SKU may only contain letters, numbers and dashes"),
  priceCents: z.number().int().min(1).max(10_000_000),
  stock: z.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.number().int().min(0).max(10_000).default(5),
});

const imageInputSchema = z.object({
  publicId: z.string().trim().min(1).max(255),
  url: z.string().trim().url().max(2_000),
  alt: z.string().trim().max(160).optional(),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers and dashes"),
  description: z.string().trim().min(10).max(5_000),
  categoryId: z.string().min(1),
  featured: z.boolean().default(false),
  variants: z.array(variantInputSchema).min(1, "At least one variant is required").max(50),
  images: z.array(imageInputSchema).max(8).default([]),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const inventoryAdjustSchema = z.object({
  variantId: z.string().min(1),
  delta: z
    .number()
    .int()
    .min(-100_000)
    .max(100_000)
    .refine((value) => value !== 0, "Adjustment cannot be zero"),
  reason: z.string().trim().min(3, "Provide a short reason for the audit trail").max(200),
});

export const signUploadSchema = z.object({
  folder: z
    .string()
    .trim()
    .regex(/^[a-z0-9/_-]+$/i, "Invalid folder name")
    .max(100)
    .default("storefront/products"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type InventoryAdjustInput = z.infer<typeof inventoryAdjustSchema>;
