import { NextResponse } from "next/server";

type Session = {
  createdAt: number;
  bpm: number;
  range: { start: number; end: number };
  stats?: {
    meanAbsMs: number;
    stdMs: number;
    driftMsPerMin: number;
  };
};

const sessions: Session[] = []; // NOTE: in-memory (resets on serverless)

export async function POST(req: Request) {
  const body = (await req.json()) as Session;

  if (!body?.bpm || !body?.range) {
    return NextResponse.json({ ok: false, error: "Missing bpm or range" }, { status: 400 });
  }

  sessions.unshift({ ...body, createdAt: Date.now() });
  sessions.splice(20); // keep last 20

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, sessions });
}
