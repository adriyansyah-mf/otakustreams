"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import { makeSeoKey } from "@/lib/seoRoute";

type Item = { id: number; title: string; thumbnail_url: string | null };

export function RecommendationSection() {
  const [anime, setAnime] = useState<Item[]>([]);
  const [manga, setManga] = useState<Item[]>([]);

  useEffect(() => {
    apiFetch<{ anime: Item[]; manga: Item[] }>("/recommendations")
      .then((r) => {
        setAnime(r.anime ?? []);
        setManga(r.manga ?? []);
      })
      .catch(() => {});
  }, []);

  if (anime.length === 0 && manga.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-3 text-sm font-semibold text-white">Rekomendasi Untukmu</div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-panel p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/50">Anime</div>
          <div className="mt-3 grid gap-2">
            {anime.slice(0, 6).map((a) => (
              <Link key={a.id} href={`/anime/${makeSeoKey(a.id, a.title)}`} className="text-sm text-white/80 hover:text-white">
                {a.title}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-panel p-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/50">Manga</div>
          <div className="mt-3 grid gap-2">
            {manga.slice(0, 6).map((m) => (
              <Link key={m.id} href={`/manga/${makeSeoKey(m.id, m.title)}`} className="text-sm text-white/80 hover:text-white">
                {m.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

