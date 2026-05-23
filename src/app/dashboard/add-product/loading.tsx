export default function Loading() {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <div className="mx-auto max-w-2xl animate-pulse rounded-2xl border border-gray-800 bg-neutral-900 p-10">
          <div className="mb-8 h-10 w-52 rounded bg-neutral-800" />
  
          <div className="space-y-5">
            {[1, 2, 3, 4].map((item) => (
              <div key={item}>
                <div className="mb-2 h-4 w-32 rounded bg-neutral-800" />
  
                <div className="h-12 rounded-xl bg-neutral-800" />
              </div>
            ))}
  
            <div className="h-12 rounded-xl bg-neutral-800" />
          </div>
        </div>
      </main>
    );
  }