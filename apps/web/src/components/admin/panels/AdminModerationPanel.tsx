"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";

type CommentItem = {
  id: number;
  user_id: number;
  kind: string;
  entity_id: number;
  body: string;
  is_hidden: boolean;
};

type ReportItem = {
  id: number;
  kind: string;
  entity_id: number;
  url: string;
  reason: string;
  status: string;
};

export function AdminModerationPanel() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedCommentIds, setSelectedCommentIds] = useState<number[]>([]);
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [commentOffset, setCommentOffset] = useState(0);
  const [reportOffset, setReportOffset] = useState(0);
  const [commentHasMore, setCommentHasMore] = useState(true);
  const [reportHasMore, setReportHasMore] = useState(true);
  const [commentKind, setCommentKind] = useState<string>("");
  const [commentHidden, setCommentHidden] = useState<string>("all");
  const [commentQ, setCommentQ] = useState<string>("");
  const [reportStatus, setReportStatus] = useState<string>("");
  const [reportKind, setReportKind] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string>("");
  const [isBusy, setIsBusy] = useState(false);
  const pageSize = 20;

  async function load(reset = true) {
    const nextCommentOffset = reset ? 0 : commentOffset;
    const nextReportOffset = reset ? 0 : reportOffset;
    const commentParams = new URLSearchParams({
      limit: String(pageSize),
      offset: String(nextCommentOffset),
      ...(commentKind ? { kind: commentKind } : {}),
      ...(commentHidden === "all" ? {} : { is_hidden: String(commentHidden === "hidden") }),
      ...(commentQ ? { q: commentQ } : {}),
    });
    const reportParams = new URLSearchParams({
      limit: String(pageSize),
      offset: String(nextReportOffset),
      ...(reportStatus ? { status: reportStatus } : {}),
      ...(reportKind ? { kind: reportKind } : {}),
    });
    const [c, r, h] = await Promise.all([
      apiFetch<CommentItem[]>(`/admin/community/comments?${commentParams.toString()}`),
      apiFetch<ReportItem[]>(`/admin/reports?${reportParams.toString()}`),
      apiFetch<any>("/admin/notifications/health"),
    ]);
    setCommentHasMore(c.length === pageSize);
    setReportHasMore(r.length === pageSize);
    if (reset) {
      setComments(c);
      setReports(r);
      setSelectedCommentIds([]);
      setSelectedReportIds([]);
      setActionMessage("");
      setCommentOffset(c.length);
      setReportOffset(r.length);
    } else {
      setComments((prev) => [...prev, ...c]);
      setReports((prev) => [...prev, ...r]);
      setCommentOffset(nextCommentOffset + c.length);
      setReportOffset(nextReportOffset + r.length);
    }
    setHealth(h);
  }

  useEffect(() => {
    load(true).catch(() => {});
  }, [commentKind, commentHidden, commentQ, reportStatus, reportKind]);

  return (
    <div className="space-y-4">
      {actionMessage ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          {actionMessage}
        </div>
      ) : null}
      <div className="rounded-2xl border border-white/10 bg-panel p-4 text-xs text-white/70">
        Notifications: {health?.total_notifications ?? 0} | Unread: {health?.unread_notifications ?? 0} | Open reports:{" "}
        {health?.open_broken_reports ?? 0}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-panel p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-white">Moderasi Komentar</div>
            <button onClick={() => load(true)} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">Refresh</button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              disabled={isBusy}
              onClick={() => setSelectedCommentIds(comments.map((c) => c.id))}
              className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              Select all
            </button>
            <button
              disabled={isBusy}
              onClick={() => setSelectedCommentIds([])}
              className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              Clear
            </button>
            <button
              disabled={selectedCommentIds.length === 0 || isBusy}
              onClick={async () => {
                if (!window.confirm(`Hide ${selectedCommentIds.length} selected comments?`)) return;
                setIsBusy(true);
                try {
                  const res = await apiFetch<{ updated?: number }>("/admin/community/comments/bulk", {
                    method: "PATCH",
                    body: JSON.stringify({ comment_ids: selectedCommentIds, is_hidden: true }),
                  });
                  await load(true);
                  setActionMessage(`Komentar berhasil di-hide: ${res.updated ?? selectedCommentIds.length}`);
                } finally {
                  setIsBusy(false);
                }
              }}
              className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              {isBusy ? "Processing..." : `Hide selected (${selectedCommentIds.length})`}
            </button>
            <button
              disabled={selectedCommentIds.length === 0 || isBusy}
              onClick={async () => {
                if (!window.confirm(`Unhide ${selectedCommentIds.length} selected comments?`)) return;
                setIsBusy(true);
                try {
                  const res = await apiFetch<{ updated?: number }>("/admin/community/comments/bulk", {
                    method: "PATCH",
                    body: JSON.stringify({ comment_ids: selectedCommentIds, is_hidden: false }),
                  });
                  await load(true);
                  setActionMessage(`Komentar berhasil di-unhide: ${res.updated ?? selectedCommentIds.length}`);
                } finally {
                  setIsBusy(false);
                }
              }}
              className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              Unhide selected
            </button>
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-4">
            <select value={commentKind} onChange={(e) => setCommentKind(e.target.value)} className="rounded border border-white/10 bg-bg px-2 py-1 text-xs text-white">
              <option value="">All kind</option>
              <option value="anime">anime</option>
              <option value="manga">manga</option>
            </select>
            <select value={commentHidden} onChange={(e) => setCommentHidden(e.target.value)} className="rounded border border-white/10 bg-bg px-2 py-1 text-xs text-white">
              <option value="all">All status</option>
              <option value="visible">visible</option>
              <option value="hidden">hidden</option>
            </select>
            <input value={commentQ} onChange={(e) => setCommentQ(e.target.value)} placeholder="Search body" className="rounded border border-white/10 bg-bg px-2 py-1 text-xs text-white md:col-span-2" />
          </div>
          <ul className="mt-3 space-y-2">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg border border-white/10 bg-bg p-3">
                <div className="text-xs text-white/50">
                  <input
                    type="checkbox"
                    checked={selectedCommentIds.includes(c.id)}
                    onChange={(e) => {
                      setSelectedCommentIds((prev) =>
                        e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id),
                      );
                    }}
                    disabled={isBusy}
                    className="mr-2 align-middle"
                  />
                  #{c.id} user:{c.user_id} {c.kind}:{c.entity_id}
                </div>
                <div className="mt-1 text-sm text-white/80">{c.body}</div>
                <button
                  onClick={async () => {
                    setIsBusy(true);
                    try {
                    await apiFetch(`/admin/community/comments/${c.id}?is_hidden=${(!c.is_hidden).toString()}`, {
                      method: "PATCH",
                    });
                    await load(true);
                    } finally {
                      setIsBusy(false);
                    }
                  }}
                  disabled={isBusy}
                  className="mt-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {c.is_hidden ? "Unhide" : "Hide"}
                </button>
              </li>
            ))}
          </ul>
          {commentHasMore ? (
            <button onClick={() => load(false)} className="mt-3 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              Load more comments
            </button>
          ) : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-panel p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-white">Broken Link Reports</div>
            <button onClick={() => load(true)} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">Refresh</button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              disabled={isBusy}
              onClick={() => setSelectedReportIds(reports.map((r) => r.id))}
              className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              Select all
            </button>
            <button
              disabled={isBusy}
              onClick={() => setSelectedReportIds([])}
              className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
            >
              Clear
            </button>
            {["open", "in_progress", "resolved"].map((s) => (
              <button
                key={`bulk-${s}`}
                disabled={selectedReportIds.length === 0 || isBusy}
                onClick={async () => {
                  if (!window.confirm(`Set status ${selectedReportIds.length} selected reports ke '${s}'?`)) return;
                  setIsBusy(true);
                  try {
                    const res = await apiFetch<{ updated?: number }>("/admin/reports/bulk", {
                      method: "PATCH",
                      body: JSON.stringify({ report_ids: selectedReportIds, status: s }),
                    });
                    await load(true);
                    setActionMessage(`Report berhasil diupdate ke '${s}': ${res.updated ?? selectedReportIds.length}`);
                  } finally {
                    setIsBusy(false);
                  }
                }}
                className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
              >
                Set selected {s} ({selectedReportIds.length})
              </button>
            ))}
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <select value={reportStatus} onChange={(e) => setReportStatus(e.target.value)} className="rounded border border-white/10 bg-bg px-2 py-1 text-xs text-white">
              <option value="">All status</option>
              <option value="open">open</option>
              <option value="in_progress">in_progress</option>
              <option value="resolved">resolved</option>
            </select>
            <select value={reportKind} onChange={(e) => setReportKind(e.target.value)} className="rounded border border-white/10 bg-bg px-2 py-1 text-xs text-white">
              <option value="">All kind</option>
              <option value="anime">anime</option>
              <option value="manga">manga</option>
              <option value="chapter">chapter</option>
              <option value="episode">episode</option>
            </select>
          </div>
          <ul className="mt-3 space-y-2">
            {reports.map((r) => (
              <li key={r.id} className="rounded-lg border border-white/10 bg-bg p-3">
                <div className="text-xs text-white/50">
                  <input
                    type="checkbox"
                    checked={selectedReportIds.includes(r.id)}
                    onChange={(e) => {
                      setSelectedReportIds((prev) =>
                        e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id),
                      );
                    }}
                    disabled={isBusy}
                    className="mr-2 align-middle"
                  />
                  #{r.id} {r.kind}:{r.entity_id} ·{" "}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.status === "open"
                        ? "bg-rose-500/20 text-rose-200"
                        : r.status === "in_progress"
                          ? "bg-amber-500/20 text-amber-200"
                          : "bg-emerald-500/20 text-emerald-200"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <a href={r.url} target="_blank" rel="noreferrer" className="block truncate text-xs text-white/70 underline">
                  {r.url}
                </a>
                <div className="mt-1 text-sm text-white/80">{r.reason}</div>
                <div className="mt-2 flex gap-2">
                  {["open", "in_progress", "resolved"].map((s) => (
                    <button
                      key={s}
                      onClick={async () => {
                        setIsBusy(true);
                        try {
                          await apiFetch(`/admin/reports/${r.id}?status=${s}`, { method: "PATCH" });
                          await load(true);
                        } finally {
                          setIsBusy(false);
                        }
                      }}
                      disabled={isBusy}
                      className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          {reportHasMore ? (
            <button onClick={() => load(false)} className="mt-3 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              Load more reports
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

