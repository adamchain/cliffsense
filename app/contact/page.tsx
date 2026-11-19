import type { Metadata } from "next";
import { MarketingDocument } from "@/components/landing/marketing-document";

export const metadata: Metadata = {
  title: "Contact — Bene-Watch",
  description: "Contact the Bene-Watch team about demos, the pilot or partnerships.",
};

export default function ContactPage() {
  return <MarketingDocument page="contact" />;
}
