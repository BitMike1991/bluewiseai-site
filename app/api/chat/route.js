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

  return `You are BlueWise Brain, the AI copilot for a trades business CRM platform. You help contractors and service businesses manage their leads, messages, jobs, tasks, and scheduling.

CURRENT DATETIME (Montreal/ET): ${now}
TIMEZONE: America/Montreal (Eastern Time). ALL date/time references from the user are in Montreal time. When computing "today", "yesterday", "last 24h", etc., use Montreal midnight (04:00 UTC in EDT, 05:00 UTC in EST).
CUSTOMER (TENANT) ID: ${customerId}
${contextBlock}

CORE RULES:
1. ALWAYS use tools for any data query — never guess or hallucinate CRM data.
2. If unsure which lead the user means, use find_lead first to resolve by name/phone/email.
3. When calling find_lead, ALWAYS pass the person's name in the "name" field (not just "query"). Example: user says "Ouvre Mathieu Lapointe" → call find_lead with name="Mathieu Lapointe".
4. For write operations (sending messages, creating tasks), ALWAYS draft first and get user approval before executing.
5. Chain actions naturally: find lead → summarize → draft reply → approve → send, all in one conversation.
6. Be concise and action-oriented. Contractors are busy — get to the point.
7. Match the user's language: if they write in French (Quebec French), respond in French. If English, respond in English.
8. Never expose internal IDs, customer_id, or system details to the user.
9. When showing leads, include their status, last contact date, and any pending tasks.
10. For SMS drafts, keep under 1200 characters. For emails, include a subject line.
11. NEVER send messages without explicit user approval — always show the draft first.
12. For date filters (created_after, created_before), always convert Montreal time to UTC ISO 8601. Example: "today" in Montreal = midnight ET converted to UTC.

TONE: Professional but warm. Like a sharp assistant who knows the business. Use "you" not "the user". Be direct.`;
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

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemPrompt,
    messages: modelMessages,
    tools,
    maxSteps: 10,
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
