// ---------- Supabase Konfiguration ----------
const SUPABASE_URL = "https://kfonugwtvqmpltfdldri.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmb251Z3d0dnFtcGx0ZmRsZHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NDY4MDUsImV4cCI6MjA3NDMyMjgwNX0.H-9mm9JdAAhLUrhvSRf_j47POPNQR4MhcXpT3dHCa38";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- Globale Variablen ----------
let currentUser = null;
let currentFarmId = localStorage.getItem("currentFarmId");
let currentFarm = null;

// ---------- DOM Elemente ----------
const form = document.getElementById("medication-form");

// ---------- Initialisierung ----------
(async function init() {
  console.log("HI")
  // Session prüfen
  const { data: { session }, error } = await client.auth.getSession();
  if (error) {
    console.error("Fehler beim Laden der Session:", error);
    alert("Fehler beim Laden der Session.");
    return;
  }

  if (!session) {
    alert("Bitte zuerst einloggen!");
    window.location.href = "../auth.html";
    return;
  }

  currentUser = session.user;

  // Logout-Button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await client.auth.signOut();
      localStorage.removeItem("currentFarmId");
      window.location.href = "../auth.html";
    });
  }

  // Farm + Profil in UI anzeigen
  await loadFarmAndProfile();
  await loadUpcomingTreatments();

})();

// ---------- Farm + Profil laden ----------
async function loadFarmAndProfile() {
  const farmInfoEl = document.getElementById("farm-info");
  const navbarUserEl = document.getElementById("navbar-username");
  const profileUsernameEl = document.getElementById("profile-username");
  const profileEmailEl = document.getElementById("profile-email");
  const profileFarmEl = document.getElementById("profile-farm");
  const profileFarmcodeEl = document.getElementById("profile-farmcode");

  if (!currentFarmId) {
    if (farmInfoEl) {
      farmInfoEl.textContent = "Keine Farm ausgewählt!";
    }
    return;
  }

  const { data: farm, error } = await client
    .from("farms")
    .select("id, name, invite_code")
    .eq("id", currentFarmId)
    .single();

  if (error || !farm) {
    console.error("Fehler beim Laden der Farm:", error);
    if (farmInfoEl) {
      farmInfoEl.textContent = "Farm nicht gefunden!";
    }
    return;
  }

  currentFarm = farm;

  // Navbar-Name
  if (navbarUserEl && currentUser) {
    navbarUserEl.textContent =
      currentUser.user_metadata?.username || currentUser.email;
  }

  // Farminfo im Dashboard (falls vorhanden)
  if (farmInfoEl) {
    farmInfoEl.innerHTML = `
      Du bist in der Farm <strong>${farm.name}</strong>.
    `;
  }

  // Profilmodal (falls vorhanden)
  if (profileUsernameEl && currentUser) {
    profileUsernameEl.textContent =
      currentUser.user_metadata?.username || "(kein Benutzername)";
  }
  if (profileEmailEl && currentUser) {
    profileEmailEl.textContent = currentUser.email;
  }
  if (profileFarmEl) {
    profileFarmEl.textContent = farm.name;
  }
  if (profileFarmcodeEl) {
    profileFarmcodeEl.textContent = farm.invite_code;
  }
}

async function loadUpcomingTreatments() {
const { data: treatments, error } = await client
    .from("treatments")
    .select(`
      id,
      treatment_date,
      animal_id,
      description,
      treatment_medications (
      medications(
        name,
        is_vaccine,
        aftercare)
        ),      animals (
        animal_number,
        birth_date
      )
    `)
    .eq("farm_id", currentFarmId)
    .order("treatment_date", { ascending: false });

  if (error) {
    console.error("Fehler beim Laden der Behandlungen:", error);
    return;
  }

  console.log("Geladene Behandlungen:", treatments);
  const aftercare = treatments.filter(t => {
    return t.treatment_medications.some(tm => tm.medications.is_vaccine === false && tm.medications.aftercare);
  });
  for (care in aftercare) {
      
    console.log("Behandlung mit Nachsorge:", care);
  }


}