// ═══════════════════════════════════════
// findspot.js — Section 04: Findspot
// ═══════════════════════════════════════
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

const PALETTE = [
  '#8B7355','#6E9EC8','#5A9E8A','#5A6AA0',
  '#C85A3A','#A87858','#6A8AAA','#AA8840',
  '#C89040','#4A8AAA','#789050','#8A7AAA',
  '#809068','#C87060','#9A7848','#B0A090',
];

export async function initFindspot() {
  const fsData = await d3.csv('./data/findspot.csv', d3.autoType);

  const wrap = document.getElementById('findspot-bars');
  if (!wrap) return;

  const TOP_N = 14;
  const top   = fsData.slice(0, TOP_N);
  const other = fsData.slice(TOP_N).reduce((s, d) => s + d.count, 0);
  const slices = [...top, { country: 'Other', count: other }];

  const W = Math.min(wrap.clientWidth || 360, 360);
  const R = W / 2 * 0.72;
  const IR = R * 0.46;
  const H = W;

  const svg = d3.select('#findspot-bars').append('svg')
    .attr('viewBox', `0 38 ${W} ${H - 76}`)
    .attr('width', '100%')
    .style('display', 'block');

  const g = svg.append('g').attr('transform', `translate(${W / 2},${H / 2})`);

  const pie   = d3.pie().value(d => d.count).sort(null);
  const arc   = d3.arc().innerRadius(IR).outerRadius(R);
  const arcHover = d3.arc().innerRadius(IR).outerRadius(R + 8);

  const color = d => d.country === 'Other'
    ? 'rgba(26,22,20,0.12)'
    : PALETTE[slices.indexOf(d)];

  // tooltip
  const tip = d3.select(wrap).append('div')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('background', 'rgba(245,240,232,0.96)')
    .style('border', '1px solid rgba(26,22,20,0.12)')
    .style('padding', '7px 12px')
    .style('font-family', 'Courier New, monospace')
    .style('font-size', '11px')
    .style('letter-spacing', '0.06em')
    .style('color', '#1A1614')
    .style('border-radius', '2px')
    .style('opacity', 0)
    .style('transition', 'opacity 0.15s');

  d3.select(wrap).style('position', 'relative');

  const total = d3.sum(slices, d => d.count);

  const paths = g.selectAll('path')
    .data(pie(slices))
    .join('path')
    .attr('fill', d => color(d.data))
    .attr('stroke', 'rgba(245,240,232,0.6)')
    .attr('stroke-width', 1.5)
    .attr('d', arc)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).transition().duration(150).attr('d', arcHover(d));
      const pct = (d.data.count / total * 100).toFixed(1);
      tip.style('opacity', 1)
        .html(`<strong>${d.data.country}</strong><br>${d.data.count.toLocaleString()} objects · ${pct}%`);
    })
    .on('mousemove', function(event) {
      const [mx, my] = d3.pointer(event, wrap);
      tip.style('left', (mx + 14) + 'px').style('top', (my - 28) + 'px');
    })
    .on('mouseout', function(event, d) {
      d3.select(this).transition().duration(150).attr('d', arc(d));
      tip.style('opacity', 0);
    });

  // animate in
  paths.each(function(d) {
    const el = d3.select(this);
    const interpolate = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
    el.transition().duration(900).delay((_, i) => i * 40).ease(d3.easeCubicOut)
      .attrTween('d', () => t => arc(interpolate(t)));
  });

  // centre label
  g.append('text')
    .attr('text-anchor', 'middle').attr('dy', '-0.3em')
    .attr('font-family', 'Courier New, monospace').attr('font-size', 11)
    .attr('fill', 'rgba(26,22,20,0.45)').attr('letter-spacing', '0.06em')
    .text('total objects');
  g.append('text')
    .attr('text-anchor', 'middle').attr('dy', '1.1em')
    .attr('font-size', 22).attr('font-weight', 400).attr('letter-spacing', '-0.02em')
    .attr('fill', '#1A1614')
    .text(total.toLocaleString());

  // legend
  const leg = d3.select(wrap).append('div')
    .style('display', 'flex').style('flex-wrap', 'wrap')
    .style('gap', '6px 16px').style('margin-top', '2px')
    .style('justify-content', 'center');

  slices.forEach((d, i) => {
    const item = leg.append('div')
      .style('display', 'flex').style('align-items', 'center').style('gap', '5px');
    item.append('div')
      .style('width', '8px').style('height', '8px').style('border-radius', '2px').style('flex-shrink', '0')
      .style('background', d.country === 'Other' ? 'rgba(26,22,20,0.12)' : PALETTE[i]);
    item.append('span')
      .style('font-family', 'Courier New, monospace').style('font-size', '9px')
      .style('letter-spacing', '0.06em').style('color', 'rgba(26,22,20,0.6)')
      .text(d.country);
  });
}
