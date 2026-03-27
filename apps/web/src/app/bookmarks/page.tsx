"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { apiFetch } from "@/lib/http";

type Bookmark = {
  id: number;
  kind: "anime" | "manga" | "episode" | "chapter" | string;
  entity_id: number;
};

export default function BookmarksPage() {
  const [items, setItems] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Bookmark[]>("/bookmarks")
      .then((res) => setItems(res))
      .catch(() => setError("Kamu belum login atau bookmark belum ada."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <h1 className="text-xl font-black text-white">Bookmark Saya</h1>
        <p className="mt-1 text-sm text-white/60">
          Kumpulan anime/manga yang kamu simpan.
        </p>

        {loading ? <div className="mt-6 text-sm text-white/60">Memuat bookmark...</div> : null}
        {error ? (
          <div className="mt-6 text-sm text-red-300">
            {error}{" "}
            <Link href="/login" className="underline">
              Login dulu
            </Link>
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <div className="mt-6 text-sm text-white/60">Belum ada bookmark.</div>
        ) : null}

        <ul className="mt-6 space-y-3">
          {items.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-bg p-4"
            >
              <div>
                <div className="text-sm font-semibold text-white">
                  {b.kind.toUpperCase()} #{b.entity_id}
                </div>
                <div className="text-xs text-white/60">Bookmark ID: {b.id}</div>
              </div>

              <Link
                href={getBookmarkHref(b)}
                className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90"
              >
                Buka
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}

function getBookmarkHref(item: Bookmark): string {
  if (item.kind === "anime") return `/anime/${item.entity_id}`;
  if (item.kind === "manga") return `/manga/${item.entity_id}`;
  if (item.kind === "chapter") return `/manga/chapter/${item.entity_id}`;
  // episode route belum ada page dedicated; fallback ke anime list.
  return "/anime";
}

