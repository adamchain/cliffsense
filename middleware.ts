import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { onboardingPathForStep } from "@/lib/onboarding/steps";

const publicPrefixes = ["/", "/landing", "/auth", "/resources", "/invite"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/plaid/webhook") ||
    pathname.startsWith("/api/cron")
  ) {
    // These endpoints authenticate themselves (NextAuth, Plaid JWT, CRON_SECRET).
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    // Behind Railway's TLS proxy, Auth.js sets the `__Secure-`-prefixed cookie
    // because NEXTAUTH_URL is https. getToken doesn't auto-detect this, so we
    // must tell it to look for the secure cookie name (and matching salt).
    secureCookie: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
  });

  const isLoggedIn = !!token;
  const onboardingStep = (token?.onboardingStep as string | undefined) ?? "none";

  if (pathname === "/") {
    if (!isLoggedIn) {
      // Show the marketing landing page at the root URL without changing the
      // address bar. Logged-in users fall through to onboarding/dashboard below.
      return NextResponse.rewrite(new URL("/landing", req.url));
    }
    if (onboardingStep !== "complete") {
      return NextResponse.redirect(new URL(onboardingPathForStep(onboardingStep), req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (publicPrefixes.some((p) => pathname.startsWith(p))) {
    if (pathname.startsWith("/auth") && isLoggedIn) {
      if (onboardingStep && onboardingStep !== "complete") {
        return NextResponse.redirect(new URL(onboardingPathForStep(onboardingStep), req.url));
      }
      if (onboardingStep === "complete") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const signIn = new URL("/auth/signin", req.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  // Admin surface: defense-in-depth on top of the per-page/route checks. Only a
  // real admin who is NOT currently impersonating may reach it — during
  // impersonation the token carries the target's (non-admin) isAdmin plus an
  // impersonatorId, so both conditions must hold.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const isAdmin = token?.isAdmin === true && !token?.impersonatorId;
    if (!isAdmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (
    onboardingStep &&
    onboardingStep !== "complete" &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/api/")
  ) {
    return NextResponse.redirect(new URL(onboardingPathForStep(onboardingStep), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
