import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f7f8]">

      {/* 🎵 subtle background music symbols */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-20 text-black/[0.05] text-[320px] select-none">
          ♪
        </div>
        <div className="absolute -bottom-28 -left-16 text-black/[0.04] text-[360px] rotate-[-8deg] select-none">
          ♫
        </div>
      </div>

      {/* foreground content */}
      <main className="relative z-10 min-h-screen px-6 py-16">
        <div className="mx-auto flex max-w-5xl items-center justify-center">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-200/70 bg-white/70 p-10 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] backdrop-blur">
            
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs text-zinc-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Dance-Mix timing trainer
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">
              Count Coach
            </h1>

            <p className="mt-3 text-base leading-relaxed text-zinc-600">
              <span className="font-semibold text-zinc-800">Definition:</span>{" "}
              A practice tool that lets you isolate a specific segment of a mix,
              ,and train your internal count with a metronome.
            </p>

            <p className="mt-3 text-base leading-relaxed text-zinc-600">
              Upload a mix, highlight the exact section you want (like{" "}
              <span className="font-medium text-zinc-800">0:30 → 2:30</span>),
              loop it, detect tempo, and sharpen timing.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/train"
                className="group inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
              >
                Start training
                <span className="ml-2 transition group-hover:translate-x-0.5">→</span>
              </Link>

              <div className="text-xs text-zinc-500">
                Tip: choose a clean 8–16 count segment for best BPM stability.
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <MiniCard title="Range anchors" desc="Train only the part that matters." />
              <MiniCard title="Auto BPM" desc="Detect tempo from the selected segment." />
              <MiniCard title="Metronome" desc="Creates a metronome, so that you can overlay the mix w/ a metronome" />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-2xl text-center text-xs text-zinc-400">
          Built for mixes with section-by-section tempo changes. Such as those seen in DDN (Desi Dance Network)
        </div>
      </main>
    </div>
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
