import "@supabase/functions-js/edge-runtime.d.ts";

const FUNCTION_NAME = "video_auto_tagger";

type RequestBody = {
  traceId?: string;
  videoId?: string;
  transcript?: string;
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

    // TODO(v4): Classify hook style and topic clusters from transcript/caption.
    // TODO(v4): Gate auto-tags by confidence threshold and store review queue.
    return jsonResponse({
      ok: true,
      function: FUNCTION_NAME,
      traceId: body.traceId ?? crypto.randomUUID(),
      videoId: body.videoId ?? null,
      tags: [],
      confidence: null,
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
