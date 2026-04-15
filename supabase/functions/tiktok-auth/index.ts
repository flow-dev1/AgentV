import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  // 1. Map to your EXACT vault names
  const CLIENT_KEY = Deno.env.get("TIKTOK_CLIENT_KEY_SANDBOX");
  const REDIRECT_URI = Deno.env.get("TIKTOK_REDIRECT_URI");

  // Debugging: If these aren't found, we'll show you why
  if (!CLIENT_KEY || !REDIRECT_URI) {
    return new Response(
      JSON.stringify({ 
        error: "Secrets not found in Supabase Environment",
        missing: { 
          CLIENT_KEY: !CLIENT_KEY, 
          REDIRECT_URI: !REDIRECT_URI 
        },
        tip: "Run: npx supabase secrets list"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Inside your tiktok-auth function...

const state = crypto.randomUUID();

// Define the scopes exactly as you requested
const scopes = [
  "user.info.basic",
  "video.publish",
  "video.upload",
  "user.info.profile",
  "user.info.stats",
  "video.list"
].join(" "); // Joins them with spaces

const params = new URLSearchParams({
  client_key: CLIENT_KEY,
  scope: scopes, // URLSearchParams will handle the encoding
  response_type: "code",
  redirect_uri: REDIRECT_URI,
  state: state,
});

const url = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;

return new Response(null, {
  status: 302,
  headers: { "Location": url }
});
});