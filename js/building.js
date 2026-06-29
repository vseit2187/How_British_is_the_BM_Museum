// ═══════════════════════════════════════
// building.js — Hero BM building animation
// All 5 columns start dark, fade left to
// right, col 5 (rightmost) survives. Loops.
// ═══════════════════════════════════════

export function initBuilding() {
  const cols = [1, 2, 3, 4, 5].map(i => document.getElementById('bm-col-' + i));
  if (!cols[0]) return;

  const DARK  = '#8B8278';               // dark stone — starting state
  const GONE  = 'rgba(26,22,20,0.08)';  // almost invisible — faded state
  const DELAY = 700;                     // ms between each column fade
  const HOLD  = 3000;                    // ms to hold before looping

  let timer = null;

  function fade(col) {
    col.style.fill    = GONE;
    col.style.opacity = '0.22';
  }

  function reset() {
    cols.forEach(col => {
      col.style.fill    = DARK;
      col.style.opacity = '1';
    });
  }

  function run() {
    reset();
    // Fade cols 1→4 sequentially, col 5 stays
    timer = setTimeout(() => {
      fade(cols[0]);
      timer = setTimeout(() => {
        fade(cols[1]);
        timer = setTimeout(() => {
          fade(cols[2]);
          timer = setTimeout(() => {
            fade(cols[3]);
            // col 5 survives — hold then loop
            timer = setTimeout(run, HOLD);
          }, DELAY);
        }, DELAY);
      }, DELAY);
    }, 900);
  }

  run();
}
