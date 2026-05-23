export default function Loading() {
    return (
      <main className="min-h-screen bg-black p-4 text-white md:p-10">
        <div className="mx-auto max-w-5xl animate-pulse rounded-3xl border border-gray-800 bg-neutral-900 p-6 md:p-10">
          <div className="h-8 w-40 rounded bg-neutral-800" />
  
          <div className="mt-5 h-14 w-72 rounded bg-neutral-800" />
  
          <div className="mt-4 h-6 w-40 rounded bg-neutral-800" />
  
          <div className="mt-10 h-[400px] rounded-3xl bg-neutral-800" />
  
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="h-32 rounded-2xl bg-neutral-800" />
  
            <div className="h-32 rounded-2xl bg-neutral-800" />
          </div>
        </div>
      </main>
    );
  }