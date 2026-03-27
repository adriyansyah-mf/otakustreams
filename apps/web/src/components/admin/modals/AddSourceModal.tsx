"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/http";
import { cx } from "@/components/ui";
import { getPresetConfig, PresetId, SourceKind } from "@/lib/crawlerPresets";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const PRESETS: { id: PresetId; label: string }[] = [
  { id: "blank", label: "Blank (flexible)" },
  { id: "otakudesu_like", label: "Otakudesu-like" },
  { id: "komiku_like", label: "Komiku-like" },
];

export function AddSourceModal({ open, onClose, onCreated }: Props) {
  const [kind, setKind] = useState<SourceKind>("anime");
  const [preset, setPreset] = useState<PresetId>("blank");
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [listUrl, setListUrl] = useState("");
  const [interval, setInterval] = useState(1440);
  const [enabled, setEnabled] = useState(true);
  const [advancedConfigOpen, setAdvancedConfigOpen] = useState(false);
  const [configJson, setConfigJson] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetValue = useMemo(() => getPresetConfig(kind, preset), [kind, preset]);

  useEffect(() => {
    if (advancedConfigOpen) setConfigJson(presetValue.config_json);
  }, [advancedConfigOpen, presetValue]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">Add Source</div>
            <div className="mt-1 text-xs text-white/60">
              Buat source baru, pilih preset, lalu kamu bisa refine config selectors.
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
          >
            Close
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label className="block">
            <div className="text-xs font-semibold text-white/70">Kind</div>
            <select
              className="mt-1 w-full rounded border border-white/10 bg-bg px-2 py-2 text-xs text-white outline-none focus:border-white/25"
              value={kind}
              onChange={(e) => setKind(e.target.value as SourceKind)}
            >
              <option value="anime">anime</option>
              <option value="manga">manga</option>
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-white/70">Preset</div>
            <div className="mt-1 flex gap-2">
              <select
                className="w-full rounded border border-white/10 bg-bg px-2 py-2 text-xs text-white outline-none focus:border-white/25"
                value={preset}
                onChange={(e) => setPreset(e.target.value as PresetId)}
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block md:col-span-2">
            <div className="text-xs font-semibold text-white/70">Name</div>
            <input
              className="mt-1 w-full rounded border border-white/10 bg-bg px-2 py-2 text-xs text-white outline-none focus:border-white/25"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Otakudesu (custom)"
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-white/70">Base URL</div>
            <input
              type="url"
              className="mt-1 w-full rounded border border-white/10 bg-bg px-2 py-2 text-xs text-white outline-none focus:border-white/25"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-white/70">List URL</div>
            <input
              type="url"
              className="mt-1 w-full rounded border border-white/10 bg-bg px-2 py-2 text-xs text-white outline-none focus:border-white/25"
              value={listUrl}
              onChange={(e) => setListUrl(e.target.value)}
              placeholder="https://example.com/anime-list/"
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold text-white/70">Interval (minutes)</div>
            <input
              type="number"
              min={5}
              className="mt-1 w-full rounded border border-white/10 bg-bg px-2 py-2 text-xs text-white outline-none focus:border-white/25"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value || "0", 10))}
            />
          </label>

          <label className="flex items-center gap-2 pt-6 text-xs text-white/80">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            Enabled
          </label>

          <div className="flex items-center gap-2 md:col-span-2 pt-6">
            <input
              id="advancedConfig"
              type="checkbox"
              checked={advancedConfigOpen}
              onChange={(e) => setAdvancedConfigOpen(e.target.checked)}
            />
            <label htmlFor="advancedConfig" className="text-xs text-white/80">
              Advanced config (JSON, untuk yang ngerti selector)
            </label>
          </div>

          {advancedConfigOpen ? (
            <label className="block md:col-span-2">
              <div className="text-xs font-semibold text-white/70">config_json</div>
              <div className="mt-1 text-[11px] text-white/50">
                Template ini otomatis mengikuti preset pilihan kamu.
              </div>
              <textarea
                className="mt-2 h-44 w-full rounded border border-white/10 bg-bg px-2 py-2 font-mono text-[11px] text-white outline-none focus:border-white/25"
                value={configJson || presetValue.config_json}
                onChange={(e) => setConfigJson(e.target.value)}
              />
            </label>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-white/50">
            Will set: <span className="font-mono">{presetValue.source_type}</span> via{" "}
            <span className="font-mono">config_json.source_type</span>
          </div>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const finalConfig = (configJson || presetValue.config_json).trim() || "{}";
                await apiFetch("/admin/sources", {
                  method: "POST",
                  body: JSON.stringify({
                    kind,
                    name,
                    base_url: baseUrl,
                    list_url: listUrl,
                    is_enabled: enabled,
                    crawl_interval_minutes: interval,
                    config_json: (advancedConfigOpen ? finalConfig : presetValue.config_json).trim() || "{}",
                  }),
                });
                onCreated();
                onClose();
              } catch (e: any) {
                setError(e?.body?.detail ? String(e.body.detail) : "Gagal create source.");
              } finally {
                setBusy(false);
              }
            }}
            className={cx(
              "rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand/90",
              busy ? "opacity-60" : ""
            )}
          >
            Create Source
          </button>
        </div>
      </div>
    </div>
  );
}

