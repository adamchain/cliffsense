import type { Metadata } from "next";
import { MarketingDocument } from "@/components/landing/marketing-document";

export const metadata: Metadata = {
  title: "Pilot Program — Bene-Watch",
  description: "A special limited invitation to help shape Bene-Watch in Pennsylvania.",
};

export default function PilotPage() {
  return <MarketingDocument page="pilot" />;
}
