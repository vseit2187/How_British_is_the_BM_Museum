// ═══════════════════════════════════════
// correlation.js — Section 07: Sankey diagram
// Made-in × Found-in, pre-1500 AD objects
// ═══════════════════════════════════════
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'https://cdn.jsdelivr.net/npm/d3-sankey@0.12/+esm';

const GOLD      = '#B8860B';
const BLUE      = '#6E9EC8';
const STONE     = '#A09585';   // same-country flows
const STONE_ALT = '#C8BFB5';   // same-country node fill

export async function initCorrelation() {
  const wrap = document.getElementById('corr-chart');
  if (!wrap) return;

  const raw = await d3.csv('./data/correlation.csv', d3.autoType);

  // ── 1. Rank made_in and found_in by total flow volume ──────────────────────
  const madeVol  = d3.rollup(raw, v => d3.sum(v, d => d.count), d => d.made_in);
  const foundVol = d3.rollup(raw, v => d3.sum(v, d => d.count), d => d.found_in);

  const top10made  = [...madeVol.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 10).map(d => d[0]);
  const top8found  = [...foundVol.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 8).map(d => d[0]);

  const madeSet  = new Set(top10made);
  const foundSet = new Set(top8found);

  // ── 2. Filter rows to those within both sets ────────────────────────────────
  const flows = raw.filter(d => madeSet.has(d.made_in) && foundSet.has(d.found_in));

  // ── 3. Build Sankey nodes & links ───────────────────────────────────────────
  // Prefix L_ / R_ so same country name on both sides gets distinct node ids
  const leftIds  = top10made.map(n => `L_${n}`);
  const rightIds = top8found.map(n => `R_${n}`);

  const nodes = [...leftIds, ...rightIds].map(id => ({ id }));

  const links = flows.map(d => {
    const isSame   = String(d.same).toLowerCase() === 'true';
    const isUKDest = String(d.found_in_uk).toLowerCase() === 'true';
    const color    = isSame ? STONE : (isUKDest ? GOLD : BLUE);
    return {
      source: `L_${d.made_in}`,
      target: `R_${d.found_in}`,
      value:  d.count,
      made_in:  d.made_in,
      found_in: d.found_in,
      count:    d.count,
      isSame,
      isUKDest,
      color,
    };
  });

  // ── 4. Layout ────────────────────────────────────────────────────────────────
  const W      = wrap.clientWidth || 820;
  const H      = Math.max(390, Math.round(W * 0.50));
  const margin = { top: 16, right: 160, bottom: 16, left: 160 };

  const sankeyGen = d3Sankey()
    .nodeId(d => d.id)
    .nodeWidth(14)
    .nodePadding(10)
    .extent([[margin.left, margin.top], [W - margin.right, H - margin.bottom]]);

  const graph = sankeyGen({
    nodes: nodes.map(d => ({ ...d })),
    links: links.map(d => ({ ...d })),
  });

  // ── 5. SVG ──────────────────────────────────────────────────────────────────
  const svg = d3.select('#corr-chart').append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', '100%')
    .style('overflow', 'visible');

  // Tooltip
  const tip = d3.select('body').select('#sankey-tip').node()
    ? d3.select('#sankey-tip')
    : d3.select('body').append('div').attr('id', 'sankey-tip')
        .style('position', 'fixed')
        .style('pointer-events', 'none')
        .style('display', 'none')
        .style('background', '#F5F0E8')
        .style('border', '1px solid rgba(26,22,20,0.15)')
        .style('border-radius', '4px')
        .style('padding', '8px 12px')
        .style('font-family', 'Georgia')
        .style('font-size', '13px')
        .style('color', '#1A1614')
        .style('box-shadow', '0 2px 8px rgba(0,0,0,0.12)')
        .style('z-index', '9999')
        .style('max-width', '220px');

  // ── 6. Links ────────────────────────────────────────────────────────────────
  const linkG = svg.append('g').attr('fill', 'none');

  linkG.selectAll('path')
    .data(graph.links)
    .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', d => d.color)
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('stroke-opacity', d => d.isSame ? 0.30 : 0.45)
      .style('cursor', 'default')
      .on('mousemove', function(event, d) {
        d3.select(this).attr('stroke-opacity', d.isSame ? 0.55 : 0.72);
        const label = d.isSame
          ? `${d.made_in} — stayed home`
          : `${d.made_in} → ${d.found_in}`;
        const sub = d.isUKDest
          ? 'Found in UK'
          : d.isSame ? 'Same country' : 'Cross-border';
        tip.style('display', 'block')
          .html(`<strong>${label}</strong><br/><span style="font-family:Courier New;font-size:11px;letter-spacing:.06em;opacity:.65">${sub}</span><br/>${d.count.toLocaleString()} objects`);
        tip.style('left', (event.clientX + 14) + 'px')
           .style('top',  (event.clientY - 48) + 'px');
      })
      .on('mouseleave', function(event, d) {
        d3.select(this).attr('stroke-opacity', d.isSame ? 0.30 : 0.45);
        tip.style('display', 'none');
      });

  // ── 7. Nodes ────────────────────────────────────────────────────────────────
  const isLeft = d => d.id.startsWith('L_');

  const nodeG = svg.append('g');

  nodeG.selectAll('rect')
    .data(graph.nodes)
    .join('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width',  d => d.x1 - d.x0)
      .attr('height', d => Math.max(1, d.y1 - d.y0))
      .attr('fill', d => {
        const name = d.id.slice(2);
        if (name === 'United Kingdom') return GOLD;
        return STONE_ALT;
      })
      .attr('opacity', 0.85)
      .attr('rx', 2);

  // ── 8. Labels ───────────────────────────────────────────────────────────────
  const labelPad = 10;

  nodeG.selectAll('text')
    .data(graph.nodes)
    .join('text')
      .attr('x', d => isLeft(d) ? d.x0 - labelPad : d.x1 + labelPad)
      .attr('y', d => (d.y0 + d.y1) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => isLeft(d) ? 'end' : 'start')
      .attr('font-family', 'Courier New')
      .attr('font-size', Math.max(9, Math.min(11, W / 82)))
      .attr('letter-spacing', '0.04em')
      .attr('fill', d => {
        const name = d.id.slice(2);
        return name === 'United Kingdom' ? GOLD : 'rgba(26,22,20,0.65)';
      })
      .text(d => d.id.slice(2))
      .on('mousemove', function(event, d) {
        const name = d.id.slice(2);
        const vol  = isLeft(d) ? madeVol.get(name) : foundVol.get(name);
        const side = isLeft(d) ? 'Made in' : 'Found in';
        tip.style('display', 'block')
          .html(`<strong>${name}</strong><br/><span style="font-family:Courier New;font-size:11px;letter-spacing:.06em;opacity:.65">${side}</span><br/>${(vol || 0).toLocaleString()} objects`);
        tip.style('left', (event.clientX + 14) + 'px')
           .style('top',  (event.clientY - 48) + 'px');
      })
      .on('mouseleave', () => tip.style('display', 'none'));

  // ── 9. Column headers ────────────────────────────────────────────────────────
  const leftX  = graph.nodes.find(d => isLeft(d))?.x0 ?? margin.left;
  const rightX = graph.nodes.find(d => !isLeft(d))?.x1 ?? W - margin.right;

  const hdrStyle = sel => sel
    .attr('font-family', 'Courier New')
    .attr('font-size', 10)
    .attr('letter-spacing', '0.18em')
    .attr('fill', 'rgba(26,22,20,0.35)')
    .attr('y', margin.top - 4);

  svg.append('text').call(hdrStyle)
    .attr('x', leftX).attr('text-anchor', 'end').text('MADE IN');

  svg.append('text').call(hdrStyle)
    .attr('x', rightX + labelPad).attr('text-anchor', 'start').text('FOUND IN');
}
