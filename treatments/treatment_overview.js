/***** Supabase-Konfiguration *****/
const SUPABASE_URL = "https://kfonugwtvqmpltfdldri.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtmb251Z3d0dnFtcGx0ZmRsZHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NDY4MDUsImV4cCI6MjA3NDMyMjgwNX0.H-9mm9JdAAhLUrhvSRf_j47POPNQR4MhcXpT3dHCa38";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/***** State *****/
let currentUser = null;
let currentFarmId = localStorage.getItem("currentFarmId"); // von Login gesetzt
let medications = [];
const TEAM_FIELD = "farm_id"; // das Feld in der animals-Tabelle, das die Farm referenziert

/***** Helpers *****/
const qs = (sel) => document.querySelector(sel);
function fmtDate(d) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}
function showAlert(type = "success", html = "") {
  // type: 'success' | 'danger' | 'warning' | 'info'
  const host = qs("#page-content") || document.body;
  const old = host.querySelector(".live-alert");
  if (old) old.remove();

  const wrap = document.createElement("div");
  wrap.className = "live-alert";
  wrap.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">
      ${html}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>
    </div>
  `;
  host.prepend(wrap);
}

/***** Init *****/
(async function init() {
  // Session prüfen
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) {
    showAlert("danger", "Fehler beim Laden der Session.");
    return;
  }
  if (!sessionData.session) {
    window.location.href = "../auth.html";
    return;
  }
  currentUser = sessionData.session.user;

  // Navbar Profilname (falls vorhanden)
  const navUser = qs("#navbar-username");
  if (navUser) navUser.textContent = currentUser.user_metadata?.username || currentUser.email;

  // Farm prüfen
  if (!currentFarmId) {
    showAlert("danger", "Keine Farm ausgewählt. Bitte melde dich neu an.");
    return;
  }
  initTreatmentOverviewPage();
})();   

async function initTreatmentOverviewPage() {
  const overviewTable = document.getElementById("treatment-overview-table");
  if (!overviewTable) return;

  const tbody = overviewTable.querySelector("tbody");
  if (!tbody) {
    console.error("tbody fehlt in treatment-overview-table");
    return;
  }

  const { data: treatments, error } = await supabase
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

  tbody.innerHTML = "";

  treatments.forEach(treatment => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${treatment.animals?.animal_number ?? "N/A"}</td>
      <td>${fmtDate(treatment.treatment_date)}</td>
      <td>${treatment.description ?? "N/A"}</td>
      <td>${treatment.animals?.birth_date ? fmtDate(treatment.animals.birth_date) : "N/A"}</td>
    `;

    tbody.appendChild(row);
  });
}
