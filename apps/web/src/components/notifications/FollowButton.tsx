"use client";

import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/http";

export function FollowButton(props: { kind: "anime" | "manga"; entityId: number }) {
  const [following, setFollowing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={async () => {
          setMsg(null);
          try {
            const res = await apiFetch<{ following: boolean }>("/notifications/follow", {
              method: "POST",
              body: JSON.stringify({ kind: props.kind, entity_id: props.entityId }),
            });
            setFollowing(res.following);
          } catch (e) {
            if (e instanceof ApiError && e.status === 401) setMsg("Login dulu untuk follow.");
            else setMsg("Gagal update follow.");
          }
        }}
        className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
      >
        {following ? "Following" : "Follow Update"}
      </button>
      {msg ? <div className="mt-1 text-[11px] text-white/60">{msg}</div> : null}
    </div>
  );
}

