import Link from "next/link";
import { Film, BookOpen, Bookmark } from "lucide-react";
import { cx } from "@/components/ui";

export function MainNav(props: { className?: string }) {
  const link =
    "inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg px-3 text-sm text-white/80 hover:bg-white/5 hover:text-white active:bg-white/10";
  return (
    <nav
      className={cx(
        "flex items-center gap-1 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] md:gap-2 md:pb-0",
        props.className,
      )}
      aria-label="Navigasi utama"
    >
      <Link href="/anime" className={link}>
        <Film className="h-4 w-4 shrink-0" aria-hidden />
        Anime
      </Link>
      <Link href="/manga" className={link}>
        <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
        Manga
      </Link>
      <Link href="/bookmarks" className={link}>
        <Bookmark className="h-4 w-4 shrink-0" aria-hidden />
        Bookmark
      </Link>
    </nav>
  );
}
