"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchForm() {
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"anime" | "manga">("anime");
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        const base = scope === "anime" ? "/anime" : "/manga";
        if (!query) {
          router.push(base);
          return;
        }
        router.push(`${base}?q=${encodeURIComponent(query)}`);
      }}
      className="flex w-full min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 md:w-auto md:max-w-md md:rounded-full md:py-1.5"
      role="search"
      aria-label="Cari anime atau manga"
    >
      <Search className="h-5 w-5 shrink-0 text-white/60 md:h-4 md:w-4" aria-hidden />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari judul..."
        className="min-h-[44px] min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-white/40 outline-none md:min-h-0 md:w-36 md:text-sm"
        autoComplete="off"
        enterKeyHint="search"
      />
      <select
        value={scope}
        onChange={(e) => setScope(e.target.value as "anime" | "manga")}
        className="min-h-[44px] shrink-0 rounded-xl bg-bg px-2 py-1 text-sm text-white outline-none md:min-h-0 md:rounded-full md:text-[11px]"
        aria-label="Jenis konten"
      >
        <option value="anime">Anime</option>
        <option value="manga">Manga</option>
      </select>
      <button
        type="submit"
        className="min-h-[44px] shrink-0 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 active:bg-white/20 md:min-h-0 md:rounded-full md:px-2 md:py-1 md:text-[11px]"
      >
        Search
      </button>
    </form>
  );
}
