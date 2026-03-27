import type { Metadata } from "next";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "DMCA",
  description: "Kebijakan takedown (DMCA) Otakunesia.",
};

export default function DmcaPage() {
  return (
    <Shell>
      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <h1 className="text-2xl font-black text-white">DMCA Takedown Policy</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          DMCA Takedown Policy ini mengatur proses penghapusan konten berdasarkan klaim hak cipta.
          Jika kamu pemegang hak cipta dan ingin meminta penghapusan link dari katalog, kirim detail berikut:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/70">
          <li>URL halaman di Otakunesia yang ingin ditakedown</li>
          <li>Bukti kepemilikan hak cipta (atau otorisasi)</li>
          <li>Kontak yang bisa dihubungi</li>
        </ul>
        <p className="mt-4 text-sm leading-6 text-white/70">
          Permintaan valid akan diproses secepatnya.
        </p>
      </div>
    </Shell>
  );
}

