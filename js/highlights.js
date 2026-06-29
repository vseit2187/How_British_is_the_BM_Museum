// ═══════════════════════════════════════
// highlights.js — Section 03: Highlights
// ═══════════════════════════════════════
export async function initHighlights() {
  const resp = await fetch('./data/highlights.json');
  const data = await resp.json();

  const grid = document.getElementById('highlights-grid');
  if (!grid) return;

  const LINKS = {
    'Parthenon Sculptures': '#contested',
    "Hoa Hakananai'a":      '#contested-hoa',
  };

  data.forEach(item => {
    const link = LINKS[item.name];
    const card = document.createElement(link ? 'a' : 'div');
    card.className = 'highlight-card';
    if (link) {
      card.href = link;
      card.style.textDecoration = 'none';
      card.style.color = 'inherit';
      card.style.cursor = 'pointer';
    }
    card.innerHTML = `
      ${item.contested ? '<div class="highlight-contested">Contested</div>' : ''}
      <img src="${item.image}" alt="${item.name}" loading="lazy"
           onerror="this.style.display='none'">
      <div class="highlight-overlay">
        <div class="highlight-origin">${item.origin}</div>
        <div class="highlight-name">${item.name}</div>
      </div>`;
    grid.appendChild(card);
  });

  // ── Country counters ──
  const countersEl = document.getElementById('highlights-counters');
  if (!countersEl) return;

  // Normalize origin names for display
  function normalize(origin) {
    if (origin.startsWith('Italy'))      return 'Italy';
    if (origin.startsWith('Rapa Nui'))   return 'Easter Is.';
    return origin;
  }

  const sequence = data.map(d => normalize(d.origin));

  // Final counts per country
  const finalCounts = {};
  sequence.forEach(c => { finalCounts[c] = (finalCounts[c] || 0) + 1; });
  finalCounts['UK'] = 0;

  // Order: UK first, then by count desc, then alphabetical
  const countries = [
    'UK',
    ...Object.keys(finalCounts)
      .filter(c => c !== 'UK')
      .sort((a, b) => finalCounts[b] - finalCounts[a] || a.localeCompare(b))
  ];

  // Build DOM
  countersEl.innerHTML = countries.map(c =>
    `<div class="counter-col">
      <div class="counter-num" id="cnt-${CSS.escape(c)}">${finalCounts[c]}</div>
      <div class="counter-lbl">${c}</div>
    </div>`
  ).join('');

  // Reset all to 0 before animating
  countries.forEach(c => {
    document.getElementById('cnt-' + CSS.escape(c)).textContent = '0';
  });

  // Animate on scroll into view
  const current = {};
  countries.forEach(c => current[c] = 0);
  let animated = false;

  const obs = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting || animated) return;
    animated = true;

    sequence.forEach((country, i) => {
      setTimeout(() => {
        current[country] = (current[country] || 0) + 1;
        const el = document.getElementById('cnt-' + CSS.escape(country));
        if (!el) return;
        el.textContent = current[country];
        el.classList.add('counter-bump');
        setTimeout(() => el.classList.remove('counter-bump'), 300);
      }, i * 450);
    });
  }, { threshold: 0.4 });

  obs.observe(countersEl);
}
