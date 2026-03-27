"use client";

import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/http";

export function BrokenLinkButton(props: { kind: string; entityId: number; url: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
      >
        Laporkan link rusak
      </button>
      {open ? (
        <div className="mt-2 rounded-xl border border-white/10 bg-bg p-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Kenapa link rusak?"
            className="w-full rounded border border-white/10 bg-panel px-2 py-2 text-xs text-white"
          />
          <button
            onClick={async () => {
              setMsg(null);
              try {
                await apiFetch("/reports/broken-link", {
                  method: "POST",
                  body: JSON.stringify({
                    kind: props.kind,
                    entity_id: props.entityId,
                    url: props.url,
                    reason: reason || "Broken link",
                  }),
                });
                setReason("");
                setMsg("Laporan terkirim.");
              } catch (e) {
                if (e instanceof ApiError && e.status === 401) setMsg("Login dulu untuk melapor.");
                else setMsg("Gagal kirim laporan.");
              }
            }}
            className="mt-2 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90"
          >
            Kirim
          </button>
          {msg ? <div className="mt-2 text-xs text-white/70">{msg}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

