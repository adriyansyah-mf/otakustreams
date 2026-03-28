export function PageLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-8 py-16">
      <div className="relative h-16 w-16">
        <div
          className="absolute inset-0 rounded-full border-2 border-white/10"
          aria-hidden
        />
        <div
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand border-r-brand/40"
          aria-hidden
        />
        <span className="sr-only">Memuat halaman</span>
      </div>
      <div className="flex w-full max-w-md flex-col gap-3 px-4">
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-full animate-pulse rounded-full bg-white/[0.07]" />
        <div className="h-3 w-5/6 animate-pulse rounded-full bg-white/[0.07]" />
      </div>
      <p className="text-sm text-white/50">Memuat konten…</p>
    </div>
  );
}
