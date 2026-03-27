"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { apiFetch } from "@/lib/http";
import { cx } from "@/components/ui";

export function BookmarkButton(props: { kind: string; entityId: number }) {
  const [loading, setLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState<boolean | null>(null);

  async function toggle() {
    setLoading(true);
    try {
      const res = await apiFetch<{ bookmarked: boolean }>("/bookmarks/toggle", {
        method: "POST",
        body: JSON.stringify({ kind: props.kind, entity_id: props.entityId }),
      });
      setBookmarked(res.bookmarked);
    } catch {
      // likely not logged in
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cx(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold",
        bookmarked ? "bg-brand text-white" : "bg-white/10 text-white hover:bg-white/15",
        loading ? "opacity-60" : ""
      )}
    >
      <Bookmark className="h-4 w-4" />
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}

