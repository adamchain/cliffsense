import type { Metadata } from "next";
import { GuidesDocs } from "@/components/guides/guides-docs";

export const metadata: Metadata = {
  title: "Guides · Bene-Watch",
  description:
    "How Bene-Watch tracks renewals, interim reports, reportable changes, reviews, and proof — and how to set up the household record.",
};

export default function GuidesPage() {
  return <GuidesDocs />;
}
