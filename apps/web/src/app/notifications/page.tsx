"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { apiFetch } from "@/lib/http";
import Link from "next/link";

type Notif = {
  id: number;
  kind: string;
  title_kind: string;
  title_id: number;
  entity_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  async function load(reset = false) {
    const nextOffset = reset ? 0 : offset;
    const data = await apiFetch<Notif[]>(`/notifications/feed?limit=${pageSize}&offset=${nextOffset}`);
    setHasMore(data.length === pageSize);
    if (reset) {
      setItems(data);
      setOffset(data.length);
    } else {
      setItems((prev) => [...prev, ...data]);
      setOffset(nextOffset + data.length);
    }
  }

  useEffect(() => {
    load(true).catch(() => {});
  }, []);

  return (
    <Shell>
      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-black text-white">Notifikasi</h1>
          <button
            onClick={async () => {
              await apiFetch("/notifications/read-all", { method: "POST" });
              await load(true);
            }}
            className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
          >
            Tandai semua dibaca
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {items.map((n) => (
            <li key={n.id} className="rounded-xl border border-white/10 bg-bg p-3">
              <div className="text-sm text-white">{n.message}</div>
              <div className="mt-1 text-[11px] text-white/50">{new Date(n.created_at).toLocaleString()}</div>
              <div className="mt-2 flex gap-2">
                <Link
                  href={n.title_kind === "anime" ? `/anime/${n.title_id}` : `/manga/${n.title_id}`}
                  className="rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-white"
                >
                  Buka
                </Link>
                {!n.is_read ? (
                  <button
                    onClick={async () => {
                      await apiFetch(`/notifications/${n.id}/read`, { method: "POST" });
                      await load(true);
                    }}
                    className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white"
                  >
                    Tandai dibaca
                  </button>
                ) : null}
              </div>
            </li>
          ))}
          {items.length === 0 ? <li className="text-sm text-white/60">Belum ada notifikasi.</li> : null}
        </ul>
        {hasMore ? (
          <div className="mt-4">
            <button
              onClick={() => load(false)}
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
            >
              Load more
            </button>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}

