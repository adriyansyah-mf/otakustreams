import type { Metadata } from "next";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Terms",
  description: "Syarat & ketentuan penggunaan OtakuStream.",
};

export default function TermsPage() {
  return (
    <Shell>
      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <h1 className="text-2xl font-black text-white">Terms</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          OtakuStream adalah katalog dan viewer yang menampilkan konten dari source publik. Kami tidak
          meng-host video atau gambar di server ini (kecuali aset UI).
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/70">
          <li>Gunakan layanan ini sesuai hukum yang berlaku.</li>
          <li>Link embed/external berasal dari pihak ketiga; kualitas/ketersediaan bisa berubah.</li>
          <li>Kami dapat menghapus konten/URL dari katalog jika ada permintaan yang valid.</li>
        </ul>
      </div>
    </Shell>
  );
}

