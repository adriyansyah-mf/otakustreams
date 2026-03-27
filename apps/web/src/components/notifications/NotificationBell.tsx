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
    <Link href="/notifications" className="relative rounded bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">
      <Bell className="h-4 w-4" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px]">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}

