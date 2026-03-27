"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cx } from "@/components/ui";

export function PlayerModal(props: {
  open: boolean;
  title: string;
  url: string;
  isEmbed?: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") props.onClose();
    }
    if (props.open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props]);

  if (!props.open) return null;

  const isProbablyEmbed =
    props.isEmbed ??
    (props.url.includes("embed") ||
      props.url.includes("player") ||
      props.url.includes("iframe"));

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
        onClick={props.onClose}
      />
      <div className="absolute left-1/2 top-1/2 w-[min(1000px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-panel shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">
              {props.title}
            </div>
            <div className="truncate text-xs text-white/50">{props.url}</div>
          </div>
          <button
            onClick={props.onClose}
            className={cx(
              "inline-flex h-9 w-9 items-center justify-center rounded",
              "hover:bg-white/10 text-white/80 hover:text-white"
            )}
            aria-label="Close player"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="aspect-video bg-black">
          {isProbablyEmbed ? (
            <iframe
              src={props.url}
              className="h-full w-full"
              allowFullScreen
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-6 text-center">
              <div>
                <div className="text-sm font-semibold text-white">
                  Link external
                </div>
                <div className="mt-2 text-xs text-white/60">
                  Provider tidak menyediakan embed yang aman. Buka di tab baru.
                </div>
                <a
                  href={props.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex rounded bg-brand px-4 py-2 text-sm font-semibold text-white"
                >
                  Buka Link
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

