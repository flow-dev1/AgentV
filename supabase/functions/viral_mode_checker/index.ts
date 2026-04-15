import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

Deno.serve(async (req) => {
  const { tiktok_account_id } = await req.json()
  const now = new Date()

  // 1. Fetch Viral Settings
  const { data: settings } = await supabase
    .from('agent_settings')
    .select('viral_mode_threshold_pct')
    .eq('tiktok_account_id', tiktok_account_id)
    .single()
  const threshold = settings?.viral_mode_threshold_pct ?? 20.0

  // 2. PART 1: Check expiring viral windows (Keep-Alive Logic) [cite: 1216-1222]
  const { data: expiringWindows } = await supabase
    .from('viral_queue')
    .select('*, viral_mode_log(*)')
    .eq('tiktok_account_id', tiktok_account_id)
    .lte('active_until', new Date(now.getTime() + 5 * 60 * 1000).toISOString())

  for (const window of expiringWindows ?? []) {
    const log = window.viral_mode_log?.[0]
    if (!log) continue

    // Calculate current velocity spike [cite: 1229-1243]
    const { data: snaps } = await supabase
      .from('video_performance')
      .select('views, comments_count')
      .eq('tiktok_video_id', window.tiktok_video_id)
      .order('snapshot_date', { ascending: false })
      .limit(2)

    const [latest, previous] = snaps ?? []
    const viewSpike = previous?.views > 0 ? ((latest.views - previous.views) / previous.views) * 100 : 0
    const commentSpike = previous?.comments_count > 0 ? ((latest.comments_count - previous.comments_count) / previous.comments_count) * 100 : 0
    const maxSpike = Math.max(viewSpike, commentSpike)
    const stillSpiking = maxSpike >= threshold

    // v4 Mega-Viral escalation logic
    if (log.keep_alive_count >= log.max_keep_alives) {
      if (stillSpiking) {
        // MEGA-VIRAL: Spike persists past 48h. Pause polling and alert human
        await supabase.from('viral_queue').delete().eq('tiktok_video_id', window.tiktok_video_id)
        
        await supabase.channel('mega_viral_alerts').send({
          type: 'broadcast',
          event: 'mega_viral_escalation',
          payload: {
            tiktok_video_id: window.tiktok_video_id,
            current_spike_pct: maxSpike.toFixed(1),
            hours_in_viral: log.keep_alive_count,
            message: `Video has been viral for ${log.keep_alive_count} hours and is still spiking at ${maxSpike.toFixed(1)}%.`
          }
        })

        await supabase.from('viral_mode_log').update({ 
          ended_at: null, // Freeze in limbo for human decision
          last_keep_alive_at: now 
        }).eq('id', log.id)
      } else {
        // Natural end: Ceiling reached and velocity stabilized
        await supabase.from('viral_queue').delete().eq('tiktok_video_id', window.tiktok_video_id)
        await supabase.from('viral_mode_log').update({ ended_at: now }).eq('id', log.id)
      }
      continue
    }

    // Standard extension logic (Keep-Alive) [cite: 1244-1255]
    if (stillSpiking) {
      await supabase.from('viral_queue').update({ 
        active_until: new Date(now.getTime() + 60 * 60 * 1000).toISOString() 
      }).eq('tiktok_video_id', window.tiktok_video_id)

      await supabase.from('viral_mode_log').update({
        keep_alive_count: log.keep_alive_count + 1,
        last_keep_alive_at: now,
        polls_conducted: log.polls_conducted + 30
      }).eq('id', log.id)
    } else {
      // Natural end: Velocity stabilized before ceiling [cite: 1258-1259]
      await supabase.from('viral_queue').delete().eq('tiktok_video_id', window.tiktok_video_id)
      await supabase.from('viral_mode_log').update({ ended_at: now }).eq('id', log.id)
    }
  }

  // 3. PART 2: Detect New Spikes (Standard Detection) [cite: 786-814, 1262-1264]
  // (Logic to compare all active videos and insert new rows into viral_queue/viral_mode_log)

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})