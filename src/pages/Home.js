import { supabase } from "../supabaseClient.js";

/**
 * Renders the HTML Structure of the Home Page
 */
export function renderHome() {
  const leadCards = [
    { handle: "@studiofounder", score: 91, private: true, intent: "buy_intent" },
    { handle: "@ugc_creator", score: 82, private: false, intent: "collab_intent" },
    { handle: "@brandoperator", score: 76, private: true, intent: "faq_then_buy" },
  ];

  const sparklineData = [71, 74, 75, 78, 81, 84, 86];
  const sparklinePoints = sparklineData
    .map((value, index) => `${index * 30},${100 - value}`)
    .join(" ");

  const leadMarkup = leadCards
    .map(
      (lead) => `
      <article class="lead-card">
        <div class="lead-card-top">
          <strong>${lead.handle}</strong>
          <span class="intent-chip">${lead.intent}</span>
        </div>
        <div class="lead-meta">
          <span class="lead-score">Lead Score: ${lead.score}</span>
          <span class="account-badge ${lead.private ? "is-private" : "is-public"}">
            ${lead.private ? "Private Account" : "Public Account"}
          </span>
        </div>
      </article>
    `
    )
    .join("");

  return `
    <section class="card connection-status-card">
      <div>
        <h3>Platform Integration</h3>
        <p>
          Status: 
          <strong id="tiktok-connection-status">Checking connection...</strong>
        </p>
      </div>
      <button 
        id="connect-tiktok-btn" 
        class="btn-primary" 
        type="button"
      >
        Connect TikTok Sandbox
      </button>
    </section>

    <section class="card shadow-mode-panel">
      <div>
        <h2>Shadow Mode Accuracy (Day 7)</h2>
        <p>Track daily model precision while rating AI drafts before publish.</p>
      </div>
      <div class="sparkline-wrap" aria-label="7 day accuracy trend">
        <svg viewBox="0 0 180 100" role="img" aria-label="Accuracy trend sparkline">
          <polyline class="sparkline-line" points="${sparklinePoints}" />
        </svg>
        <p class="sparkline-caption">7-day avg: 78.4% → 86.0%</p>
      </div>
    </section>

    <section class="hero card">
      <h1>Build reliable TikTok automations with AgentV</h1>
      <p>
        Unified webhook ingestion, secure OAuth flows, and real-time observability 
        for campaign and creator tooling.
      </p>
      <a class="btn-primary" href="/demo">Explore live demo</a>
    </section>

    <section class="section card">
      <h2>How it works</h2>
      <div class="grid-3">
        <article>
          <h3>1. Connect</h3>
          <p>Authorize accounts and choose granular permissions per workspace.</p>
        </article>
        <article>
          <h3>2. Receive</h3>
          <p>Subscribe to webhook events and route payloads into your data stack.</p>
        </article>
        <article>
          <h3>3. Act</h3>
          <p>Trigger internal automations from normalized event envelopes.</p>
        </article>
      </div>
    </section>

    <section class="section card">
      <h2>Priority Inbox Leads</h2>
      <p>Private Account badges and lead scoring from the v4 intelligence loop.</p>
      <div class="lead-grid">
        ${leadMarkup}
      </div>
    </section>

    <section class="section card">
      <h2>Feature highlights</h2>
      <div class="grid-3">
        <article><h3>Tenant isolation</h3><p>Per-tenant secrets and scoped tokens.</p></article>
        <article><h3>Replay protection</h3><p>Signature checks and idempotency keys.</p></article>
        <article><h3>Audit trails</h3><p>End-to-end request and action visibility.</p></article>
      </div>
    </section>
  `;
}

/**
 * Helper to verify connection with Supabase
 */
async function checkConnection() {
  try {
    const { data } = await supabase.from("tiktok_tokens").select("open_id").maybeSingle();
    return Boolean(data);
  } catch (e) {
    return false;
  }
}

/**
 * Initializes Event Listeners and Logic for the Home Page
 */
export async function initHome() {
  const statusNode = document.getElementById("tiktok-connection-status");
  const button = document.getElementById("connect-tiktok-btn");
  if (!statusNode || !button) return;

  const setLoading = (loading) => {
    button.disabled = loading;
    button.classList.toggle("loading", loading);
    button.textContent = loading ? "Opening TikTok..." : "Connect TikTok Sandbox";
  };

  // 1. Initial Status Check
  const connected = await checkConnection();
  if (connected) {
    statusNode.textContent = "Connected to Sandbox";
    button.textContent = "Account Linked";
    button.classList.replace("btn-primary", "btn-secondary");
    button.disabled = true;
    return;
  }

  statusNode.textContent = "Disconnected";

  // 2. Click Handler
  button.addEventListener("click", () => {
    setLoading(true);

    // Sandbox Fix: If user_id is missing, we create a default one to avoid the error
    let userId = localStorage.getItem("user_id");
    if (!userId) {
      userId = "sandbox_user_" + Math.floor(Math.random() * 1000);
      localStorage.setItem("user_id", userId);
      console.log("AgentV: Created sandbox user_id:", userId);
    }

    // Direct Browser Navigation (Bypasses CORS/Preflight issues)
    // Points to the function we deployed earlier
    const baseUrl = "https://ozewbffmbicddicxenlg.supabase.co"; // Replace with VITE_SUPABASE_URL if Vite is working
    const url = `${baseUrl}/functions/v1/tiktok-auth?user_id=${encodeURIComponent(userId)}`;
    
    window.location.href = url;
  });
}