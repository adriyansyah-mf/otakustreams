"use client";

import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import { PlayerModal } from "@/components/PlayerModal";
import { AdSlot } from "@/components/ads/AdSlot";
import { cx } from "@/components/ui";
import { apiFetch } from "@/lib/http";

type Episode = {
  id: number;
  episode_number: number;
  title: string | null;
  source_url: string;
  video_links:
    | Array<{
        provider?: string | null;
        quality?: string | null;
        url: string;
        is_embed?: boolean | null;
      }>
    | null;
};

export function AnimeDetailClient(props: { animeTitle: string; episodes: Episode[] }) {
  const [open, setOpen] = useState(false);
  const [playUrl, setPlayUrl] = useState<string>("");
  const [playIsEmbed, setPlayIsEmbed] = useState<boolean>(true);
  const [playTitle, setPlayTitle] = useState<string>("");
  const [currentEpisodeId, setCurrentEpisodeId] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [progressByEpisodeId, setProgressByEpisodeId] = useState<Record<number, number>>({});

  const episodes = useMemo(() => {
    // API returns desc, we want asc for UX
    return [...props.episodes].sort((a, b) => a.episode_number - b.episode_number);
  }, [props.episodes]);

  useEffect(() => {
    if (!open || !currentEpisodeId) return;
    const t = window.setInterval(() => {
      setElapsed((v) => v + 10);
      apiFetch(`/history/progress?episode_id=${currentEpisodeId}&last_second=${elapsed + 10}`, {
        method: "POST",
      }).catch(() => {});
    }, 10000);
    return () => window.clearInterval(t);
  }, [open, currentEpisodeId, elapsed]);

  useEffect(() => {
    apiFetch<Array<{ episode_id: number; last_second: number }>>("/history/progress")
      .then((rows) => {
        const map: Record<number, number> = {};
        for (const r of rows) map[r.episode_id] = r.last_second;
        setProgressByEpisodeId(map);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mt-3">
      <div className="mb-4">
        <AdSlot placement="player_top" />
      </div>
      <PlayerModal
        open={open}
        title={playTitle}
        url={playUrl}
        isEmbed={playIsEmbed}
        onClose={() => setOpen(false)}
      />

      <div className="max-h-[420px] overflow-auto rounded-xl border border-white/10">
        {episodes.length === 0 ? (
          <div className="p-4 text-sm text-white/60">Belum ada episode.</div>
        ) : null}

        <ul className="divide-y divide-white/10">
          {episodes.map((e) => {
            const links = e.video_links ?? [];
            const chosen = links.find((l) => l?.is_embed) ?? links[0];
            const chosenUrl = chosen?.url ?? e.source_url;
            const chosenIsEmbed = chosen?.is_embed ?? true;
            return (
              <li key={e.id} className="flex items-center gap-3 p-3">
                <div className="w-16 shrink-0 text-xs font-semibold text-white/70">
                  EP {e.episode_number}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-white">
                    {e.title ?? `${props.animeTitle} Episode ${e.episode_number}`}
                  </div>
                  <div className="truncate text-xs text-white/50">{e.source_url}</div>
                  {progressByEpisodeId[e.id] ? (
                    <div className="mt-1 text-[11px] text-white/50">
                      Resume: {Math.floor(progressByEpisodeId[e.id] / 60)}m {progressByEpisodeId[e.id] % 60}s
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={() => {
                    setPlayUrl(chosenUrl);
                    setPlayIsEmbed(chosenIsEmbed);
                    setPlayTitle(`EP ${e.episode_number} · ${props.animeTitle}`);
                    setCurrentEpisodeId(e.id);
                    setElapsed(0);
                    setOpen(true);
                    apiFetch(`/history/watch?episode_id=${e.id}`, { method: "POST" }).catch(() => {});
                  }}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-full bg-white/10",
                    "px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  )}
                >
                  <Play className="h-4 w-4" />
                  Play
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

