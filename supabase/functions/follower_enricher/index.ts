import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

Deno.serve(async (req) => {
  const { comment_id, author_username, tiktok_account_id } = await req.json()

  // 1. Fetch user data from TikTok API [cite: 1135-1151]
  let followerCount = 0
  let isPrivate = false

  try {
    const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('TIKTOK_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: author_username,
        fields: ['follower_count', 'privacy_level']
      })
    })
    const userData = await userRes.json()
    followerCount = userData?.data?.user?.follower_count ?? 0

    // v4 logic: Handle private accounts or failed lookups
    if (userData?.data?.user?.privacy_level === 'SELF_ONLY' || followerCount === 0) {
      isPrivate = true
    }
  } catch (err) {
    console.error("TikTok User API failed:", err)
    isPrivate = true // Treat failures as private to be safe
  }

  // 2. Calculate Follower Score (Max 25 pts) [cite: 845-850, 1157-1162]
  let followerScore = 0
  if (followerCount > 100000) followerScore = 25
  else if (followerCount > 10000) followerScore = 15
  else if (followerCount > 1000) followerScore = 8
  else if (followerCount > 100) followerScore = 3

  // 3. Check for Viral Context Bonus (Max 15 pts) [cite: 851-858, 1163-1171]
  const { data: viralCheck } = await supabase
    .from('viral_mode_log')
    .select('id')
    .eq('tiktok_account_id', tiktok_account_id)
    .is('ended_at', null) // Current active viral window
    .maybeSingle()

  const viralBonus = viralCheck ? 15 : 0

  // 4. Compute Final Lead Score [cite: 1172-1177, 1409]
  const { data: comment } = await supabase
    .from('comment_logs')
    .select('lead_score_potential, comment_text, detected_intent')
    .eq('id', comment_id)
    .single()

  const finalScore = Math.min(100, (comment?.lead_score_potential ?? 0) + followerScore + viralBonus)

  // 5. Update Database with v4 Schema fields
  await supabase.from('comment_logs').update({
    author_follower_count: followerCount,
    account_is_private: isPrivate,
    follower_count_fetched: true,
    lead_score: finalScore
  }).eq('id', comment_id)

  // 6. Handle High-Value Lead Notifications [cite: 860-870, 1184-1191]
  const { data: settings } = await supabase
    .from('agent_settings')
    .select('lead_score_notify_above')
    .eq('tiktok_account_id', tiktok_account_id)
    .single()

  if (finalScore >= (settings?.lead_score_notify_above ?? 70)) {
    await supabase.channel('lead_alerts').send({
      type: 'broadcast',
      event: 'high_value_lead',
      payload: {
        comment_id,
        username: author_username,
        is_private: isPrivate,
        score: finalScore,
        text: comment?.comment_text,
        intent: comment?.detected_intent
      }
    })
  }

  return new Response(JSON.stringify({ final_score: finalScore }), { status: 200 })
})