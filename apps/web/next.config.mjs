/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  // Saat NEXT_PUBLIC_API_BASE_URL relatif (/api), browser memanggil origin Next — perlu proxy ke FastAPI di dev.
  async rewrites() {
    const publicBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
    if (!publicBase.startsWith("/")) {
      return [];
    }
    const prefix = publicBase.replace(/\/$/, "") || "/api";
    const backend = (process.env.INTERNAL_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
    return [{ source: `${prefix}/:path*`, destination: `${backend}/:path*` }];
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;

