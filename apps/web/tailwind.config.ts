import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0B10",
        panel: "#12121A",
        soft: "#1A1A25",
        brand: "#E50914",
        text: "#E7E7EA"
      }
    }
  },
  plugins: []
} satisfies Config;

