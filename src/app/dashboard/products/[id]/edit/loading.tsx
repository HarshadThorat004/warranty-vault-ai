export default function EditLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <div className="mb-6 h-4 w-48 animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
      <div className="rounded-[32px] border border-white/10 bg-neutral-950 p-6 md:p-10">
        <div className="mb-8 space-y-3">
          <div className="h-6 w-32 animate-pulse rounded-full bg-white/10 motion-reduce:animate-none" />
          <div className="h-10 w-64 animate-pulse rounded bg-white/10 motion-reduce:animate-none" />
          <div className="h-4 w-80 animate-pulse rounded bg-white/5 motion-reduce:animate-none" />
        </div>
        <div className="space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl bg-white/5 motion-reduce:animate-none"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
