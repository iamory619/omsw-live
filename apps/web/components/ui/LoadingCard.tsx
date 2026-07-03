export function LoadingCard() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-zinc-950 p-8">
      <div className="h-4 w-32 animate-pulse rounded-full bg-zinc-800" />
      <div className="mt-4 h-8 w-72 animate-pulse rounded-full bg-zinc-800" />
      <div className="mt-3 h-4 w-full max-w-md animate-pulse rounded-full bg-zinc-800" />
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-900" />
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-900" />
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-900" />
      </div>
    </div>
  );
}