import type { Metadata } from "next";
import { MarketingDocument } from "@/components/landing/marketing-document";

export const metadata: Metadata = {
  title: "Testimonials — Bene-Watch",
  description: "Stories from the families, caregivers and partners shaping Bene-Watch.",
};

export default function TestimonialsPage() {
  return <MarketingDocument page="testimonials" />;
}
