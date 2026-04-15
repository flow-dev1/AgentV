import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)

Deno.serve(async (req) => {
  // 1. Receive record from Supabase DB Webhook [cite: 734]
  const { record } = await req.json()

  // Skip if tags are already verified or manually overridden [cite: 735]
  if (record.hook_style_status !== 'ai_suggested' || record.hook_style) {
    return new Response('Skipping: Already tagged', { status: 200 })
  }

  // 2. Classify with gemini-2.5-flash [cite: 737, 1023]
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
  const prompt = `
    Analyze this TikTok video and classify it for our Intelligence Loop. 
    Return JSON only.
    
    Caption: "${record.video_caption}"
    Transcript (first 30s): "${record.video_transcript?.slice(0, 500) ?? 'Not available'}"
    
    Return: {
      "hook_style": "how-to" | "vlog" | "trend-sound" | "pov" | "storytime" | "talking-head",
      "hook_style_confidence": 0.0 to 1.0,
      "topic_tag": "specific topic in 2-4 words",
      "topic_tag_confidence": 0.0 to 1.0
    }
  `

  const result = await model.generateContent(prompt)
  const parsed = JSON.parse(result.response.text().replace(/```json|```/g, '').trim())

  // 3. v4 Confidence Gating Logic [cite: 1271-1275, 1417]
  const hookConfident = parsed.hook_style_confidence >= 0.85
  const topicConfident = parsed.topic_tag_confidence >= 0.85

  // 4. Update video_performance [cite: 1276-1288]
  // 'human_verified' status is used for silent auto-approval of high-confidence tags
  await supabase.from('video_performance').update({
    hook_style: parsed.hook_style,
    hook_style_confidence: parsed.hook_style_confidence,
    hook_style_status: hookConfident ? 'human_verified' : 'ai_suggested',
    topic_tag: parsed.topic_tag,
    topic_tag_confidence: parsed.topic_tag_confidence,
    topic_tag_status: topicConfident ? 'human_verified' : 'ai_suggested'
  }).eq('id', record.id)

  // 5. Queue for Human Review if confidence is low [cite: 1289-1296, 1417]
  if (!hookConfident || !topicConfident) {
    await supabase.from('pending_tag_reviews').insert({
      video_performance_id: record.id,
      tiktok_video_id: record.tiktok_video_id,
      hook_needs_review: !hookConfident,
      topic_needs_review: !topicConfident
    })
  }

  return new Response(JSON.stringify({ ok: true, auto_approved: hookConfident && topicConfident }), { status: 200 })
})