(function () {
  // Ordner, die bei dir "echte" Root-Ordner sind:
  const ROOT_FOLDERS = new Set([
    "animals", "treatments", "movements",
    "js", "css", "partials", "assets", "img", "images"
  ]);

  function getBasePath() {
    const host = window.location.hostname;              // z.B. "pascalkih.github.io" oder "127.0.0.1"
    const parts = window.location.pathname.split("/").filter(Boolean);
    console.log("NavBase - Host:", host, "Path Segments:", parts);
    // Lokal (Live Server): Root ist "/"
    if (!host.endsWith("github.io")) return "/";

    // GitHub Pages:
    // - User Page:  https://USER.github.io/auth.html   => parts[0] = "auth.html" (kein repo folder)
    // - Project Page: https://USER.github.io/REPO/auth.html => parts[0] = "REPO" (repo folder)

    // Heuristik: Wenn erstes Segment KEIN bekannter Root-Ordner ist und wir mind. 2 Segmente haben,
    // dann ist es sehr wahrscheinlich ein Repo-Name => base "/REPO/"
    if (parts.length >= 2 && !ROOT_FOLDERS.has(parts[0])) {
      return `/${parts[0]}/`;
    }

    return "/";
  }

  window.NavBase = { getBasePath };
})();
