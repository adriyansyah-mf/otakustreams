"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/http";

type TopItem = { title: string; count: number };
type Overview = {
  watch_24h: number;
  read_24h: number;
  bookmarks: number;
  comments_24h: number;
  ratings_24h: number;
  reports_open: number;
  reports_24h: number;
  notifications_24h: number;
  notifications_unread: number;
  most_watched_titles: TopItem[];
  most_read_titles: TopItem[];
  generated_at: string;
};

export function AdminAnalyticsPanel() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Overview>("/admin/analytics/overview");
      setOverview(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setError("Kamu belum login admin.");
      else setError("Gagal memuat analytics.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <h2 className="text-sm font-semibold text-white">Analytics (24 jam)</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          <Stat label="Watch 24h" value={overview?.watch_24h ?? 0} />
          <Stat label="Read 24h" value={overview?.read_24h ?? 0} />
          <Stat label="Bookmarks" value={overview?.bookmarks ?? 0} />
          <Stat label="Comments 24h" value={overview?.comments_24h ?? 0} />
          <Stat label="Ratings 24h" value={overview?.ratings_24h ?? 0} />
          <Stat label="Reports Open" value={overview?.reports_open ?? 0} />
          <Stat label="Reports 24h" value={overview?.reports_24h ?? 0} />
          <Stat label="Notif 24h" value={overview?.notifications_24h ?? 0} />
          <Stat label="Notif Unread" value={overview?.notifications_unread ?? 0} />
        </div>
        <div className="mt-4 text-xs text-white/50">
          {overview ? `Generated at ${new Date(overview.generated_at).toLocaleString()}` : ""}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Top Watched Titles">
          {loading && !overview ? (
            <div className="text-sm text-white/60">Memuat...</div>
          ) : (
            <ul className="space-y-2">
              {(overview?.most_watched_titles ?? []).map((t) => (
                <li key={t.title} className="flex items-center justify-between gap-3 text-sm text-white/80">
                  <span className="min-w-0 truncate">{t.title}</span>
                  <span className="shrink-0 text-white/60">{t.count}</span>
                </li>
              ))}
              {(overview?.most_watched_titles ?? []).length === 0 ? (
                <li className="text-sm text-white/60">Belum ada data.</li>
              ) : null}
            </ul>
          )}
        </Panel>

        <Panel title="Top Read Titles">
          {loading && !overview ? (
            <div className="text-sm text-white/60">Memuat...</div>
          ) : (
            <ul className="space-y-2">
              {(overview?.most_read_titles ?? []).map((t) => (
                <li key={t.title} className="flex items-center justify-between gap-3 text-sm text-white/80">
                  <span className="min-w-0 truncate">{t.title}</span>
                  <span className="shrink-0 text-white/60">{t.count}</span>
                </li>
              ))}
              {(overview?.most_read_titles ?? []).length === 0 ? (
                <li className="text-sm text-white/60">Belum ada data.</li>
              ) : null}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat(props: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-bg p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50">{props.label}</div>
      <div className="mt-2 text-xl font-black text-white">{props.value}</div>
    </div>
  );
}

function Panel(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel p-6">
      <h3 className="text-sm font-semibold text-white">{props.title}</h3>
      <div className="mt-3">{props.children}</div>
    </div>
  );
}

