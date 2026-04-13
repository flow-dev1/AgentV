export function renderHome() {
  return `
    <section class="hero card">
      <h1>Build reliable TikTok automations with AgentV</h1>
      <p>
        Unified webhook ingestion, secure OAuth flows, and real-time observability
        for campaign and creator tooling.
      </p>
      <a class="btn-primary" href="#/demo">Explore live demo</a>
    </section>

    <section class="section card">
      <h2>How it works</h2>
      <div class="grid-3">
        <article>
          <h3>1. Connect</h3>
          <p>Authorize accounts and choose granular permissions per workspace.</p>
        </article>
        <article>
          <h3>2. Receive</h3>
          <p>Subscribe to webhook events and route payloads into your data stack.</p>
        </article>
        <article>
          <h3>3. Act</h3>
          <p>Trigger internal automations from normalized event envelopes.</p>
        </article>
      </div>
    </section>

    <section class="section card">
      <h2>Feature highlights</h2>
      <div class="grid-3">
        <article><h3>Tenant isolation</h3><p>Per-tenant secrets and scoped tokens.</p></article>
        <article><h3>Replay protection</h3><p>Signature checks and idempotency keys.</p></article>
        <article><h3>Audit trails</h3><p>End-to-end request and action visibility.</p></article>
      </div>
    </section>
  `;
}
