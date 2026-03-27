import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Otakunesia",
    short_name: "Otakunesia",
    description: "Nonton anime sub indo, baca manga, dan baca komik online.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f19",
    theme_color: "#7c3aed",
    lang: "id",
    categories: ["entertainment", "books", "news"],
    icons: [
      {
        src: `${env.siteUrl}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
