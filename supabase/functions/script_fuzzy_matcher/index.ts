import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)

Deno.serve(async (req) => {
  const { tiktok_account_id } = await req.json()
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Fetch unlinked briefs from the last 4 weeks [cite: 1313-1320]
  const { data: openBriefs } = await supabase
    .from('creative_briefs')
    .select('id, week_of, script_suggestions')
    .eq('tiktok_account_id', tiktok_account_id)
    .eq('fuzzy_match_confirmed', false)
    .gte('created_at', fourWeeksAgo)

  // 2. Fetch new videos uploaded since the last match run [cite: 1321-1327]
  const { data: newVideos } = await supabase
    .from('video_performance')
    .select('tiktok_video_id, video_caption, hook_style, topic_tag')
    .eq('tiktok_account_id', tiktok_account_id)
    .gte('snapshot_date', fourWeeksAgo)

  if (!openBriefs?.length || !newVideos?.length) {
    return new Response(JSON.stringify({ matched: 0 }), { status: 200 })
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  let matchCount = 0

  for (const brief of openBriefs) {
    const scripts = brief.script_suggestions as any[]
    if (!scripts?.length) continue

    for (const video of newVideos) {
      // 3. LLM comparison of script vs. real video content [cite: 1338-1352]
      const prompt = `
        Compare this TikTok video against these script suggestions.
        SCRIPTS: ${JSON.stringify(scripts)}
        NEW VIDEO:
        Caption: "${video.video_caption}"
        Hook Style: "${video.hook_style}"
        Topic Tag: "${video.topic_tag}"

        Return JSON only: {
          "best_match_index": number | null,
          "match_score": 0.0 to 1.0,
          "reasoning": "one sentence explanation"
        }
      `
      const result = await model.generateContent(prompt)
      const parsed = JSON.parse(result.response.text().replace(/```json|```/g, '').trim())

      // 4. Threshold Check: Only link if confidence is > 90% 
      if (parsed.match_score >= 0.90) {
        const candidates = brief.fuzzy_match_candidates as any[] ?? []
        candidates.push({
          video_id: video.tiktok_video_id,
          script_index: parsed.best_match_index,
          match_score: parsed.match_score,
          reasoning: parsed.reasoning
        })

        // 5. Update brief with candidate for human confirmation [cite: 1367-1380]
        await supabase
          .from('creative_briefs')
          .update({ fuzzy_match_candidates: candidates })
          .eq('id', brief.id)
        
        matchCount++
      }
    }
  }

  return new Response(JSON.stringify({ matched: matchCount }), { status: 200 })
})