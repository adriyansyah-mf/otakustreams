import { z } from "zod";

const schema = z.object({
  apiBaseUrl: z.string().min(1),
  siteUrl: z.string().url(),
  internalApiBaseUrl: z.string().url(),
  /** Tampilkan link Admin di footer (set NEXT_PUBLIC_SHOW_ADMIN_FOOTER=true jika perlu). */
  showAdminFooterLink: z.boolean(),
});

export const env = schema.parse({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:8080",
  internalApiBaseUrl: process.env.INTERNAL_API_BASE_URL ?? "http://localhost:8000",
  showAdminFooterLink: process.env.NEXT_PUBLIC_SHOW_ADMIN_FOOTER === "true",
});
