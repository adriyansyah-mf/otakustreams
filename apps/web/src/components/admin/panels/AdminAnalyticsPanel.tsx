"use client";

import { useCallback, useEffect, useState } from "react";
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

type VisitsReport = {
  days: number;
  series: { day: string; count: number }[];
  top_paths: { path: string; count: number }[];
  total_in_period: number;
  unique_sessions_in_period: number;
};

export function AdminAnalyticsPanel() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [visits, setVisits] = useState<VisitsReport | null>(null);
  const [visitDays, setVisitDays] = useState(14);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, v] = await Promise.all([
        apiFetch<Overview>("/admin/analytics/overview"),
        apiFetch<VisitsReport>(`/admin/analytics/visits?days=${visitDays}`),
      ]);
      setOverview(ov);
      setVisits(v);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setError("Kamu belum login admin.");
      else setError("Gagal memuat analytics.");
    } finally {
      setLoading(false);
    }
  }, [visitDays]);

  useEffect(() => {
    load();
  }, [load]);

  const maxVisit = Math.max(1, ...(visits?.series.map((s) => s.count) ?? [1]));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white">Kunjungan halaman (page view)</h2>
          <select
            className="rounded-lg border border-white/10 bg-bg px-3 py-1.5 text-xs text-white outline-none"
            value={visitDays}
            onChange={(e) => setVisitDays(Number(e.target.value))}
          >
            <option value={7}>7 hari</option>
            <option value={14}>14 hari</option>
            <option value={30}>30 hari</option>
            <option value={90}>90 hari</option>
          </select>
        </div>
        <p className="mt-1 text-xs text-white/50">
          Dari beacon browser (setiap navigasi). Sesi unik pakai localStorage.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Stat label="Total page view" value={visits?.total_in_period ?? 0} />
          <Stat label="Sesi unik (perkiraan)" value={visits?.unique_sessions_in_period ?? 0} />
          <Stat label="Periode (hari)" value={visits?.days ?? visitDays} />
        </div>
        {visits && visits.series.length > 0 ? (
          <div className="mt-6">
            <VisitBarChart series={visits.series} maxCount={maxVisit} />
          </div>
        ) : (
          <div className="mt-4 text-sm text-white/50">Belum ada data kunjungan. Buka situs dari browser biasa.</div>
        )}
        {visits && visits.top_paths.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-white/70">Halaman terpopuler</h3>
            <ul className="mt-2 space-y-1.5">
              {visits.top_paths.map((p) => (
                <li key={p.path} className="flex items-center justify-between gap-2 text-xs text-white/80">
                  <span className="min-w-0 truncate font-mono">{p.path}</span>
                  <span className="shrink-0 text-white/55">{p.count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

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

function VisitBarChart(props: { series: { day: string; count: number }[]; maxCount: number }) {
  const w = 800;
  const h = 200;
  const pad = 36;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const n = props.series.length;
  const barW = n > 0 ? innerW / n - 2 : 0;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full max-w-full text-emerald-400/90" role="img" aria-label="Grafik kunjungan">
      <rect x="0" y="0" width={w} height={h} fill="transparent" />
      {props.series.map((s, i) => {
        const x = pad + i * (innerW / n) + 1;
        const bh = props.maxCount > 0 ? (s.count / props.maxCount) * innerH : 0;
        const y = pad + innerH - bh;
        return <rect key={s.day} x={x} y={y} width={Math.max(1, barW)} height={bh} rx={2} fill="currentColor" />;
      })}
      <text x={pad} y={h - 8} className="fill-white/40 text-[10px]">
        {props.series[0]?.day ?? ""} → {props.series[props.series.length - 1]?.day ?? ""}
      </text>
    </svg>
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

