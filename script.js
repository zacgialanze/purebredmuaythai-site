// Interactive timetable filters and glow handling copied from BADBUTGOODTIMETABLE
// This script enables category filtering and highlights the current day.
(function(){
  const filters = document.querySelectorAll('.tt4-filter');
  const slots = document.querySelectorAll('.tt4 .slot');
  if(!filters.length || !slots.length) return;

  function syncLabelGlow(){
    filters.forEach(f => {
      const label = f.closest('label');
      if(!label) return;
      if(f.checked) label.classList.add('on');
      else label.classList.remove('on');
    });
  }

  function apply(){
    const on = new Set([...filters].filter(f => f.checked).map(f => f.dataset.key));
    slots.forEach(s => {
      const k = s.dataset.keys;
      if(!k){ s.style.display = ''; return; } // All Levels always visible
      const keys = k.split(',').map(x => x.trim());
      const show = keys.some(x => on.has(x));
      s.style.display = show ? '' : 'none';
    });
    syncLabelGlow();
  }

  filters.forEach(f => f.addEventListener('change', apply));
  apply();

  // Highlight the current day column
  const map = {1:0,2:1,3:2,4:3,5:4,6:5,0:6};
  const idx = map[new Date().getDay()];
  const cells = document.querySelectorAll('.tt4-grid .tt4-cell');
  if(cells[idx]) cells[idx].style.boxShadow = "inset 0 0 0 2px rgba(255,211,77,.25)";
})();

// Mobile day‑selector for the timetable.  On screens up to 768px wide
// we collapse the weekly schedule into a single pane and add
// abbreviated day tabs (M, T, W, T, F, S, S).  Clicking a tab
// reveals the corresponding day’s classes while hiding the others.
(function(){
  // Abort if matchMedia isn’t available or the page isn’t the timetable
  if(typeof window.matchMedia !== 'function') return;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if(!isMobile) return;
  const body = document.body;
  if(!body.classList.contains('timetable-page')) return;
  const grid = document.querySelector('.tt4-grid');
  if(!grid) return;
  const dayEls = Array.from(grid.querySelectorAll('.tt4-day'));
  const cellEls = Array.from(grid.querySelectorAll('.tt4-cell'));
  if(dayEls.length !== cellEls.length) return;
  // Create container for day tabs
  const tabs = document.createElement('div');
  tabs.className = 'tt-mobile-tabs';
  const dayAbbr = ['M','T','W','T','F','S','S'];
  dayEls.forEach((dayEl, index) => {
    const btn = document.createElement('button');
    btn.className = 'tt-mobile-tab';
    btn.type = 'button';
    btn.textContent = dayAbbr[index] || dayEl.textContent.trim().charAt(0);
    btn.addEventListener('click', () => {
      dayLabel.textContent = dayFullNames[index];
      // Hide all cells
      cellEls.forEach((c,i) => {
        c.style.display = (i === index) ? '' : 'none';
      });
      // Update active state on tabs
      tabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    if(index === 0) btn.classList.add('active');
    tabs.appendChild(btn);
  });
  
  // Create and insert the readable full day label
  const dayFullNames = dayEls.map(el => el.textContent.trim());
  const dayLabel = document.createElement('div');
  dayLabel.className = 'tt-selected-day';
  dayLabel.textContent = dayFullNames[0] || '';
// Insert the tabs before the grid
  grid.parentNode.insertBefore(tabs, grid);
  grid.parentNode.insertBefore(dayLabel, grid);
  // Hide day name headers (only show tabs)
  dayEls.forEach(el => {
    el.style.display = 'none';
  });
  // Show only first day by default
  cellEls.forEach((c, i) => {
    c.style.display = (i === 0) ? '' : 'none';
  });
})();