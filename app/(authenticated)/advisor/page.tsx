import { AdvisorChat } from "./advisor-chat";

export default async function AdvisorPage({
  searchParams,
}: {
  searchParams: Promise<{ ask?: string }>;
}) {
  const { ask } = await searchParams;
  const initialQuestion = typeof ask === "string" ? ask.slice(0, 500) : undefined;
  return <AdvisorChat initialQuestion={initialQuestion} />;
}
