"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/http";

type Ad = {
  id: number;
  placement: string;
  html: string;
  is_enabled: boolean;
  sort_order: number;
};

const placements = ["home_top", "player_top", "manga_top"];

export function AdminAdsPanel() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draftPlacement, setDraftPlacement] = useState<string>("home_top");
  const [draftHtml, setDraftHtml] = useState<string>("");
  const [draftEnabled, setDraftEnabled] = useState<boolean>(true);

  async function load() {
    setError(null);
    try {
      const res = await apiFetch<Ad[]>("/admin/ads");
      setAds(res);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setError("Kamu belum login admin.");
      else setError("Gagal memuat ads.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!draftHtml.trim()) return;
    setBusy(true);
    try {
      await apiFetch("/admin/ads", {
        method: "POST",
        body: JSON.stringify({
          placement: draftPlacement,
          html: draftHtml,
          is_enabled: draftEnabled,
          sort_order: 0,
        }),
      });
      setDraftHtml("");
      await load();
    } catch {
      setError("Gagal menambah ads.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAd(ad: Ad) {
    setBusy(true);
    try {
      await apiFetch(`/admin/ads/${ad.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          placement: ad.placement,
          html: ad.html,
          is_enabled: ad.is_enabled,
          sort_order: ad.sort_order,
        }),
      });
      await load();
    } catch {
      setError("Gagal menyimpan ads.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(adId: number) {
    setBusy(true);
    try {
      await apiFetch(`/admin/ads/${adId}`, { method: "DELETE" });
      await load();
    } catch {
      setError("Gagal menghapus ads.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? <div className="text-sm text-red-300">{error}</div> : null}

      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <h2 className="text-sm font-semibold text-white">Tambah Ads</h2>
        <div className="mt-4 space-y-4">
          <label className="block">
            <div className="text-xs font-semibold text-white/70">Placement</div>
            <select
              value={draftPlacement}
              onChange={(e) => setDraftPlacement(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg px-4 py-2 text-sm text-white outline-none focus:border-white/25"
            >
              {placements.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-white/70">HTML snippet</div>
            <textarea
              value={draftHtml}
              onChange={(e) => setDraftHtml(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg px-4 py-2 text-sm text-white outline-none focus:border-white/25"
              rows={5}
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={draftEnabled}
              onChange={(e) => setDraftEnabled(e.target.checked)}
            />
            <span className="text-sm text-white/80">Enabled</span>
          </label>

          <button
            disabled={busy}
            onClick={create}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
          >
            {busy ? "Menyimpan..." : "Tambah"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <h2 className="text-sm font-semibold text-white">Ads List</h2>
        <div className="mt-4 space-y-4">
          {ads.length === 0 ? (
            <div className="text-sm text-white/60">Belum ada ads.</div>
          ) : null}

          {ads.map((ad) => (
            <div key={ad.id} className="rounded-xl border border-white/10 bg-bg p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">{ad.placement}</div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={ad.is_enabled}
                      onChange={(e) =>
                        setAds((prev) =>
                          prev.map((x) =>
                            x.id === ad.id ? { ...x, is_enabled: e.target.checked } : x
                          )
                        )
                      }
                      disabled={busy}
                    />
                    Enabled
                  </label>
                  <button
                    disabled={busy}
                    onClick={() => saveAd(ad)}
                    className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => remove(ad.id)}
                    className="rounded-full border border-white/15 bg-transparent px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/5 disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <textarea
                value={ad.html}
                onChange={(e) =>
                  setAds((prev) => prev.map((x) => (x.id === ad.id ? { ...x, html: e.target.value } : x)))
                }
                className="mt-3 w-full rounded-xl border border-white/10 bg-bg px-4 py-2 text-sm text-white outline-none focus:border-white/25"
                rows={4}
              />
              <div className="mt-2 text-xs text-white/50">sort_order: {ad.sort_order}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

