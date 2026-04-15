import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)

Deno.serve(async (req) => {
  const { tiktok_account_id } = await req.json()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Gather Intelligence Inputs [cite: 375-376, 918-925]
  const [insights, performance, leads, previousResults] = await Promise.all([
    supabase.from('market_insights').select('*').eq('tiktok_account_id', tiktok_account_id).gte('created_at', weekAgo),
    supabase.from('video_performance').select('*').eq('tiktok_account_id', tiktok_account_id).order('retention_rate', { ascending: false }).limit(10),
    supabase.from('comment_logs').select('comment_text, detected_intent').eq('tiktok_account_id', tiktok_account_id).eq('detected_intent', 'buy_intent').limit(20),
    supabase.from('creative_briefs').select('generated_brief, brief_accuracy_score').eq('tiktok_account_id', tiktok_account_id).order('week_of', { ascending: false }).limit(1)
  ])

  // 2. Synthesize with gemini-2.5-flash [cite: 1023]
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  const prompt = `
    You are a TikTok Creative Director. Generate a markdown creative brief.
    WATCH TIME PATTERNS: ${JSON.stringify(performance.data)}
    MARKET INSIGHTS: ${JSON.stringify(insights.data)}
    BUY INTENT SIGNALS: ${JSON.stringify(leads.data)}
    PREVIOUS RESULTS: ${JSON.stringify(previousResults.data)}

    Structure the brief into these v4 required sections [cite: 926-947]:
    1. **Watch Time & Re-watch Pattern**: Analyze which hooks drove highest retention [cite: 927-931].
    2. **3 Script Suggestions**: Each with a Title, Hook (first 3s), Body, and Loop Trigger [cite: 932-937].
    3. **Unanswered Market Questions**: Top 3 recurring questions [cite: 940-941].
    4. **Demand Conversion**: Specific buying intent comments to address [cite: 943-944].
    5. **Algorithm Recommendations**: Recommended length and audio type [cite: 945-946].

    Return JSON with two keys: "markdown_brief" and "scripts_json" (an array of the 3 scripts).
  `

  const result = await model.generateContent(prompt)
  const response = JSON.parse(result.response.text().replace(/```json|```/g, '').trim())

  // 3. Store the Brief and close the loop [cite: 399-408, 1058-1063]
  const weekOf = new Date().toISOString().split('T')[0]
  const { data: brief, error } = await supabase.from('creative_briefs').insert({
    tiktok_account_id,
    week_of: weekOf,
    generated_brief: response.markdown_brief,
    script_suggestions: response.scripts_json,
    status: 'draft',
    top_video_id: performance.data?.[0]?.tiktok_video_id
  }).select().single()

  // 4. Trigger Fuzzy Matcher to link any new uploads to these scripts 
  if (brief) {
    await supabase.functions.invoke('script_fuzzy_matcher', {
      body: { tiktok_account_id, brief_id: brief.id }
    })
  }

  return new Response(JSON.stringify({ ok: true, brief_id: brief?.id }), { status: 200 })
})