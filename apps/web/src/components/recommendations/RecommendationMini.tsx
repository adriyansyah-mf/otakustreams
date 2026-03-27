"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";
import { makeSeoKey } from "@/lib/seoRoute";

type Item = { id: number; title: string; thumbnail_url: string | null };

export function RecommendationMini(props: { kind: "anime" | "manga" }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    apiFetch<{ anime: Item[]; manga: Item[] }>("/recommendations")
      .then((r) => setItems((props.kind === "anime" ? r.anime : r.manga).slice(0, 6)))
      .catch(() => {});
  }, [props.kind]);

  if (items.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-panel p-4">
      <div className="text-sm font-semibold text-white">Rekomendasi</div>
      <div className="mt-2 grid gap-1">
        {items.map((i) => (
          <Link
            key={i.id}
            href={props.kind === "anime" ? `/anime/${makeSeoKey(i.id, i.title)}` : `/manga/${makeSeoKey(i.id, i.title)}`}
            className="text-sm text-white/75 hover:text-white"
          >
            {i.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

