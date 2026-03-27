"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/http";
import { clearTokens } from "@/lib/auth";
import { cx } from "@/components/ui";
import { AdminAnalyticsPanel } from "@/components/admin/panels/AdminAnalyticsPanel";
import { AdminAdsPanel } from "@/components/admin/panels/AdminAdsPanel";
import { AdminSeoPanel } from "@/components/admin/panels/AdminSeoPanel";
import { AdminModerationPanel } from "@/components/admin/panels/AdminModerationPanel";
import { AnimeFlexConfigModal } from "@/components/admin/modals/AnimeFlexConfigModal";
import { MangaFlexConfigModal } from "@/components/admin/modals/MangaFlexConfigModal";
import { AddSourceModal } from "@/components/admin/modals/AddSourceModal";

type Me = { id: number; email: string; role: string };
type Source = {
  id: number;
  kind: string;
  name: string;
  base_url: string;
  list_url: string;
  is_enabled: boolean;
  crawl_interval_minutes: number;
  last_crawled_at: string | null;
  config_json: string;
};

type Summary = {
  users: number;
  anime_titles: number;
  manga_titles: number;
  bookmarks: number;
  crawl_jobs: number;
  crawl_errors_24h: number;
};

export function AdminDashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [listUrlDrafts, setListUrlDrafts] = useState<Record<number, string>>({});
  const [tab, setTab] = useState<"sources" | "analytics" | "seo" | "ads" | "moderation">("sources");
  const [flexModalOpen, setFlexModalOpen] = useState(false);
  const [flexModalSource, setFlexModalSource] = useState<Source | null>(null);
  const [mangaFlexModalOpen, setMangaFlexModalOpen] = useState(false);
  const [mangaFlexModalSource, setMangaFlexModalSource] = useState<Source | null>(null);
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);
    try {
      const meRes = await apiFetch<Me>("/auth/me");
      if (meRes.role !== "admin") {
        setError("Admin only.");
        return;
      }
      setMe(meRes);
      const [sum, src, j, l] = await Promise.all([
        apiFetch<Summary>("/admin/summary"),
        apiFetch<Source[]>("/admin/sources"),
        apiFetch<any[]>("/admin/jobs"),
        apiFetch<any[]>("/admin/logs"),
      ]);
      setSummary(sum);
      setSources(src);
      setJobs(j);
      setLogs(l);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError("Kamu belum login.");
      } else {
        setError("Gagal load admin data.");
      }
    }
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const g: Record<string, Source[]> = {};
    for (const s of sources) g[s.kind] = [...(g[s.kind] ?? []), s];
    return g;
  }, [sources]);

  async function patchSource(id: number, patch: Partial<Source>) {
    setBusy(true);
    try {
      await apiFetch(`/admin/sources/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function trigger(sourceId: number) {
    setBusy(true);
    try {
      await apiFetch(`/admin/crawl/trigger?source_id=${sourceId}`, { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white">Admin Panel</h1>
          <div className="mt-1 text-xs text-white/60">
            {me ? `Login sebagai ${me.email}` : "—"}
          </div>
        </div>
        <button
          onClick={() => {
            clearTokens();
            window.location.href = "/login";
          }}
          className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
        >
          Logout
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-white/10 bg-panel p-6 text-sm text-white/70">
          {error}{" "}
          <a className="underline" href="/login">
            Login
          </a>
        </div>
      ) : null}

      {summary ? (
        <div className="grid gap-3 md:grid-cols-6">
          <Stat label="Users" value={summary.users} />
          <Stat label="Anime" value={summary.anime_titles} />
          <Stat label="Manga" value={summary.manga_titles} />
          <Stat label="Bookmarks" value={summary.bookmarks} />
          <Stat label="Jobs" value={summary.crawl_jobs} />
          <Stat label="Errors 24h" value={summary.crawl_errors_24h} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <TabButton
          active={tab === "sources"}
          onClick={() => setTab("sources")}
          label="Sources"
        />
        <TabButton
          active={tab === "analytics"}
          onClick={() => setTab("analytics")}
          label="Analytics"
        />
        <TabButton
          active={tab === "seo"}
          onClick={() => setTab("seo")}
          label="SEO"
        />
        <TabButton
          active={tab === "ads"}
          onClick={() => setTab("ads")}
          label="Ads"
        />
        <TabButton
          active={tab === "moderation"}
          onClick={() => setTab("moderation")}
          label="Moderation"
        />
      </div>

      {tab === "sources" ? (
        <>
          <div className="rounded-2xl border border-white/10 bg-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Crawler Sources</div>
                <div className="mt-1 text-xs text-white/60">
                  Enable/disable, interval, dan trigger manual.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={busy}
                  onClick={() => setAddSourceOpen(true)}
                  className={cx(
                    "rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90",
                    busy ? "opacity-60" : ""
                  )}
                >
                  Add Source
                </button>
                <button
                  disabled={busy}
                  onClick={load}
                  className={cx(
                    "rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15",
                    busy ? "opacity-60" : ""
                  )}
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-8">
              {Object.entries(grouped).map(([kind, items]) => (
                <div key={kind}>
                  <div className="text-xs font-semibold uppercase tracking-widest text-white/50">
                    {kind}
                  </div>
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-white/60">
                        <tr>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">List URL</th>
                          <th className="px-3 py-2">Enabled</th>
                          <th className="px-3 py-2">Interval (m)</th>
                          <th className="px-3 py-2">Last crawled</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {items.map((s) => (
                          <tr key={s.id} className="text-white/80">
                            <td className="px-3 py-2 font-semibold">{s.name}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-col gap-2">
                                <input
                                  type="url"
                                  className="w-[260px] max-w-[60vw] rounded border border-white/10 bg-bg px-2 py-1 text-xs text-white outline-none focus:border-white/25"
                                  value={listUrlDrafts[s.id] ?? s.list_url}
                                  disabled={busy}
                                  onChange={(e) =>
                                    setListUrlDrafts((prev) => ({
                                      ...prev,
                                      [s.id]: e.target.value,
                                    }))
                                  }
                                />
                                <div className="flex items-center gap-2">
                                  <a
                                    className="underline text-white/60 hover:text-white"
                                    href={s.list_url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Open
                                  </a>
                                  <button
                                    disabled={busy}
                                    onClick={() => {
                                      const draft = listUrlDrafts[s.id] ?? s.list_url;
                                      patchSource(s.id, { list_url: draft });
                                    }}
                                    className="rounded bg-brand px-3 py-1 text-[11px] font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={s.is_enabled}
                                onChange={(e) => patchSource(s.id, { is_enabled: e.target.checked })}
                                disabled={busy}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                className="w-24 rounded border border-white/10 bg-bg px-2 py-1 text-white"
                                value={s.crawl_interval_minutes}
                                onChange={(e) => patchSource(s.id, { crawl_interval_minutes: Number(e.target.value) })}
                                disabled={busy}
                              />
                            </td>
                            <td className="px-3 py-2 text-white/60">{s.last_crawled_at ?? "—"}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {s.kind === "anime" ? (
                                  <button
                                    disabled={busy}
                                    onClick={() => {
                                      setFlexModalSource(s);
                                      setFlexModalOpen(true);
                                    }}
                                    className="rounded border border-white/15 bg-transparent px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/5 disabled:opacity-60"
                                  >
                                    Config
                                  </button>
                                ) : null}
                                {s.kind === "manga" ? (
                                  <button
                                    disabled={busy}
                                    onClick={() => {
                                      setMangaFlexModalSource(s);
                                      setMangaFlexModalOpen(true);
                                    }}
                                    className="rounded border border-white/15 bg-transparent px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/5 disabled:opacity-60"
                                  >
                                    Config
                                  </button>
                                ) : null}
                                <button
                                  disabled={busy}
                                  onClick={() => trigger(s.id)}
                                  className="rounded bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
                                >
                                  Trigger
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-panel p-6">
              <div className="text-sm font-semibold text-white">Last Jobs</div>
              <div className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-white/60">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {jobs.map((j) => (
                      <tr key={j.id} className="text-white/80">
                        <td className="px-3 py-2">{j.id}</td>
                        <td className="px-3 py-2">{j.source_id}</td>
                        <td className="px-3 py-2">{j.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-panel p-6">
              <div className="text-sm font-semibold text-white">Last Logs</div>
              <div className="mt-3 max-h-[360px] overflow-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-white/60">
                    <tr>
                      <th className="px-3 py-2">Level</th>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {logs.map((l) => (
                      <tr key={l.id} className="text-white/80">
                        <td className="px-3 py-2">{l.level}</td>
                        <td className="px-3 py-2">{l.source_id}</td>
                        <td className="px-3 py-2 text-white/70">
                          <div className="line-clamp-2">{l.message}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : tab === "analytics" ? (
        <AdminAnalyticsPanel />
      ) : tab === "seo" ? (
        <AdminSeoPanel />
      ) : tab === "ads" ? (
        <AdminAdsPanel />
      ) : (
        <AdminModerationPanel />
      )}
      <AddSourceModal
        open={addSourceOpen}
        onClose={() => setAddSourceOpen(false)}
        onCreated={load}
      />
      <AnimeFlexConfigModal
        open={flexModalOpen}
        onClose={() => setFlexModalOpen(false)}
        source={
          flexModalSource
            ? {
                id: flexModalSource.id,
                name: flexModalSource.name,
                kind: flexModalSource.kind,
                config_json: flexModalSource.config_json,
              }
            : null
        }
      />
      <MangaFlexConfigModal
        open={mangaFlexModalOpen}
        onClose={() => setMangaFlexModalOpen(false)}
        source={
          mangaFlexModalSource
            ? {
                id: mangaFlexModalSource.id,
                name: mangaFlexModalSource.name,
                kind: mangaFlexModalSource.kind,
                config_json: mangaFlexModalSource.config_json,
              }
            : null
        }
      />
    </div>
  );
}

function TabButton(props: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={props.onClick}
      className={cx(
        "rounded-full px-4 py-2 text-xs font-semibold",
        props.active ? "bg-brand text-white" : "bg-white/10 text-white/80 hover:bg-white/15"
      )}
    >
      {props.label}
    </button>
  );
}

function Stat(props: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
        {props.label}
      </div>
      <div className="mt-2 text-lg font-black text-white">{props.value}</div>
    </div>
  );
}

