// ═══════════════════════════════════════
// main.js — Entry point
// Initialises all chart modules + scroll reveal
// ═══════════════════════════════════════
import { initForce }       from './force.js';
import { initMap }         from './map.js';
import { initHighlights }  from './highlights.js';
import { initFindspot }    from './findspot.js';
import { initCorrelation } from './correlation.js';
// ── Init all charts ──
initForce();
initMap();
initHighlights();
initFindspot();
initCorrelation();

// ── Scroll reveal ──
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('vis');
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── Nav active state on scroll ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const navObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + e.target.id
          ? 'var(--ink)' : '';
      });
    }
  });
}, { threshold: 0.3 });

sections.forEach(s => navObs.observe(s));
