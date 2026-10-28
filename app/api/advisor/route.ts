import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { logActivity } from "@/lib/activity/log-activity";
import { rateLimit } from "@/lib/security/rate-limit";
import { connectDB } from "@/lib/db/mongodb";
import { getActiveBeneficiaryForUser } from "@/lib/beneficiaries/active";
import { buildAdvisorAccountContext } from "@/lib/advisor/account-context";

export const runtime = "nodejs";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

const SYSTEM_PROMPT = `You are Bene-Watch Advisor, an informational assistant that helps people understand US public-benefit programs (SSI, SSDI, SNAP, Medicaid, TANF, WIC, LIHEAP, ACA, VA, ABLE) and how the Bene-Watch app surfaces thresholds, recurring income, and alerts.

Ground rules (every response):
- You are NOT a lawyer, financial advisor, tax professional, or benefits counselor.
- You do NOT make eligibility determinations. For final answers, the user must contact the relevant agency or a qualified benefits counselor.
- Cite general program rules in plain language. When state or year matters, say so and recommend the user verify with their state agency.
- If a question is outside benefits or Bene-Watch product help, gently redirect.
- Keep answers concise (3-6 short paragraphs or a tight bulleted list). Use everyday language.
- You may be given a "LIVE ACCOUNT CONTEXT" block with the user's real Bene-Watch data — enrolled programs, this month's income (earned vs unearned, with exclusions applied), account balances, transaction categories, limit/threshold status, and recent transactions. When it's present, ANSWER FROM IT: cite the user's actual figures and category breakdowns directly. Do NOT tell the user to "go check the Limits screen" or "review your data" — you can already see it. Never invent figures that aren't in the context or general program rules; if a needed number isn't in the context, say what's missing.

When a user asks "how do I fix" being over or near a limit, give practical, actionable options without making an eligibility determination. Draw on real program mechanisms where relevant: income exclusions and disregards, work incentives (SSI's $65 + ½ earned exclusion, SSDI Trial Work Period / IRWE / Extended Period of Eligibility), MAWD for workers with disabilities, ABLE accounts to shelter savings, Medicaid spend-down / Medically Needy, adjunctive eligibility, and what to report and to whom (and by when). Always close by pointing the user to the administering agency or a benefits counselor for the actual determination.

Income methodology — do not mix these up:
- QMB and Extra Help: the published dollar limit already includes the $20 general exclusion. The figure compared with that limit does NOT have the $20 subtracted. Never say a QMB or Extra Help amount "reflects the $20 general exclusion" or that the $20 was applied to unearned SSDI. Say the $20 is already inside the limit. Earned income still gets the $65 exclusion, any IRWE entered, and then one-half.
- SSI, ABD Medicaid, and MAWD: the $20 IS subtracted from unearned income first, then any leftover from earned income, then the $65, then IRWE, then half of what remains.
- If the account context shows IRWE of $0, say work expenses were not subtracted. Do not invent an IRWE deduction.
- SNAP deposits and ABLE distributions identified by description are left out of the income figures. A non-qualified ABLE withdrawal can still count; say that a counselor decides that. Infrequent or irregular income is not detected automatically.

When the user asks about Bene-Watch features, you can describe: limits, per-program limit pages, alerts (predictive / breach / trend), recurring income detection, the reporting calendar, the file vault, and exports.`;

function reqEnv(name: string): string | null {
  const v = process.env[name];
  return v && v.trim() !== "" ? v : null;
}

/** Anthropic's own error text, so a bad key or missing workspace isn't hidden as a bare 502. */
function anthropicErrorMessage(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    const message = parsed.error?.message?.trim();
    if (message) return message.slice(0, 400);
  } catch {
    // Non-JSON body. Fall through to the status.
  }
  return `Upstream status ${status}`;
}

export async function POST(req: Request) {
  const apiKey = reqEnv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Advisor not configured",
        details: "Set ANTHROPIC_API_KEY in the environment to enable the advisor.",
      },
      { status: 503 },
    );
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rl = rateLimit(`advisor:${session.user.id}`, 20, 5 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "You're sending messages too quickly. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const model = reqEnv("ANTHROPIC_MODEL") ?? "claude-sonnet-4-6";
  const maxTokens = Number(reqEnv("ANTHROPIC_MAX_TOKENS") ?? "1024");
  const workspaceId = reqEnv("ANTHROPIC_WORKSPACE_ID");

  // Give the advisor read access to the user's own financial picture so it can
  // answer from real figures instead of deflecting to a screen. Best-effort —
  // failures degrade gracefully to the generic (no-data) advisor.
  let accountContext: string | null = null;
  try {
    await connectDB();
    const primary = await getActiveBeneficiaryForUser(session.user.id);
    if (primary) {
      accountContext = await buildAdvisorAccountContext(primary._id);
    }
  } catch (e) {
    console.error("advisor account context failed", e);
  }

  // Static prompt is cached; the per-user live snapshot is not (it changes each
  // request and differs per user, so caching it would be wrong and wasteful).
  const systemBlocks: { type: "text"; text: string; cache_control?: { type: "ephemeral" } }[] = [
    { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
  ];
  if (accountContext) {
    systemBlocks.push({ type: "text", text: accountContext });
  }

  // Stream the reply so the UI can render it as it's written, rather than
  // waiting for the whole message. We forward only the text deltas to the
  // client as a plain-text stream; usage is captured for logging at the end.
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };
  // Personal keys (sk-ant-usr-…) that aren't tied to one workspace are rejected
  // unless this header names the workspace to bill.
  if (workspaceId) headers["anthropic-workspace-id"] = workspaceId;

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: Number.isFinite(maxTokens) ? maxTokens : 1024,
      stream: true,
      system: systemBlocks,
      messages: parsed.data.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  }).catch((e: Error) => {
    console.error("advisor upstream fetch failed", e);
    return null;
  });

  if (!upstream) {
    return NextResponse.json({ error: "Advisor unreachable" }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    console.error("advisor upstream non-2xx", upstream.status, text.slice(0, 500));
    return NextResponse.json(
      { error: "Advisor failed", details: anthropicErrorMessage(upstream.status, text) },
      { status: 502 },
    );
  }

  const userId = session.user.id;
  const lastUser = parsed.data.messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const upstreamBody = upstream.body;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamBody.getReader();
      let buffer = "";
      let reply = "";
      let inputTokens: number | null = null;
      let outputTokens: number | null = null;
      let cacheReadTokens: number | null = null;
      let cacheCreateTokens: number | null = null;

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const evt = JSON.parse(payload) as {
                type?: string;
                delta?: { type?: string; text?: string };
                message?: { usage?: Record<string, number> };
                usage?: Record<string, number>;
              };
              if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
                const t = evt.delta.text ?? "";
                reply += t;
                controller.enqueue(encoder.encode(t));
              } else if (evt.type === "message_start") {
                const u = evt.message?.usage ?? {};
                inputTokens = u.input_tokens ?? null;
                cacheReadTokens = u.cache_read_input_tokens ?? null;
                cacheCreateTokens = u.cache_creation_input_tokens ?? null;
              } else if (evt.type === "message_delta") {
                outputTokens = evt.usage?.output_tokens ?? outputTokens;
              }
            } catch {
              // ignore keepalive pings / non-JSON lines
            }
          }
        }
      } catch (e) {
        console.error("advisor stream error", e);
      } finally {
        controller.close();
        void logActivity({
          userId,
          category: "advisor",
          action: "advisor.message",
          details: {
            model,
            hasAccountContext: Boolean(accountContext),
            promptChars: lastUser.length,
            replyChars: reply.length,
            inputTokens,
            outputTokens,
            cacheReadTokens,
            cacheCreateTokens,
          },
        });
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
