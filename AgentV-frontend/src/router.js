import { renderNav, initNav } from "./components/Nav.js";
import { renderFooter } from "./components/Footer.js";
import { renderHome } from "./pages/Home.js";
import { renderDemo, initDemo } from "./pages/Demo.js";
import { renderPrivacy } from "./pages/Privacy.js";
import { renderTerms } from "./pages/Terms.js";

const routes = {
  "/": { render: renderHome },
  "/demo": { render: renderDemo, init: initDemo },
  "/privacy": { render: renderPrivacy },
  "/terms": { render: renderToS  },
};

function getRouteFromHash() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  return routes[raw] ? raw : "/";
}

function renderApp() {
  const app = document.getElementById("app");
  const route = getRouteFromHash();
  const current = routes[route];

  app.innerHTML = `
    ${renderNav(route)}
    <main class="container page-shell" id="page-root">
      ${current.render()}
    </main>
    ${renderFooter()}
  `;

  initNav();
  if (typeof current.init === "function") {
    current.init();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  if (!window.location.hash) {
    window.location.hash = "/";
  }
  renderApp(); // ← always call renderApp, no early return
});
