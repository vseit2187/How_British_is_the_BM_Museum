// ═══════════════════════════════════════
// map.js — Section 02: World map + bars
// ═══════════════════════════════════════
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import * as topojson from 'https://cdn.jsdelivr.net/npm/topojson-client@3/+esm';

const PALETTE = {
  'United Kingdom': '#8B7355',
  'Italy':    '#6E9EC8', 'China':    '#C85A3A', 'Greece':   '#5A9E8A',
  'Germany':  '#8A7AAA', 'India':    '#C89040', 'France':   '#4A8AAA',
  'Cyprus':   '#A87858', 'Japan':    '#A86070', 'Iran':     '#789050',
  'Egypt':    '#AA8840', 'Turkey':   '#6A8AAA', 'Nigeria':  '#9A7848',
  'Iraq':     '#5A6AA0', 'Spain':    '#809068',
};

// numeric ISO → country name (subset)
const ID_MAP = {
  380:'Italy', 156:'China', 300:'Greece', 276:'Germany', 356:'India',
  250:'France', 196:'Cyprus', 392:'Japan', 364:'Iran', 818:'Egypt',
  792:'Turkey', 566:'Nigeria', 368:'Iraq', 724:'Spain', 840:'USA',
  826:'United Kingdom', 504:'Morocco', 788:'Tunisia', 760:'Syria',
  422:'Lebanon', 376:'Israel', 643:'Russia', 804:'Ukraine',
  586:'Pakistan', 144:'Sri Lanka', 50:'Bangladesh', 400:'Jordan',
  288:'Ghana', 404:'Kenya', 710:'South Africa', 76:'Brazil',
  484:'Mexico', 604:'Peru', 32:'Argentina', 152:'Chile',
  36:'Australia', 554:'New Zealand', 702:'Singapore', 104:'Myanmar',
  116:'Cambodia', 764:'Thailand', 360:'Indonesia', 458:'Malaysia',
};

export async function initMap() {
  const ppData  = await d3.csv('./data/production_place.csv', d3.autoType);
  const world   = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');

  const ppMap   = new Map(ppData.map(d => [d.country, d.count]));
  const maxVal  = d3.max(ppData, d => d.count);
  const colScale = d3.scaleSequentialLog([1, maxVal], ['#D4C8B0', '#6B3A1A']);

  // ── MAP ──
  const mapWrap = document.getElementById('map-container');
  if (!mapWrap) return;

  const W  = mapWrap.clientWidth || 900;
  const H  = Math.round(W * 0.5);
  const proj = d3.geoNaturalEarth1().scale(W / 6.2).translate([W / 2, H / 2]);
  const path = d3.geoPath(proj);

  const svgMap = d3.select('#map-svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', '100%');

  svgMap.append('rect').attr('width', W).attr('height', H).attr('fill', '#EDE8DF');

  const mapTip = document.getElementById('map-tip');

  svgMap.selectAll('path')
    .data(topojson.feature(world, world.objects.countries).features)
    .join('path')
    .attr('d', path)
    .attr('stroke', '#F5F0E8')
    .attr('stroke-width', 0.5)
    .attr('fill', d => {
      const name = ID_MAP[+d.id];
      if (name === 'United Kingdom') return '#8B7355';
      const v = name ? ppMap.get(name) : null;
      return v ? colScale(v) : '#D8D0C0';
    })
    .on('mousemove', (event, d) => {
      const name = ID_MAP[+d.id];
      const v    = name ? ppMap.get(name) : null;
      if (!v) return;
      mapTip.style.display = 'block';
      mapTip.style.left    = (event.clientX + 14) + 'px';
      mapTip.style.top     = (event.clientY - 36) + 'px';
      mapTip.textContent   = `${name}: ${v.toLocaleString()} objects`;
    })
    .on('mouseleave', () => { mapTip.style.display = 'none'; });

  // legend
  const lg = svgMap.append('g').attr('transform', `translate(${W - 180}, ${H - 36})`);
  ['#D4C8B0', '#C4A880', '#A07040', '#7A4820', '#6B3A1A'].forEach((c, i) => {
    lg.append('rect').attr('x', i * 24).attr('width', 24).attr('height', 8).attr('fill', c);
  });
  lg.append('text').attr('x', 0).attr('y', 20)
    .attr('font-size', 9).attr('fill', 'rgba(26,22,20,0.4)').attr('font-family', 'Courier New').text('Fewer');
  lg.append('text').attr('x', 96).attr('y', 20)
    .attr('font-size', 9).attr('fill', 'rgba(26,22,20,0.4)').attr('font-family', 'Courier New').text('More');

  // ── BAR CHART ──
  const barWrap = document.getElementById('bar-chart');
  if (!barWrap) return;

  const top15 = ppData
    .filter(d => d.country && d.country !== '(no place recorded)')
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // tooltip
  const barTip = d3.select(barWrap).append('div')
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

  d3.select(barWrap).style('position', 'relative');

  function drawBars(containerWidth) {
    d3.select('#bar-chart svg').remove();

    const BW = containerWidth;
    const bh = 22, gap = 6;
    const margin = { top: 8, right: 55, bottom: 8, left: 108 };
    const innerW = BW - margin.left - margin.right;
    const TH = top15.length * (bh + gap) + margin.top + margin.bottom;
    const total = d3.sum(top15, d => d.count);

    const x = d3.scaleLinear([0, top15[0].count], [0, innerW]);

    const svgBar = d3.select('#bar-chart').append('svg')
      .attr('viewBox', `0 0 ${BW} ${TH}`)
      .attr('width', '100%');

    const g = svgBar.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    top15.forEach((d, i) => {
      const y     = i * (bh + gap);
      const isUK  = d.country === 'United Kingdom';
      const color = PALETTE[d.country] || '#9B8B7B';

      g.append('text')
        .attr('x', -8).attr('y', y + bh / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('font-family', 'Courier New').attr('font-size', 10).attr('letter-spacing', '0.04em')
        .attr('fill', isUK ? '#1A1614' : 'rgba(26,22,20,0.5)')
        .text(d.country);

      g.append('rect')
        .attr('x', 0).attr('y', y).attr('width', innerW).attr('height', bh)
        .attr('fill', 'rgba(26,22,20,0.05)').attr('rx', 1);

      g.append('rect')
        .attr('x', 0).attr('y', y).attr('width', 0).attr('height', bh)
        .attr('fill', color).attr('opacity', isUK ? 1 : 0.75).attr('rx', 1)
        .transition().duration(800).delay(i * 40).ease(d3.easeCubicOut)
        .attr('width', x(d.count));

      g.append('text')
        .attr('x', x(d.count) + 5).attr('y', y + bh / 2 + 4)
        .attr('font-family', 'Courier New').attr('font-size', 10)
        .attr('fill', 'rgba(26,22,20,0.35)')
        .text((d.count / 1000).toFixed(1) + 'k');

      // invisible hit area for hover
      g.append('rect')
        .attr('x', -margin.left).attr('y', y)
        .attr('width', BW).attr('height', bh)
        .attr('fill', 'transparent')
        .style('cursor', 'default')
        .on('mouseover', function(event) {
          const pct = (d.count / total * 100).toFixed(1);
          barTip.style('opacity', 1)
            .html(`<strong>${d.country}</strong><br>${d.count.toLocaleString()} objects · ${pct}% of top 15`);
        })
        .on('mousemove', function(event) {
          const [mx, my] = d3.pointer(event, barWrap);
          barTip.style('left', (mx + 14) + 'px').style('top', (my - 28) + 'px');
        })
        .on('mouseout', () => barTip.style('opacity', 0));
    });
  }

  drawBars(barWrap.clientWidth || 700);

  const ro = new ResizeObserver(entries => {
    const w = entries[0].contentRect.width;
    if (w > 0) drawBars(w);
  });
  ro.observe(barWrap);
}
