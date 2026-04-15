import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)

Deno.serve(async (req) => {
  const { tiktok_account_id } = await req.json()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Gather all raw signals from the past week [cite: 19, 375-377]
  const [comments, viralEvents, existingInsights] = await Promise.all([
    supabase.from('comment_logs')
      .select('comment_text, detected_intent, sentiment_score')
      .eq('tiktok_account_id', tiktok_account_id)
      .gte('created_at', weekAgo),
    supabase.from('viral_mode_log')
      .select('*')
      .eq('tiktok_account_id', tiktok_account_id)
      .gte('triggered_at', weekAgo),
    supabase.from('market_insights')
      .select('*')
      .eq('tiktok_account_id', tiktok_account_id)
      .gte('created_at', weekAgo)
  ])

  // 2. Synthesize Intelligence with gemini-2.5-flash [cite: 1023-1025]
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  
  const prompt = `
    You are a Market Intelligence Analyst for a major TikTok brand. 
    Analyze the following data streams from the past 7 days:
    
    RAW COMMENTS: ${JSON.stringify(comments.data?.slice(0, 100))}
    VIRAL EVENTS: ${JSON.stringify(viralEvents.data)}
    EXISTING INSIGHTS: ${JSON.stringify(existingInsights.data)}

    Identify:
    1. Competitor Mentions: Are users comparing us to others? 
    2. Sentiment Shifts: Is there a specific topic driving frustration or joy? [cite: 105, 140, 146]
    3. Content Gaps: What are users asking for that we haven't filmed yet? [cite: 145, 940]
    4. Trend Opportunities: Any specific slang, audio, or formats mentioned? [cite: 143, 150]

    Return JSON only:
    {
      "weekly_digest": "A 3-paragraph executive summary of the week's vibe",
      "top_signals": [
        {"type": "competitor_mention|pain_point|trend_opportunity", "summary": "...", "confidence": 0.0-1.0}
      ],
      "recommended_hashtags": ["#tag1", "#tag2"]
    }
  `

  const result = await model.generateContent(prompt)
  const report = JSON.parse(result.response.text().replace(/```json|```/g, '').trim())

  // 3. Log high-confidence new insights back to the database [cite: 135, 144, 162]
  if (report.top_signals) {
    const newInsights = report.top_signals
      .filter((s: any) => s.confidence >= 0.8)
      .map((s: any) => ({
        tiktok_account_id,
        insight_type: s.type,
        summary: s.summary,
        confidence_score: s.confidence,
        week_of: new Date().toISOString().split('T')[0]
      }))

    if (newInsights.length > 0) {
      await supabase.from('market_insights').insert(newInsights)
    }
  }

  return new Response(JSON.stringify({ ok: true, digest: report.weekly_digest }), { status: 200 })
})