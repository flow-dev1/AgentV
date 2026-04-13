const THEME_KEY = "agentv-theme";

export function renderNav(activeRoute) {
  const links = [
    { href: "#/", label: "Home", route: "/" },
    { href: "#/demo", label: "Demo", route: "/demo" },
    { href: "#/privacy", label: "Privacy", route: "/privacy" },
    { href: "#/terms", label: "Terms", route: "/terms" },
  ];

  const navLinks = links
    .map((item) => {
      const isActive = item.route === activeRoute ? "is-active" : "";
      return `<a class="nav-link ${isActive}" href="${item.href}">${item.label}</a>`;
    })
    .join("");

  return `
    <header class="nav-wrap" id="site-nav">
      <div class="container nav">
        <a href="#/" class="brand">AgentV</a>
        <button id="mobile-menu-toggle" class="btn-secondary nav-toggle" aria-expanded="false" aria-label="Toggle menu">Menu</button>
        <nav id="mobile-menu" class="nav-links" aria-label="Primary navigation">
          ${navLinks}
          <button id="theme-toggle" class="btn-secondary" type="button">Toggle theme</button>
        </nav>
      </div>
    </header>
  `;
}

function applyStoredTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem(THEME_KEY);
  if (!saved) return;
  root.dataset.theme = saved;
}

export function initNav() {
  applyStoredTheme();

  const navWrap = document.getElementById("site-nav");
  const toggle = document.getElementById("mobile-menu-toggle");
  const menu = document.getElementById("mobile-menu");
  const themeToggle = document.getElementById("theme-toggle");

  window.addEventListener(
    "scroll",
    () => {
      navWrap.classList.toggle("is-sticky", window.scrollY > 8);
    },
    { passive: true }
  );

  toggle?.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  themeToggle?.addEventListener("click", () => {
    const root = document.documentElement;
    const current = root.dataset.theme === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
  });
}
