import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getFillableForm } from "@/lib/forms/fillable";
import { fillOfficialPdf, OfficialPdfUnavailable } from "@/lib/forms/official-pdf";

export const runtime = "nodejs";

/**
 * Fetches the official agency PDF and auto-fills its form fields from the user's
 * answers, returning the real government form ready to print or submit. Falls
 * back (422) to the MyBenefitsPA summary PDF when the official form can't be
 * fetched or matched.
 */
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
  if (!form.officialFill) {
    return NextResponse.json(
      { error: "no_official_fill", details: "This form has no auto-fillable official PDF." },
      { status: 422 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const { bytes, filled, totalFields } = await fillOfficialPdf(form, parsed.data.values);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${formId}-official-filled.pdf"`,
        "Cache-Control": "no-store",
        "X-Fields-Filled": `${filled}/${totalFields}`,
      },
    });
  } catch (e) {
    if (e instanceof OfficialPdfUnavailable) {
      return NextResponse.json(
        {
          error: "official_unavailable",
          details:
            "Couldn't auto-fill the official PDF right now. Use the MyBenefitsPA summary, or open the official form to fill it by hand.",
        },
        { status: 422 },
      );
    }
    console.error("official-pdf fill failed", e);
    return NextResponse.json({ error: "fill_failed" }, { status: 502 });
  }
}
