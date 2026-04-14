import "@supabase/functions-js/edge-runtime.d.ts";

const FUNCTION_NAME = "follower_enricher";

type RequestBody = {
  traceId?: string;
  authorHandle?: string;
  intent?: string;
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

    // TODO(v4): Gate user.info.stats calls by intent and confidence thresholds.
    // TODO(v4): Compute composite lead score and push enriched profile payload.
    return jsonResponse({
      ok: true,
      function: FUNCTION_NAME,
      traceId: body.traceId ?? crypto.randomUUID(),
      authorHandle: body.authorHandle ?? null,
      intent: body.intent ?? "unknown",
      leadScore: null,
      receivedAt: new Date().toISOString(),
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
