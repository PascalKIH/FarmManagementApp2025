(async function () {
  const mount = document.getElementById("navbar-mount");
  if (!mount) return;

  // Prefix berechnen (damit wir /partials/navbar.html auch aus Unterordnern holen können)
  const prefix = window.NavPaths?.computePrefix ? window.NavPaths.computePrefix() : "";

  const navbarUrl = prefix + "partials/navbar.html";

  try {
    const res = await fetch(navbarUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Navbar konnte nicht geladen werden: ${res.status} ${res.statusText}`);

    const html = await res.text();
    mount.innerHTML = html;

    // Jetzt die Links in der geladenen Navbar korrekt prefixen
    window.NavPaths?.applyNavPaths(mount);

  } catch (err) {
    console.error(err);
    mount.innerHTML = `
      <div class="alert alert-danger m-2">
        Navbar konnte nicht geladen werden. Prüfe Pfad: <code>${navbarUrl}</code>
      </div>
    `;
  }
})();
