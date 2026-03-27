export type SourceKind = "anime" | "manga";

export type PresetId =
  | "blank"
  | "otakudesu_like"
  | "komiku_like";

type FlexibleAnimeConfig = Record<string, any>;
type FlexibleMangaConfig = Record<string, any>;

const defaultAnimeConfigOtakudesu: FlexibleAnimeConfig = {
  mode: "flexible",
  animeList: {
    // Otakudesu-like proven defaults from the existing AnimeFlexConfigModal
    containerSelector: "div#abtext",
    linkSelector: "a.hodebgst",
    urlContains: ["/anime/"],
    linkAttr: "href",
  },
  animeDetail: {
    titleSelectors: ["div.infozingle h1", "h1"],
    thumbnailSelectors: ["img.attachment-post-thumbnail", "article img", "img"],
    synopsisSelectors: [".entry-content p", ".sinopsis", ".sinopc"],
    statusSelectors: [".infozingle p", ".infozingle li"],
    scoreRegex: "\\bskor\\b\\s*[:\\-]?\\s*([0-9]+(?:\\.[0-9]+)?)",
    genres: {
      itemSelector: "a[rel='tag']",
    },
    episodeListOnDetailPage: {
      episodeListSelector: "div.episodelist",
      episodeListIndex: 1,
      episodeLinkSelector: "li a[href]",
      urlContains: ["/anime/"],
      episodeUrlAttr: "href",
    },
  },
  episodeDetail: {
    titleSelectors: ["div.venser h1", "h1", ".entry-title", ".post-title"],
    iframeSelector: "iframe[src]",
    iframeAttr: "src",
    externalFallback: true,
    externalLinkSelector: "a[href]",
  },
};

// Flexible manga defaults modeled from our existing Komiku adapter heuristics.
const defaultMangaConfig: FlexibleMangaConfig = {
  mode: "flexible",
  mangaList: {
    // Best-effort: grab all links, then filter by urlContains.
    containerSelector: "",
    linkSelector: "a[href]",
    urlContains: ["/manga/", "/komik/"],
    linkAttr: "href",
  },
  mangaDetail: {
    titleSelectors: ["h1", ".komik_info h1", ".entry-title", ".post-title"],
    thumbnailSelectors: [".komik_info img", ".thumb img", "article img", "img"],
    synopsisSelectors: [".komik_info .desc", ".sinopsis", ".entry-content p", ".content p"],
    statusSelectors: [".komik_info .status", ".komik_info .type"],
    genres: {
      // Komiku-like usually has /genre/
      itemSelector: "a[href*='/genre/']",
    },
    chapterListOnDetailPage: {
      chaptersRootSelector: "",
      chapterLinkSelector: "a[href]",
      // Heuristic: many chapter URLs include "chapter" or "bab"
      urlContains: ["chapter", "/chapter", "bab", "/bab"],
      chapterUrlAttr: "href",
    },
  },
  chapterDetail: {
    titleSelectors: ["h1", ".entry-title"],
    pageImagesSelector: "img",
    pageImageAttrPriority: ["data-src", "data-lazy-src", "src"],
  },
};

export function getPresetConfig(kind: SourceKind, preset: PresetId): { config_json: string; source_type: PresetId } {
  let base: FlexibleAnimeConfig | FlexibleMangaConfig;
  if (kind === "anime") {
    base = defaultAnimeConfigOtakudesu;
  } else {
    base = defaultMangaConfig;
  }

  // Provide `source_type` as metadata for future improvements (not strictly needed by crawler).
  return {
    source_type: preset,
    config_json: JSON.stringify(
      {
        ...base,
        source_type: preset,
      },
      null,
      2
    ),
  };
}

