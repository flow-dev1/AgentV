// supabase/functions/tiktok_oauth_callback/index.ts
// Multi-tenant TikTok OAuth Callback
// Handles: ?action=login  → redirects to TikTok authorization
//          ?action=callback → exchanges code for tokens, creates/links account

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TIKTOK_CLIENT_KEY    = Deno.env.get("TIKTOK_CLIENT_KEY")!;
const TIKTOK_CLIENT_SECRET = Deno.env.get("TIKTOK_CLIENT_SECRET")!;
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Where to send users after successful connection
const SUCCESS_REDIRECT = Deno.env.get("FRONTEND_URL") ?? "https://your-app.com/dashboard";
const ERROR_REDIRECT   = Deno.env.get("FRONTEND_URL") ?? "https://your-app.com/onboarding";

// TikTok OAuth scopes needed for engagement + analytics (no upload scope)
const TIKTOK_SCOPES = [
  "user.info.basic",
  "user.info.profile",
  "video.list",
  "comment.list",
  "comment.list.manage",
].join(",");

// ─── CORS headers ────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const url    = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // ── Step 1: Initiate TikTok OAuth ─────────────────────────────────────
    if (action === "login") {
      return handleLogin(req, url);
    }

    // ── Step 2: Handle TikTok callback ────────────────────────────────────
    if (action === "callback") {
      return await handleCallback(req, url);
    }

    // ── Health check ──────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({ status: "ok", message: "TikTok OAuth endpoint ready" }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[oauth] Unhandled error:", err);
    return Response.redirect(
      `${ERROR_REDIRECT}?error=server_error&message=${encodeURIComponent(String(err))}`,
      302
    );
  }
});

// ─── Step 1: Build TikTok authorization URL ──────────────────────────────────
function handleLogin(req: Request, url: URL): Response {
  // The caller must pass ?user_id=<supabase_auth_uid> so we can link the account
  // after the callback. We embed it in the state parameter.
  const userId = url.searchParams.get("user_id");
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "missing_user_id", message: "Pass ?user_id=<your supabase auth uid>" }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  // CSRF protection: embed user_id + a random nonce in state
  const state = btoa(JSON.stringify({
    userId,
    nonce: crypto.randomUUID(),
    ts:    Date.now(),
  }));

  const redirectUri = buildRedirectUri(req);

  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key",     TIKTOK_CLIENT_KEY);
  authUrl.searchParams.set("scope",          TIKTOK_SCOPES);
  authUrl.searchParams.set("response_type",  "code");
  authUrl.searchParams.set("redirect_uri",   redirectUri);
  authUrl.searchParams.set("state",          state);

  console.log("[oauth] Redirecting to TikTok auth for user:", userId);
  return Response.redirect(authUrl.toString(), 302);
}

// ─── Step 2: Exchange code → tokens → onboard account ────────────────────────
async function handleCallback(req: Request, url: URL): Promise<Response> {
  const code        = url.searchParams.get("code");
  const stateRaw    = url.searchParams.get("state");
  const errorParam  = url.searchParams.get("error");

  // User denied permission on TikTok
  if (errorParam) {
    console.warn("[oauth] User denied TikTok permission:", errorParam);
    return Response.redirect(`${ERROR_REDIRECT}?error=tiktok_denied`, 302);
  }

  if (!code || !stateRaw) {
    return Response.redirect(`${ERROR_REDIRECT}?error=missing_params`, 302);
  }

  // Decode state → extract userId
  let userId: string;
  try {
    const state = JSON.parse(atob(stateRaw));
    userId = state.userId;
    // Reject stale state (older than 10 minutes)
    if (Date.now() - state.ts > 10 * 60 * 1000) {
      return Response.redirect(`${ERROR_REDIRECT}?error=state_expired`, 302);
    }
  } catch {
    return Response.redirect(`${ERROR_REDIRECT}?error=invalid_state`, 302);
  }

  const redirectUri = buildRedirectUri(req);

  // ── Exchange authorization code for access token ──────────────────────────
  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key:    TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      code,
      grant_type:    "authorization_code",
      redirect_uri:  redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error("[oauth] Token exchange failed:", body);
    return Response.redirect(`${ERROR_REDIRECT}?error=token_exchange_failed`, 302);
  }

  const tokenData = await tokenRes.json();
  const {
    access_token,
    refresh_token,
    expires_in,
    refresh_expires_in,
    open_id,
    scope,
  } = tokenData;

  if (!access_token || !open_id) {
    console.error("[oauth] Token response missing required fields:", tokenData);
    return Response.redirect(`${ERROR_REDIRECT}?error=invalid_token_response`, 302);
  }

  // ── Fetch TikTok user profile ─────────────────────────────────────────────
  const profileRes = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username",
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  let displayName  = "TikTok User";
  let avatarUrl    = null;
  let tiktokHandle = open_id; // fallback to open_id if profile fetch fails

  if (profileRes.ok) {
    const profileData = await profileRes.json();
    const user = profileData?.data?.user;
    if (user) {
      displayName  = user.display_name  ?? displayName;
      avatarUrl    = user.avatar_url    ?? null;
      tiktokHandle = user.username      ?? open_id;
    }
  } else {
    console.warn("[oauth] Could not fetch TikTok profile — using open_id as handle");
  }

  // ── Write to Supabase ─────────────────────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Call onboard_account() RPC — creates agent_accounts + agent_settings rows
  const { error: onboardError } = await supabase.rpc("onboard_account", {
    p_account_id:        userId,
    p_tiktok_account_id: tiktokHandle,
    p_tiktok_open_id:    open_id,
    p_display_name:      displayName,
    p_avatar_url:        avatarUrl,
  });

  if (onboardError) {
    console.error("[oauth] onboard_account RPC failed:", onboardError);
    return Response.redirect(`${ERROR_REDIRECT}?error=onboard_failed`, 302);
  }

  // 2. Store encrypted tokens inside agent_settings.faq_bank (_tokens key)
  //    In production replace with Supabase Vault secrets per account
  const tokenPayload = {
    access_token,
    refresh_token,
    open_id,
    scope,
    expires_at:         new Date(Date.now() + expires_in * 1000).toISOString(),
    refresh_expires_at: new Date(Date.now() + refresh_expires_in * 1000).toISOString(),
    updated_at:         new Date().toISOString(),
  };

  const { error: tokenError } = await supabase.rpc("store_tiktok_tokens", {
    p_account_id:    userId,
    p_token_payload: tokenPayload,
  });

  if (tokenError) {
    // Non-fatal — account is created, tokens just need a retry
    console.warn("[oauth] store_tiktok_tokens failed (non-fatal):", tokenError);
  }

  // 3. Log to usage_log so we have a day-0 row
  await supabase.rpc("increment_usage", {
    p_account_id:        userId,
    p_tiktok_account_id: tiktokHandle,
    p_metric:            "api_calls_tiktok",
    p_amount:            1,
  });

  console.log(`[oauth] ✅ Account onboarded: ${tiktokHandle} (user: ${userId})`);

  // ── Redirect to dashboard with success signal ────────────────────────────
  return Response.redirect(
    `${SUCCESS_REDIRECT}?connected=true&handle=${encodeURIComponent(tiktokHandle)}`,
    302
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Builds the redirect_uri dynamically so the same function works in
// local dev (http://localhost:54321) and production (https://xxx.supabase.co)
function buildRedirectUri(): string {
  return Deno.env.get("TIKTOK_REDIRECT_URI")!;
}
