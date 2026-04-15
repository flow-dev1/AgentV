const CALLBACK_URL = "https://ozewbffmbicddicxenlg.supabase.co/functions/v1/tiktok-callback";

export function renderCallback() {
  return `
    <div class="callback-container" style="padding: 60px; text-align: center; color: white;">
      <div class="card" style="background: #1a1a1a; border: 1px solid #333; padding: 40px; border-radius: 12px; display: inline-block;">
        <h2 id="status-title">Linking Account...</h2>
        <p id="status-text">Exchanging TikTok code for secure tokens.</p>
      </div>
    </div>
  `;
}

export async function initCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");
  
  // Important: Match the ID from your index.html
  const appContainer = document.getElementById("app"); 

  if (error || !code) {
    appContainer.innerHTML = `
      <div class="card" style="padding:40px; color: #ff4444;">
        <h3>Connection Failed</h3>
        <p>${error || "No authorization code received."}</p>
        <a href="/" style="color: white; text-decoration: underline;">Back to Dashboard</a>
      </div>`;
    return;
  }

  try {
    // Grab the user_id we generated/stored in Home.js
    const userId = localStorage.getItem("user_id") || "sandbox_user_default";

    const res = await fetch(CALLBACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        code: code,
        user_id: userId 
      }),
    });

    const data = await res.json();

    if (data.success) {
      appContainer.innerHTML = `
        <div class="card" style="padding:40px; text-align:center;">
          <h2 style="color: #00ffa3;">✅ Success!</h2>
          <p>TikTok account linked to AgentV.</p>
          <p>Redirecting to dashboard...</p>
        </div>`;

      // Return home to see the "Connected" status
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } else {
      throw new Error(data.error || "Token exchange failed");
    }
  } catch (err) {
    appContainer.innerHTML = `
      <div class="card" style="padding:40px; color: #ff4444;">
        <h3>Exchange Error</h3>
        <p>${err.message}</p>
        <pre style="font-size: 10px; color: #666;">${JSON.stringify(err, null, 2)}</pre>
        <a href="/" style="color: white; margin-top: 10px; display: block;">Try Again</a>
      </div>`;
  }
}