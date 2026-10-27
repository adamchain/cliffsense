import { redirect } from "next/navigation";

/** Older program links used /thresholds/SSI. The page now lives at /programs/SSI. */
export default async function LegacyProgramRedirect({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program } = await params;
  redirect(`/programs/${program}`);
}
