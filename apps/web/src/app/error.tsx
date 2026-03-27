"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Shell } from "@/components/Shell";

export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // keep minimal; avoids noisy console in production if needed later
    // console.error(props.error);
  }, [props.error]);

  return (
    <html lang="id">
      <body>
        <Shell>
          <div className="rounded-2xl border border-white/10 bg-panel p-6">
            <div className="text-xs font-semibold tracking-widest text-white/50">ERROR</div>
            <h1 className="mt-2 text-2xl font-black text-white">Sedang ada gangguan</h1>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Server sedang sibuk atau koneksi ke API bermasalah. Coba refresh beberapa saat lagi.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => props.reset()}
                className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand/90"
              >
                Coba lagi
              </button>
              <Link
                href="/"
                className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                Ke Home
              </Link>
            </div>
            <div className="mt-4 text-[11px] text-white/40">
              {props.error?.digest ? `Digest: ${props.error.digest}` : null}
            </div>
          </div>
        </Shell>
      </body>
    </html>
  );
}

