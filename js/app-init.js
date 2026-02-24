(function () {

  // ==============================
  // Supabase Initialisierung
  // ==============================
    const SUPABASE_URL = "https://kfonugwtvqmpltfdldri.supabase.co"; // <-- dein Projekt
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmb251Z3d0dnFtcGx0ZmRsZHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NDY4MDUsImV4cCI6MjA3NDMyMjgwNX0.H-9mm9JdAAhLUrhvSRf_j47POPNQR4MhcXpT3dHCa38";

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // ==============================
  // BasePath Resolver (User/Page)
  // ==============================
  function getBasePath() {
    const host = window.location.hostname;
    const parts = window.location.pathname.split("/").filter(Boolean);

    if (!host.endsWith("github.io")) return "/";

    const ROOT_FOLDERS = new Set([
      "animals", "treatments", "movements",
      "js", "css", "partials", "assets"
    ]);

    if (parts.length >= 2 && !ROOT_FOLDERS.has(parts[0])) {
      return `/${parts[0]}/`;
    }

    return "/";
  }

  function resolve(path) {
    if (/^https?:\/\//.test(path)) return path;
    const base = getBasePath();
    return base + path.replace(/^\/+/, "");
  }

  // ==============================
  // Auth Guard
  // ==============================
  async function requireAuth(redirectTo = "auth.html") {

    const { data: { session }, error } = await sb.auth.getSession();

    if (error || !session) {
      window.location.href = resolve(redirectTo);
      return null;
    }

    const user = session.user;

    // Logout-Button automatisch verdrahten
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn && !logoutBtn.dataset.bound) {
      logoutBtn.dataset.bound = "1";
      logoutBtn.addEventListener("click", async () => {
        await sb.auth.signOut();
        localStorage.removeItem("currentFarmId");
        window.location.href = resolve("auth.html");
      });
    }

    return user;
  }

  // ==============================
  // Farm + Profil laden
  // ==============================
  async function loadFarmAndProfile(user) {

    const currentFarmId = localStorage.getItem("currentFarmId");
    if (!currentFarmId) return null;

    const { data: farm, error } = await sb
      .from("farms")
      .select("id, name, invite_code")
      .eq("id", currentFarmId)
      .single();

    if (error || !farm) return null;

    // Navbar Username
    const navbarUserEl = document.getElementById("navbar-username");
    if (navbarUserEl)
      navbarUserEl.textContent = user.user_metadata?.username || user.email;

    // Profilmodal
    const profileUsernameEl = document.getElementById("profile-username");
    const profileEmailEl = document.getElementById("profile-email");
    const profileFarmEl = document.getElementById("profile-farm");
    const profileFarmcodeEl = document.getElementById("profile-farmcode");

    if (profileUsernameEl)
      profileUsernameEl.textContent = user.user_metadata?.username || "(kein Benutzername)";
    if (profileEmailEl) profileEmailEl.textContent = user.email;
    if (profileFarmEl) profileFarmEl.textContent = farm.name;
    if (profileFarmcodeEl) profileFarmcodeEl.textContent = farm.invite_code;

    return farm;
  }

  // ==============================
  // Global verfügbar machen
  // ==============================
  window.App = {
    sb,
    requireAuth,
    loadFarmAndProfile,
    resolve
  };

})();
