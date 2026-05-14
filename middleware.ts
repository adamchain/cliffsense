import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { onboardingPathForStep } from "@/lib/onboarding/steps";

const publicPrefixes = ["/", "/auth", "/resources"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/plaid/webhook")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const onboardingStep = (token?.onboardingStep as string | undefined) ?? "none";

  if (pathname === "/" || publicPrefixes.some((p) => p !== "/" && pathname.startsWith(p))) {
    if (pathname.startsWith("/auth") && isLoggedIn) {
      if (onboardingStep && onboardingStep !== "complete") {
        return NextResponse.redirect(new URL(onboardingPathForStep(onboardingStep), req.url));
      }
      if (onboardingStep === "complete") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    if (pathname === "/" && isLoggedIn && onboardingStep !== "complete") {
      return NextResponse.redirect(new URL(onboardingPathForStep(onboardingStep), req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const signIn = new URL("/auth/signin", req.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
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
