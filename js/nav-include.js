(async function () {
  const mount = document.getElementById("navbar-mount");
  if (!mount) return;

  const base = window.NavBase?.getBasePath ? window.NavBase.getBasePath() : "/";

  const navbarUrl = `${base}partials/navbar.html`;

  try {
    const res = await fetch(navbarUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Navbar konnte nicht geladen werden: ${res.status} ${res.statusText}`);

    mount.innerHTML = await res.text();

    // Links setzen: href = base + data-href
    mount.querySelectorAll("a[data-href]").forEach(a => {
      const target = a.getAttribute("data-href") || "";
      const clean = target.replace(/^\/+/, "");         // "index.html" statt "/index.html"
      a.setAttribute("href", base + clean);
      console.log("Link generiert:", {
        text: a.textContent.trim(),
        dataHref: target,
        finalHref: a.href
      });
    });

    // Optional: Active-State
    const current = window.location.pathname.replace(/\/+$/, "");
    mount.querySelectorAll("a[data-href]").forEach(a => {
      const href = a.getAttribute("href")?.replace(/\/+$/, "");
      if (href && current.endsWith(href.replace(base.replace(/\/+$/, ""), ""))) {
        a.classList.add("active");
      }
    });

  } catch (err) {
    console.error(err);
    mount.innerHTML = `
      <div class="alert alert-danger m-2">
        Navbar konnte nicht geladen werden. Prüfe: <code>${navbarUrl}</code>
      </div>
    `;
  }
})();
