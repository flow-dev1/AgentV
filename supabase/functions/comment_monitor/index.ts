import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const FUNCTION_NAME = "comment_monitor";

type RequestBody = {
  traceId?: string;
  videoId?: string;
  cursor?: string;
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

    // TODO(v4): Poll TikTok comments and normalize ingestion envelope.
    // TODO(v4): Trigger engagement_router for each normalized comment item.
    return jsonResponse({
      ok: true,
      function: FUNCTION_NAME,
      traceId: body.traceId ?? crypto.randomUUID(),
      videoId: body.videoId ?? null,
      cursor: body.cursor ?? null,
      receivedAt: new Date().toISOString(),
      nextStep: "Dispatch normalized comments to engagement_router",
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
