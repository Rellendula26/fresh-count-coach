import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-xl space-y-4 rounded-xl border bg-white p-6">
        <h1 className="text-3xl font-semibold">Count Coach</h1>
        <p className="text-slate-600">
          Upload a mix, anchor a range (0:30 → 2:30), loop it, and train your timing.
        </p>
        <Link
          className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-white"
          href="/train"
        >
          Start training
        </Link>
      </div>
    </main>
  );
}
