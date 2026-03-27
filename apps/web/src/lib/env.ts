export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:8080",
  internalApiBaseUrl: process.env.INTERNAL_API_BASE_URL ?? "http://localhost:8000",
} as const;

