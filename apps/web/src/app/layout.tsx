import type { Metadata } from "next";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  applicationName: "OtakuStream",
  title: {
    default: "OtakuStream",
    template: "%s · OtakuStream",
  },
  description: "Nonton anime dan baca manga subtitle Indonesia dengan update crawler otomatis.",
  keywords: [
    "anime subtitle indonesia",
    "streaming anime",
    "baca manga",
    "otakustream",
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
    title: "OtakuStream",
    description: "Nonton anime dan baca manga subtitle Indonesia dengan update crawler otomatis.",
    url: env.siteUrl,
    siteName: "OtakuStream",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary",
    title: "OtakuStream",
    description: "Nonton anime dan baca manga subtitle Indonesia.",
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

