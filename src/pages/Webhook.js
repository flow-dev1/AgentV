const samples = {
  endpoint: "POST /v1/webhooks/tiktok/events",
  signatureHeader: "x-agentv-signature: sha256=<digest>",
  exampleScope: "webhook.events.read",
};

export function renderWebhook() {
  return `
    <section class="card">
      <h1>Webhook API Reference</h1>
      <p>Use these references to register and secure your webhook endpoint.</p>
      <div class="code-row">
        <code>${samples.endpoint}</code>
        <button class="btn-secondary copy-btn" data-copy="${samples.endpoint}">Copy</button>
      </div>
      <div class="code-row">
        <code>${samples.signatureHeader}</code>
        <button class="btn-secondary copy-btn" data-copy="${samples.signatureHeader}">Copy</button>
      </div>
    </section>

    <section class="card section">
      <h2>Scopes</h2>
      <table class="scopes-table">
        <thead>
          <tr><th>Scope</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td>${samples.exampleScope}</td><td>Read webhook event payloads.</td></tr>
          <tr><td>webhook.subscriptions.write</td><td>Create and update subscriptions.</td></tr>
          <tr><td>oauth.tokens.read</td><td>View token metadata for diagnostics.</td></tr>
        </tbody>
      </table>
    </section>
  `;
}

export function initWebhook() {
  const buttons = Array.from(document.querySelectorAll(".copy-btn"));
  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.dataset.copy || "";
      await navigator.clipboard.writeText(text);
      const old = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => {
        button.textContent = old;
      }, 1200);
    });
  });
}
