"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/http";

type SeoSettings = {
  site_title: string;
  site_description: string;
  og_image_url: string | null;
};

export function AdminSeoPanel() {
  const [data, setData] = useState<SeoSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setError(null);
    setSuccess(null);
    try {
      const res = await apiFetch<SeoSettings>("/seo/settings");
      setData(res);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setError("Unauthorized.");
      else setError("Gagal memuat SEO settings.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!data) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch<SeoSettings>("/admin/seo/settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setSuccess("SEO settings tersimpan.");
      await load();
    } catch (e) {
      setError("Gagal menyimpan SEO settings.");
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <div className="text-sm text-white/60">Memuat...</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <h2 className="text-sm font-semibold text-white">SEO Settings (Global)</h2>

        {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}
        {success ? <div className="mt-3 text-sm text-emerald-300">{success}</div> : null}

        <div className="mt-4 space-y-4">
          <label className="block">
            <div className="text-xs font-semibold text-white/70">Site title</div>
            <input
              value={data.site_title}
              onChange={(e) => setData({ ...data, site_title: e.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg px-4 py-2 text-sm text-white outline-none focus:border-white/25"
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-white/70">Site description</div>
            <textarea
              value={data.site_description}
              onChange={(e) => setData({ ...data, site_description: e.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg px-4 py-2 text-sm text-white outline-none focus:border-white/25"
              rows={4}
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-white/70">OG image URL</div>
            <input
              value={data.og_image_url ?? ""}
              onChange={(e) => setData({ ...data, og_image_url: e.target.value || null })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-bg px-4 py-2 text-sm text-white outline-none focus:border-white/25"
            />
          </label>

          <button
            disabled={busy}
            onClick={save}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
          >
            {busy ? "Menyimpan..." : "Save SEO"}
          </button>
        </div>
      </div>
    </div>
  );
}

