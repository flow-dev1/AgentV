import "@supabase/functions-js/edge-runtime.d.ts";

const FUNCTION_NAME = "script_fuzzy_matcher";

type RequestBody = {
  traceId?: string;
  videoId?: string;
  caption?: string;
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

    // TODO(v4): Fuzzy-match posted videos against archived AI brief scripts.
    // TODO(v4): Return best-match candidates and confidence score.
    return jsonResponse({
      ok: true,
      function: FUNCTION_NAME,
      traceId: body.traceId ?? crypto.randomUUID(),
      videoId: body.videoId ?? null,
      matches: [],
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
