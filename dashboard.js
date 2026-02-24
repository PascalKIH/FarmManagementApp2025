//dashboard.js
(async function () {
  
  // 1) Login erzwingen (redirectTo optional)
  const user = await App.requireAuth("auth.html");
  console.log("Aktueller User:", user);
  if (!user) return;

  // 2) Farm + Profil laden & UI füllen
  const farm = await App.loadFarmAndProfile(user);

  // Falls keine Farm ausgewählt ist:
  const currentFarmId = localStorage.getItem("currentFarmId");
  const farmInfoEl = document.getElementById("farm-info");
  if (!currentFarmId) {
    if (farmInfoEl) farmInfoEl.textContent = "Keine Farm ausgewählt!";
    return;
  }

  if (!farm) {
    if (farmInfoEl) farmInfoEl.textContent = "Farm nicht gefunden!";
    return;
  }

  // Optional: Farm-Info anzeigen (wenn Element existiert)
  if (farmInfoEl) {
    farmInfoEl.innerHTML = `Du bist in der Farm <strong>${farm.name}</strong>.`;
  }

  // 3) Seitenspezifische Logik
  await loadUpcomingTreatments(currentFarmId);
})();

async function loadUpcomingTreatments(currentFarmId) {
  const { data: treatments, error } = await App.sb
    .from("treatments")
    .select(`
      id,
      treatment_date,
      animal_id,
      description,
      treatment_medications (
        medications (
          name,
          is_vaccine,
          aftercare
        )
      ),
      animals (
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

  const aftercare = (treatments ?? []).filter(t =>
    (t.treatment_medications ?? []).some(tm =>
      tm.medications && tm.medications.is_vaccine === false && tm.medications.aftercare
    )
  );

  // vorher war das "for (care in aftercare)" -> das gibt nur Indizes
  for (const care of aftercare) {
    console.log("Behandlung mit Nachsorge:", care);
  }
}