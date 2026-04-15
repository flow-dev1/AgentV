import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// 1. REGEX PII SCRUBBER (Addition 1 / Phase 1)
function regexScrub(text: string): string {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  return text.replace(emailRegex, "[EMAIL_REDACTED]").replace(phoneRegex, "[PHONE_REDACTED]");
}

Deno.serve(async (req) => {
  try {
    const { commentId, commentText, authorHandle, tiktokAccountId } = await req.json();

    // Pass 1: Regex Scrub
    const firstPassText = regexScrub(commentText);

    // Pass 2: Gemini 2.5 Flash - Intent & Contextual Scrub
    // Using 2.5 Flash for superior contextual PII detection and faster inference
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this TikTok comment for AgentV: "${firstPassText}". 
            1. Classify intent: buy_intent, collab_intent, faq, or general_praise.
            2. Contextual PII removal: Remove names, addresses, or specific IDs while keeping intent.
            3. Generate a helpful, brand-aligned draft reply.
            Return ONLY JSON: { "intent": "...", "scrubbed": "...", "reply": "..." }`
          }]
        }]
      })
    });

    const geminiData = await geminiRes.json();
    const resultText = geminiData.candidates[0].content.parts[0].text;
    const { intent, scrubbed, reply } = JSON.parse(resultText.replace(/```json|```/g, ""));

    // 2. CALCULATE BASE POTENTIAL (Phase 1 Lead Scoring)
    let baseScore = 0;
    if (intent === "buy_intent") baseScore = 60;
    else if (intent === "collab_intent") baseScore = 40;
    else if (intent === "faq") baseScore = 20;

    // 3. PREPARE DB FOR ENRICHER
    await supabase.from("comment_logs").update({
      intent_label: intent,
      content: scrubbed, 
      ai_drafted_reply: reply,
      lead_score_potential: baseScore, // Set the "Seed" for the enricher
      status: "pending"
    }).eq("id", commentId);

    // 4. HANDOFF TO FOLLOWER ENRICHER
    // We don't 'await' this so the router can return immediately (non-blocking)
    edgeRuntime.invokeFunction("follower_enricher", {
      body: { 
        comment_id: commentId, 
        author_username: authorHandle, 
        tiktok_account_id: tiktokAccountId 
      }
    });

    return new Response(JSON.stringify({ ok: true, intent, baseScore }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});