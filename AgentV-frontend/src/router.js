import { renderNav, initNav } from "./components/Nav.js";
import { renderFooter } from "./components/Footer.js";
import { renderHome } from "./pages/Home.js";
import { renderDemo, initDemo } from "./pages/Demo.js";
import { renderViralMonitor } from "./pages/ViralMonitor.js";
import { renderPrivacy } from "./pages/Privacy.js";
import { renderToS } from "./pages/Terms.js";

const routes = {
  "/": { render: renderHome },
  "/demo": { render: renderDemo, init: initDemo },
  "/viral-monitor": { render: renderViralMonitor },
  "/privacy": { render: renderPrivacy },
  "/terms": { render: renderToS },
};

function getRoute() {
  return routes[window.location.pathname] ? window.location.pathname : "/";
}

function renderApp() {
  const app = document.getElementById("app");
  const route = getRoute();
  const current = routes[route];

  app.innerHTML = `
    ${renderNav(route)}
    <main class="container page-shell" id="page-root">
      ${current.render()}
    </main>
    ${renderFooter()}
  `;

  initNav();
  if (typeof current.init === "function") current.init();
}

// Handle back/forward buttons
window.addEventListener("popstate", renderApp);

// Intercept all link clicks
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (a && a.href.startsWith(window.location.origin)) {
    e.preventDefault();
    history.pushState({}, "", a.href);
    renderApp();
  }
});

window.addEventListener("DOMContentLoaded", renderApp);