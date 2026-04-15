import { renderNav, initNav } from "./components/Nav.js";
import { renderFooter } from "./components/Footer.js";
import { renderHome, initHome } from "./pages/Home.js";
import { renderDemo, initDemo } from "./pages/Demo.js";
import { renderCallback, initCallback } from "./pages/Callback.js";
import { renderViralMonitor } from "./pages/ViralMonitor.js";
import { renderPrivacy } from "./pages/Privacy.js";
import { renderToS } from "./pages/Terms.js";

const routes = {
  "/": { render: renderHome, init: initHome },
  "/demo": { render: renderDemo, init: initDemo },
  "/callback": { render: renderCallback, init: initCallback },
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

function navigate(path) {
  history.pushState({}, "", path);
  renderApp();
}

window.addEventListener("popstate", renderApp);

document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a) return;

  const href = a.getAttribute("href");
  if (!href) return;
  if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
  if (href.startsWith("#")) return;
  if (href === window.location.pathname) return;

  e.preventDefault();
  navigate(href);
});

window.addEventListener("DOMContentLoaded", renderApp);