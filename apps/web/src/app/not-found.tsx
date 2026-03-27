import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function NotFound() {
  return (
    <Shell>
      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <div className="text-xs font-semibold tracking-widest text-white/50">404</div>
        <h1 className="mt-2 text-2xl font-black text-white">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Link yang kamu buka mungkin sudah berubah, atau kontennya belum tercrawl.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/anime"
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand/90"
          >
            Lihat Anime
          </Link>
          <Link
            href="/manga"
            className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            Lihat Manga
          </Link>
        </div>
      </div>
    </Shell>
  );
}

