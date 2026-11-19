import type { Metadata } from "next";
import { MarketingDocument } from "@/components/landing/marketing-document";

export const metadata: Metadata = {
  title: "Strategic Partners — Bene-Watch",
  description:
    "Partner with Bene-Watch to help families keep their benefits, in Pennsylvania and nationwide.",
};

export default function PartnersPage() {
  return <MarketingDocument page="partners" />;
}
