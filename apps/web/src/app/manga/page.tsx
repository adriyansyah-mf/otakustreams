import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Shell } from "@/components/Shell";
import { apiFetch } from "@/lib/http";
import { makeSeoKey } from "@/lib/seoRoute";
import { env } from "@/lib/env";

type MangaListItem = {
  id: number;
  title: string;
  thumbnail_url: string | null;
};

function getPageParam(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function makeListUrl(
  basePath: string,
  params: { page?: number; q?: string | null; genre?: string | null; status?: string | null; sort?: string | null }
) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.genre) sp.set("genre", params.genre);
  if (params.status) sp.set("status", params.status);
  if (params.sort && params.sort !== "latest") sp.set("sort", params.sort);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export async function generateMetadata(props: {
  searchParams?: Promise<{ page?: string; q?: string; genre?: string; status?: string; sort?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const page = getPageParam(sp.page);
  const q = (sp.q ?? "").trim() || null;
  const canonicalPath = makeListUrl("/manga", { page, q, genre: (sp.genre ?? "").trim() || null, status: (sp.status ?? "").trim() || null, sort: (sp.sort ?? "").trim() || "latest" });
  const title = q ? `Manga: ${q}` : "Manga";
  return {
    title: page > 1 ? `${title} (Page ${page})` : title,
    description: q
      ? `Cari manga/komik: ${q} - baca manga dan baca komik online di Otakunesia.`
      : "Baca manga dan baca komik online terbaru di Otakunesia.",
    keywords: ["baca manga", "baca komik", "komik online", "manga terbaru"],
    alternates: { canonical: canonicalPath },
    openGraph: { url: new URL(canonicalPath, env.siteUrl).toString() },
  };
}

export default async function MangaListPage(props: {
  searchParams?: Promise<{ page?: string; q?: string; genre?: string; status?: string; sort?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const page = getPageParam(sp.page);
  const q = (sp.q ?? "").trim() || null;
  const genre = (sp.genre ?? "").trim() || null;
  const status = (sp.status ?? "").trim() || null;
  const sort = (sp.sort ?? "").trim() || "latest";

  const pageSize = 60;
  const offset = (page - 1) * pageSize;
  const filters = [
    q ? `q=${encodeURIComponent(q)}` : "",
    genre ? `genre=${encodeURIComponent(genre)}` : "",
    status ? `status=${encodeURIComponent(status)}` : "",
    sort ? `sort=${encodeURIComponent(sort)}` : "",
  ]
    .filter(Boolean)
    .join("&");
  const apiUrl = `/manga?limit=${pageSize + 1}&offset=${offset}${filters ? `&${filters}` : ""}`;
  const itemsPlus = await apiFetch<MangaListItem[]>(apiUrl);
  const hasNext = itemsPlus.length > pageSize;
  const items = itemsPlus.slice(0, pageSize);

  return (
    <Shell>
      <div>
        <h2 className="text-xl font-bold text-white">Manga</h2>
        <p className="mt-1 text-sm text-white/60">Reader scroll-friendly.</p>
      </div>

      <form className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-panel p-4 md:grid-cols-4" action="/manga" method="GET">
        <input name="q" defaultValue={q ?? ""} placeholder="Cari judul..." className="rounded border border-white/10 bg-bg px-3 py-2 text-xs text-white" />
        <input name="genre" defaultValue={genre ?? ""} placeholder="Genre" className="rounded border border-white/10 bg-bg px-3 py-2 text-xs text-white" />
        <input name="status" defaultValue={status ?? ""} placeholder="Status" className="rounded border border-white/10 bg-bg px-3 py-2 text-xs text-white" />
        <select name="sort" defaultValue={sort} className="rounded border border-white/10 bg-bg px-3 py-2 text-xs text-white">
          <option value="latest">Terbaru</option>
          <option value="title_asc">Judul A-Z</option>
        </select>
        <button className="md:col-span-4 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90">Terapkan Filter</button>
      </form>
      {(q || genre || status || sort !== "latest") ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {q ? <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">q: {q}</span> : null}
          {genre ? <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">genre: {genre}</span> : null}
          {status ? <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">status: {status}</span> : null}
          {sort !== "latest" ? <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">sort: {sort}</span> : null}
          <Link href="/manga" className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">Reset</Link>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-panel p-6 text-sm text-white/60">
          Belum ada manga yang tercrawl untuk saat ini. Coba lagi nanti.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {items.map((m) => (
            <Link
              key={m.id}
              href={`/manga/${makeSeoKey(m.id, m.title)}`}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-panel hover:border-white/20"
            >
              <div className="aspect-[3/4] bg-soft">
                <Image
                  src={m.thumbnail_url ?? "/placeholder.svg"}
                  alt={`${m.title} - baca manga dan baca komik`}
                  width={480}
                  height={640}
                  sizes="(max-width: 1024px) 40vw, 20vw"
                  className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <div className="line-clamp-2 text-sm font-semibold text-white">
                  {m.title}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Link
          aria-disabled={page <= 1}
          href={makeListUrl("/manga", { page: Math.max(1, page - 1), q, genre, status, sort })}
          className={
            page <= 1
              ? "pointer-events-none rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-white/40"
              : "rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
          }
        >
          Prev
        </Link>
        <div className="text-xs text-white/60">Page {page}</div>
        <Link
          aria-disabled={!hasNext}
          href={makeListUrl("/manga", { page: page + 1, q, genre, status, sort })}
          className={
            !hasNext
              ? "pointer-events-none rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-white/40"
              : "rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
          }
        >
          Next
        </Link>
      </div>
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
            ],
          }),
        }}
      />
    </Shell>
  );
}

