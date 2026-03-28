import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Shell } from "@/components/Shell";
import { apiFetch } from "@/lib/http";
import { makeSeoKey } from "@/lib/seoRoute";

const AdSlot = dynamic(
  () => import("@/components/ads/AdSlot").then((m) => ({ default: m.AdSlot })),
  { loading: () => <div className="mt-6 h-12 animate-pulse rounded-xl bg-white/[0.04]" aria-hidden /> },
);

const ContinueSection = dynamic(
  () => import("@/components/home/ContinueSection").then((m) => ({ default: m.ContinueSection })),
  { loading: () => <DeferredSectionSkeleton /> },
);

const RecommendationSection = dynamic(
  () => import("@/components/home/RecommendationSection").then((m) => ({ default: m.RecommendationSection })),
  { loading: () => <DeferredSectionSkeleton /> },
);

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
            dengan katalog yang terus diperbarui, pengalaman menonton yang nyaman, reader ringan,
            serta fitur seperti bookmark, riwayat, notifikasi update, dan rekomendasi.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-white/75">
              {anime.length} judul anime
            </span>
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-white/75">
              {manga.length} judul manga
            </span>
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
          </div>
        </div>
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
              Belum ada judul anime di katalog. Cek lagi nanti.
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
              Belum ada judul manga di katalog. Cek lagi nanti.
            </div>
          ) : null}
        </div>
      </section>

      <ContinueSection />
      <RecommendationSection />

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <Card
          title="Katalog terkini"
          desc="Judul anime dan manga diperbarui berkala supaya kamu tidak ketinggalan episode atau chapter baru."
        />
        <Card
          title="Nyaman dipakai"
          desc="Player embed untuk streaming dan reader ringan untuk baca manga—fokus ke konten, bukan antarmuka yang ribet."
        />
        <Card
          title="Akun & progres"
          desc="Login untuk bookmark, riwayat tonton/baca, notifikasi update, dan rekomendasi yang lebih pas."
        />
      </section>
    </Shell>
  );
}

function DeferredSectionSkeleton() {
  return (
    <div className="mt-10 space-y-3" aria-hidden>
      <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
      <div className="h-36 animate-pulse rounded-2xl border border-white/10 bg-panel/40" />
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

