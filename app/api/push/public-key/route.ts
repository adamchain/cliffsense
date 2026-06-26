import { NextResponse } from "next/server";
import { pushConfigured } from "@/lib/push/web-push";

/** Exposes the VAPID public key so the client can subscribe. Public by design. */
export async function GET() {
  if (!pushConfigured()) {
    return NextResponse.json({ enabled: false, publicKey: null });
  }
  return NextResponse.json({
    enabled: true,
    publicKey: process.env.VAPID_PUBLIC_KEY!.trim(),
  });
}
