"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/http";

export function AdSlot(props: { placement: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiFetch<any[]>(`/ads?placement=${encodeURIComponent(props.placement)}`)
      .then((ads) => {
        if (!mounted) return;
        const firstEnabled = ads?.[0]?.html ?? null;
        setHtml(firstEnabled);
      })
      .catch((e) => {
        if (!mounted) return;
        if (e instanceof ApiError && e.status === 401) {
          setError("Unauthorized");
        } else {
          setError("Gagal memuat ads");
        }
      });

    return () => {
      mounted = false;
    };
  }, [props.placement]);

  if (error) return null;
  if (!html) return null;

  return (
    <div
      className="ad-slot"
      // Admin controls the HTML snippet.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

