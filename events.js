(async function () {
  const emptyEl = document.getElementById("events-empty");
  const cardEl = document.getElementById("event-card");

  try {
    const res = await fetch("data/event.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No event.json");
    const data = await res.json();

    if (!data || !data.show) return;

    document.getElementById("event-title").textContent = data.title || "Event";
    document.getElementById("event-desc").textContent = data.description || "";

    const img = document.getElementById("event-poster-img");
    if (data.poster) {
      img.src = data.poster;
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }

    emptyEl.style.display = "none";
    cardEl.style.display = "grid";
  } catch (e) {
    console.log("Events empty:", e);
  }
})();
