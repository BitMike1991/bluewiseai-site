#!/usr/bin/env node
// scripts/brain-backfill.js
// Backfill brain_embeddings from inbox_messages across all tenants
// Usage: node scripts/brain-backfill.js

const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai").default;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_KEY });

const BATCH_SIZE = 20;
const DELAY_MS = 50;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractContent(msg) {
  // Try common content fields
  const parts = [];
  if (msg.body) parts.push(msg.body);
  if (msg.content && msg.content !== msg.body) parts.push(msg.content);
  if (msg.text && msg.text !== msg.body && msg.text !== msg.content) parts.push(msg.text);
  if (msg.email_body && msg.email_body !== msg.body) parts.push(msg.email_body);
  const combined = parts.join("\n").trim();
  return combined || null;
}

async function fetchAllMessages() {
  console.log("Fetching messages...");
  let allMessages = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("inbox_messages")
      .select("id, lead_id, body, content, text, email_body, channel, direction, created_at")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Error fetching messages:", error.message);
      break;
    }

    if (!data || data.length === 0) break;
    allMessages = allMessages.concat(data);
    console.log(`  fetched ${allMessages.length} messages so far...`);
    offset += pageSize;

    if (data.length < pageSize) break;
  }

  return allMessages;
}

async function resolveCustomerIds(messages) {
  // inbox_messages -> lead_id -> inbox_leads.customer_id
  const leadIds = [...new Set(messages.map((m) => m.lead_id).filter(Boolean))];
  console.log(`Resolving customer_id for ${leadIds.length} unique leads...`);

  const leadToCustomer = {};
  // Fetch in batches
  for (let i = 0; i < leadIds.length; i += 500) {
    const batch = leadIds.slice(i, i + 500);
    const { data, error } = await supabase
      .from("inbox_leads")
      .select("id, customer_id")
      .in("id", batch);

    if (error) {
      console.error("Error fetching inbox_leads:", error.message);
      continue;
    }

    for (const lead of data || []) {
      // customer_id stored as STRING in inbox_leads
      leadToCustomer[lead.id] = parseInt(lead.customer_id, 10);
    }
  }

  return leadToCustomer;
}

async function embedBatch(items) {
  const texts = items.map((i) => i.content);
  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  const rows = items.map((item, idx) => ({
    customer_id: item.customer_id,
    source_type: "message",
    source_id: item.source_id,
    lead_id: item.lead_id,
    content: item.content,
    metadata: item.metadata,
    embedding: JSON.stringify(embeddingRes.data[idx].embedding),
  }));

  const { error } = await supabase
    .from("brain_embeddings")
    .upsert(rows, {
      onConflict: "customer_id,source_type,source_id",
      ignoreDuplicates: false,
    });

  if (error) {
    console.error("  upsert error:", error.message);
    return 0;
  }
  return rows.length;
}

async function main() {
  console.log("=== Brain Backfill Start ===");
  const startTime = Date.now();

  const messages = await fetchAllMessages();
  console.log(`Total messages fetched: ${messages.length}`);

  const leadToCustomer = await resolveCustomerIds(messages);

  // Filter messages with content and valid customer_id
  const embeddable = [];
  let skipped = 0;
  for (const msg of messages) {
    const content = extractContent(msg);
    if (!content) { skipped++; continue; }

    const customerId = leadToCustomer[msg.lead_id];
    if (!customerId || isNaN(customerId)) { skipped++; continue; }

    embeddable.push({
      customer_id: customerId,
      source_type: "message",
      source_id: msg.id,
      lead_id: msg.lead_id,
      content: content.substring(0, 8000), // cap content length
      metadata: {
        channel: msg.channel || null,
        direction: msg.direction || null,
        created_at: msg.created_at || null,
      },
    });
  }

  console.log(`Embeddable: ${embeddable.length} | Skipped: ${skipped}`);

  let totalEmbedded = 0;
  for (let i = 0; i < embeddable.length; i += BATCH_SIZE) {
    const batch = embeddable.slice(i, i + BATCH_SIZE);
    const count = await embedBatch(batch);
    totalEmbedded += count;

    if ((i / BATCH_SIZE) % 10 === 0) {
      console.log(`  Progress: ${totalEmbedded}/${embeddable.length} embedded`);
    }

    await sleep(DELAY_MS);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`=== Brain Backfill Complete ===`);
  console.log(`Embedded: ${totalEmbedded} | Time: ${elapsed}s`);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
