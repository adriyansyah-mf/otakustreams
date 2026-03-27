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
      className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5"
      role="search"
      aria-label="Search anime or manga"
    >
      <Search className="h-4 w-4 text-white/60" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari judul..."
        className="w-36 bg-transparent text-xs text-white placeholder:text-white/40 outline-none"
      />
      <select
        value={scope}
        onChange={(e) => setScope(e.target.value as "anime" | "manga")}
        className="rounded-full bg-bg px-2 py-1 text-[11px] text-white outline-none"
      >
        <option value="anime">Anime</option>
        <option value="manga">Manga</option>
      </select>
      <button
        type="submit"
        className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-white hover:bg-white/15"
      >
        Search
      </button>
    </form>
  );
}

