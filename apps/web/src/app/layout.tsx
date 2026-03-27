import type { Metadata } from "next";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  applicationName: "Otakunesia",
  title: {
    default: "Otakunesia",
    template: "%s · Otakunesia",
  },
  description: "Otakunesia - nonton anime sub indo, baca manga, dan baca komik online subtitle Indonesia.",
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
    title: "Otakunesia",
    description: "Nonton anime sub indo, baca manga, dan baca komik online subtitle Indonesia.",
    url: env.siteUrl,
    siteName: "Otakunesia",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary",
    title: "Otakunesia",
    description: "Nonton anime sub indo, baca manga, dan baca komik online.",
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

