"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/http";
import { cx } from "@/components/ui";

type SourceMinimal = {
  id: number;
  name: string;
  kind: string;
  config_json: string;
};

type FlexConfig = Record<string, any>;

function toSelectorsLines(s: string): string[] {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function toUrlContainsLines(s: string): string[] {
  return s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function defaultConfig(): FlexConfig {
  return {
    mode: "flexible",
    animeList: {
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
}

export function AnimeFlexConfigModal(props: { open: boolean; onClose: () => void; source: SourceMinimal | null }) {
  const [draft, setDraft] = useState<FlexConfig>(() => defaultConfig());
  const [busy, setBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const source = props.source;

  // test inputs
  const [detailUrl, setDetailUrl] = useState("");
  const [episodeUrl, setEpisodeUrl] = useState("");

  useEffect(() => {
    if (!props.open || !source) return;
    try {
      const parsed = JSON.parse(source.config_json || "{}");
      setDraft({ ...defaultConfig(), ...parsed });
    } catch {
      setDraft(defaultConfig());
    }
    setError(null);
    setResult(null);
    setDetailUrl("");
    setEpisodeUrl("");
  }, [props.open, source]);

  const listCfg = useMemo(() => (draft.animeList ?? {}), [draft]);
  const detailCfg = useMemo(() => (draft.animeDetail ?? {}), [draft]);
  const episodeCfg = useMemo(() => (draft.episodeDetail ?? {}), [draft]);

  function setDeep(path: string[], value: any) {
    setDraft((prev) => {
      const next = { ...prev };
      let cur: any = next;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        cur[key] = cur[key] ? { ...cur[key] } : {};
        cur = cur[key];
      }
      cur[path[path.length - 1]] = value;
      return next;
    });
  }

  async function save() {
    if (!source) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/sources/${source.id}`, {
        method: "PATCH",
        body: JSON.stringify({ config_json: JSON.stringify({ ...draft, mode: "flexible" }) }),
      });
      props.onClose();
    } catch (e) {
      if (e instanceof ApiError) setError(`Gagal simpan: ${e.status}`);
      else setError("Gagal simpan config.");
    } finally {
      setBusy(false);
    }
  }

  async function runTest() {
    if (!source) return;
    if (!detailUrl.trim()) {
      setError("detailUrl wajib diisi.");
      return;
    }
    setTestBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiFetch<any>(`/admin/sources/${source.id}/test`, {
        method: "POST",
        body: JSON.stringify({
          detail_url: detailUrl,
          episode_url: episodeUrl.trim() ? episodeUrl : null,
        }),
      });
      setResult(res);
    } catch (e) {
      setError("Gagal test selector.");
    } finally {
      setTestBusy(false);
    }
  }

  if (!props.open || !source) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      <button className="absolute inset-0 bg-black/70" onClick={props.onClose} aria-label="Close modal" />
      <div className="absolute left-1/2 top-1/2 w-[min(1100px,96vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-white/10 bg-panel shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-white">Flex Selector Config</div>
            <div className="text-xs text-white/60">{source.name}</div>
          </div>
          <button
            onClick={props.onClose}
            className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-white/10 bg-bg p-4">
              <h3 className="text-sm font-semibold text-white">Anime List</h3>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">containerSelector</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={listCfg.containerSelector ?? ""}
                    onChange={(e) => setDeep(["animeList", "containerSelector"], e.target.value)}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">linkSelector</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={listCfg.linkSelector ?? ""}
                    onChange={(e) => setDeep(["animeList", "linkSelector"], e.target.value)}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">urlContains (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={4}
                    value={(listCfg.urlContains ?? []).join("\n")}
                    onChange={(e) => setDeep(["animeList", "urlContains"], toUrlContainsLines(e.target.value))}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-bg p-4">
              <h3 className="text-sm font-semibold text-white">Anime Detail</h3>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">titleSelectors (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={4}
                    value={(detailCfg.titleSelectors ?? []).join("\n")}
                    onChange={(e) => setDeep(["animeDetail", "titleSelectors"], toSelectorsLines(e.target.value))}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">thumbnailSelectors (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={3}
                    value={(detailCfg.thumbnailSelectors ?? []).join("\n")}
                    onChange={(e) => setDeep(["animeDetail", "thumbnailSelectors"], toSelectorsLines(e.target.value))}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">synopsisSelectors (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={3}
                    value={(detailCfg.synopsisSelectors ?? []).join("\n")}
                    onChange={(e) => setDeep(["animeDetail", "synopsisSelectors"], toSelectorsLines(e.target.value))}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">statusSelectors (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={3}
                    value={(detailCfg.statusSelectors ?? []).join("\n")}
                    onChange={(e) => setDeep(["animeDetail", "statusSelectors"], toSelectorsLines(e.target.value))}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">scoreRegex</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={detailCfg.scoreRegex ?? ""}
                    onChange={(e) => setDeep(["animeDetail", "scoreRegex"], e.target.value)}
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-white/10 bg-bg p-4">
              <h3 className="text-sm font-semibold text-white">Episode List On Detail</h3>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">episodeListSelector</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={detailCfg.episodeListOnDetailPage?.episodeListSelector ?? ""}
                    onChange={(e) => setDeep(["animeDetail", "episodeListOnDetailPage", "episodeListSelector"], e.target.value)}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">episodeListIndex</div>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={detailCfg.episodeListOnDetailPage?.episodeListIndex ?? 1}
                    onChange={(e) => setDeep(["animeDetail", "episodeListOnDetailPage", "episodeListIndex"], Number(e.target.value))}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">episodeLinkSelector</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={detailCfg.episodeListOnDetailPage?.episodeLinkSelector ?? ""}
                    onChange={(e) => setDeep(["animeDetail", "episodeListOnDetailPage", "episodeLinkSelector"], e.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-bg p-4">
              <h3 className="text-sm font-semibold text-white">Episode Detail</h3>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">episode titleSelectors (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={3}
                    value={(episodeCfg.titleSelectors ?? []).join("\n")}
                    onChange={(e) => setDeep(["episodeDetail", "titleSelectors"], toSelectorsLines(e.target.value))}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">iframeSelector</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={episodeCfg.iframeSelector ?? "iframe[src]"}
                    onChange={(e) => setDeep(["episodeDetail", "iframeSelector"], e.target.value)}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">iframeAttr</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={episodeCfg.iframeAttr ?? "src"}
                    onChange={(e) => setDeep(["episodeDetail", "iframeAttr"], e.target.value)}
                  />
                </label>
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-white/10 bg-bg p-4">
            <h3 className="text-sm font-semibold text-white">Test Selector</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block">
                <div className="text-xs font-semibold text-white/70">detailUrl</div>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                  value={detailUrl}
                  onChange={(e) => setDetailUrl(e.target.value)}
                  placeholder="https://otakudesu.... /anime/slug/"
                />
              </label>
              <label className="block">
                <div className="text-xs font-semibold text-white/70">episodeUrl (optional)</div>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                  value={episodeUrl}
                  onChange={(e) => setEpisodeUrl(e.target.value)}
                  placeholder="https://otakudesu.... /anime/...-episode-..."
                />
              </label>
            </div>

            {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                disabled={testBusy}
                onClick={runTest}
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
              >
                {testBusy ? "Testing..." : "Run Test"}
              </button>
            </div>

            {result ? (
              <pre className={cx("mt-4 max-h-[320px] overflow-auto rounded-xl border border-white/10 bg-panel p-4 text-xs text-white/80")}>
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : null}
          </section>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="text-xs text-white/50">Config disimpan ke `sources.config_json` dan dipakai crawler saat `mode=flexible`.</div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={busy}
                onClick={save}
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
              >
                {busy ? "Saving..." : "Save Config"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

