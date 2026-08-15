/* SVG 图表渲染：K 线、深度、迷你走势 */
const Charts = (() => {
  function svg(name, attrs) {
    const ns = 'http://www.w3.org/2000/svg';
    const el = document.createElementNS(ns, name);
    Object.keys(attrs || {}).forEach(k => el.setAttribute(k, attrs[k]));
    return el;
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function fmtMoney(v, digits) {
    if (v == null || isNaN(v)) return '--';
    const d = digits == null ? (Math.abs(v) < 0.001 ? 8 : Math.abs(v) < 1 ? 6 : 2) : digits;
    return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function fmtTime(ms, interval) {
    const d = new Date(ms);
    const p = n => String(n).padStart(2, '0');
    if (interval === '1d') return p(d.getMonth() + 1) + '-' + p(d.getDate());
    return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function polylinePoints(points, xFn, yFn) {
    return points.map((p, i) => xFn(p, i) + ',' + yFn(p, i)).join(' ');
  }

  function drawCandles(el, klines, ind, opts) {
    opts = opts || {};
    const w = el.clientWidth || 900;
    const h = el.clientHeight || 420;
    clear(el);
    const root = svg('svg', { width: w, height: h, viewBox: '0 0 ' + w + ' ' + h });
    el.appendChild(root);

    const count = klines.length;
    if (!count) return;

    const padL = 14, padR = 10, padT = 10;
    const volH = 74, xLabelH = 22;
    const plotW = w - padL - padR;
    const plotH = h - padT - volH - xLabelH;
    const yTop = padT, yBottom = yTop + plotH;
    const volTop = yBottom + 6, volBottom = yBottom + volH - 4;

    const closes = ind.closes, highs = ind.highs, lows = ind.lows, vols = ind.vols;
    let min = Infinity, max = -Infinity;
    for (let i = 0; i < count; i++) {
      if (lows[i] < min) min = lows[i];
      if (highs[i] > max) max = highs[i];
    }
    const extras = [];
    if (opts.ma) extras.push(ind.sma20, ind.sma50, ind.ema12, ind.ema26);
    if (opts.boll) extras.push(ind.boll.upper, ind.boll.mid, ind.boll.lower);
    extras.forEach(arr => {
      for (let i = 0; i < count; i++) {
        if (arr[i] == null) continue;
        if (arr[i] < min) min = arr[i];
        if (arr[i] > max) max = arr[i];
      }
    });
    const pad = (max - min) * 0.08 || 1;
    min -= pad; max += pad;

    const xAt = i => padL + (i + 0.5) * (plotW / count);
    const yAt = v => yBottom - ((v - min) / (max - min)) * plotH;
    const step = plotW / count;
    const candleW = Math.max(1.5, step * 0.62);

    function drawLine(arr, color, width, dash) {
      if (!arr) return;
      const pts = [];
      for (let i = 0; i < count; i++) if (arr[i] != null) pts.push([i, arr[i]]);
      if (pts.length < 2) return;
      const line = svg('polyline', {
        points: polylinePoints(pts, (p) => xAt(p[0]), (p) => yAt(p[1])),
        fill: 'none', stroke: color, 'stroke-width': width || 1.2,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round'
      });
      if (dash) line.setAttribute('stroke-dasharray', dash);
      root.appendChild(line);
    }

    // grid
    for (let g = 0; g <= 4; g++) {
      const y = yTop + (plotH / 4) * g;
      root.appendChild(svg('line', { x1: padL, x2: w - padR, y1: y, y2: y, stroke: '#1e2932', 'stroke-width': 1 }));
      const val = max - ((max - min) / 4) * g;
      const t = svg('text', { x: w - padR - 4, y: y + 3, 'text-anchor': 'end', fill: '#647483', 'font-size': 10 });
      t.textContent = fmtMoney(val, Math.abs(val) < 1 ? 4 : 2);
      root.appendChild(t);
    }

    // x labels
    const labelEvery = Math.max(1, Math.ceil(count / 6));
    for (let i = 0; i < count; i += labelEvery) {
      const x = xAt(i);
      const t = svg('text', { x, y: h - 7, 'text-anchor': 'middle', fill: '#647483', 'font-size': 10 });
      t.textContent = fmtTime(klines[i][0], opts.interval);
      root.appendChild(t);
      root.appendChild(svg('line', { x1: x, x2: x, y1: yTop, y2: yBottom, stroke: 'rgba(38,50,61,.35)', 'stroke-width': 1, 'stroke-dasharray': '3 5' }));
    }

    // overlays behind candles
    if (opts.ma) {
      drawLine(ind.sma20, '#f4b942', 1.2);
      drawLine(ind.sma50, '#58a6ff', 1.2);
      drawLine(ind.ema12, '#2dd4bf', 1.1);
      drawLine(ind.ema26, '#c084fc', 1.1);
    }
    if (opts.boll) {
      drawLine(ind.boll.upper, '#8fa0ae', 1, '3 4');
      drawLine(ind.boll.mid, '#8fa0ae', 0.8, '3 4');
      drawLine(ind.boll.lower, '#8fa0ae', 1, '3 4');
    }

    // candles
    const volMax = Math.max.apply(null, vols.slice(-count)) || 1;
    const group = svg('g', {});
    klines.forEach((k, i) => {
      const o = +k[1], hi = +k[2], lo = +k[3], c = +k[4], v = +k[5];
      const up = c >= o;
      const color = up ? '#2fbf71' : '#f0546d';
      const x = xAt(i);
      const wick = svg('line', { x1: x, x2: x, y1: yAt(hi), y2: yAt(lo), stroke: color, 'stroke-width': 1 });
      group.appendChild(wick);
      const yO = yAt(o), yC = yAt(c);
      const bodyY = Math.min(yO, yC);
      const bodyH = Math.max(1.5, Math.abs(yO - yC));
      const body = svg('rect', { x: x - candleW / 2, y: bodyY, width: candleW, height: bodyH, fill: color, rx: 1 });
      group.appendChild(body);
      if (opts.vol) {
        const vh = Math.max(1, (v / volMax) * (volBottom - volTop));
        const vb = svg('rect', { x: x - candleW / 2, y: volBottom - vh, width: candleW, height: vh, fill: color, opacity: .55, rx: 1 });
        group.appendChild(vb);
      }
    });
    root.appendChild(group);

    // hover highlight
    let lastIdx = -1;
    const band = svg('rect', { x: 0, y: yTop, width: step, height: plotH, fill: 'rgba(45,212,191,.06)', display: 'none' });
    root.appendChild(band);

    function hoverAt(clientX) {
      const rect = root.getBoundingClientRect();
      const x = clientX - rect.left;
      const idx = Math.min(count - 1, Math.max(0, Math.floor((x - padL) / step)));
      if (idx === lastIdx) return;
      lastIdx = idx;
      band.setAttribute('x', padL + idx * step);
      band.style.display = 'block';
      const k = klines[idx];
      const l = ind ? Indicators.latest(ind, idx) : null;
      if (opts.onHover) {
        opts.onHover({
          time: fmtTime(k[0], opts.interval),
          o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5],
          rsi: l ? l.rsi : null, macd: l ? l.macd : null,
          sma20: l ? l.sma20 : null, bollU: l ? l.bollUpper : null, bollL: l ? l.bollLower : null
        });
      }
    }

    root.addEventListener('mousemove', ev => hoverAt(ev.clientX));
    root.addEventListener('mouseleave', () => {
      lastIdx = -1;
      band.style.display = 'none';
      if (opts.onLeave) opts.onLeave();
    });
    return root;
  }

  function drawDepth(el, depth) {
    const w = el.clientWidth || 900;
    const h = el.clientHeight || 300;
    clear(el);
    const root = svg('svg', { width: w, height: h, viewBox: '0 0 ' + w + ' ' + h });
    el.appendChild(root);
    const bids = (depth.bids || []).slice().sort((a, b) => a[0] - b[0]);
    const asks = (depth.asks || []).slice().sort((a, b) => a[0] - b[0]);
    if (!bids.length && !asks.length) return;

    const padL = 12, padR = 12, padT = 14, padB = 26;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    let min = bids.length ? bids[0][0] : asks[0][0];
    let max = asks.length ? asks[asks.length - 1][0] : bids[bids.length - 1][0];
    if (min === max) { min *= .999; max *= 1.001; }
    const span = max - min || 1;

    const bidCum = [], askCum = [];
    let bidTotal = 0, askTotal = 0;
    bids.forEach(([p, q]) => { bidTotal += q; bidCum.push({ p, q: bidTotal }); });
    asks.forEach(([p, q]) => { askTotal += q; askCum.push({ p, q: askTotal }); });
    const yMax = Math.max(bidTotal, askTotal, 1);

    const xAt = p => padL + ((p - min) / span) * plotW;
    const yAt = v => padT + plotH - (v / yMax) * plotH;

    // grid
    for (let g = 0; g <= 4; g++) {
      const y = padT + (plotH / 4) * g;
      root.appendChild(svg('line', { x1: padL, x2: w - padR, y1: y, y2: y, stroke: '#1e2932', 'stroke-width': 1 }));
      const t = svg('text', { x: padL + 2, y: y - 3, fill: '#647483', 'font-size': 9 });
      t.textContent = Data.fmtNum(yMax * (1 - g / 4), 0);
      root.appendChild(t);
    }

    function area(points, color) {
      if (!points.length) return;
      const pts = [[padL, yAt(0)]].concat(points.map(p => [xAt(p.p), yAt(p.q)])).concat([[w - padR, yAt(0)]]);
      const poly = svg('polygon', {
        points: polylinePoints(pts, p => p[0], p => p[1]),
        fill: color, stroke: 'none', opacity: .22
      });
      root.appendChild(poly);
      const linePts = points.map(p => [xAt(p.p), yAt(p.q)]);
      const line = svg('polyline', {
        points: polylinePoints(linePts, p => p[0], p => p[1]),
        fill: 'none', stroke: color, 'stroke-width': 1.6
      });
      root.appendChild(line);
    }

    area(bidCum, '#2fbf71');
    area(askCum, '#f0546d');

    const mid = depth.price || ((bids.length && asks.length) ? (bids[bids.length - 1][0] + asks[0][0]) / 2 : min);
    const mx = Math.min(Math.max(mid, min), max);
    root.appendChild(svg('line', { x1: xAt(mx), x2: xAt(mx), y1: padT, y2: padT + plotH, stroke: '#f4b942', 'stroke-width': 1, 'stroke-dasharray': '4 3' }));
    const t = svg('text', { x: xAt(mx), y: padT - 3, 'text-anchor': 'middle', fill: '#f4b942', 'font-size': 10, 'font-weight': 700 });
    t.textContent = Data.fmtNum(mid, 2);
    root.appendChild(t);

    // x labels
    for (let g = 0; g <= 4; g++) {
      const x = padL + (plotW / 4) * g;
      const v = min + (span / 4) * g;
      const xt = svg('text', { x, y: h - 8, 'text-anchor': 'middle', fill: '#647483', 'font-size': 9 });
      xt.textContent = Data.fmtNum(v, 2);
      root.appendChild(xt);
    }

    const l1 = svg('text', { x: padL + 4, y: h - 8, fill: '#2fbf71', 'font-size': 10, 'font-weight': 700 });
    l1.textContent = '买盘 ' + Data.fmtNum(bidTotal, 0);
    const l2 = svg('text', { x: w - padR - 4, y: h - 8, 'text-anchor': 'end', fill: '#f0546d', 'font-size': 10, 'font-weight': 700 });
    l2.textContent = '卖盘 ' + Data.fmtNum(askTotal, 0);
    root.appendChild(l1);
    root.appendChild(l2);
    return root;
  }

  function drawSparkline(el, values, color) {
    clear(el);
    if (!values || values.length < 2) return;
    const w = el.clientWidth || 74;
    const h = el.clientHeight || 22;
    const root = svg('svg', { width: w, height: h, viewBox: '0 0 ' + w + ' ' + h });
    el.appendChild(root);
    const min = Math.min.apply(null, values);
    const max = Math.max.apply(null, values);
    const span = max - min || 1;
    const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)]);
    const area = svg('polygon', {
      points: polylinePoints(pts, p => p[0], p => p[1]) + ' ' + w + ',' + h + ' 0,' + h,
      fill: color, opacity: .12, stroke: 'none'
    });
    const line = svg('polyline', {
      points: polylinePoints(pts, p => p[0], p => p[1]),
      fill: 'none', stroke: color, 'stroke-width': 1.4
    });
    root.appendChild(area);
    root.appendChild(line);
  }

  return { drawCandles, drawDepth, drawSparkline, fmtMoney, fmtTime };
})();
