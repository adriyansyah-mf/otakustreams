"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/http";
import { setTokens } from "@/lib/auth";

export function AuthForm(props: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{
        access_token: string;
        refresh_token: string;
      }>(`/auth/${props.mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setTokens({ accessToken: res.access_token, refreshToken: res.refresh_token });
      router.push("/");
      router.refresh();
    } catch (err) {
      setError("Gagal autentikasi. Cek email/password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <div className="text-xs font-semibold text-white/70">Email</div>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          className="mt-2 w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-sm text-white outline-none focus:border-white/25"
        />
      </label>

      <label className="block">
        <div className="text-xs font-semibold text-white/70">Password</div>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          minLength={8}
          className="mt-2 w-full rounded-xl border border-white/10 bg-bg px-4 py-3 text-sm text-white outline-none focus:border-white/25"
        />
      </label>

      {error ? <div className="text-xs text-red-300">{error}</div> : null}

      <button
        disabled={loading}
        className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-60"
      >
        {loading ? "Memproses..." : props.mode === "login" ? "Login" : "Register"}
      </button>
    </form>
  );
}

