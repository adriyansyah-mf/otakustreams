import Link from "next/link";
import { cx } from "@/components/ui";
import { SearchForm } from "@/components/header/SearchForm";
import { MainNav } from "@/components/header/MainNav";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AnalyticsBeacon } from "@/components/AnalyticsBeacon";

const loginClass =
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/15 active:bg-white/20";

export function Shell(props: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-bg/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-3 py-3 md:hidden">
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/"
                className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-lg pr-2 active:bg-white/5"
                aria-label="Otakunesia — beranda"
              >
                <img src="/icon.svg" alt="" className="h-9 w-9 shrink-0" width={36} height={36} />
                <span className="truncate text-base font-semibold tracking-wide text-white">
                  Otakunesia
                </span>
              </Link>
              <div className="flex shrink-0 items-center gap-2">
                <NotificationBell />
                <Link href="/login" className={loginClass}>
                  Login
                </Link>
              </div>
            </div>
            <MainNav className="-mx-1 px-1" />
            <SearchForm />
          </div>

          <div className="hidden items-center gap-4 py-3 md:flex">
            <Link
              href="/"
              className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg pr-2 hover:bg-white/5"
              aria-label="Otakunesia — beranda"
            >
              <img src="/icon.svg" alt="" className="h-8 w-8" width={32} height={32} />
              <span className="text-sm font-semibold tracking-wide text-white">Otakunesia</span>
            </Link>
            <MainNav className="ml-2" />
            <div className="ml-auto flex items-center gap-2">
              <SearchForm />
              <NotificationBell />
              <Link href="/login" className={loginClass}>
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      <AnalyticsBeacon />
      <main className="mx-auto max-w-6xl px-4 py-8">{props.children}</main>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-white/55">
            <span>© {new Date().getFullYear()} Otakunesia</span>
            <Link href="/terms" className="inline-flex min-h-[44px] items-center underline hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="inline-flex min-h-[44px] items-center underline hover:text-white">
              Privacy
            </Link>
            <Link href="/dmca" className="inline-flex min-h-[44px] items-center underline hover:text-white">
              DMCA
            </Link>
          </div>
          <div className="mt-3 max-w-prose text-sm leading-relaxed text-white/45">
            Otakunesia menampilkan link dari source publik. Kami tidak meng-host video/gambar pihak ketiga.
          </div>
        </div>
      </footer>
    </div>
  );
}
