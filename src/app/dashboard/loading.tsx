export default function Loading() {
    return (
      <main className="min-h-screen bg-black p-6 text-white md:p-10">
        <div className="mx-auto max-w-6xl animate-pulse motion-reduce:animate-none">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="h-10 w-52 rounded-xl bg-neutral-800" />
  
              <div className="mt-3 h-5 w-40 rounded-xl bg-neutral-800" />
            </div>
  
            <div className="h-12 w-40 rounded-xl bg-neutral-800" />
          </div>
  
          {/* Stats */}
          <div className="mb-10 grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-gray-800 bg-neutral-900 p-6"
              >
                <div className="h-4 w-24 rounded bg-neutral-800" />
  
                <div className="mt-4 h-10 w-16 rounded bg-neutral-800" />
              </div>
            ))}
          </div>
  
          {/* Search */}
          <div className="mb-8 h-14 rounded-2xl bg-neutral-900" />
  
          {/* Product Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-gray-800 bg-neutral-900 p-6"
              >
                <div className="mb-4 h-40 rounded-xl bg-neutral-800" />
  
                <div className="h-7 w-40 rounded bg-neutral-800" />
  
                <div className="mt-3 h-4 w-28 rounded bg-neutral-800" />
  
                <div className="mt-5 h-6 w-32 rounded-full bg-neutral-800" />
  
                <div className="mt-6 space-y-3">
                  <div className="h-4 w-full rounded bg-neutral-800" />
  
                  <div className="h-4 w-4/5 rounded bg-neutral-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }