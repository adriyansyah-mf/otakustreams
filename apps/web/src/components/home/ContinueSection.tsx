"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/http";
import { makeSeoKey } from "@/lib/seoRoute";

type WatchItem = {
  episode_id: number;
  anime_id: number;
  anime_title: string;
  episode_number: number;
  episode_title: string | null;
  watched_at: string;
};

type ReadItem = {
  chapter_id: number;
  manga_id: number;
  manga_title: string;
  chapter_number: number;
  chapter_title: string | null;
  read_at: string;
};

export function ContinueSection() {
  const [watch, setWatch] = useState<WatchItem[]>([]);
  const [read, setRead] = useState<ReadItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch<WatchItem[]>("/history/watch/expanded"),
      apiFetch<ReadItem[]>("/history/read/expanded"),
    ])
      .then(([w, r]) => {
        if (!mounted) return;
        setWatch(w.slice(0, 6));
        setRead(r.slice(0, 6));
      })
      .catch((e) => {
        if (!mounted) return;
        if (!(e instanceof ApiError && e.status === 401)) {
          setWatch([]);
          setRead([]);
        }
      })
      .finally(() => mounted && setReady(true));
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready || (watch.length === 0 && read.length === 0)) return null;

  return (
    <section className="mt-10 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-panel p-5">
        <div className="text-sm font-semibold text-white">Lanjut Nonton</div>
        <ul className="mt-3 space-y-2">
          {watch.map((w) => (
            <li key={w.episode_id} className="rounded-lg border border-white/10 bg-bg p-3">
              <div className="text-xs text-white/50">Episode {w.episode_number}</div>
              <div className="truncate text-sm font-semibold text-white">{w.anime_title}</div>
              <div className="truncate text-xs text-white/60">{w.episode_title ?? "—"}</div>
              <Link
                href={`/anime/${makeSeoKey(w.anime_id, w.anime_title)}`}
                className="mt-2 inline-flex rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-white hover:bg-brand/90"
              >
                Buka Anime
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-white/10 bg-panel p-5">
        <div className="text-sm font-semibold text-white">Lanjut Baca</div>
        <ul className="mt-3 space-y-2">
          {read.map((r) => (
            <li key={r.chapter_id} className="rounded-lg border border-white/10 bg-bg p-3">
              <div className="text-xs text-white/50">Chapter {r.chapter_number}</div>
              <div className="truncate text-sm font-semibold text-white">{r.manga_title}</div>
              <div className="truncate text-xs text-white/60">{r.chapter_title ?? "—"}</div>
              <Link
                href={`/manga/chapter/${r.chapter_id}`}
                className="mt-2 inline-flex rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-white hover:bg-brand/90"
              >
                Lanjut Baca
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

