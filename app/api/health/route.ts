import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongodb";

/**
 * Liveness for load balancers and ops. Unauthenticated — keep minimal (no PII).
 */
export async function GET() {
  try {
    await connectDB();
    const mongo = mongoose.connection.readyState === 1;
    return NextResponse.json({
      ok: mongo,
      mongo,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ ok: false, mongo: false, timestamp: new Date().toISOString() }, { status: 503 });
  }
}
