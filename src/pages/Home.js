import { supabase } from "../supabaseClient.js";

/**
 * Renders the Skeleton of the Home Page
 */
export function renderHome() {
  return `
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
          <div class="action-item"><span>Scan latest 10 comments</span> <button class="btn-tiny" id="run-scan-btn">Run</button></div>
          <div class="action-item"><span>Verify AI Drafts</span> <button class="btn-tiny" onclick="window.location.href='/demo'">Review</button></div>
        </div>
      </section>
    </div>

    <section class="section card">
      <h2>Priority Inbox Leads</h2>
      <div class="lead-grid" id="live-lead-grid">
        <p class="loading-text">Fetching latest leads...</p>
      </div>
    </section>
  `;
}

/**
 * Logic & Data Fetching
 */
export async function initHome() {
  const statusNode = document.getElementById("tiktok-connection-status");
  const profileName = document.getElementById("profile-name");
  const button = document.getElementById("connect-tiktok-btn");
  const statusBlob = document.getElementById("status-blob");
  const leadGrid = document.getElementById("live-lead-grid");
  const sparklineContainer = document.getElementById("sparkline-container");
  
  if (!statusNode || !button) return;

  // 1. ENSURE SECURE IDENTITY
  // Upgrade from 'sandbox_user_default' to a secure UUID if needed
  let userId = localStorage.getItem("user_id");
  if (!userId || userId.startsWith("sandbox_user_")) { 
    userId = crypto.randomUUID(); 
    localStorage.setItem("user_id", userId);
  }

  // 2. CHECK CONNECTION
  // We no longer need .eq("user_id", userId) because the RLS policy 
  // and the 'x-user-id' header handle the filtering automatically
  const { data: tokenData, error } = await supabase
    .from("tiktok_tokens")
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Connection check failed. Check your RLS policy:", error.message);
  }

  if (tokenData) {
    // RENDER: Connected UI
    statusNode.textContent = "Connected to Sandbox";
    statusBlob.style.background = "#00ffa3";
    profileName.textContent = "TikTok Creator Account";
    button.textContent = "View Analytics";
    button.classList.replace("btn-primary", "btn-secondary");
    button.onclick = () => window.location.href = "/demo";

    // Load your Live Dashboard Features
    fetchAndRenderLeads(leadGrid); // Removed open_id param as RLS filters this too
    fetchAndRenderSparkline(sparklineContainer);
  } else {
    // RENDER: Disconnected UI
    statusNode.textContent = "TikTok Account Not Linked";
    statusBlob.style.background = "#ff4444";
    
    button.onclick = () => {
      button.disabled = true;
      button.textContent = "Opening TikTok...";
      const baseUrl = "https://ozewbffmbicddicxenlg.supabase.co";
      window.location.href = `${baseUrl}/functions/v1/tiktok-auth?user_id=${encodeURIComponent(userId)}`;
    };
  }
}

    // 2. Fetch Live Leads (Comment Logs)
    fetchAndRenderLeads(leadGrid, tokenData.open_id);

    // 3. Fetch Accuracy Trend (Sparkline)
    fetchAndRenderSparkline(sparklineContainer, tokenData.open_id);

    // 4.  Listen for Mega-Viral Escalations
const channel = supabase
.channel('mega_viral_alerts')
.on('broadcast', { event: 'mega_viral_escalation' }, (payload) => {
  renderMegaViralAlert(payload.payload);
})
.subscribe();

function renderMegaViralAlert(data) {
const container = document.getElementById("connection-panel"); // Or a dedicated alert div
const alertHtml = `
  <div class="card mega-viral-alert" style="border: 2px solid #ff4444; background: rgba(255, 68, 68, 0.1); margin-bottom: 20px;">
    <h2 style="color: #ff4444;">🚨 MEGA-VIRAL EVENT DETECTED</h2>
    <p>Video ${data.tiktok_video_id} has been viral for ${data.hours_in_viral} hours.</p>
    <p>Current spike: <strong>+${data.current_spike_pct}%</strong>. Still growing.</p>
    <div style="margin-top: 15px;">
      <button class="btn-tiny" onclick="extendViral('${data.tiktok_video_id}', 24)">⚡ Extend 24 hrs</button>
      <button class="btn-secondary btn-tiny" onclick="stopViral('${data.tiktok_video_id}')">⏹ Keep paused</button>
    </div>
  </div>
`;
container.insertAdjacentHTML('beforebegin', alertHtml);
}

  } else {
    statusNode.textContent = "TikTok Account Not Linked";
    statusBlob.style.background = "#ff4444";
    leadGrid.innerHTML = `<p>Connect your account to see lead intelligence.</p>`;
    sparklineContainer.innerHTML = `<p>Awaiting connection data...</p>`;
    
    button.addEventListener("click", () => {
      window.location.href = `https://ozewbffmbicddicxenlg.supabase.co/functions/v1/tiktok-auth?user_id=${userId}`;
    });
  }
}

/**
 * Addition 1 & Phase 1: Render Real Leads with Private Badge
 */
async function fetchAndRenderLeads(container, accountId) {
  const { data: leads, error } = await supabase
    .from("comment_logs")
    .select("*")
    .order("lead_score", { ascending: false })
    .limit(4);

  if (error || !leads || leads.length === 0) {
    container.innerHTML = `<p>No leads detected yet. Run a scan to begin.</p>`;
    return;
  }

  container.innerHTML = leads.map(lead => `
    <article class="lead-card">
      <div class="lead-card-top">
        <strong>@${lead.author_handle || 'hidden_user'}</strong>
        <span class="intent-chip">${lead.intent_label || 'analyzing'}</span>
      </div>
      <p class="comment-text">"${lead.content}"</p>
      <div class="lead-meta">
        <span class="lead-score">Score: ${lead.lead_score}/100</span>
        ${lead.account_is_private ? 
          `<span class="account-badge is-private" title="Follower reach unknown. Treat as high-intent.">🔒 Private</span>` : 
          `<span class="account-badge is-public">Public</span>`
        }
      </div>
    </article>
  `).join("");
}

/**
 * Addition 3: Accuracy Trend Sparkline from DB
 */
async function fetchAndRenderSparkline(container, accountId) {
  const { data: logs } = await supabase
    .from("shadow_mode_accuracy_log")
    .select("accuracy_pct")
    .order("recorded_at", { ascending: true })
    .limit(7);

  if (!logs || logs.length < 2) {
    container.innerHTML = `<p class="sparkline-caption">Not enough data for trend. (Min 2 days)</p>`;
    return;
  }

  const points = logs.map((log, i) => `${i * 30},${100 - log.accuracy_pct}`).join(" ");
  const currentAcc = logs[logs.length - 1].accuracy_pct;
  const prevAcc = logs[logs.length - 2].accuracy_pct;
  const trend = (currentAcc - prevAcc).toFixed(1);

  container.innerHTML = `
    <div class="sparkline-wrap">
      <svg viewBox="0 0 180 100">
        <polyline class="sparkline-line" points="${points}" />
      </svg>
      <p class="sparkline-caption">
        Current: ${currentAcc}% 
        <span style="color: ${trend >= 0 ? '#00ffa3' : '#ff4444'}">
          (${trend >= 0 ? '▲' : '▼'} ${trend}%)
        </span>
      </p>
    </div>
  `;
}