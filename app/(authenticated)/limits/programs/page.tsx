import { redirect } from "next/navigation";

/** Dates live on each program page. This path used to be a combined dates form. */
export default function LimitsProgramsPage() {
  redirect("/limits");
}
