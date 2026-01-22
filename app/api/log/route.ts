import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // basic validation (keeps it from blowing up)
    const payload = {
      event: body?.event ?? "unknown",
      bpm: typeof body?.bpm === "number" ? body.bpm : null,
      range: body?.range ?? null,
      createdAt: new Date().toISOString(),
    };

    // "backend stuff": server-side logging (shows up in Vercel logs)
    console.log("[CountCoach log]", payload);

    return NextResponse.json({ ok: true, received: payload });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
}
