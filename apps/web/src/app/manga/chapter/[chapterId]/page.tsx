import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { MarkRead } from "@/components/manga/MarkRead";
import { ApiError, apiFetch } from "@/lib/http";
import { env } from "@/lib/env";
import { BrokenLinkButton } from "@/components/report/BrokenLinkButton";

type Chapter = {
  id: number;
  chapter_number: number;
  title: string | null;
  source_url: string;
  page_images: string[] | null;
};

export async function generateMetadata(props: {
  params: Promise<{ chapterId: string }>;
}): Promise<Metadata> {
  const { chapterId } = await props.params;
  const ch = await apiFetch<Chapter>(`/manga/chapters/${chapterId}`);
  const canonicalPath = `/manga/chapter/${ch.id}`;
  return {
    title: `Chapter ${ch.chapter_number}`,
    description: `Baca chapter ${ch.chapter_number} di OtakuStream`,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `Chapter ${ch.chapter_number}`,
      description: ch.title ?? undefined,
      images: ch.page_images?.[0] ? [ch.page_images[0]] : undefined,
      url: new URL(canonicalPath, env.siteUrl).toString(),
    },
  };
}

export default async function MangaChapterPage(props: {
  params: Promise<{ chapterId: string }>;
}) {
  const { chapterId } = await props.params;
  let ch: Chapter;
  try {
    ch = await apiFetch<Chapter>(`/manga/chapters/${chapterId}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <Shell>
      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CreativeWork",
              name: `Chapter ${ch.chapter_number}`,
              description: ch.title ?? undefined,
              url: new URL(`/manga/chapter/${ch.id}`, env.siteUrl).toString(),
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
                { "@type": "ListItem", position: 3, name: `Chapter ${ch.chapter_number}`, item: `${env.siteUrl.replace(/\/$/, "")}/manga/chapter/${ch.id}` },
              ],
            }),
          }}
        />
        <MarkRead chapterId={ch.id} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-black text-white">
              Chapter {ch.chapter_number}
            </h1>
            <div className="mt-1 text-xs text-white/60">{ch.title ?? "—"}</div>
          </div>
          <a
            href={ch.source_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
          >
            Sumber
          </a>
        </div>
        <div className="mt-2">
          <BrokenLinkButton kind="chapter" entityId={ch.id} url={ch.source_url} />
        </div>

        <div className="mt-6 space-y-3">
          {ch.page_images?.length ? (
            ch.page_images.map((src, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${src}-${idx}`}
                src={src}
                alt={`Page ${idx + 1}`}
                className="mx-auto w-full max-w-3xl rounded-lg border border-white/10 bg-black/20"
                loading={idx < 2 ? "eager" : "lazy"}
              />
            ))
          ) : (
            <div className="text-sm text-white/60">
              Halaman belum tersedia. Crawler mungkin belum mengambil gambar.
            </div>
          )}
        </div>

        <div className="mt-8 text-xs text-white/50">
          <Link href="/manga" className="underline">
            Kembali ke daftar manga
          </Link>
        </div>
      </div>
    </Shell>
  );
}

