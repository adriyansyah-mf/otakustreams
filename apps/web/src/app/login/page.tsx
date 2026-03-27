import Link from "next/link";
import { Shell } from "@/components/Shell";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-panel p-6">
        <h1 className="text-xl font-black text-white">Login</h1>
        <p className="mt-2 text-sm text-white/60">
          Masuk untuk bookmark dan histori.
        </p>
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
        <div className="mt-4 text-xs text-white/60">
          Belum punya akun?{" "}
          <Link href="/register" className="underline">
            Register
          </Link>
        </div>
      </div>
    </Shell>
  );
}

