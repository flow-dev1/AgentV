// Ensure this matches the function name in your Supabase 'functions' folder!
// Based on your error log, it is 'tiktok_oauth_callback'
const CALLBACK_URL = "https://ozewbffmbicddicxenlg.supabase.co/functions/v1/tiktok-callback";

export function renderCallback() {
  return `
    <div class="callback-container" style="padding: 60px; text-align: center; color: white;">
      <div class="card" style="background: #1a1a1a; border: 1px solid #333; padding: 40px; border-radius: 12px; display: inline-block;">
        <h2 id="status-title" style="margin-bottom: 10px;">Linking Account...</h2>
        <div class="spinner" style="margin: 20px auto; width: 30px; height: 30px; border: 3px solid #333; border-top-color: #00ffa3; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p id="status-text" style="color: #888;">Exchanging TikTok code for secure tokens.</p>
      </div>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `;
}

export async function initCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");
  
  // We target 'page-root' because that's what your router.js uses
  const root = document.getElementById("page-root"); 

  if (error || !code) {
    root.innerHTML = `
      <div class="card" style="padding:40px; color: #ff4444; text-align: center;">
        <h3>Connection Failed</h3>
        <p>${error || "No authorization code received from TikTok."}</p>
        <a href="/" style="color: white; text-decoration: underline; margin-top: 20px; display: block;">Back to Dashboard</a>
      </div>`;
    return;
  }

  try {
    // 1. Get the local user session
    const userId = localStorage.getItem("user_id") || "sandbox_user_default";

    // 2. Call the Edge Function
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
      // 3. Update UI on Success
      root.innerHTML = `
        <div class="card" style="padding:40px; text-align:center;">
          <h2 style="color: #00ffa3; margin-bottom: 10px;">✅ Account Linked!</h2>
          <p>Your TikTok Sandbox account is now connected.</p>
          <p style="font-size: 14px; color: #888; margin-top: 10px;">Redirecting you back...</p>
        </div>`;

      setTimeout(() => {
        window.location.href = "/";
      }, 2500);
      
    } else {
      // 4. Handle token exchange errors (API level)
      throw new Error(data.error || data.detail?.error_description || "Token exchange failed");
    }
  } catch (err) {
    // 5. Catch Network/Logic errors
    root.innerHTML = `
      <div class="card" style="padding:40px; color: #ff4444; text-align: center;">
        <h3>Exchange Error</h3>
        <p style="background: rgba(255,0,0,0.1); padding: 10px; border-radius: 4px;">${err.message}</p>
        <p style="font-size: 12px; color: #666; margin-top: 15px;">Check Supabase Logs for details.</p>
        <a href="/" style="color: white; margin-top: 20px; display: block; text-decoration: underline;">Return to Home</a>
      </div>`;
  }
}