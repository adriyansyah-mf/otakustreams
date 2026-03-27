import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { BookmarkButton } from "@/components/bookmark/BookmarkButton";
import { CommunitySection } from "@/components/community/CommunitySection";
import { FollowButton } from "@/components/notifications/FollowButton";
import { BrokenLinkButton } from "@/components/report/BrokenLinkButton";
import { RecommendationMini } from "@/components/recommendations/RecommendationMini";
import { ApiError, apiFetch } from "@/lib/http";
import { parseIdFromSeoKey } from "@/lib/seoRoute";
import { makeSeoKey } from "@/lib/seoRoute";
import { env } from "@/lib/env";

type Chapter = {
  id: number;
  chapter_number: number;
  title: string | null;
};

type MangaDetail = {
  id: number;
  title: string;
  synopsis: string | null;
  status: string | null;
  thumbnail_url: string | null;
  source_url: string;
  chapters: Chapter[];
};

export async function generateMetadata(props: {
  params: Promise<{ mangaId: string }>;
}): Promise<Metadata> {
  const { mangaId } = await props.params;
  const id = parseIdFromSeoKey(mangaId) ?? Number(mangaId);
  const m = await apiFetch<MangaDetail>(`/manga/${id}`);
  const canonicalPath = `/manga/${makeSeoKey(m.id, m.title ?? String(m.id))}`;
  return {
    title: m.title,
    description: m.synopsis ?? `Baca manga dan komik ${m.title} di Otakunesia`,
    keywords: ["baca manga", "baca komik", m.title],
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: m.title,
      description: m.synopsis ?? undefined,
      images: m.thumbnail_url ? [m.thumbnail_url] : undefined,
      url: new URL(canonicalPath, env.siteUrl).toString(),
    },
  };
}

export default async function MangaDetailPage(props: {
  params: Promise<{ mangaId: string }>;
}) {
  const { mangaId } = await props.params;
  const id = parseIdFromSeoKey(mangaId) ?? Number(mangaId);
  let m: MangaDetail;
  try {
    m = await apiFetch<MangaDetail>(`/manga/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const chapters = [...m.chapters].sort((a, b) => a.chapter_number - b.chapter_number);

  return (
    <Shell>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-panel">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Book",
              name: m.title,
              description: m.synopsis ?? undefined,
              image: m.thumbnail_url ?? undefined,
              url: new URL(`/manga/${makeSeoKey(m.id, m.title ?? String(m.id))}`, env.siteUrl).toString(),
              genre: (m as any).genres ?? undefined,
            }),
          }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${env.siteUrl.replace(/\/$/, "")}/` },
                { "@type": "ListItem", position: 2, name: "Manga", item: `${env.siteUrl.replace(/\/$/, "")}/manga` },
                { "@type": "ListItem", position: 3, name: m.title, item: `${env.siteUrl.replace(/\/$/, "")}/manga/${makeSeoKey(m.id, m.title ?? String(m.id))}` },
              ],
            }),
          }}
        />
        <div className="grid gap-6 p-6 md:grid-cols-[220px_1fr]">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.thumbnail_url ?? "/placeholder.svg"}
              alt={`${m.title} - cover manga`}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{m.title}</h1>
            <div className="mt-2 text-xs text-white/60">
              {m.status ? <span className="rounded bg-white/10 px-2 py-1">{m.status}</span> : null}
            </div>
            <p className="mt-4 text-sm leading-6 text-white/70">
              {m.synopsis ?? "Belum ada sinopsis dari crawler."}
            </p>
            <div className="mt-4">
              <BookmarkButton kind="manga" entityId={m.id} />
            </div>
            <div className="mt-2">
              <FollowButton kind="manga" entityId={m.id} />
            </div>
            <div className="mt-2">
              <BrokenLinkButton kind="manga" entityId={m.id} url={m.source_url} />
            </div>
            <div className="mt-4 text-xs text-white/50">
              Sumber:{" "}
              <a href={m.source_url} target="_blank" rel="noreferrer" className="underline">
                {m.source_url}
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 p-6">
          <h2 className="text-sm font-semibold text-white">Chapters</h2>
          <div className="mt-3 max-h-[520px] overflow-auto rounded-xl border border-white/10">
            <ul className="divide-y divide-white/10">
              {chapters.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">
                      Chapter {c.chapter_number}
                    </div>
                    <div className="truncate text-xs text-white/60">{c.title ?? "—"}</div>
                  </div>
                  <Link
                    href={`/manga/chapter/${c.id}`}
                    className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90"
                  >
                    Baca
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-6 pt-0">
          <CommunitySection kind="manga" entityId={m.id} />
          <RecommendationMini kind="manga" />
        </div>
      </div>
    </Shell>
  );
}

