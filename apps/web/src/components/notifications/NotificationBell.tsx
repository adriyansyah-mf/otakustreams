"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/http";

export function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    apiFetch<any[]>("/notifications/feed?only_unread=true&limit=50&offset=0")
      .then((items) => setCount(items.length))
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/notifications"
      className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/15 active:bg-white/20"
      aria-label="Notifikasi"
    >
      <Bell className="h-5 w-5" aria-hidden />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px]">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}

