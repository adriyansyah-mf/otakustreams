"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { env } from "@/lib/env";

const SESSION_KEY = "otakunesia_visit_sid";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let s = localStorage.getItem(SESSION_KEY);
    if (!s) {
      s = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return "";
  }
}

export function AnalyticsBeacon() {
  const pathname = usePathname();
  const sentForPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;
    if (sentForPath.current === pathname) return;
    sentForPath.current = pathname;

    const path = pathname.length > 500 ? pathname.slice(0, 500) : pathname;
    const sessionId = getSessionId();
    const url = `${env.apiBaseUrl.replace(/\/$/, "")}/analytics/track`;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, session_id: sessionId || null }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
