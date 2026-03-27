import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { makeSeoKey } from "@/lib/seoRoute";

type AnimeListItem = { id: number; title?: string };
type MangaListItem = { id: number; title?: string };
type MangaChapterListItem = { id: number; title?: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl.replace(/\/$/, "");
  const now = new Date();

  const [anime, manga] = await Promise.all([
    fetchAllPages<AnimeListItem>(`${env.internalApiBaseUrl}/anime`),
    fetchAllPages<MangaListItem>(`${env.internalApiBaseUrl}/manga`),
  ]);

  const chapters = await fetchAllPages<MangaChapterListItem>(`${env.internalApiBaseUrl}/manga/chapters`);

  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/anime`, lastModified: now },
    { url: `${base}/manga`, lastModified: now },
    ...anime.map((a) => ({
      url: `${base}/anime/${makeSeoKey(a.id, a.title ?? String(a.id))}`,
      lastModified: now,
    })),
    ...manga.map((m) => ({
      url: `${base}/manga/${makeSeoKey(m.id, m.title ?? String(m.id))}`,
      lastModified: now,
    })),
    ...chapters.map((c) => ({
      url: `${base}/manga/chapter/${c.id}`,
      lastModified: now,
    })),
  ];
}

async function safeFetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

async function fetchAllPages<T extends { id: number }>(baseUrl: string): Promise<T[]> {
  const pageSize = 100;
  const all: T[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const url = `${baseUrl}?limit=${pageSize}&offset=${offset}`;
    const items = await safeFetchJson<T[]>(url, []);
    if (!items.length) break;
    all.push(...items);
    if (items.length < pageSize) break;
  }

  return all;
}

