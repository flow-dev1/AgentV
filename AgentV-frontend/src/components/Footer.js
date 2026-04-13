export function renderFooter() {
  return `
    <footer class="footer">
      <div class="container footer-inner">
        <p>© ${new Date().getFullYear()} AgentV. All rights reserved.</p>
        <nav class="footer-links" aria-label="Footer links">
          <a href="#/">Home</a>
          <a href="#/demo">Demo</a>
          <a href="#/privacy">Privacy</a>
          <a href="#/terms">Terms</a>
        </nav>
      </div>
    </footer>
  `;
}
