import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // 1. Get code AND user_id from the frontend call
    const { code, user_id } = await req.json();

    const CLIENT_KEY = Deno.env.get("TIKTOK_CLIENT_KEY_SANDBOX")!;
    const CLIENT_SECRET = Deno.env.get("TIKTOK_CLIENT_SECRET_SANDBOX")!;
    const REDIRECT_URI = Deno.env.get("TIKTOK_REDIRECT_URI")!;

    // 2. Exchange code for tokens
    const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await res.json();
    
    // 3. Handle TikTok-specific errors (like expired codes)
    if (!data.access_token) {
      console.error("TikTok API Error:", data);
      return new Response(
        JSON.stringify({ error: data.error_description || "Token exchange failed", details: data }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 4. Save tokens linked to the user_id
    const { error } = await supabase.from("tiktok_tokens").upsert(
      {
        user_id: user_id || 'sandbox_default', // Link to your agent
        open_id: data.open_id,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        scope: data.scope,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        refresh_expires_at: new Date(Date.now() + data.refresh_expires_in * 1000).toISOString(),
      },
      { onConflict: "user_id" } // Ensures one agent = one TikTok account
    );

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, open_id: data.open_id }), 
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});