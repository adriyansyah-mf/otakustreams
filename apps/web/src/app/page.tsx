import Link from "next/link";
import Image from "next/image";
import { Shell } from "@/components/Shell";
import { apiFetch } from "@/lib/http";
import { makeSeoKey } from "@/lib/seoRoute";
import { AdSlot } from "@/components/ads/AdSlot";
import { ContinueSection } from "@/components/home/ContinueSection";
import { RecommendationSection } from "@/components/home/RecommendationSection";

type AnimeItem = {
  id: number;
  title: string;
  score: string | null;
  thumbnail_url: string | null;
};

type MangaItem = {
  id: number;
  title: string;
  thumbnail_url: string | null;
};

export default async function HomePage() {
  const [anime, manga] = await Promise.all([
    apiFetch<AnimeItem[]>("/anime?limit=12"),
    apiFetch<MangaItem[]>("/manga?limit=12"),
  ]);
  const featured = anime[0];
  const hasCatalog = anime.length > 0 || manga.length > 0;

  return (
    <Shell>
      <section className="relative min-h-[280px] overflow-hidden rounded-3xl border border-white/10 bg-panel md:min-h-[360px]">
        <Image
          src={featured?.thumbnail_url ?? "/placeholder.svg"}
          alt={featured?.title ? `${featured.title} - nonton anime sub indo` : "Otakunesia - nonton anime sub indo"}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/50" />
        <div className="relative px-6 py-12 md:px-10 md:py-14">
          <p className="text-xs font-semibold tracking-[0.2em] text-white/60">
            OTAKUNESIA
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-white md:text-5xl">
            Nonton anime sub indo, baca manga & komik—satu platform cepat
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 md:text-base">
            Di Otakunesia kamu bisa nonton anime sub indo, baca manga, dan baca komik online
            dengan katalog yang terus terbarui dari crawler background, pengalaman menonton nyaman,
            reader ringan, serta fitur personalisasi seperti bookmark, history, notifikasi update,
            dan rekomendasi.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-white/75">
              {anime.length} Anime
            </span>
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-white/75">
              {manga.length} Manga
            </span>
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-white/75">
              SSR + Sitemap + Structured Data
            </span>
            {featured ? (
              <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-white/75">
                Featured score: {featured.score ?? "—"}
              </span>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-3 md:mt-9">
            <Link
              href={featured ? `/anime/${makeSeoKey(featured.id, featured.title)}` : "/anime"}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-6 text-base font-semibold text-white hover:bg-brand/90 active:bg-brand/80 md:text-sm"
            >
              Mulai Nonton
            </Link>
            <Link
              href="/manga"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-white/10 px-6 text-base font-semibold text-white hover:bg-white/15 active:bg-white/10 md:text-sm"
            >
              Jelajahi Manga
            </Link>
            <Link
              href="/admin"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/15 bg-transparent px-6 text-base font-semibold text-white/90 hover:bg-white/5 active:bg-white/10 md:text-sm"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoPill label="Katalog aktif" value={hasCatalog ? "Online" : "Menunggu crawl"} />
        <InfoPill label="Fokus UX" value="Watch + Reader" />
        <InfoPill label="Personalisasi" value="Bookmark & History" />
        <InfoPill label="Admin tools" value="Crawler + Moderasi" />
      </section>

      <div className="mt-6">
        <AdSlot placement="home_top" />
      </div>

      <section className="mt-10">
        <SectionHeading
          title="Trending Anime"
          subtitle="Pilihan anime terbaru dan paling banyak ditonton."
          href="/anime"
          cta="Lihat semua anime"
        />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {anime.map((a, idx) => (
            <Link
              key={a.id}
              href={`/anime/${makeSeoKey(a.id, a.title)}`}
              className="group overflow-hidden rounded-xl border border-white/10 bg-panel transition hover:-translate-y-0.5 hover:border-white/20"
            >
              <div className="aspect-[16/9] bg-soft">
                <Image
                  src={a.thumbnail_url ?? "/placeholder.svg"}
                  alt={`${a.title} - nonton anime sub indo`}
                  width={640}
                  height={360}
                  sizes="(max-width: 1024px) 50vw, 16vw"
                  className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                />
              </div>
              <div className="p-3">
                {idx < 3 ? (
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-brand">
                    Hot Pick
                  </div>
                ) : null}
                <div className="line-clamp-2 text-xs font-semibold text-white">{a.title}</div>
                <div className="mt-1 text-[11px] text-white/55">Skor: {a.score ?? "—"}</div>
              </div>
            </Link>
          ))}
          {anime.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/15 bg-panel p-6 text-sm text-white/60">
              Belum ada data anime. Jalankan crawler dari admin panel untuk memulai katalog.
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <SectionHeading
          title="Popular Manga"
          subtitle="Daftar manga yang sedang ramai dibaca pengguna."
          href="/manga"
          cta="Lihat semua manga"
        />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {manga.map((m, idx) => (
            <Link
              key={m.id}
              href={`/manga/${makeSeoKey(m.id, m.title)}`}
              className="group overflow-hidden rounded-xl border border-white/10 bg-panel transition hover:-translate-y-0.5 hover:border-white/20"
            >
              <div className="aspect-[3/4] bg-soft">
                <Image
                  src={m.thumbnail_url ?? "/placeholder.svg"}
                  alt={`${m.title} - baca manga dan baca komik`}
                  width={480}
                  height={640}
                  sizes="(max-width: 1024px) 40vw, 16vw"
                  className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                />
              </div>
              <div className="p-3">
                {idx < 3 ? (
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-brand">
                    Editor Choice
                  </div>
                ) : null}
                <div className="line-clamp-2 text-xs font-semibold text-white">{m.title}</div>
              </div>
            </Link>
          ))}
          {manga.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-white/15 bg-panel p-6 text-sm text-white/60">
              Belum ada data manga. Jalankan crawler dari admin panel untuk memulai katalog.
            </div>
          ) : null}
        </div>
      </section>

      <ContinueSection />
      <RecommendationSection />

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <Card
          title="Crawler Automation"
          desc="Update katalog berjalan otomatis dengan worker dan scheduler di background."
        />
        <Card
          title="SEO Foundation"
          desc="SSR, metadata, canonical URL, sitemap, dan structured data siap untuk indexing."
        />
        <Card
          title="Public-Ready UX"
          desc="Navigasi jelas, pencarian cepat, feed personal, dan panel admin untuk operasional."
        />
      </section>
    </Shell>
  );
}

function InfoPill(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-panel/80 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-white/45">{props.label}</div>
      <div className="mt-1 text-sm font-semibold text-white">{props.value}</div>
    </div>
  );
}

function SectionHeading(props: { title: string; subtitle: string; href: string; cta: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-white md:text-lg">{props.title}</h2>
        <p className="mt-1 text-sm text-white/55 md:text-xs">{props.subtitle}</p>
      </div>
      <Link
        href={props.href}
        className="inline-flex min-h-[44px] items-center text-sm font-semibold text-brand hover:underline md:text-xs"
      >
        {props.cta}
      </Link>
    </div>
  );
}

function Card(props: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel p-6">
      <div className="text-sm font-semibold text-white">{props.title}</div>
      <div className="mt-2 text-sm leading-6 text-white/65">{props.desc}</div>
    </div>
  );
}

