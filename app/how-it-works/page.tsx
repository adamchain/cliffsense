import type { Metadata } from "next";
import { auth } from "@/auth";
import { MarketingDocument } from "@/components/landing/marketing-document";
import { RequireAppShell } from "@/components/layout/require-app-shell";
import { ProductHowItWorks } from "@/components/product/how-it-works-view";

const MARKETING_META: Metadata = {
  title: "How It Works — Bene-Watch",
  description:
    "How Bene-Watch helps you understand what could put your benefits at risk, and what to do next.",
};

const PRODUCT_META: Metadata = {
  title: "How it works · Bene-Watch",
  description:
    "Bene-Watch tracks renewals, interim reports, reportable changes, disability and eligibility reviews, and requests for proof as separate obligations.",
};

async function showProduct() {
  const session = await auth();
  const user = session?.user;
  if (!user) return false;
  if (user.applicationStatus === "pending_review" || user.applicationStatus === "rejected") {
    return false;
  }
  return user.onboardingStep === "complete";
}

export async function generateMetadata(): Promise<Metadata> {
  return (await showProduct()) ? PRODUCT_META : MARKETING_META;
}

export default async function HowItWorksPage() {
  if (await showProduct()) {
    return (
      <RequireAppShell>
        <ProductHowItWorks />
      </RequireAppShell>
    );
  }
  return <MarketingDocument page="how-it-works" />;
}
