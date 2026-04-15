import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

Deno.serve(async (req) => {
  const { tiktok_account_id } = await req.json()
  const today = new Date().toISOString().split('T')[0]

  // 1. Fetch all shadow_drafted comments handled today
  const { data: logs } = await supabase
    .from('comment_logs')
    .select('status, detected_intent')
    .eq('tiktok_account_id', tiktok_account_id)
    .eq('shadow_mode_active', true)
    .gte('processed_at', today)

  if (!logs || logs.length === 0) {
    return new Response(JSON.stringify({ message: "No drafts today" }), { status: 200 })
  }

  // 2. Aggregate counts for the day
  const total = logs.length
  const approved = logs.filter(l => l.status === 'auto_replied').length // Would have approved
  const edited = logs.filter(l => l.status === 'human_replied').length   // Would have edited
  const rejected = logs.filter(l => l.status === 'ignored').length      // Wrong entirely
  const accuracyPct = (approved / total) * 100

  // 3. Category-specific accuracy
  const getCatAcc = (intent: string) => {
    const catLogs = logs.filter(l => l.detected_intent === intent)
    return catLogs.length > 0 ? (catLogs.filter(l => l.status === 'auto_replied').length / catLogs.length) * 100 : 0
  }

  // 4. Fetch settings to determine Day Number
  const { data: settings } = await supabase.from('agent_settings').select('shadow_mode_start').eq('tiktok_account_id', tiktok_account_id).single()
  const dayNumber = Math.ceil((new Date().getTime() - new Date(settings.shadow_mode_start).getTime()) / (1000 * 60 * 60 * 24))

  // 5. Upsert to accuracy log
  await supabase.from('shadow_mode_accuracy_log').upsert({
    tiktok_account_id,
    day_number: dayNumber,
    total_drafts: total,
    approved_count: approved,
    edited_count: edited,
    rejected_count: rejected,
    accuracy_pct: accuracyPct,
    price_faq_accuracy: getCatAcc('price_faq'),
    link_request_accuracy: getCatAcc('link_request'),
    general_praise_accuracy: getCatAcc('general_praise'),
    buy_intent_accuracy: getCatAcc('buy_intent')
  })

  return new Response(JSON.stringify({ ok: true, accuracy: accuracyPct }), { status: 200 })
})