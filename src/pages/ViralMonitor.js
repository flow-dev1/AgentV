export function renderViralMonitor() {
  return `
    <section class="card">
      <h1>Viral Monitor</h1>
      <p>
        Human-in-the-loop controls for black-swan traffic spikes and automation
        pause windows.
      </p>
    </section>

    <section class="card section viral-escalation-card">
      <div class="viral-header">
        <h2>Mega-Viral Escalation</h2>
        <span class="intent-chip">Escalated</span>
      </div>
      <p>
        Video <strong>#9812741</strong> crossed velocity threshold with a 212%
        engagement surge in 45 minutes.
      </p>
      <ul>
        <li>Auto-replies paused to reduce brand risk.</li>
        <li>12 high-priority comments waiting for manual approval.</li>
        <li>Keep-alive timer expires in 3h 12m.</li>
      </ul>
      <div class="viral-actions">
        <button class="btn-primary" type="button">Extend 24 hrs</button>
        <button class="btn-secondary" type="button">Keep Paused</button>
      </div>
    </section>
  `;
}
