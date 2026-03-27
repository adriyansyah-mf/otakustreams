import type { Metadata } from "next";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Kebijakan privasi Otakunesia.",
};

export default function PrivacyPage() {
  return (
    <Shell>
      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <h1 className="text-2xl font-black text-white">Privacy</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Kami menyimpan data minimum untuk fitur akun: email, password hash, bookmark, dan history baca/tonton.
          Kami tidak menjual data pengguna.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/70">
          <li>Cookie/localStorage dipakai untuk menyimpan token login di browser.</li>
          <li>Log sistem dapat menyimpan IP untuk keamanan/monitoring.</li>
          <li>Kamu bisa minta penghapusan data dengan menghubungi admin.</li>
        </ul>
      </div>
    </Shell>
  );
}

