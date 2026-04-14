import "@supabase/functions-js/edge-runtime.d.ts";

const FUNCTION_NAME = "engagement_router";

type RequestBody = {
  traceId?: string;
  commentText?: string;
  authorHandle?: string;
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
    const commentText = body.commentText ?? "";

    // TODO(v4): Apply regex-first PII scrub pass.
    // TODO(v4): Apply contextual LLM scrub pass and classify intent/sentiment.
    return jsonResponse({
      ok: true,
      function: FUNCTION_NAME,
      traceId: body.traceId ?? crypto.randomUUID(),
      authorHandle: body.authorHandle ?? null,
      piiScrubbedPreview: commentText.slice(0, 120),
      routeTargets: ["follower_enricher", "video_auto_tagger", "viral_mode_checker"],
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
