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

// ── Timeline scrollytelling: progressive gold spine + activate items on scroll ──
const timeline = document.querySelector('.timeline');
if (timeline) {
  const items = timeline.querySelectorAll('.timeline-item');

  const progress = document.createElement('div');
  progress.className = 'timeline-progress';
  timeline.appendChild(progress);

  function updateTimelineProgress() {
    const rect = timeline.getBoundingClientRect();
    const mid  = window.innerHeight * 0.5;
    const filled = Math.max(0, Math.min(1, (mid - rect.top) / rect.height));
    progress.style.height = (filled * rect.height) + 'px';
  }
  window.addEventListener('scroll', updateTimelineProgress, { passive: true });
  window.addEventListener('resize', updateTimelineProgress);
  updateTimelineProgress();

  // Items light up once they reach the middle band, and stay lit
  const tlObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

  items.forEach(i => tlObs.observe(i));
}
