// ═══════════════════════════════════════
// force.js — Section 01: Force layout
// ═══════════════════════════════════════
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const PALETTE = {
  'United Kingdom': '#8B7355',
  'Italy':    '#6E9EC8',
  'China':    '#C85A3A',
  'Greece':   '#5A9E8A',
  'Germany':  '#8A7AAA',
  'India':    '#C89040',
  'France':   '#4A8AAA',
  'Cyprus':   '#A87858',
  'Japan':    '#A86070',
  'Iran':     '#789050',
  'Egypt':    '#AA8840',
  'Turkey':   '#6A8AAA',
  'Nigeria':  '#9A7848',
  'Iraq':     '#5A6AA0',
  'Spain':    '#809068',
  'Rest of World': '#9B8B7B',
  'Unknown':  'rgba(26,22,20,0.1)',
};

export async function initForce() {
  const wrap = document.getElementById('force-wrap');
  if (!wrap) return;

  const ppData = await d3.csv('./data/production_place.csv', d3.autoType);

  const TOP15 = Object.keys(PALETTE).filter(k => k !== 'Rest of World' && k !== 'Unknown');
  const ppMap = new Map(ppData.map(d => [d.country, d.count]));

  const groups = TOP15.map(name => ({
    id: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, ''),
    name,
    count: ppMap.get(name) || 0,
    color: PALETTE[name],
    isUK: name === 'United Kingdom',
  }));

  const topNames = new Set(TOP15);
  const rowCount = ppData
    .filter(d => !topNames.has(d.country))
    .reduce((s, d) => s + d.count, 0);
  groups.push({ id: 'row', name: 'Rest of World', count: rowCount, color: PALETTE['Rest of World'], isUK: false });

  const unknownCount = 22528;
  groups.push({ id: 'unknown', name: 'Unknown origin', count: unknownCount, color: PALETTE['Unknown'], isUK: false });

  const DOT = 10;
  const W = wrap.clientWidth || 900;
  const H = Math.round(W * 0.60);
  const cx = W / 2, cy = H / 2;

  // Cluster centres — UK at centre, others in a ring around it
  function makeCentres() {
    const ring = groups
      .filter(d => !d.isUK && d.id !== 'unknown')
      .sort((a, b) => b.count - a.count);

    const ukDots = Math.round(groups.find(d => d.isUK).count / DOT);
    const ukR    = Math.sqrt(ukDots) * 2.7;
    const itDots = Math.round((ppMap.get('Italy') || 5654) / DOT);
    const itR    = Math.sqrt(itDots) * 2.7;
    const ringR  = ukR + itR * 0.85;

    const c = {};
    c['united_kingdom'] = { x: cx, y: cy };
    c['unknown']        = { x: cx, y: cy };

    ring.forEach((d, i) => {
      const angle = (i / ring.length) * Math.PI * 2 - Math.PI / 2;
      c[d.id] = {
        x: cx + Math.cos(angle) * ringR,
        y: cy + Math.sin(angle) * ringR,
      };
    });
    return c;
  }

  const centres = makeCentres();

  // Build nodes — start each near its cluster centre
  const nodes = [];
  groups.forEach(grp => {
    const n   = Math.round(grp.count / DOT);
    const cen = centres[grp.id] || { x: cx, y: cy };
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 16;
      nodes.push({
        id: grp.id, name: grp.name, count: grp.count,
        color: grp.color, isUK: grp.isUK,
        x: cen.x + Math.cos(a) * r,
        y: cen.y + Math.sin(a) * r,
        cx: cen.x, cy: cen.y,
        r: grp.id === 'unknown' ? 1.4 : (grp.isUK ? 2.9 : 2.3),
      });
    }
  });

  // SVG
  const svg = d3.select('#force-svg')
    .attr('viewBox', `0 159 ${W} ${H - 318}`)
    .attr('width', '100%');
  wrap.style.height = (H - 318) + 'px';

  const g = svg.append('g');

  // Pre-warm: run simulation silently until settled, then render in final positions
  const prewarm = d3.forceSimulation(nodes)
    .force('x', d3.forceX(d => d.cx).strength(d => d.id === 'unknown' ? 0.007 : 0.09))
    .force('y', d3.forceY(d => d.cy).strength(d => d.id === 'unknown' ? 0.007 : 0.09))
    .force('collide', d3.forceCollide(d => d.r + 0.55).strength(0.65))
    .alphaDecay(0.022)
    .stop();

  // Tick enough iterations to reach alpha < 0.001 (alphaDecay 0.022 → ~300 ticks)
  const ticksNeeded = Math.ceil(Math.log(0.001) / Math.log(1 - 0.022));
  for (let i = 0; i < ticksNeeded; i++) prewarm.tick();

  const dots = g.selectAll('circle').data(nodes).join('circle')
    .attr('r',            d => d.r)
    .attr('fill',         d => d.id === 'unknown' ? 'none' : d.color)
    .attr('stroke',       d => d.id === 'unknown' ? 'rgba(26,22,20,0.3)' : 'none')
    .attr('stroke-width', d => d.id === 'unknown' ? 0.6 : 0)
    .attr('opacity',      d => d.id === 'unknown' ? 1 : 0.78)
    .attr('cx', d => d.x)
    .attr('cy', d => d.y);

  // Stat panel — left side, hidden until toggle ON
  // Position it at ~25% of width horizontally
  const statX = W * 0.22;
  const statY = cy;

  const fstat = svg.append('g')
    .attr('transform', `translate(${statX},${statY})`)
    .attr('opacity', 0)
    .attr('id', 'fstat');

  fstat.append('text')
    .attr('text-anchor', 'middle').attr('y', -28)
    .attr('font-size', Math.round(W * 0.085))
    .attr('font-family', 'Georgia').attr('letter-spacing', '-0.04em')
    .attr('fill', '#B8860B').text('19.1%');

  fstat.append('text')
    .attr('text-anchor', 'middle').attr('y', 18)
    .attr('font-size', 11).attr('font-family', 'Courier New')
    .attr('letter-spacing', '0.15em').attr('fill', 'rgba(26,22,20,0.50)')
    .text('OF OBJECTS WITH KNOWN ORIGIN');

  fstat.append('text')
    .attr('text-anchor', 'middle').attr('y', 42)
    .attr('font-size', 13).attr('font-family', 'Georgia')
    .attr('font-style', 'italic').attr('fill', 'rgba(26,22,20,0.55)')
    .text('are from the United Kingdom');

  fstat.append('text')
    .attr('text-anchor', 'middle').attr('y', 72)
    .attr('font-size', 11).attr('font-family', 'Courier New')
    .attr('letter-spacing', '0.12em').attr('fill', 'rgba(26,22,20,0.38)')
    .text('5,016 of 26,257 objects');

  // Tooltip
  const tip = document.getElementById('dot-tip');
  dots.on('mousemove', function (event, d) {
      tip.style.display = 'block';
      tip.style.left = (event.clientX + 16) + 'px';
      tip.style.top  = (event.clientY - 52) + 'px';
      tip.querySelector('.dt-c').textContent = d.id === 'unknown' ? 'Unknown origin' : d.name;
      tip.querySelector('.dt-n').textContent = d.count.toLocaleString();
      if (d.id === 'unknown') d3.select(this).attr('stroke', 'rgba(26,22,20,0.7)').attr('stroke-width', 1);
    })
    .on('mouseleave', function (event, d) {
      tip.style.display = 'none';
      if (d.id === 'unknown') d3.select(this).attr('stroke', 'rgba(26,22,20,0.3)').attr('stroke-width', 0.6);
    });

  // Live simulation — starts from pre-warmed positions, quickly settles any residual
  const sim = d3.forceSimulation(nodes)
    .force('x', d3.forceX(d => d.cx).strength(d => d.id === 'unknown' ? 0.007 : 0.09))
    .force('y', d3.forceY(d => d.cy).strength(d => d.id === 'unknown' ? 0.007 : 0.09))
    .force('collide', d3.forceCollide(d => d.r + 0.55).strength(0.65))
    .alphaDecay(0.022)
    .alpha(0.08) // low alpha — almost settled already
    .on('tick', () => dots.attr('cx', d => d.x).attr('cy', d => d.y));

  // Toggle
  let filterOn = false;

  // UK cluster target: right side of canvas (~68% of width)
  const ukTargetX = W * 0.68;

  document.getElementById('force-toggle').addEventListener('click', () => {
    filterOn = !filterOn;
    const btn = document.getElementById('force-toggle');
    btn.classList.toggle('on', filterOn);
    document.getElementById('lbl-all').classList.toggle('active', !filterOn);
    document.getElementById('lbl-uk').classList.toggle('active',  filterOn);

    if (filterOn) {
      // Move UK cluster to right; keep non-UK where they are (they'll fade out)
      nodes.forEach(d => {
        if (d.isUK) {
          d.cx = ukTargetX;
          d.cy = cy;
        }
        // non-UK: leave cx/cy unchanged — simulation keeps them in place while they fade
      });

      // Fade out non-UK dots first, then move UK
      dots.filter(d => !d.isUK && d.id !== 'unknown')
        .transition().duration(500).attr('opacity', 0);
      dots.filter(d => d.id === 'unknown')
        .transition().duration(400).attr('opacity', 0);

      // Restart sim to slide UK to right; non-UK hidden so movement doesn't matter
      sim.force('x', d3.forceX(d => d.cx).strength(d => d.isUK ? 0.12 : 0.001))
         .force('y', d3.forceY(d => d.cy).strength(d => d.isUK ? 0.12 : 0.001))
         .force('collide', d3.forceCollide(d => d.r + 0.4).strength(0.6))
         .alpha(0.7).restart();

      // Show UK dots brighter after fade completes
      dots.filter(d => d.isUK)
        .transition().duration(600).delay(200)
        .attr('opacity', 0.92)
        .attr('r', 3.1);

      // Stat panel slides in from left after UK has moved
      d3.select('#fstat').transition().duration(600).delay(500).attr('opacity', 1);

    } else {
      // Restore all nodes to original cluster centres
      nodes.forEach(d => { d.cx = centres[d.id].x; d.cy = centres[d.id].y; });

      // Hide stat panel immediately
      d3.select('#fstat').transition().duration(250).attr('opacity', 0);

      // Fade non-UK back in
      dots.filter(d => !d.isUK && d.id !== 'unknown')
        .transition().duration(600).delay(150).attr('opacity', 0.78);
      dots.filter(d => d.id === 'unknown')
        .transition().duration(600).delay(150).attr('opacity', 1);
      dots.filter(d => d.isUK)
        .transition().duration(400).attr('opacity', 0.78).attr('r', 2.9);

      // Restart sim to return UK to centre
      sim.force('x', d3.forceX(d => d.cx).strength(d => d.id === 'unknown' ? 0.007 : 0.09))
         .force('y', d3.forceY(d => d.cy).strength(d => d.id === 'unknown' ? 0.007 : 0.09))
         .force('collide', d3.forceCollide(d => d.r + 0.55).strength(0.65))
         .alpha(0.7).restart();
    }
  });

  // Legend
  const leg = document.getElementById('dot-legend');
  groups.filter(d => d.id !== 'unknown').forEach(d => {
    const el = document.createElement('div');
    el.className = 'dl-item';
    el.innerHTML = `
      <div class="dl-dot" style="background:${d.color}"></div>
      <span class="dl-txt">${d.name}</span>
      <span class="dl-n">${(d.count / 1000).toFixed(1)}k</span>`;
    leg.appendChild(el);
  });

  const unk = document.createElement('div');
  unk.className = 'dl-item';
  unk.innerHTML = `
    <div class="dl-dot" style="background:rgba(26,22,20,0.2)"></div>
    <span class="dl-txt">Unknown origin</span>
    <span class="dl-n">22.5k</span>`;
  leg.appendChild(unk);
}
