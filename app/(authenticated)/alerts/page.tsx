import { redirect } from "next/navigation";

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ alert?: string }>;
}) {
  const { alert } = await searchParams;
  redirect(alert ? `/limits/alerts?alert=${encodeURIComponent(alert)}` : "/limits/alerts");
}
