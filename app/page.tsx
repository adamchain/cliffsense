import type { Metadata } from "next";
import { MarketingDocument } from "@/components/landing/marketing-document";

export const metadata: Metadata = {
  title: "Bene-Watch — Protecting PA Benefits",
  description:
    "Bene-Watch is a Pennsylvania-first benefit-continuity system for households, caregivers and the organizations that support them.",
};

export default function HomePage() {
  return <MarketingDocument page="home" />;
}
