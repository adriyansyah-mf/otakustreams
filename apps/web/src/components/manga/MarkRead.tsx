"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/http";

export function MarkRead(props: { chapterId: number }) {
  useEffect(() => {
    apiFetch(`/history/read?chapter_id=${props.chapterId}`, { method: "POST" }).catch(() => {});
  }, [props.chapterId]);

  return null;
}

