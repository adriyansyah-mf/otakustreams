import type { Metadata } from "next";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Kebijakan privasi Otakunesia.",
};

export default function PrivacyPage() {
  return (
    <Shell>
      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <h1 className="text-2xl font-black text-white">Privacy Policy</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Privacy Policy ini menjelaskan bagaimana Otakunesia mengelola data pengguna. Kami menyimpan
          data minimum untuk fitur akun: email, password hash, bookmark, dan history baca/tonton.
          Kami tidak menjual data pengguna.
        </p>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Saat kamu menggunakan layanan kami untuk nonton anime sub indo, baca manga, atau baca komik
          online, beberapa data teknis dapat tercatat secara otomatis untuk menjaga stabilitas layanan.
          Data teknis ini dapat mencakup alamat IP, jenis browser, sistem operasi, halaman yang
          diakses, serta waktu akses. Data tersebut kami gunakan untuk analitik operasional,
          pemantauan performa, pencegahan penyalahgunaan, dan investigasi gangguan sistem.
        </p>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Untuk data akun, kami menerapkan prinsip minimisasi data. Kami hanya meminta informasi yang
          benar-benar dibutuhkan untuk autentikasi dan fitur personalisasi. Password tidak disimpan
          dalam bentuk teks biasa, melainkan dalam bentuk hash. Riwayat interaksi seperti bookmark,
          progress, dan notifikasi dipakai agar pengalaman penggunaan lebih relevan, misalnya untuk
          menampilkan konten yang terakhir dibuka atau update chapter/episode terbaru dari konten yang
          kamu ikuti.
        </p>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Kami dapat bekerja sama dengan penyedia infrastruktur pihak ketiga seperti penyedia server,
          database, atau monitoring. Pihak ketiga tersebut hanya memproses data sesuai kebutuhan
          teknis layanan dan tidak boleh menggunakan data untuk kepentingan lain. Selain itu, sebagian
          konten media pada platform ini berasal dari sumber publik atau pihak ketiga, sehingga
          kebijakan privasi pada sumber tersebut dapat berlaku saat kamu membuka link eksternal.
        </p>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Kamu memiliki hak untuk meminta akses, pembaruan, atau penghapusan data akun selama tidak
          bertentangan dengan kewajiban hukum yang berlaku. Permintaan dapat dikirimkan melalui kontak
          admin dan akan kami proses dalam waktu yang wajar. Kebijakan ini dapat diperbarui sewaktu-
          waktu untuk menyesuaikan perubahan fitur, regulasi, atau praktik keamanan. Dengan tetap
          menggunakan layanan Otakunesia, kamu dianggap memahami kebijakan privasi terbaru.
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

