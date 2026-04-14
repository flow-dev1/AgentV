import "@supabase/functions-js/edge-runtime.d.ts";

const FUNCTION_NAME = "trend_analyzer";

type RequestBody = {
  traceId?: string;
  weekStart?: string;
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

    // TODO(v4): Build weekly digest from enriched leads, tags, and accuracy data.
    // TODO(v4): Produce trend opportunities and competitor signal deltas.
    return jsonResponse({
      ok: true,
      function: FUNCTION_NAME,
      traceId: body.traceId ?? crypto.randomUUID(),
      weekStart: body.weekStart ?? null,
      insights: [],
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
