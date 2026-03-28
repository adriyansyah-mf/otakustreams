import type { Metadata, Viewport } from "next";
import "./globals.css";
import { env } from "@/lib/env";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B0B10",
};

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  applicationName: "Otakunesia",
  title: {
    default:
      "Otakunesia — Nonton Anime Sub Indo & Baca Manga Komik Online",
    template: "%s · Otakunesia",
  },
  description:
    "Otakunesia: nonton anime sub indo, baca manga, dan komik online subtitle Indonesia. Katalog lengkap, update terbaru, dan streaming yang ringan di satu tempat.",
  keywords: [
    "nonton anime",
    "nonton anime sub indo",
    "anime sub indo",
    "baca komik",
    "baca manga",
    "otakunesia",
    "nonton anime subtitle indonesia",
    "baca manga indonesia",
    "anime terbaru",
    "manga terbaru",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/icon.svg" }],
  },
  openGraph: {
    title:
      "Otakunesia — Nonton Anime Sub Indo & Baca Manga Komik Online",
    description:
      "Otakunesia: nonton anime sub indo, baca manga, dan komik online subtitle Indonesia. Katalog lengkap, update terbaru, dan streaming yang ringan di satu tempat.",
    url: env.siteUrl,
    siteName: "Otakunesia",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary",
    title:
      "Otakunesia — Nonton Anime Sub Indo & Baca Manga Komik Online",
    description:
      "Otakunesia: nonton anime sub indo, baca manga, dan komik online subtitle Indonesia. Katalog lengkap, update terbaru, dan streaming yang ringan di satu tempat.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{props.children}</body>
    </html>
  );
}

