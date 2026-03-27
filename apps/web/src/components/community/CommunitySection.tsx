"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/http";

type Comment = {
  id: number;
  user_id: number;
  user_email?: string | null;
  body: string;
  created_at: string;
};

export function CommunitySection(props: { kind: "anime" | "manga"; entityId: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<number>(8);
  const [avg, setAvg] = useState<number | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [cs, rs] = await Promise.all([
      apiFetch<Comment[]>(`/community/comments?kind=${props.kind}&entity_id=${props.entityId}`),
      apiFetch<{ avg_rating: number | null; total: number }>(
        `/community/ratings?kind=${props.kind}&entity_id=${props.entityId}`
      ).catch(() => ({ avg_rating: null, total: 0 })),
    ]);
    setComments(cs);
    setAvg(rs.avg_rating);
    setTotal(rs.total);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [props.kind, props.entityId]);

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-panel p-5">
      <h3 className="text-sm font-semibold text-white">Komentar & Rating</h3>
      <div className="mt-1 text-xs text-white/60">
        Rating komunitas: {avg != null ? avg.toFixed(1) : "—"} ({total})
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={0}
          max={10}
          step={0.5}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-24 rounded border border-white/10 bg-bg px-2 py-2 text-xs text-white"
        />
        <button
          onClick={async () => {
            setError(null);
            try {
              await apiFetch("/community/ratings", {
                method: "POST",
                body: JSON.stringify({ kind: props.kind, entity_id: props.entityId, rating }),
              });
              await load();
            } catch (e) {
              if (e instanceof ApiError && e.status === 401) setError("Login dulu untuk memberi rating.");
              else setError("Gagal submit rating.");
            }
          }}
          className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
        >
          Submit Rating
        </button>
      </div>

      <div className="mt-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Tulis komentar..."
          className="w-full rounded border border-white/10 bg-bg px-3 py-2 text-xs text-white"
        />
        <button
          onClick={async () => {
            if (!body.trim()) return;
            setError(null);
            try {
              await apiFetch("/community/comments", {
                method: "POST",
                body: JSON.stringify({ kind: props.kind, entity_id: props.entityId, body }),
              });
              setBody("");
              await load();
            } catch (e) {
              if (e instanceof ApiError && e.status === 401) setError("Login dulu untuk komentar.");
              else if (e instanceof ApiError && typeof e.body === "object" && e.body && "detail" in e.body) {
                setError(String((e.body as any).detail));
              }
              else setError("Gagal kirim komentar.");
            }
          }}
          className="mt-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90"
        >
          Kirim Komentar
        </button>
      </div>

      {error ? <div className="mt-2 text-xs text-red-300">{error}</div> : null}

      <ul className="mt-4 space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="rounded-lg border border-white/10 bg-bg p-3">
            <div className="text-[11px] text-white/50">
              {c.user_email ?? `User #${c.user_id}`} · {new Date(c.created_at).toLocaleString()}
            </div>
            <div className="mt-1 text-sm text-white/80">{c.body}</div>
          </li>
        ))}
        {comments.length === 0 ? <li className="text-xs text-white/60">Belum ada komentar.</li> : null}
      </ul>
    </div>
  );
}

