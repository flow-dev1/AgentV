import "@supabase/functions-js/edge-runtime.d.ts";

const FUNCTION_NAME = "accuracy_tracker";

type RequestBody = {
  traceId?: string;
  rating?: number;
  draftId?: string;
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

    // TODO(v4): Aggregate daily shadow-mode quality ratings for 7-day onboarding.
    // TODO(v4): Return trend datapoints consumed by UI sparkline panel.
    return jsonResponse({
      ok: true,
      function: FUNCTION_NAME,
      traceId: body.traceId ?? crypto.randomUUID(),
      draftId: body.draftId ?? null,
      rating: body.rating ?? null,
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
