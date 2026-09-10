import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPublicPath } from "@/lib/auth/public-path";
import { onboardingPathForStep } from "@/lib/onboarding/steps";

function continueIntoApp(onboardingStep: string, req: NextRequest) {
  if (onboardingStep && onboardingStep !== "complete") {
    return NextResponse.redirect(new URL(onboardingPathForStep(onboardingStep), req.url));
  }
  return NextResponse.redirect(new URL("/dashboard", req.url));
}

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
  const applicationStatus = (token?.applicationStatus as string | undefined) ?? "approved";

  // Application review gate. Applicants acting for someone else are parked on
  // /application (relationship form + document upload + live status) until an
  // admin approves. Allow the application page, its APIs, auth, and the public
  // status link; redirect everything else — including the dashboard and
  // onboarding — to /application.
  if (isLoggedIn && (applicationStatus === "pending_review" || applicationStatus === "rejected")) {
    const allowed =
      pathname === "/" ||
      pathname.startsWith("/about") ||
      pathname.startsWith("/resources") ||
      pathname.startsWith("/legal") ||
      pathname.startsWith("/application") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/status") ||
      pathname.startsWith("/apply");
    if (!allowed) {
      return NextResponse.redirect(new URL("/application", req.url));
    }
    return NextResponse.next();
  }

  // Route handlers enforce their own auth and return JSON 401s. Still gate
  // /api/admin here so a missing cookie cannot probe that surface.
  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/admin")) {
      const isAdmin = token?.isAdmin === true && !token?.impersonatorId;
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    if (isLoggedIn && (pathname === "/" || pathname.startsWith("/auth"))) {
      return continueIntoApp(onboardingStep, req);
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
  if (pathname.startsWith("/admin")) {
    const isAdmin = token?.isAdmin === true && !token?.impersonatorId;
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (
    onboardingStep &&
    onboardingStep !== "complete" &&
    !pathname.startsWith("/onboarding")
  ) {
    return NextResponse.redirect(new URL(onboardingPathForStep(onboardingStep), req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
