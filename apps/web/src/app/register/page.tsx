import Link from "next/link";
import { Shell } from "@/components/Shell";
import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-panel p-6">
        <h1 className="text-xl font-black text-white">Register</h1>
        <p className="mt-2 text-sm text-white/60">
          Buat akun untuk bookmark dan histori.
        </p>
        <div className="mt-6">
          <AuthForm mode="register" />
        </div>
        <div className="mt-4 text-xs text-white/60">
          Sudah punya akun?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </div>
    </Shell>
  );
}

