import { supabase } from "../supabaseClient.js";

/**
 * Renders the HTML Structure of the Home Page
 */
export function renderHome() {
  return `
    <div id="alert-anchor"></div>

    <section class="card connection-status-card" id="connection-panel">
      <div class="status-info">
        <div class="status-indicator" id="status-blob"></div>
        <div>
          <h3 id="profile-name">Platform Integration</h3>
          <p id="tiktok-connection-status">Checking connection...</p>
        </div>
      </div>
      <button id="connect-tiktok-btn" class="btn-primary" type="button">
        Connect TikTok Sandbox
      </button>
    </section>

    <div class="grid-2">
      <section class="card shadow-mode-panel">
        <h2>Shadow Mode Accuracy</h2>
        <div id="sparkline-container">
           <p class="loading-text">Loading trend data...</p>
        </div>
      </section>

      <section class="card action-center">
        <h2>Agent Intelligence</h2>
        <div class="action-list">
          <div class="action-item">
            <span>Scan latest 10 comments</span> 
            <button class="btn-tiny" id="run-scan-btn">Run Scan</button>
          </div>
          <div class="action-item">
            <span>Verify AI Drafts</span> 
            <button class="btn-tiny" onclick="window.location.href='/demo'">Review</button>
          </div>
        </div>
      </section>
    </div>

    <section class="section card">
      <h2>Priority Inbox Leads</h2>
      <p style="font-size: 13px; color: #888; margin-bottom: 20px;">
        High-intent leads identified by AgentV Intelligence Loop.
      </p>
      <div class="lead-grid" id="live-lead-grid">
        <p class="loading-text">Fetching latest leads...</p>
      </div>
    </section>
  `;
}

/**
 * Initializes Event Listeners and Logic
 */
export async function initHome() {
  const statusNode = document.getElementById("tiktok-connection-status");
  const profileName = document.getElementById("profile-name");
  const button = document.getElementById("connect-tiktok-btn");
  const statusBlob = document.getElementById("status-blob");
  const leadGrid = document.getElementById("live-lead-grid");
  const sparklineContainer = document.getElementById("sparkline-container");
  const scanBtn = document.getElementById("run-scan-btn");

  if (!statusNode || !button) return;

  // 1. Build-Safe Identity Setup
  let userId = localStorage.getItem("user_id");
  if (!userId || userId.startsWith("sandbox_user_")) {
    userId = crypto.randomUUID();
    localStorage.setItem("user_id", userId);
  }

  // 2. Real-time Listener for Mega-Viral Escalations (Spec v4 Addition 2)
  supabase
    .channel('mega_viral_alerts')
    .on('broadcast', { event: 'mega_viral_escalation' }, (payload) => {
      renderMegaViralAlert(payload.payload);
    })
    .subscribe();

  // 3. Check Connection (Filtered by RLS x-user-id header)
  const { data: tokenData, error } = await supabase
    .from("tiktok_tokens")
    .select("*")
    .maybeSingle();

  if (error) console.error("RLS Policy Check:", error.message);

  if (tokenData) {
    // UI: Connected State
    statusNode.textContent = "Connected to Sandbox";
    statusBlob.style.background = "#00ffa3";
    profileName.textContent = "TikTok Creator Account";
    button.textContent = "Account Linked";
    button.classList.replace("btn-primary", "btn-secondary");
    button.disabled = true;

    // Load spec-specific data components
    fetchAndRenderLeads(leadGrid);
    fetchAndRenderSparkline(sparklineContainer);
  } else {
    // UI: Disconnected State
    statusNode.textContent = "TikTok Account Not Linked";
    statusBlob.style.background = "#ff4444";
    leadGrid.innerHTML = `<p>Connect your account to begin comment ingestion.</p>`;
    sparklineContainer.innerHTML = `<p>Awaiting Shadow Mode data...</p>`;

    button.onclick = () => {
      button.disabled = true;
      button.textContent = "Opening TikTok...";
      const authUrl = `https://ozewbffmbicddicxenlg.supabase.co/functions/v1/tiktok-auth?user_id=${encodeURIComponent(userId)}`;
      window.location.href = authUrl;
    };
  }

  if (scanBtn) {
    scanBtn.onclick = async () => {
      scanBtn.disabled = true;
      scanBtn.textContent = "Scanning...";

      try {
        const { data, error: invokeError } = await supabase.functions.invoke("comment-monitor", {
          body: { user_id: localStorage.getItem("user_id") }
        });

        if (invokeError) throw invokeError;

        alert(`Scan complete! Processed ${data?.processed_count || 0} comments.`);
        location.reload();
      } catch (err) {
        console.error("Scan failed:", err);
        alert("Scan failed. Check Supabase Edge Function logs.");
      } finally {
        scanBtn.disabled = false;
        scanBtn.textContent = "Run Scan";
      }
    };
  }
}

/**
 * Render Mega-Viral Banner (Spec v4 Addition 2)
 */
function renderMegaViralAlert(data) {
  const anchor = document.getElementById("alert-anchor");
  const alertHtml = `
    <div class="card mega-viral-alert" style="border: 2px solid #ff4444; background: rgba(255, 68, 68, 0.1); margin-bottom: 25px; padding: 25px;">
      <h2 style="color: #ff4444; margin-top: 0;">🚨 MEGA-VIRAL EVENT DETECTED</h2>
      <p>Video <strong>${data.tiktok_video_id}</strong> has been viral for ${data.hours_in_viral} hours and is still spiking at ${data.current_spike_pct}%.</p>
      <p style="font-size: 14px; color: #ccc;">High-frequency polling paused to protect API limits. Escalating to human decision.</p>
      <div style="margin-top: 15px; display: flex; gap: 10px;">
        <button class="btn-primary btn-tiny" onclick="window.extendViral('${data.tiktok_video_id}', 24)">⚡ Extend 24 hrs</button>
        <button class="btn-secondary btn-tiny" onclick="window.stopViral('${data.tiktok_video_id}')">⏹ Keep paused</button>
      </div>
    </div>
  `;
  anchor.innerHTML = alertHtml;
}

/**
 * Fetch Leads with Private Account Logic (Spec v4 Addition 1)
 */
async function fetchAndRenderLeads(container) {
  const { data: leads, error } = await supabase
    .from("comment_logs")
    .select("*")
    .order("lead_score", { ascending: false })
    .limit(4);

  if (error || !leads || leads.length === 0) {
    container.innerHTML = `<p>No leads detected yet. Run a scan to populate the inbox.</p>`;
    return;
  }

  container.innerHTML = leads.map(lead => {
    const isPrivate = lead.account_is_private;
    return `
      <article class="lead-card">
        <div class="lead-card-top">
          <strong>@${lead.author_handle || 'user'}</strong>
          <span class="intent-chip">${lead.intent_label || 'analyzing'}</span>
        </div>
        <p class="comment-text">"${lead.content}"</p>
        <div class="lead-meta">
          <span class="lead-score">Lead Score: ${lead.lead_score}/100</span>
          ${isPrivate ? 
            `<div class="private-warning">
               <span class="account-badge is-private">🔒 Private Account</span>
               <p style="font-size: 10px; color: #666;">Reach unknown. Treat as high-intent.</p>
             </div>` : 
            `<span class="account-badge is-public">Public Account</span>`
          }
        </div>
        <div style="display: flex; gap: 8px; margin-top: 10px;">
          <button class="btn-tiny" onclick="window.rateLead('${lead.id}', 'approved')">Approve</button>
          <button class="btn-tiny" onclick="window.rateLead('${lead.id}', 'edited')">Edited</button>
          <button class="btn-tiny btn-secondary" onclick="window.rateLead('${lead.id}', 'rejected')">Reject</button>
        </div>
      </article>
    `;
  }).join("");
}

/**
 * Accuracy Trend Sparkline (Spec v4 Addition 3)
 */
async function fetchAndRenderSparkline(container) {
  const { data: logs } = await supabase
    .from("shadow_mode_accuracy_log")
    .select("accuracy_pct")
    .order("recorded_at", { ascending: true })
    .limit(7);

  if (!logs || logs.length < 2) {
    container.innerHTML = `<p class="sparkline-caption">Shadow Mode Day 1: Collecting baseline accuracy...</p>`;
    return;
  }

  const points = logs.map((log, i) => `${i * 30},${100 - log.accuracy_pct}`).join(" ");
  const currentAcc = logs[logs.length - 1].accuracy_pct;
  const trend = (currentAcc - logs[logs.length - 2].accuracy_pct).toFixed(1);

  container.innerHTML = `
    <div class="sparkline-wrap">
      <svg viewBox="0 0 180 100">
        <polyline class="sparkline-line" points="${points}" />
      </svg>
      <p class="sparkline-caption">
        Current Accuracy: <strong>${currentAcc}%</strong> 
        <span style="color: ${trend >= 0 ? '#00ffa3' : '#ff4444'}">
          (${trend >= 0 ? '▲' : '▼'} ${trend}%)
        </span>
      </p>
    </div>
  `;
}

// Attach Mega-Viral actions to window for HTML onclick access
window.extendViral = async (videoId, hours) => {
  await supabase.from('viral_queue').upsert({ 
    tiktok_video_id: videoId, 
    active_until: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() 
  });
  alert("Monitoring Extended");
  location.reload();
};

window.stopViral = async (videoId) => {
  await supabase.from('viral_queue').delete().eq('tiktok_video_id', videoId);
  await supabase.from('viral_mode_log').update({ ended_at: new Date() }).eq('tiktok_video_id', videoId);
  location.reload();
};

// Expose manual verification action so lead cards can record outcomes.
window.rateLead = async (id, status) => {
  const { error } = await supabase
    .from("comment_logs")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("Lead rating failed:", error);
    alert("Unable to save rating. Check logs and try again.");
    return;
  }

  const tiktokAccountId = localStorage.getItem("tiktok_account_id") || localStorage.getItem("user_id");
  await supabase.functions.invoke("accuracy_tracker", {
    body: { tiktok_account_id: tiktokAccountId, day_number: 1 }
  });

  location.reload();
};
