// lib/brain/runners/search.js
// RAG search runner — embeds query, calls brain_search RPC, returns formatted results

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Execute a semantic search against brain_embeddings
 * @param {object} supabase - Supabase client (user-scoped or admin)
 * @param {number} customerId - tenant isolation
 * @param {object} args - { query, lead_id?, source_types?, limit? }
 */
export async function runSearchMessagesTool(supabase, customerId, args) {
  const { query, lead_id, source_types, limit = 5 } = args;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return { error: "query is required" };
  }

  const clampedLimit = Math.min(Math.max(limit, 1), 20);

  try {
    // 1. Embed the query
    const embeddingRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query.trim(),
    });

    const queryEmbedding = embeddingRes.data[0].embedding;

    // 2. Call brain_search RPC with customer_id isolation
    const { data, error } = await supabase.rpc("brain_search", {
      p_customer_id: customerId,
      p_query_embedding: JSON.stringify(queryEmbedding),
      p_source_types: source_types || null,
      p_lead_id: lead_id || null,
      p_limit: clampedLimit,
    });

    if (error) {
      console.error("brain_search RPC error:", error);
      return { error: error.message };
    }

    if (!data || data.length === 0) {
      return {
        results: [],
        message: "No matching results found.",
      };
    }

    // 3. Format results
    const results = data.map((row) => ({
      source_type: row.source_type,
      source_id: row.source_id,
      lead_id: row.lead_id,
      content: row.content,
      metadata: row.metadata,
      similarity: Math.round(row.similarity * 1000) / 1000,
    }));

    return {
      results,
      count: results.length,
      query,
    };
  } catch (err) {
    console.error("search runner error:", err);
    return { error: err.message };
  }
}
