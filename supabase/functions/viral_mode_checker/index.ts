import "@supabase/functions-js/edge-runtime.d.ts";

const FUNCTION_NAME = "viral_mode_checker";

type RequestBody = {
  traceId?: string;
  videoId?: string;
  velocityScore?: number;
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
    const velocityScore = body.velocityScore ?? 0;

    // TODO(v4): Detect mega-viral thresholds and pause automation safely.
    // TODO(v4): Emit escalation state for Viral Monitor human-in-the-loop controls.
    return jsonResponse({
      ok: true,
      function: FUNCTION_NAME,
      traceId: body.traceId ?? crypto.randomUUID(),
      videoId: body.videoId ?? null,
      velocityScore,
      escalationStatus: velocityScore >= 90 ? "mega_viral" : "normal",
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
