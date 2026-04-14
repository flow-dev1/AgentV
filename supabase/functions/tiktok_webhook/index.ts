import "@supabase/functions-js/edge-runtime.d.ts";

const FUNCTION_NAME = "tiktok_webhook";

type RequestBody = {
  eventType?: string;
  traceId?: string;
  payload?: Record<string, unknown>;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return jsonResponse(
        { ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Use POST." } },
        405,
      );
    }

    const body = (await req.json()) as RequestBody;

    // TODO(v4): Validate TikTok signature and handshake challenge.
    // TODO(v4): Route event payloads into comment_monitor or downstream queue.
    return jsonResponse({
      ok: true,
      function: FUNCTION_NAME,
      eventType: body.eventType ?? "unknown",
      traceId: body.traceId ?? crypto.randomUUID(),
      receivedAt: new Date().toISOString(),
      nextStep: "Forward payload to comment_monitor",
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: { code: "UNHANDLED_ERROR", message: (error as Error).message },
      },
      500,
    );
  }
});
