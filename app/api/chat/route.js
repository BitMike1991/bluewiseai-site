// app/api/chat/route.js — BlueWise Brain v2 Streaming API
// App Router Route Handler (works alongside Pages Router pages)
// Required for proper Web Response streaming with AI SDK 6

import { streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createBrainTools } from "../../../lib/brain/tools";

export const maxDuration = 60;

// Auth helper for App Router (mirrors getAuthContext from lib/supabaseServer.js)
async function getAppRouterAuth() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user || null;

  if (userErr || !user) {
    return { supabase, user: null, customerId: null };
  }

  // Lookup customer_id from customer_users
  const { data: cuRows } = await supabase
    .from("customer_users")
    .select("customer_id")
    .eq("user_id", user.id);

  if (!cuRows || cuRows.length === 0) {
    return { supabase, user, customerId: null };
  }

  const allCustomerIds = cuRows.map((r) => r.customer_id);
  let customerId = allCustomerIds[0];

  // Multi-tenant: check __active_tenant cookie
  if (allCustomerIds.length > 1) {
    const activeTenant = parseInt(cookieStore.get("__active_tenant")?.value, 10);
    if (activeTenant && allCustomerIds.includes(activeTenant)) {
      customerId = activeTenant;
    }
  }

  return { supabase, user, customerId };
}

function buildSystemPrompt(customerId, context) {
  // All clients are in Montreal — use ET for all date/time reasoning
  const now = new Date().toLocaleString("en-CA", {
    timeZone: "America/Montreal",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });

  let contextBlock = "";
  if (context?.activeLeadId) {
    contextBlock = `\n\nCURRENT CONTEXT:
- The user is currently viewing lead #${context.activeLeadId}${context.activeLeadName ? ` (${context.activeLeadName})` : ""}.
- When they say "this lead", "this person", "them", etc., they mean lead #${context.activeLeadId}.
- Prefer using this lead's ID in tool calls rather than asking the user to specify.`;
  }
  if (context?.activePage) {
    contextBlock += `\n- Active page: ${context.activePage}`;
  }

  return `<identity>
You are BlueWise Brain — the AI copilot for a trades business CRM. You help contractors manage leads, messages, jobs, tasks, and scheduling. You are sharp, fast, and sound like a real human assistant — not a robot.
</identity>

<context>
DATETIME: ${now} (Montreal/ET, America/Montreal)
TENANT: ${customerId}
${contextBlock}
</context>

<tool_rules>
- ALWAYS use tools for data queries. Never guess CRM data.
- find_lead: pass the name in the "name" field. Example: "Ouvre Mathieu" → name="Mathieu".
- draft_reply: call DIRECTLY. It loads conversation context internally. Do NOT call summarize_conversation before drafting.
- summarize_conversation: ONLY when the user explicitly asks for a summary.
- send_message: ONLY after user clicks Send (message starts with [APPROVED]). Call it with the exact params, report result in one sentence, STOP. No extra tool calls.
- Date filters: convert Montreal time to UTC ISO 8601.
</tool_rules>

<language>
- Talk to the USER in their language (French → French, English → English).
- Draft messages to CUSTOMERS in the customer's language from lead.language field.
- Default to French (Quebec market) if language is unknown.
</language>

<response_style>
- Responses: 1-2 sentences max. Contractors are busy.
- Match the user's energy. Short question → short answer.
- Never expose IDs, customer_id, or system internals.
</response_style>

<constraints>
- NEVER hallucinate CRM data — tool call or nothing.
- NEVER send a message without [APPROVED] prefix from the UI.
- NEVER call summarize_conversation before draft_reply.
- NEVER write more than 2 sentences in your response (unless showing tool results).
- NEVER call additional tools after send_message completes.
</constraints>`;
}

export async function POST(req) {
  const { supabase, customerId, user } = await getAppRouterAuth();

  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!customerId) {
    return Response.json({ error: "No customer mapping" }, { status: 403 });
  }

  const body = await req.json();
  const { messages, context } = body;

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: "messages array is required" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "AI is not configured." }, { status: 500 });
  }

  const systemPrompt = buildSystemPrompt(customerId, context);
  const tools = createBrainTools(supabase, customerId);
  const modelMessages = await convertToModelMessages(messages);

  // Detect [APPROVED] sends — use fewer steps to prevent timeout
  const lastUserMsg = messages.filter((m) => m.role === "user").pop();
  const lastText = lastUserMsg?.parts?.find((p) => p.type === "text")?.text || lastUserMsg?.content || "";
  const isApproved = lastText.startsWith("[APPROVED]");

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: modelMessages,
    tools,
    maxSteps: isApproved ? 2 : 5,
  });

  // Manual SSE stream — bypass SDK's toUIMessageStreamResponse to avoid
  // protocol mismatch issues with our manual frontend parser
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(obj) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      }

      try {
        for await (const part of result.fullStream) {
          switch (part.type) {
            case "text-delta":
              send({ type: "text-delta", delta: part.text || part.textDelta || "" });
              break;
            case "tool-call":
              send({
                type: "tool-call",
                toolCallId: part.toolCallId,
                toolName: part.toolName,
                args: part.input,
              });
              break;
            case "tool-result":
              send({
                type: "tool-result",
                toolCallId: part.toolCallId,
                result: part.output,
              });
              break;
            case "error":
              send({ type: "error", error: String(part.error) });
              break;
            // Ignore other event types (start-step, finish-step, etc.)
          }
        }
      } catch (err) {
        send({ type: "error", error: err.message || "Stream error" });
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
