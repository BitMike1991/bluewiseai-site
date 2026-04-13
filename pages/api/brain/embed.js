// pages/api/brain/embed.js
// Internal API route for embedding items into brain_embeddings
// Auth: X-Brain-Secret header OR Supabase service role

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// Lazy-init to prevent module-scope crash
let _openai = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

let _supabaseAdmin = null;
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return _supabaseAdmin;
}

const BATCH_SIZE = 20;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth check: secret header or service role
  const secret = req.headers["x-brain-secret"];
  if (!secret || secret !== process.env.BRAIN_EMBED_SECRET) {
    // Fall back to checking Authorization header for service role
    const authHeader = req.headers["authorization"];
    if (
      !authHeader ||
      authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    ) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items array required" });
  }

  // Validate all items have required fields
  for (const item of items) {
    if (!item.content || !item.source_type || item.source_id == null || item.customer_id == null) {
      return res.status(400).json({
        error: "Each item requires: content, source_type, source_id, customer_id",
      });
    }
  }

  try {
    let totalEmbedded = 0;

    // Process in batches of BATCH_SIZE
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const texts = batch.map((item) => item.content);

      // Call OpenAI embeddings
      const embeddingRes = await getOpenAI().embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
      });

      // Build upsert rows
      const rows = batch.map((item, idx) => ({
        customer_id: item.customer_id,
        source_type: item.source_type,
        source_id: item.source_id,
        lead_id: item.lead_id || null,
        content: item.content,
        metadata: item.metadata || {},
        embedding: JSON.stringify(embeddingRes.data[idx].embedding),
      }));

      // Upsert into brain_embeddings (ON CONFLICT update)
      const { error } = await getSupabaseAdmin()
        .from("brain_embeddings")
        .upsert(rows, {
          onConflict: "customer_id,source_type,source_id",
          ignoreDuplicates: false,
        });

      if (error) {
        console.error("brain embed upsert error:", error);
        return res.status(500).json({ error: error.message });
      }

      totalEmbedded += batch.length;
    }

    return res.status(200).json({ embedded: totalEmbedded });
  } catch (err) {
    console.error("brain embed error:", err);
    return res.status(500).json({ error: err.message });
  }
}
