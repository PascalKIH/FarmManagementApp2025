(function () {
  function computePrefix() {
    const path = window.location.pathname;
    const host = window.location.host;

    const segments = path.split("/").filter(Boolean);
    const isGithub = host.includes("github.io");

    // depth = wie viele Ordner tief (ohne Datei), bei GitHub Pages minus Repo-Segment
    const depth = isGithub
      ? Math.max(0, segments.length - 2) // repo + folders + file => folders = len-2
      : Math.max(0, segments.length - 1); // folders + file => folders = len-1

    return "../".repeat(depth);
  }

  function applyNavPaths(rootElement = document) {
    const prefix = computePrefix();

    rootElement.querySelectorAll("a[data-nav]").forEach(a => {
      const href = a.getAttribute("href");
      if (!href) return;

      // Nicht anfassen: extern, anchors, mailto/tel, oder schon absolut
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("/")
      ) return;

      a.setAttribute("href", prefix + href);
    });

    // optional: falls du auch <script src="..."> oder <link href="..."> in partials hättest,
    // könnten wir das auch prefixen. Aktuell brauchst du es für die Navbar nicht.
  }

  // global verfügbar machen
  window.NavPaths = { computePrefix, applyNavPaths };
})();
