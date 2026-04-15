Deno.serve(async (req) => {
  // 1. Immediate 200 OK for TikTok's "Test URL" and verification
  if (req.method === 'POST') {
    const body = await req.json();
    
    // Log for debugging during the Developer Portal setup
    console.log("Incoming Webhook:", body);

    // TikTok requires an immediate 200 response to acknowledge receipt
    return new Response(JSON.stringify({ message: "ok" }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
})