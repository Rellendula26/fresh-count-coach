import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-50 to-white">
      {/* Subtle music notes background (defined in globals.css) */}
      <div className="notes-bg" />

      {/* Soft decorative blobs */}
      <div className="pointer-events-none absolute -top-24 left-[-120px] h-[420px] w-[420px] rounded-full bg-zinc-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-[-120px] h-[520px] w-[520px] rounded-full bg-blue-200/30 blur-3xl" />

      {/* Foreground content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
        <div className="w-full">
          <div className="mx-auto max-w-2xl rounded-3xl border border-zinc-200/70 bg-white/70 p-10 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] backdrop-blur">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs text-zinc-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Dance-mix timing trainer
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
              Count Coach
            </h1>

            <p className="mt-3 text-base leading-relaxed text-zinc-600">
              Upload a mix, highlight the exact section you want (like{" "}
              <span className="font-medium text-zinc-800">0:30 → 2:30</span>),
              loop it, detect tempo, and train your internal count with tapping
              and a metronome.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/train"
                className="group inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
              >
                Start training
                <span className="ml-2 transition group-hover:translate-x-0.5">
                  →
                </span>
              </Link>

              <div className="text-xs text-zinc-500">
                Tip: pick a clean 8–16 count section for best BPM detection.
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <MiniCard
                title="Range anchors"
                desc="Train only the part of the mix that matters."
              />
              <MiniCard
                title="Auto BPM"
                desc="Detect tempo directly from the selected segment."
              />
              <MiniCard
                title="Tap feedback"
                desc="Lock “1”, tap Space, and see timing stats."
              />
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-2xl text-center text-xs text-zinc-400">
            Built for dance mixes with section-by-section tempo changes.
          </div>
        </div>
      </div>
    </main>
  );
}

function MiniCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white/60 p-4">
      <div className="text-sm font-semibold text-zinc-900">{title}</div>
      <div className="mt-1 text-sm text-zinc-600">{desc}</div>
    </div>
  );
}
