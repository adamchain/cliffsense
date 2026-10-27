import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isPublicPath } from "@/lib/auth/public-path";
import { onboardingPathForStep } from "@/lib/onboarding/steps";
import { isBeneWatchAdminEmail } from "@/lib/admin/staff-email";
import {
  ADMIN_COOKIE_NAME,
  adminCookieSecure,
  adminSessionSecret,
  readAdminSession,
} from "@/lib/admin/session-token";

function continueIntoApp(onboardingStep: string, req: NextRequest) {
  if (onboardingStep && onboardingStep !== "complete") {
    return NextResponse.redirect(new URL(onboardingPathForStep(onboardingStep), req.url));
  }
  return NextResponse.redirect(new URL("/dashboard", req.url));
}

/**
 * Admin is its own app. The main-app session never grants access, and a missing
 * admin cookie never falls through into the product sign-in or dashboard.
 */
async function handleAdmin(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const open =
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/auth/");
  if (open) return NextResponse.next();

  const secret = adminSessionSecret();
  const claims = secret
    ? await readAdminSession(req.cookies.get(ADMIN_COOKIE_NAME)?.value, secret)
    : null;
  const allowed = Boolean(claims && isBeneWatchAdminEmail(claims.email));
  if (allowed) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const login = new URL("/admin/login", req.url);
  const res = NextResponse.redirect(login);
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: adminCookieSecure(),
    maxAge: 0,
  });
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return handleAdmin(req);
  }
  if (pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/plaid/webhook")
  ) {
    // These endpoints authenticate themselves (NextAuth, Plaid JWT).
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
      pathname.startsWith("/guides") ||
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

  // Route handlers enforce their own auth and return JSON 401s.
  if (pathname.startsWith("/api/")) {
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
    signIn.searchParams.set("callbackUrl", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(signIn);
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
