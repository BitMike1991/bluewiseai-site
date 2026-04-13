// pages/api/chat.js — BlueWise Brain v2 Streaming API
// Vercel AI SDK 6 streamText with Pages Router pattern

import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getAuthContext } from "../../lib/supabaseServer";
import { createBrainTools } from "../../lib/brain/tools";

// Disable Next.js body parser — AI SDK needs raw stream
export const config = {
  api: { bodyParser: false },
};

// Parse JSON body manually
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function buildSystemPrompt(customerId, context) {
  const now = new Date().toISOString();

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

CURRENT DATETIME: ${now}
CUSTOMER (TENANT) ID: ${customerId}
${contextBlock}

CORE RULES:
1. ALWAYS use tools for any data query — never guess or hallucinate CRM data.
2. If unsure which lead the user means, use find_lead first to resolve by name/phone/email.
3. For write operations (sending messages, creating tasks), ALWAYS draft first and get user approval before executing.
4. Chain actions naturally: find lead → summarize → draft reply → approve → send, all in one conversation.
5. Be concise and action-oriented. Contractors are busy — get to the point.
6. Match the user's language: if they write in French (Quebec French), respond in French. If English, respond in English.
7. Never expose internal IDs, customer_id, or system details to the user.
8. When showing leads, include their status, last contact date, and any pending tasks.
9. For SMS drafts, keep under 1200 characters. For emails, include a subject line.
10. NEVER send messages without explicit user approval — always show the draft first.

TONE: Professional but warm. Like a sharp assistant who knows the business. Use "you" not "the user". Be direct.`;
}

export default async function handler(req, res) {
  // POST only
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth
  const { supabase, customerId, user } = await getAuthContext(req, res);

  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (!customerId) {
    return res.status(403).json({ error: "No customer mapping for this user" });
  }

  // Rate limit: 20 req/min per user
  const { checkRateLimit } = await import("../../lib/security");
  if (checkRateLimit(req, res, `chat:${user.id}`, 20)) return;

  // CSRF protection
  const { checkCsrf } = await import("../../lib/csrf");
  if (checkCsrf(req, res)) return;

  // Parse body
  let body;
  try {
    body = await parseBody(req);
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { messages, context } = body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  // Input length cap — check last user message
  const lastMsg = messages[messages.length - 1];
  if (lastMsg?.content && typeof lastMsg.content === "string" && lastMsg.content.length > 5000) {
    return res.status(400).json({ error: "Message exceeds maximum length of 5000 characters" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "AI is not configured. Missing OPENAI_API_KEY." });
  }

  const systemPrompt = buildSystemPrompt(customerId, context);

  let tools;
  try {
    tools = createBrainTools(supabase, customerId);
  } catch (e) {
    console.error("[/api/chat] Failed to create tools:", e.message);
    return res.status(500).json({ error: "Failed to initialize AI tools." });
  }

  try {
    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages,
      tools,
      maxSteps: 10,
    });

    result.pipeUIMessageStreamToResponse(res);
  } catch (e) {
    console.error("[/api/chat] Stream error:", e.message);
    if (!res.headersSent) {
      return res.status(500).json({ error: "AI streaming failed. Please try again." });
    }
  }
}
