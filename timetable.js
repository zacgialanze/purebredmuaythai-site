(() => {
  const grid = document.querySelector(".tt4-grid");
  const filters = Array.from(document.querySelectorAll(".tt4-filter"));
  if (!grid) return;
  const abbr = ["M","T","W","T","F","S","S"];
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function render(data) {
    const days = Array.isArray(data && data.days) ? data.days : [];
    grid.innerHTML = "";
    days.forEach(d => {
      const h = document.createElement("div");
      h.className = "tt4-day";
      h.textContent = d.day || "";
      grid.appendChild(h);
    });
    days.forEach(d => {
      const cell = document.createElement("div");
      const classes = d.classes || [];
      cell.className = "tt4-cell" + (classes.some(c => String(c.name).toUpperCase() === "CLOSED") ? " closed" : "");
      classes.forEach(c => {
        const slot = document.createElement("div");
        slot.className = "slot";
        if (c.category && c.category !== "all") slot.dataset.keys = c.category;
        slot.innerHTML = '<div class="time">' + esc(c.time || "") + '</div><div class="name">' + esc(c.name || "") + '</div>';
        cell.appendChild(slot);
      });
      grid.appendChild(cell);
    });
    initFilters();
    highlightToday();
    initMobile(days);
  }
  function initFilters() {
    function sync() {
      const on = new Set(filters.filter(f => f.checked).map(f => f.dataset.key));
      document.querySelectorAll(".tt4 .slot").forEach(s => {
        const k = s.dataset.keys;
        s.style.display = !k || k.split(",").some(x => on.has(x.trim())) ? "" : "none";
      });
      filters.forEach(f => {
        const label = f.closest("label");
        if (label) label.classList.toggle("on", f.checked);
      });
    }
    filters.forEach(f => f.onchange = sync);
    const p = new URLSearchParams(location.search).get("program");
    if (p) {
      filters.forEach(f => f.checked = false);
      filters.forEach(f => {
        const k = f.dataset.key;
        if ((p === "kids" || p === "mini") && k === "kids") f.checked = true;
        if (p === "juniors" && k === "juniors") f.checked = true;
        if (p === "teens" && k === "beginners") f.checked = true;
        if (p === "adults" && (k === "beginners" || k === "advanced")) f.checked = true;
      });
    }
    sync();
  }
  function highlightToday() {
    const idx = ({1:0,2:1,3:2,4:3,5:4,6:5,0:6})[new Date().getDay()];
    const cells = grid.querySelectorAll(".tt4-cell");
    if (cells[idx]) cells[idx].style.boxShadow = "inset 0 0 0 2px rgba(255,211,77,.25)";
  }
  function initMobile(days) {
    if (!window.matchMedia("(max-width: 768px)").matches) return;
    const oldTabs = document.querySelector(".tt-mobile-tabs");
    const oldLabel = document.querySelector(".tt-selected-day");
    if (oldTabs) oldTabs.remove();
    if (oldLabel) oldLabel.remove();
    const headers = Array.from(grid.querySelectorAll(".tt4-day"));
    const cells = Array.from(grid.querySelectorAll(".tt4-cell"));
    if (headers.length !== cells.length) return;
    const tabs = document.createElement("div");
    tabs.className = "tt-mobile-tabs";
    const label = document.createElement("div");
    label.className = "tt-selected-day";
    function show(i) {
      label.textContent = (days[i] && days[i].day) || "";
      headers.forEach(h => h.style.display = "none");
      cells.forEach((c,n) => c.style.display = n === i ? "" : "none");
      Array.from(tabs.children).forEach((b,n) => b.classList.toggle("active", n === i));
    }
    days.forEach((d,i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tt-mobile-tab";
      b.textContent = abbr[i] || String(d.day || "").charAt(0);
      b.onclick = () => show(i);
      tabs.appendChild(b);
    });
    grid.before(tabs, label);
    show(0);
  }
  fetch("data/timetable.json", {cache:"no-store"})
    .then(r => { if (!r.ok) throw new Error("Unable to load timetable"); return r.json(); })
    .then(render)
    .catch(() => { grid.innerHTML = '<div class="tt4-load-error">Timetable temporarily unavailable.</div>'; });
})();