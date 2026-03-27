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
    mangaList: {
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
      genres: { itemSelector: "a[href*='/genre/']" },
      chapterListOnDetailPage: {
        chaptersRootSelector: "",
        chapterLinkSelector: "a[href]",
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
}

export function MangaFlexConfigModal(props: { open: boolean; onClose: () => void; source: SourceMinimal | null }) {
  const [draft, setDraft] = useState<FlexConfig>(() => defaultConfig());
  const [busy, setBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const [detailUrl, setDetailUrl] = useState("");
  const [chapterUrl, setChapterUrl] = useState("");

  const source = props.source;

  useEffect(() => {
    if (!props.open || !source) return;
    setError(null);
    setResult(null);
    setDetailUrl("");
    setChapterUrl("");
    try {
      const parsed = JSON.parse(source.config_json || "{}");
      setDraft({ ...defaultConfig(), ...(typeof parsed === "object" && parsed ? parsed : {}) });
    } catch {
      setDraft(defaultConfig());
    }
  }, [props.open, source]);

  const listCfg = useMemo(() => (draft.mangaList ?? {}), [draft]);
  const detailCfg = useMemo(() => (draft.mangaDetail ?? {}), [draft]);
  const chapterListCfg = useMemo(() => (detailCfg.chapterListOnDetailPage ?? {}), [detailCfg]);
  const chapterCfg = useMemo(() => (draft.chapterDetail ?? {}), [draft]);

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
          chapter_url: chapterUrl.trim() ? chapterUrl : null,
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
    <div className="fixed inset-0 z-[220]">
      <button className="absolute inset-0 bg-black/70" onClick={props.onClose} aria-label="Close modal" />
      <div className="absolute left-1/2 top-1/2 w-[min(1100px,96vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-white/10 bg-panel shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-white">Flex Selector Config (Manga)</div>
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
          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">{error}</div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-white/10 bg-bg p-4">
              <h3 className="text-sm font-semibold text-white">Manga List</h3>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">containerSelector</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={listCfg.containerSelector ?? ""}
                    onChange={(e) => setDeep(["mangaList", "containerSelector"], e.target.value)}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">linkSelector</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={listCfg.linkSelector ?? ""}
                    onChange={(e) => setDeep(["mangaList", "linkSelector"], e.target.value)}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">urlContains (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={4}
                    value={(listCfg.urlContains ?? []).join("\n")}
                    onChange={(e) => setDeep(["mangaList", "urlContains"], toUrlContainsLines(e.target.value))}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">linkAttr</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={listCfg.linkAttr ?? "href"}
                    onChange={(e) => setDeep(["mangaList", "linkAttr"], e.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-bg p-4">
              <h3 className="text-sm font-semibold text-white">Manga Detail</h3>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">titleSelectors (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={3}
                    value={(detailCfg.titleSelectors ?? []).join("\n")}
                    onChange={(e) => setDeep(["mangaDetail", "titleSelectors"], toSelectorsLines(e.target.value))}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">thumbnailSelectors (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={2}
                    value={(detailCfg.thumbnailSelectors ?? []).join("\n")}
                    onChange={(e) => setDeep(["mangaDetail", "thumbnailSelectors"], toSelectorsLines(e.target.value))}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">synopsisSelectors (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={3}
                    value={(detailCfg.synopsisSelectors ?? []).join("\n")}
                    onChange={(e) => setDeep(["mangaDetail", "synopsisSelectors"], toSelectorsLines(e.target.value))}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">statusSelectors (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={2}
                    value={(detailCfg.statusSelectors ?? []).join("\n")}
                    onChange={(e) => setDeep(["mangaDetail", "statusSelectors"], toSelectorsLines(e.target.value))}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">genres.itemSelector</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={detailCfg.genres?.itemSelector ?? ""}
                    onChange={(e) => setDeep(["mangaDetail", "genres", "itemSelector"], e.target.value)}
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-white/10 bg-bg p-4">
              <h3 className="text-sm font-semibold text-white">Chapter List On Detail</h3>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">chaptersRootSelector</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={chapterListCfg.chaptersRootSelector ?? ""}
                    onChange={(e) =>
                      setDeep(["mangaDetail", "chapterListOnDetailPage", "chaptersRootSelector"], e.target.value)
                    }
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">chapterLinkSelector</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={chapterListCfg.chapterLinkSelector ?? ""}
                    onChange={(e) =>
                      setDeep(["mangaDetail", "chapterListOnDetailPage", "chapterLinkSelector"], e.target.value)
                    }
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">urlContains (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={4}
                    value={(chapterListCfg.urlContains ?? []).join("\n")}
                    onChange={(e) =>
                      setDeep(["mangaDetail", "chapterListOnDetailPage", "urlContains"], toUrlContainsLines(e.target.value))
                    }
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">chapterUrlAttr</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={chapterListCfg.chapterUrlAttr ?? "href"}
                    onChange={(e) =>
                      setDeep(["mangaDetail", "chapterListOnDetailPage", "chapterUrlAttr"], e.target.value)
                    }
                  />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-bg p-4">
              <h3 className="text-sm font-semibold text-white">Chapter Detail</h3>
              <div className="mt-3 space-y-3">
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">titleSelectors (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={2}
                    value={(chapterCfg.titleSelectors ?? []).join("\n")}
                    onChange={(e) => setDeep(["chapterDetail", "titleSelectors"], toSelectorsLines(e.target.value))}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">pageImagesSelector</div>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    value={chapterCfg.pageImagesSelector ?? "img"}
                    onChange={(e) => setDeep(["chapterDetail", "pageImagesSelector"], e.target.value)}
                  />
                </label>
                <label className="block">
                  <div className="text-xs font-semibold text-white/70">pageImageAttrPriority (one per line)</div>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                    rows={2}
                    value={(chapterCfg.pageImageAttrPriority ?? []).join("\n")}
                    onChange={(e) =>
                      setDeep(["chapterDetail", "pageImageAttrPriority"], toSelectorsLines(e.target.value))
                    }
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="rounded-xl border border-white/10 bg-bg p-4">
            <div className="text-sm font-semibold text-white">Run Test</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block">
                <div className="text-xs font-semibold text-white/70">detailUrl</div>
                <input
                  type="url"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                  value={detailUrl}
                  onChange={(e) => setDetailUrl(e.target.value)}
                  placeholder="https://.../manga/..."
                />
              </label>
              <label className="block">
                <div className="text-xs font-semibold text-white/70">chapterUrl (optional)</div>
                <input
                  type="url"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                  value={chapterUrl}
                  onChange={(e) => setChapterUrl(e.target.value)}
                  placeholder="https://.../manga/.../chapter-1"
                />
              </label>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                disabled={testBusy}
                onClick={runTest}
                className={cx(
                  "rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
                )}
              >
                {testBusy ? "Testing..." : "Run Test"}
              </button>
              <div className="text-[11px] text-white/50">Hasil test akan muncul di bawah.</div>
            </div>

            {result ? (
              <pre className="mt-4 max-h-[300px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-bg px-3 py-2 text-[11px] text-white/80">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              disabled={busy}
              onClick={save}
              className={cx(
                "rounded-full bg-brand px-5 py-2 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
              )}
            >
              {busy ? "Saving..." : "Save Config"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

