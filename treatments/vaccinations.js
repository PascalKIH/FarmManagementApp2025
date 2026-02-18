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
  initAnimalPicker();
  await loadMedications();
  const treatmentForm = document.getElementById("treatment-form");
  if (treatmentForm) {
    treatmentForm.addEventListener("submit", onSaveTreatment);
  }

})();


function initAnimalPicker() {
  const elSearch   = document.getElementById("animal-search");
  const elList     = document.getElementById("animal-list");
  const elSelected = document.getElementById("selected-animals");
  const elHidden   = document.getElementById("selected-animal-ids");
  const elStatus   = document.getElementById("animal-status");
  const elConfirm  = document.getElementById("confirm-animal-selection");
  const elSelectedList = document.getElementById("selected-animals-list");

  if (!elSearch || !elList) return; // falls Seite ohne Picker

  let animals = [];
  let selectedMap = new Map(); // id -> {id, label}
  let focusedIndex = -1;

  const fmt = (v) => v ?? "—";
  if(elConfirm){
    elConfirm.addEventListener("click", () => {
      const selectedIds = Array.from(selectedMap.keys());
      elHidden.value = selectedIds.join(",");

      const offcanvasEl = document.getElementById("animalSelectOffcanvas");
      const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
      offcanvas.hide();
      displaySelectedAnimals(selectedMap);
      }
    );
  }
  function displaySelectedAnimals(selectedMap) {
    elSelectedList.innerHTML = "";
    selectedMap.forEach(({ id, label }) => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.textContent = label;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-sm btn-outline-danger";
      btn.innerHTML = '&times;';
      btn.addEventListener("click", () => removeSelection(id));
      li.appendChild(btn);
      elSelectedList.appendChild(li);
      
    });
  }

  function setHiddenValue() {
    elHidden.value = Array.from(selectedMap.keys()).join(",");
  }

  function labelFor(a) {
    return `${fmt(a.animal_number)} · ${fmt(a.animal_id)}`;
  }

  function genderSymbol(gender) {
  if (gender === "männlich") {
    return `<span class="badge text-bg-primary rounded-pill">m</span>`;
  }
  if (gender === "weiblich") {
    return `<span class="badge" style="background-color:#d63384;color:white;">w</span>`;
  }
  return `<span class="badge text-bg-secondary rounded-pill">?</span>`;
}

  function updateStatus() {
    elStatus.textContent = `${animals.length} Tiere · ${selectedMap.size} ausgewählt`;
  }

  function renderList() {
    elList.innerHTML = "";
    animals.forEach((a, index) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center picker-item";
      row.dataset.index = String(index);
      row.dataset.id = a.id;
      row.dataset.number = (a.animal_number || "").toString().toLowerCase();
      row.dataset.aid = (a.animal_id || "").toString().toLowerCase();

      row.innerHTML = `
        <span>
          <strong>${fmt(a.animal_number)}</strong>
          <small class="text-muted ms-1">ID: ${fmt(a.animal_id)}</small>
        </span>
        ${genderSymbol(a.gender)}
      `;

      row.addEventListener("click", () => toggleSelection(a.id));
      elList.appendChild(row);
    });
    updateSelectionStyles();
    updateStatus();
  }

  function updateSelectionStyles() {
    const rows = elList.querySelectorAll(".picker-item");
    rows.forEach((row) => {
      const id = row.dataset.id;
      row.classList.toggle("is-selected", selectedMap.has(id));
    });
  }

  function addSelection(id) {
    const a = animals.find(x => x.id === id);
    if (!a || selectedMap.has(id)) return;

    selectedMap.set(id, { id, label: labelFor(a) });

    const pill = document.createElement("span");
    pill.className = "badge rounded-pill text-bg-success d-inline-flex align-items-center px-3 py-2";
    pill.dataset.id = id;
    pill.innerHTML = `
      <span class="me-2">${labelFor(a)}</span>
      <button type="button" class="btn btn-sm btn-light ms-1" aria-label="Entfernen">&times;</button>
    `;
    pill.querySelector("button").addEventListener("click", () => removeSelection(id));
    elSelected.appendChild(pill);

    setHiddenValue();
    updateSelectionStyles();
    updateStatus();
  }

  function removeSelection(id) {
    selectedMap.delete(id);
    const pill = elSelected.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (pill) pill.remove();
    setHiddenValue();
    updateSelectionStyles();
    updateStatus();
  }

  function toggleSelection(id) {
    if (selectedMap.has(id)) {
      removeSelection(id);
    } else {
      addSelection(id);
    }
  }

  function clearFocus() {
    elList.querySelectorAll(".picker-item.is-focused")
      .forEach(row => row.classList.remove("is-focused"));
  }

  function focusRow(index, scroll = true) {
    const rows = Array.from(elList.querySelectorAll(".picker-item"));
    if (!rows.length) return;

    if (index < 0) index = 0;
    if (index >= rows.length) index = rows.length - 1;

    clearFocus();
    const row = rows[index];
    row.classList.add("is-focused");
    focusedIndex = index;

    if (scroll) {
      row.scrollIntoView({ block: "center" });
    }
  }

  function focusFirstMatch(query) {
    const q = query.trim().toLowerCase();
    clearFocus();
    if (!q) {
      elList.scrollTop = 0;
      focusedIndex = -1;
      return;
    }

    const rows = Array.from(elList.querySelectorAll(".picker-item"));
    const idx = rows.findIndex(row =>
      row.dataset.number.includes(q) || row.dataset.aid.includes(q)
    );

    if (idx === -1) {
      elStatus.textContent = `Keine Treffer für „${query}“ · ${animals.length} Tiere · ${selectedMap.size} ausgewählt`;
      return;
    }

    focusRow(idx, true);
    updateStatus();
  }

  // Sucheingabe
  elSearch.addEventListener("input", (e) => {
    const val = e.target.value;
    focusFirstMatch(val);
  });

  // Keyboard-Steuerung
  elSearch.addEventListener("keydown", (e) => {
    const rows = Array.from(elList.querySelectorAll(".picker-item"));
    if (!rows.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusRow(focusedIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusRow(focusedIndex - 1);
    } else if (e.key === "Enter") {
      if (focusedIndex >= 0 && focusedIndex < rows.length) {
        e.preventDefault();
        const id = rows[focusedIndex].dataset.id;
        toggleSelection(id);
      }
    } else if (e.key === "Escape") {
      clearFocus();
      focusedIndex = -1;
    }
  });

  // Daten einmalig von Supabase laden
  (async function loadAnimals() {
    elStatus.textContent = "Lade Tiere…";

    const { data, error } = await supabase
      .from("animals")
      .select("id, animal_number, animal_id, gender")
      .eq(TEAM_FIELD, currentFarmId)
      .order("animal_number", { ascending: true });

    if (error) {
      console.error(error);
      elStatus.textContent = "Fehler beim Laden der Tiere.";
      return;
    }

    animals = data || [];
    renderList();
  })();
}

async function loadMedications() {
  console.log("Lade Medikamente…");

  const { data, error } = await supabase
    .from("medications")
    .select("id, name")
    .eq("is_vaccine", true)
    .eq(TEAM_FIELD, currentFarmId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Fehler beim Laden der Medikamente:", error);
    showAlert("danger", "Fehler beim Laden der Medikamente.");
    return;
  }

  medications = data || [];
  renderMedications();
}

function renderMedications() {
  const elMedSelect = document.getElementById("treatment-medications"); // <<< ID anpassen
  if (!elMedSelect) return;

  elMedSelect.innerHTML = ""; // bei multiple kein "Bitte wählen" nötig, optional

  medications.forEach((med) => {
    const option = document.createElement("option");
    option.value = med.id;
    option.textContent = med.name;
    elMedSelect.appendChild(option);
  });
}
// ---------- Behandlungsprotokoll exportieren ----------
document.getElementById("export-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const start = document.getElementById("export-start").value;
  const end = document.getElementById("export-end").value;

  const { data, error } = await client
    .from("treatments")
    .select(`
      treatment_date,
      description,
      animals(animal_number)
    `)
    .eq("farm_id", currentFarmId)
    .gte("treatment_date", start)
    .lte("treatment_date", end)
    .order("treatment_date");

  if (error) {
    alert("Fehler beim Laden: " + error.message);
    return;
  }

  if (!data || data.length === 0) {
    alert("Keine Behandlungen im gewählten Zeitraum.");
    return;
  }

  // PDF erstellen
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.text("Behandlungsprotokoll", 14, 16);
  pdf.setFontSize(10);

  let y = 28;
  data.forEach(row => {
    pdf.text(`${row.treatment_date} – ${row.animals?.animal_number || "?"}`, 14, y);
    pdf.text(row.description, 14, y + 6);
    pdf.text(`Tierarzt: ${row.vet || "-"}`, 14, y + 12);
    y += 22;
  });

  pdf.save(`Behandlungen_${start}_bis_${end}.pdf`);
});
/***** Behandlung(en) speichern *****/
async function onSaveTreatment(e) {
  e.preventDefault();
  const form = e.currentTarget;

  // 1) Bootstrap / HTML5 Validierung
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }

  // 2) Eingaben holen
  const treatmentDate = qs("#treatment-date").value; // required in HTML setzen
  const description   = qs("#treatment-description")?.value?.trim() || null;
  const vet           = qs("#treatment-vet")?.value?.trim() || null;

  // Tiere (aus deinem Hidden Field vom Picker)
  const animalIdsRaw = qs("#selected-animal-ids")?.value || "";
  const animalIds = animalIdsRaw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  if (animalIds.length === 0) {
    showAlert("danger", "Bitte mindestens ein Tier auswählen.");
    return;
  }

  // Medikamente (multiple select)
  const medicationIds = Array
    .from(qs("#treatment-medications").selectedOptions || [])
    .map(o => o.value)
    .filter(Boolean);

  if (medicationIds.length === 0) {
    // Optional: falls Medikamente Pflicht sein sollen, ersetze confirm durch return
    const ok = confirm("Keine Medikamente ausgewählt. Trotzdem speichern?");
    if (!ok) return;
  }

  // 3) Basis-Payload für treatments (für alle Tiere identisch)
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    showAlert("danger", "Benutzer konnte nicht ermittelt werden. Bitte neu einloggen.");
    return;
  }
  const user = userData.user;

  if (!currentFarmId) {
    showAlert("danger", "Keine Farm ausgewählt. Bitte neu anmelden.");
    return;
  }

  const baseTreatment = {
    treatment_date: treatmentDate,
    description,
    vet,
    farm_id: currentFarmId,
    created_by: user.id,
    created_by_email: user.email,
    updated_by: user.id,
    updated_by_email: user.email
  };

  // 4) Treatments pro Tier erzeugen
  const treatmentPayloads = animalIds.map(animal_id => ({
    ...baseTreatment,
    animal_id
  }));

  // 5) Speichern: treatments (Bulk Insert)
  const { data: insertedTreatments, error: insErr } = await supabase
    .from("treatments")
    .insert(treatmentPayloads)
    .select("id, animal_id");

  if (insErr) {
    console.error(insErr);
    showAlert("danger", "Fehler beim Speichern der Behandlungen: " + insErr.message);
    return;
  }

  // 6) Verknüpfen: treatment_medications (Bulk Insert)
  // Kreuzprodukt: jede Behandlung × jedes Medikament
  if (medicationIds.length > 0) {
    const links = [];
    for (const t of insertedTreatments) {
      for (const medId of medicationIds) {
        links.push({
          treatment_id: t.id,
          medication_id: medId
        });
      }
    }

    const { error: linkErr } = await supabase
      .from("treatment_medications")
      .insert(links);

    if (linkErr) {
      console.error(linkErr);
      // Treatments sind gespeichert, Links teilweise/gar nicht -> transparent melden
      showAlert(
        "warning",
        `Behandlungen gespeichert (${insertedTreatments.length}), aber Medikamente konnten nicht vollständig verknüpft werden: ${linkErr.message}`
      );
      return;
    }
  }

  // 7) Erfolg + Reset
  showAlert("success", `Behandlungen für ${animalIds.length} Tier(e) gespeichert.`);
  form.reset();
  form.classList.remove("was-validated");

  // Optional: ausgewählte Tiere-Pills leeren, Hidden-Feld leeren
  const selected = qs("#selected-animals");
  if (selected) selected.innerHTML = "";
  const hidden = qs("#selected-animal-ids");
  if (hidden) hidden.value = "";
}
