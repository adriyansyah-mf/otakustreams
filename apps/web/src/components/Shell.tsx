import Link from "next/link";
import { Film, BookOpen, Bookmark } from "lucide-react";
import { cx } from "@/components/ui";
import { SearchForm } from "@/components/header/SearchForm";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function Shell(props: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon.svg" alt="Logo Otakunesia" className="h-8 w-8" />
            <span className="text-sm font-semibold tracking-wide text-white">
              Otakunesia
            </span>
          </Link>

          <nav className="ml-2 hidden items-center gap-2 md:flex">
            <Link
              href="/anime"
              className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
            >
              <Film className="h-4 w-4" />
              Anime
            </Link>
            <Link
              href="/manga"
              className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
            >
              <BookOpen className="h-4 w-4" />
              Manga
            </Link>
            <Link
              href="/bookmarks"
              className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
            >
              <Bookmark className="h-4 w-4" />
              Bookmark
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <SearchForm />
            <NotificationBell />
            <Link
              href="/login"
              className="rounded bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{props.children}</main>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/55">
            <span>© {new Date().getFullYear()} Otakunesia</span>
            <Link href="/terms" className="underline hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="underline hover:text-white">
              Privacy
            </Link>
            <Link href="/dmca" className="underline hover:text-white">
              DMCA
            </Link>
          </div>
          <div className="mt-3 text-xs text-white/45">
            Otakunesia menampilkan link dari source publik. Kami tidak meng-host video/gambar pihak ketiga.
          </div>
        </div>
      </footer>
    </div>
  );
}

