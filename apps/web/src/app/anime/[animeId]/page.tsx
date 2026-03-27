import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Shell } from "@/components/Shell";
import { AnimeDetailClient } from "@/components/anime/AnimeDetailClient";
import { BookmarkButton } from "@/components/bookmark/BookmarkButton";
import { CommunitySection } from "@/components/community/CommunitySection";
import { FollowButton } from "@/components/notifications/FollowButton";
import { BrokenLinkButton } from "@/components/report/BrokenLinkButton";
import { RecommendationMini } from "@/components/recommendations/RecommendationMini";
import { ApiError, apiFetch } from "@/lib/http";
import { parseIdFromSeoKey } from "@/lib/seoRoute";
import { makeSeoKey } from "@/lib/seoRoute";
import { env } from "@/lib/env";

type AnimeEpisode = {
  id: number;
  episode_number: number;
  title: string | null;
  source_url: string;
  video_links: Array<{
    provider?: string | null;
    quality?: string | null;
    url: string;
    is_embed?: boolean | null;
  }> | null;
};

type AnimeDetail = {
  id: number;
  title: string;
  synopsis: string | null;
  score: string | null;
  status: string | null;
  thumbnail_url: string | null;
  genres: string[] | null;
  source_url: string;
  episodes: AnimeEpisode[];
};

export async function generateMetadata(props: {
  params: Promise<{ animeId: string }>;
}): Promise<Metadata> {
  const { animeId } = await props.params;
  const id = parseIdFromSeoKey(animeId) ?? Number(animeId);
  const a = await apiFetch<AnimeDetail>(`/anime/${id}`);
  const canonicalPath = `/anime/${makeSeoKey(a.id, a.title ?? String(a.id))}`;
  return {
    title: a.title,
    description: a.synopsis ?? `Nonton anime sub indo ${a.title} di Otakunesia`,
    keywords: ["nonton anime", "anime sub indo", a.title],
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: a.title,
      description: a.synopsis ?? undefined,
      images: a.thumbnail_url ? [a.thumbnail_url] : undefined,
      url: new URL(canonicalPath, env.siteUrl).toString(),
    },
  };
}

export default async function AnimeDetailPage(props: {
  params: Promise<{ animeId: string }>;
}) {
  const { animeId } = await props.params;
  const id = parseIdFromSeoKey(animeId) ?? Number(animeId);
  let a: AnimeDetail;
  try {
    a = await apiFetch<AnimeDetail>(`/anime/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <Shell>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-panel">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "TVSeries",
              name: a.title,
              description: a.synopsis ?? undefined,
              image: a.thumbnail_url ?? undefined,
              url: new URL(`/anime/${makeSeoKey(a.id, a.title ?? String(a.id))}`, env.siteUrl).toString(),
              genre: a.genres ?? undefined,
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
                { "@type": "ListItem", position: 2, name: "Anime", item: `${env.siteUrl.replace(/\/$/, "")}/anime` },
                { "@type": "ListItem", position: 3, name: a.title, item: `${env.siteUrl.replace(/\/$/, "")}/anime/${makeSeoKey(a.id, a.title ?? String(a.id))}` },
              ],
            }),
          }}
        />
        <div className="relative h-56 md:h-80">
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
          <Image
            src={a.thumbnail_url ?? "/placeholder.svg"}
            alt={`${a.title} - poster anime sub indo`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-70"
          />
          <div className="absolute inset-x-0 bottom-0 px-6 py-6">
            <h1 className="text-2xl font-black text-white md:text-4xl">
              {a.title}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
              <span className="rounded bg-white/10 px-2 py-1">
                Skor: {a.score ?? "—"}
              </span>
              {a.status ? (
                <span className="rounded bg-white/10 px-2 py-1">{a.status}</span>
              ) : null}
              {a.genres?.slice(0, 6).map((g) => (
                <span key={g} className="rounded bg-white/10 px-2 py-1">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-sm font-semibold text-white">Sinopsis</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {a.synopsis ?? "Belum ada sinopsis dari crawler."}
            </p>
            <div className="mt-4">
              <BookmarkButton kind="anime" entityId={a.id} />
            </div>
            <div className="mt-2">
              <FollowButton kind="anime" entityId={a.id} />
            </div>
            <div className="mt-2">
              <BrokenLinkButton kind="anime" entityId={a.id} url={a.source_url} />
            </div>
            <div className="mt-4 text-xs text-white/50">
              Sumber:{" "}
              <a href={a.source_url} target="_blank" rel="noreferrer" className="underline">
                {a.source_url}
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-white">Episode</h2>
            <AnimeDetailClient animeTitle={a.title} episodes={a.episodes} />
          </div>
        </div>
        <div className="p-6 pt-0">
          <CommunitySection kind="anime" entityId={a.id} />
          <RecommendationMini kind="anime" />
        </div>
      </div>
    </Shell>
  );
}

