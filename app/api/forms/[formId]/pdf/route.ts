import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getFillableForm } from "@/lib/forms/fillable";
import { generateFormPdf, pdfFilename } from "@/lib/forms/generate-pdf";

/** Generate a printable PDF of a filled in-app form. The values are supplied by
 *  the client (already shown to the user), so this is a pure render step. */
const schema = z.object({
  values: z.record(z.string(), z.string()).default({}),
});

export async function POST(req: Request, ctx: { params: Promise<{ formId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { formId } = await ctx.params;
  const form = getFillableForm(formId);
  if (!form) {
    return NextResponse.json({ error: "Unknown form" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const bytes = await generateFormPdf(form, parsed.data.values);
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${pdfFilename(form)}"`,
      "Cache-Control": "no-store",
    },
  });
}
