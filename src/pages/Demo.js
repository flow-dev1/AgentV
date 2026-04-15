export function renderDemo() {
  return `
    <section class="card">
      <h1>Interactive Demo Dashboard</h1>
      <p>Switch tabs to preview key AgentV workflow surfaces.</p>
      <div class="tabs" role="tablist" aria-label="Demo tabs">
        <button class="tab is-active" data-tab="overview" role="tab">Overview</button>
        <button class="tab" data-tab="events" role="tab">Events</button>
        <button class="tab" data-tab="automation" role="tab">Automation</button>
      </div>
      <div class="tab-panels">
        <section class="tab-panel" data-panel="overview">
          <h2>System Overview</h2>
          <p>Live status of OAuth links, webhook health, and queued jobs.</p>
        </section>
        <section class="tab-panel hidden" data-panel="events">
          <h2>Event Stream</h2>
          <p>Normalized TikTok payloads with signatures and replay metadata.</p>
        </section>
        <section class="tab-panel hidden" data-panel="automation">
          <h2>Automation Runs</h2>
          <p>Action traces from trigger to completion, with retry visibility.</p>
        </section>
      </div>
    </section>
  `;
}

export function initDemo() {
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach((btn) => btn.classList.toggle("is-active", btn === tab));
      panels.forEach((panel) => {
        panel.classList.toggle("hidden", panel.dataset.panel !== target);
      });
    });
  });
}
