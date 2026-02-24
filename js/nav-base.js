(function () {
  // Ordner, die bei dir "echte" Root-Ordner sind:
  const ROOT_FOLDERS = new Set([
    "animals", "treatments", "movements",
    "js", "css", "partials", "assets", "img", "images"
  ]);

function getBasePath() {
  const host = window.location.hostname;
  const parts = window.location.pathname.split("/").filter(Boolean);

  console.log("HOST:", host);
  console.log("PATHNAME:", window.location.pathname);
  console.log("SEGMENTS:", parts);

  if (!host.endsWith("github.io")) {
    console.log("Base erkannt als: / (lokal)");
    return "/";
  }

  const ROOT_FOLDERS = new Set(["animals","treatments","movements","js","css","partials"]);

  if (parts.length >= 2 && !ROOT_FOLDERS.has(parts[0])) {
    const base = `/${parts[0]}/`;
    console.log("Base erkannt als (Project Page):", base);
    return base;
  }

  console.log("Base erkannt als (User Page): /");
  return "/";
}

  window.NavBase = { getBasePath };
})();
