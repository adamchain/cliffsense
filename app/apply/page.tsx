import { redirect } from "next/navigation";

/** Public "apply" entry point. Registration is the application — keep a single
 *  implementation and forward to it. */
export default function ApplyPage() {
  redirect("/auth/signup");
}
