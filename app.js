(() => {
  'use strict';
  let D = window.DATA;
  const I18N = window.I18N;
  let SECTOR_MAP = {};
  let COMP_MAP = new Map();
  let INST_MAP = new Map();
  let TODAY = new Date('2026-08-15T08:40:00+08:00');
  function buildData() {
    D = window.DATA;
    SECTOR_MAP = {};
    D.sectors.forEach(function (s) { SECTOR_MAP[s.id] = s; });
    COMP_MAP = new Map();
    D.companies.forEach(function (c) { COMP_MAP.set(c.name, c); });
    INST_MAP = new Map();
    D.institutions.forEach(function (i) { INST_MAP.set(i.name, i); });
    if (D.meta && D.meta.asOf) {
      const d = new Date(String(D.meta.asOf).replace(' ', 'T') + '+08:00');
      if (!isNaN(d.getTime())) TODAY = d;
    }
  }
  buildData();

  const ICONS = {
    gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    share2: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/>',
    list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    landmark: '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="m12 2 6 5H6z"/>',
    radar: '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62a10 10 0 1 0 19.42 0"/><path d="M16.24 7.76A6 6 0 1 0 8.15 16.3"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.2"/>',
    sparkles: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="m19 15 .7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
    'arrow-up-right': '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    'arrow-down-right': '<path d="m7 7 10 10"/><path d="M17 7v10H7"/>',
    'chevron-right': '<path d="m9 18 6-6-6-6"/>',
    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
    'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    'chevron-up': '<path d="m18 15-6-6-6 6"/>',
    'chevrons-up-down': '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    'trending-up': '<path d="M22 7 13.5 15.5l-5-5L2 17"/><path d="M16 7h6v6"/>',
    'trending-down': '<path d="M22 17 13.5 8.5l-5 5L2 7"/><path d="M16 17h6v-6"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    'pie-chart': '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    'bar-chart': '<path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>',
    'external-link': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2"/><circle cx="12" cy="12" r="3"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    wallet: '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2"/><path d="M21 12a2 2 0 0 0-2-2h-6a2 2 0 0 0 0 4h6a2 2 0 0 0 2-2z"/>',
    banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    pulse: '<path d="M2 12h4l3-8 4 16 3-8h6"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    layers: '<path d="m12 2 10 6-10 6L2 8z"/><path d="m2 16 10 6 10-6"/><path d="m2 12 10 6 10-6"/>',
    'maximize-2': '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
    'zoom-in': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/>',
    'zoom-out': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.info) + '</svg>';
  }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(v) {
    if (v == null) return '-';
    const n = Number(v);
    if (n >= 10000) return (n / 10000).toFixed(2) + '万亿';
    if (n >= 1000) return n.toLocaleString('zh-CN', { maximumFractionDigits: 1 }) + '亿';
    return n.toLocaleString('zh-CN', { maximumFractionDigits: 1 }) + '亿';
  }
  function fmtDate(s) {
    if (!s) return '-';
    const parts = s.split('-');
    return parts[1] + '/' + parts[2];
  }
  function dateCutoff(days) {
    const d = new Date(TODAY.getTime());
    d.setDate(d.getDate() - days);
    return d;
  }
  function inRange(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00+08:00');
    return d >= dateCutoff(days);
  }
  function sum(arr, fn) {
    if (!fn) fn = function (x) { return x; };
    return arr.reduce(function (a, b) { return a + fn(b); }, 0);
  }
  function pctChange(cur, prev) {
    if (!prev) return cur > 0 ? 100 : 0;
    return ((cur - prev) / prev) * 100;
  }
  function sectorName(id) { const s = SECTOR_MAP[id]; return s ? s.name : id; }
  function sectorColor(id) { const s = SECTOR_MAP[id]; return s ? s.color : '#94a3b8'; }
  function initials(name) {
    const base = state && state.lang && state.lang !== 'zh' ? enNameOf(name) : name;
    return String(base || '?').slice(0, 2);
  }
  function levelInfo(lv) {
    if (lv === 'high') return { label: '高', cls: 'red' };
    if (lv === 'medium') return { label: '中', cls: 'amber' };
    return { label: '低', cls: 'blue' };
  }
  function colorHash(str) {
    const colors = ['#2563eb', '#0d9f6e', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#db2777', '#4f46e5'];
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return colors[h % colors.length];
  }
  function debounce(fn, ms) {
    let t = null;
    return function () {
      clearTimeout(t);
      const args = arguments;
      t = setTimeout(function () { fn.apply(null, args); }, ms);
    };
  }
  function $(id) { return document.getElementById(id); }

  function enNameOf(name) {
    if (I18N && I18N.lookup && I18N.lookup[name]) return I18N.lookup[name].en || name;
    return name;
  }

  function localizeDom(root) {
    if (!I18N || !state.lang) return;
    const lang = state.lang;
    const lookup = I18N.lookup;
    const keys = Object.keys(lookup).sort(function (a, b) { return b.length - a.length; });
    function translateText(v) {
      if (!v) return v;
      let out = v;
      const toZh = [];
      const pairs = [];
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const entry = lookup[k];
        const zhVal = k;
        const hasEn = Object.prototype.hasOwnProperty.call(entry, 'en');
        const enVal = hasEn ? entry.en : k;
        const target = lang === 'zh' ? zhVal : (Object.prototype.hasOwnProperty.call(entry, lang) ? entry[lang] : enVal);
        if (target !== k) pairs.push([k, target]);
        if (enVal.length >= 4 && enVal !== zhVal) pairs.push([enVal, target]);
        ['en', 'es', 'pt', 'fr'].forEach(function (l) {
          const val = entry[l];
          if (val && val !== k && val.length >= 4) toZh.push([val, k]);
        });
      }
      const han = /[\u3400-\u4dbf\u4e00-\u9fff]/;
      function replacePair(text, pk, rep) {
        if (pk.length === 1 && han.test(pk)) {
          const parts = text.split(pk);
          let res = parts[0];
          for (let j = 1; j < parts.length; j++) {
            const before = parts[j - 1].slice(-1);
            const after = parts[j].charAt(0);
            const standalone = !(han.test(before) || han.test(after));
            res += (standalone ? rep : pk) + parts[j];
          }
          return res;
        }
        return text.split(pk).join(rep);
      }
      toZh.sort(function (a, b) { return b[0].length - a[0].length; });
      for (let j = 0; j < toZh.length; j++) {
        const pk = toZh[j][0], rep = toZh[j][1];
        if (out.indexOf(pk) >= 0) out = replacePair(out, pk, rep);
      }
      pairs.sort(function (a, b) { return b[0].length - a[0].length; });
      for (let j = 0; j < pairs.length; j++) {
        const pk = pairs[j][0], rep = pairs[j][1];
        if (out.indexOf(pk) >= 0) out = replacePair(out, pk, rep);
      }
      return out;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach(function (n) {
      const v = n.nodeValue;
      const t = translateText(v);
      if (t !== v) n.nodeValue = t;
    });
    root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(function (el) {
      ['placeholder', 'title', 'aria-label'].forEach(function (attr) {
        const val = el.getAttribute(attr);
        if (val) {
          const t = translateText(val);
          if (t !== val) el.setAttribute(attr, t);
        }
      });
    });
    document.querySelectorAll('select:not(#lang-select) option').forEach(function (opt) {
      const v = opt.textContent;
      const t = translateText(v);
      if (t !== v) opt.textContent = t;
    });
    const langSel = document.getElementById('lang-select');
    if (langSel) {
      const zhOpt = langSel.querySelector('option[value="zh"]');
      if (zhOpt) zhOpt.textContent = lang === 'zh' ? '中文' : I18N.phrase('中文', lang);
    }
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
    document.title = translateText(document.title);
  }

  const state = {
    view: 'overview',
    range: 365,
    page: 1,
    dealFilter: { q: '', sector: 'all', round: 'all', min: 0 },
    instFilter: { q: '', type: 'all', sector: 'all' },
    flowFilter: { sectors: new Set(), min: 3, cross: false, q: '' },
    signalFilter: { level: 'all', cat: 'all' },
    rules: {},
    sort: { key: 'date', dir: -1 },
    selected: null,
    reportSeed: 1,
    llmKey: '',
    llmOn: false,
    reportGenerating: false,
    llmReport: null,
    lang: 'zh'
  };
  D.rules.forEach(function (r) { state.rules[r.id] = r.enabled; });
  try {
    state.llmKey = localStorage.getItem('cf_llm_key') || '';
    state.llmOn = localStorage.getItem('cf_llm_on') === '1';
    const savedLang = localStorage.getItem('cf_lang');
    if (savedLang && I18N && I18N.langs[savedLang]) state.lang = savedLang;
  } catch (e) { /* noop */ }

  let deals = [];
  let byCompany = {};
  let byInst = {};
  function buildDerived() {
    deals = D.deals.map(function (d) {
      const co = COMP_MAP.get(d.companyName) || {};
      return {
        id: d.id,
        company: d.companyName,
        companyId: co.id || '',
        sector: d.sector,
        sectorName: sectorName(d.sector),
        sectorColor: sectorColor(d.sector),
        region: d.region,
        date: d.date,
        round: d.round,
        amount: d.amount,
        lead: d.lead,
        co: d.co,
        note: d.note,
        cross: d.cross
      };
    });
    byCompany = {};
    deals.forEach(function (d) { (byCompany[d.company] = byCompany[d.company] || []).push(d); });
    byInst = {};
    deals.forEach(function (d) {
      [d.lead].concat(d.co).forEach(function (n) {
        (byInst[n] = byInst[n] || []).push(d);
      });
    });
  }
  buildDerived();

  function fillIcons(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(function (el) {
      if (!el.querySelector('svg')) el.innerHTML = icon(el.getAttribute('data-icon'));
    });
  }

  function tl(text) {
    return I18N && I18N.phrase ? I18N.phrase(text, state.lang) : text;
  }

  function toast(msg, type) {
    const root = $('toast-root');
    const el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' error' : '');
    el.innerHTML = icon(type === 'error' ? 'alert' : 'check') + '<span>' + esc(msg) + '</span>';
    root.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity .25s';
      setTimeout(function () { el.remove(); }, 260);
    }, 2600);
  }

  function showTip(html, x, y) {
    const t = $('tooltip');
    t.innerHTML = html;
    localizeDom(t);
    t.hidden = false;
    const w = t.offsetWidth;
    const h = t.offsetHeight;
    let left = x + 12;
    let top = y - h - 12;
    if (left + w > window.innerWidth - 8) left = x - w - 12;
    if (top < 8) top = y + 16;
    t.style.left = Math.max(8, left) + 'px';
    t.style.top = top + 'px';
  }
  function hideTip() { $('tooltip').hidden = true; }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 100);
  }

  function render() {
    const views = {
      overview: renderOverview,
      flow: renderFlow,
      deals: renderDeals,
      institutions: renderInstitutions,
      signals: renderSignals,
      intel: renderIntel,
      ecosystem: renderEcosystem
    };
    document.querySelectorAll('.nav-item').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-view') === state.view);
    });
    const root = $('view-root');
    root.innerHTML = '';
    const frag = document.createElement('div');
    frag.innerHTML = views[state.view]();
    while (frag.firstChild) root.appendChild(frag.firstChild);
    fillIcons(root);
    if (state.view === 'overview') afterOverview();
    if (state.view === 'flow') afterFlow();
    if (state.view === 'deals') afterDeals();
    if (state.view === 'institutions') afterInstitutions();
    if (state.view === 'signals') afterSignals();
    if (state.view === 'intel') afterIntel();
    if (state.view === 'ecosystem') afterEcosystem();
    bindViewEvents(root);
    localizeDom(document.body);
    window.scrollTo(0, 0);
  }

  function go(view) {
    state.view = view;
    render();
  }

  function bindViewEvents(root) {
    root.addEventListener('click', function (e) {
      const navBtn = e.target.closest('.nav-item');
      if (navBtn) { go(navBtn.getAttribute('data-view')); return; }
      const dealRow = e.target.closest('[data-deal-id]');
      if (dealRow) { openDeal(Number(dealRow.getAttribute('data-deal-id'))); return; }
      const compBtn = e.target.closest('[data-comp-name]');
      if (compBtn) { openCompany(compBtn.getAttribute('data-comp-name')); return; }
      const instBtn = e.target.closest('[data-inst-name]');
      if (instBtn) { openInstitution(instBtn.getAttribute('data-inst-name')); return; }
    });
    root.addEventListener('mouseover', function (e) {
      const tv = e.target.closest('[data-tip]');
      if (tv) {
        const parts = tv.getAttribute('data-tip').split('|');
        const r = tv.getBoundingClientRect();
        showTip('<div class="tt-k">' + esc(parts[0]) + '</div><div class="tt-v">' + esc(parts[1]) + '</div>' + (parts[2] ? '<div class="tt-sub">' + esc(parts[2]) + '</div>' : ''), r.left, r.top);
      }
    });
    root.addEventListener('mouseout', function (e) {
      if (e.target.closest('[data-tip]')) hideTip();
    });
  }

  function kpiCard(ic, icCls, label, value, unit, foot) {
    return '<div class="card kpi-card"><div class="kpi-top"><span>' + esc(label) + '</span><span class="kpi-ic ' + icCls + '">' + icon(ic) + '</span></div><div class="kpi-value">' + esc(value) + (unit ? '<span class="unit">' + esc(unit) + '</span>' : '') + '</div><div class="kpi-foot">' + foot + '</div></div>';
  }

  function deltaHtml(pct, invert) {
    const up = pct >= 0;
    const good = invert ? !up : up;
    const cls = good ? 'trend-up' : 'trend-down';
    const ic = up ? 'arrow-up-right' : 'arrow-down-right';
    return '<span class="' + cls + '">' + icon(ic) + Math.abs(pct).toFixed(1) + '%</span><span>环比上期</span>';
  }

  function renderOverview() {
    const range = state.range;
    const recent = deals.filter(function (d) { return inRange(d.date, range); });
    const d30 = deals.filter(function (d) { return inRange(d.date, 30); });
    const prev30 = deals.filter(function (d) { const c = dateCutoff(30); const p1 = dateCutoff(60); const dt = new Date(d.date + 'T00:00:00+08:00'); return dt >= p1 && dt < c; });
    const total30 = sum(d30, function (d) { return d.amount; });
    const prevTotal30 = sum(prev30, function (d) { return d.amount; });
    const count30 = d30.length;
    const activeInst = new Set();
    d30.forEach(function (d) { [d.lead].concat(d.co).forEach(function (n) { activeInst.add(n); }); });
    const avg30 = count30 ? total30 / count30 : 0;
    const topDeals = deals.slice().sort(function (a, b) { return b.amount - a.amount || (a.date < b.date ? 1 : -1); }).slice(0, 7);
    const sectorTotals = {};
    d30.forEach(function (d) { sectorTotals[d.sector] = (sectorTotals[d.sector] || 0) + d.amount; });
    const sectorsSorted = Object.keys(sectorTotals).sort(function (a, b) { return sectorTotals[b] - sectorTotals[a]; });
    const topSector = sectorsSorted.length ? SECTOR_MAP[sectorsSorted[0]] : null;
    const instCount = {};
    deals.filter(function (d) { return inRange(d.date, 90); }).forEach(function (d) {
      [d.lead].concat(d.co).forEach(function (n) { instCount[n] = (instCount[n] || 0) + 1; });
    });
    const activeInstList = Object.keys(instCount).sort(function (a, b) { return instCount[b] - instCount[a]; }).slice(0, 6);
    const monthly = [];
    const mkeys = [];
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1);
      const key = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
      mkeys.push(key);
      monthly.push({ key: key, total: 0, count: 0 });
    }
    deals.forEach(function (d) {
      const k = d.date.slice(0, 7);
      const idx = mkeys.indexOf(k);
      if (idx >= 0) { monthly[idx].total += d.amount; monthly[idx].count++; }
    });
    const roundDist = {};
    recent.forEach(function (d) { roundDist[d.round] = (roundDist[d.round] || 0) + d.amount; });
    const roundsSorted = Object.keys(roundDist).sort(function (a, b) { return roundDist[b] - roundDist[a]; });
    const regionDist = {};
    recent.forEach(function (d) { regionDist[d.region] = (regionDist[d.region] || 0) + d.amount; });
    const regionsSorted = Object.keys(regionDist).sort(function (a, b) { return regionDist[b] - regionDist[a]; }).slice(0, 6);
    const nb = D.flows.monthly.map(function (r) { return r[1]; });
    const nbChange = pctChange(sum(nb.slice(-3)), sum(nb.slice(-6, -3)));

    const head = '<section class="page-head"><div><h1>市场总览</h1><p class="page-sub">' + esc(D.meta.asOf) + '</p></div><div class="head-actions"><button class="btn ghost" id="overview-export">' + icon('download') + '导出概览</button></div></section>';

    const kpis = '<div class="kpi-grid">' +
      kpiCard('wallet', 'green', '近30天融资总额', money(total30), '', deltaHtml(pctChange(total30, prevTotal30), true)) +
      kpiCard('list', 'blue', '近30天交易事件', count30, '笔', '<span class="trend-up">' + icon('arrow-up-right') + '8.4%</span><span>环比上期</span>') +
      kpiCard('users', 'amber', '近30天活跃机构', activeInst.size, '家', '<span>单家平均 ' + money(avg30) + '</span>') +
      kpiCard('flame', 'violet', '最热赛道', topSector ? topSector.name : '-', '', '<span style="color:' + esc(topSector ? topSector.color : '#64748b') + '">' + (topSector ? money(sectorTotals[topSector.id]) + ' · 占比 ' + (total30 ? (sectorTotals[topSector.id] / total30 * 100).toFixed(1) : '0') + '%' : '-') + '</span>') +
      '</div>';

    const monthlyHtml = '<div class="card chart-card"><div class="card-head"><div class="card-title">' + icon('trending-up') + '月度融资趋势</div><div class="card-meta">近12个月</div></div><div class="card-body"><div class="chart-box chart-lg" id="monthly-chart"></div></div></div>';
    const sectorHtml = '<div class="card chart-card"><div class="card-head"><div class="card-title">' + icon('pie-chart') + '赛道资金分布</div><div class="card-meta">近30天</div></div><div class="card-body"><div class="chart-box chart-md" id="sector-chart"></div></div></div>';

    const roundHtml = '<div class="card chart-card"><div class="card-head"><div class="card-title">' + icon('layers') + '轮次结构</div><div class="card-meta">近' + range + '天</div></div><div class="card-body"><div class="chart-box chart-sm" id="round-chart"></div><div class="chart-legend" id="round-legend"></div></div></div>';
    const regionHtml = '<div class="card chart-card"><div class="card-head"><div class="card-title">' + icon('map-pin') + '区域热度</div><div class="card-meta">近' + range + '天</div></div><div class="card-body"><div class="chart-box chart-md" id="region-chart"></div></div></div>';

    const moodHtml = '<div class="card mood-card"><div class="card-head"><div class="card-title">' + icon('activity') + '市场情绪温度</div><div class="card-meta">综合评分</div></div><div class="card-body"><div class="mood-wrap"><div class="mood-gauge"><div class="chart-box chart-sm" id="mood-chart"></div><div class="mood-value"><div class="num">78</div><div class="lbl">偏热</div></div></div><div class="mood-bars" id="mood-bars"></div></div></div></div>';

    const topDealRows = topDeals.map(function (d) {
      return '<tr data-deal-id="' + d.id + '"><td class="date-cell">' + fmtDate(d.date) + '</td><td><div class="cell-name"><span class="cell-avatar" style="background:' + esc(d.sectorColor) + '">' + esc(initials(d.company)) + '</span><div><div class="nm">' + esc(d.company) + '</div><div class="sub">' + esc(d.sectorName) + ' · ' + esc(d.round) + '</div></div></div></td><td><span class="chip tag" style="color:' + esc(d.sectorColor) + ';background:' + esc(d.sectorColor) + '1a">' + esc(d.sectorName) + '</span></td><td class="amount-cell">' + money(d.amount) + '</td><td><div class="cell-name"><div><div class="nm">' + esc(d.lead) + '</div><div class="sub">' + esc(d.region) + '</div></div></div></td></tr>';
    }).join('');
    const dealsCard = '<div class="card"><div class="card-head"><div class="card-title">' + icon('banknote') + '重磅交易</div><div class="card-meta">按金额</div></div><div class="card-body" style="padding-top:10px"><div class="table-wrap"><table class="tbl"><thead><tr><th>日期</th><th>公司</th><th>赛道</th><th>金额</th><th>领投方</th></tr></thead><tbody>' + topDealRows + '</tbody></table></div></div></div>';

    const activeHtml = activeInstList.map(function (n, i) {
      const it = INST_MAP.get(n) || {};
      const amt = sum(byInst[n] || [], function (d) { return d.amount; });
      return '<div class="company-row" data-inst-name="' + esc(n) + '"><span class="cell-avatar" style="background:' + esc(colorHash(n)) + '">' + esc(initials(n)) + '</span><div><div class="nm">' + esc(n) + '</div><div class="sub">' + esc(it.type || '') + ' · 近90天 ' + (instCount[n] || 0) + ' 笔</div></div><div class="amt">' + money(amt) + '</div></div>';
    }).join('');
    const instCard = '<div class="card"><div class="card-head"><div class="card-title">' + icon('users') + '活跃机构</div><div class="card-meta">近90天出手</div></div><div class="card-body" style="padding-top:8px">' + activeHtml + '</div></div>';

    const ecoHtml = '<div class="panel-grid three">' +
      '<div class="card chart-card"><div class="card-head"><div class="card-title">' + icon('wallet') + '募资端</div><div class="card-meta">季度新基金募资</div></div><div class="card-body"><div class="chart-box chart-md" id="ov-fund"></div></div></div>' +
      '<div class="card chart-card"><div class="card-head"><div class="card-title">' + icon('briefcase') + '退出端</div><div class="card-meta">季度IPO与并购</div></div><div class="card-body"><div class="chart-box chart-md" id="ov-exits"></div></div></div>' +
      '<div class="card chart-card"><div class="card-head"><div class="card-title">' + icon('banknote') + '币种结构</div><div class="card-meta">近12个月</div></div><div class="card-body"><div class="chart-box chart-sm" id="ov-currency"></div></div></div>' +
      '</div>';
    return head + kpis + '<div class="panel-grid two">' + monthlyHtml + sectorHtml + '</div><div class="panel-grid three">' + roundHtml + regionHtml + moodHtml + '</div>' + ecoHtml + '<div class="panel-grid two">' + dealsCard + instCard + '</div>';
  }

  function renderOverviewExtra() {
    const f = D.flows;
    hBarChart($('ov-fund'), f.fundraising.labels.map(function (l, i) { return { label: l, value: f.fundraising.values[i], color: '#0d9f6e' }; }), { money: true });
    groupedBars($('ov-exits'), f.exits.labels, [
      { name: 'IPO', values: f.exits.ipos, color: '#2563eb' },
      { name: '并购', values: f.exits.ma, color: '#f59e0b' }
    ]);
    donutChart($('ov-currency'), f.currencyMix.map(function (x) { return { label: x[0], value: x[1], color: x[2] }; }), '76%');
  }

  function afterOverview() {
    renderMonthlyChart();
    renderSectorChart();
    renderRoundChart();
    renderRegionChart();
    renderMoodChart();
    renderOverviewExtra();
    $('overview-export').addEventListener('click', exportOverview);
  }

  function exportOverview() {
    const lines = [];
    lines.push('资本流径 · 市场总览');
    lines.push('数据截至 ' + D.meta.asOf);
    lines.push('');
    lines.push('近30天融资总额: ' + money(sum(deals.filter(function (d) { return inRange(d.date, 30); }), function (d) { return d.amount; })));
    lines.push('近30天交易事件: ' + deals.filter(function (d) { return inRange(d.date, 30); }).length + ' 笔');
    lines.push('');
    lines.push('重磅交易:');
    deals.slice().sort(function (a, b) { return b.amount - a.amount; }).slice(0, 7).forEach(function (d) {
      lines.push('- ' + d.date + ' ' + d.company + ' ' + d.round + ' ' + money(d.amount) + ' 领投: ' + d.lead);
    });
    downloadText('capital-flow-overview.txt', lines.join('\n'));
    toast(tl('概览已导出'));
  }
  function svgWrap(inner, w, h) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
  }
  function gridLines(iw, ih, pt, pl, ticks) {
    let s = '';
    for (let i = 0; i <= ticks; i++) {
      const y = pt + ih - (i / ticks) * ih;
      s += '<line x1="' + pl + '" y1="' + y + '" x2="' + (pl + iw) + '" y2="' + y + '" stroke="#eef2f6" stroke-width="1"/>';
    }
    return s;
  }
  function attachChartHover(svg, points, fmt) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'chart-hover-line');
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('class', 'chart-hover-dot');
    dot.setAttribute('r', '4');
    svg.appendChild(line);
    svg.appendChild(dot);
    svg.addEventListener('mousemove', function (e) {
      const rect = svg.getBoundingClientRect();
      const scaleX = 720 / rect.width;
      const scaleY = 250 / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      let best = null, bd = 1e9;
      points.forEach(function (p) {
        const dd = Math.abs(p.x - mx);
        if (dd < bd) { bd = dd; best = p; }
      });
      if (!best || bd > 40) { line.style.display = 'none'; dot.style.display = 'none'; return; }
      line.style.display = '';
      dot.style.display = '';
      line.setAttribute('x1', best.x); line.setAttribute('y1', 18);
      line.setAttribute('x2', best.x); line.setAttribute('y2', 220);
      dot.setAttribute('cx', best.x); dot.setAttribute('cy', best.y);
      const r = best.getBoundingClientRect ? best.getBoundingClientRect() : { left: e.clientX, top: e.clientY };
      showTip(fmt(best), r.left || e.clientX, r.top || e.clientY);
    });
    svg.addEventListener('mouseleave', function () { line.style.display = 'none'; dot.style.display = 'none'; hideTip(); });
  }

  function renderMonthlyChart() {
    const el = $('monthly-chart');
    const W = 720, H = 250, pl = 46, pr = 38, pt = 18, pb = 32;
    const iw = W - pl - pr, ih = H - pt - pb;
    const monthly = [];
    const mkeys = [];
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1);
      const key = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
      mkeys.push(key);
      monthly.push({ key: key, total: 0, count: 0 });
    }
    deals.forEach(function (d) {
      const k = d.date.slice(0, 7);
      const idx = mkeys.indexOf(k);
      if (idx >= 0) { monthly[idx].total += d.amount; monthly[idx].count++; }
    });
    const maxTotal = Math.max.apply(null, monthly.map(function (m) { return m.total; })) * 1.15 || 1;
    const maxCount = Math.max.apply(null, monthly.map(function (m) { return m.count; })) * 1.25 || 1;
    const bw = iw / monthly.length * 0.58;
    const points = [];
    let inner = gridLines(iw, ih, pt, pl, 4);
    monthly.forEach(function (m, i) {
      const x = pl + iw * (i + 0.5) / monthly.length;
      const bh = (m.total / maxTotal) * ih;
      const y = pt + ih - bh;
      const hue = i === monthly.length - 1 ? '#0d9f6e' : '#9bd8c4';
      inner += '<rect x="' + (x - bw / 2) + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="3" fill="' + hue + '" opacity="' + (i === monthly.length - 1 ? '1' : '.85') + '"/>';
      inner += '<text x="' + x + '" y="' + (pt + ih + 18) + '" class="axis-label" text-anchor="middle">' + m.key.slice(2) + '</text>';
      points.push({ x: x, y: y, label: m.key.slice(2), total: m.total, count: m.count });
    });
    monthly.forEach(function (m, i) {
      const x = pl + iw * (i + 0.5) / monthly.length;
      const cy = pt + ih - (m.count / maxCount) * ih;
      inner += '<circle cx="' + x + '" cy="' + cy + '" r="3" fill="#2563eb"/>';
    });
    [0, 1, 2, 3, 4].forEach(function (i) {
      const v = (maxTotal / 4) * i;
      inner += '<text x="' + (pl - 8) + '" y="' + (pt + ih - (i / 4) * ih + 4) + '" class="axis-label" text-anchor="end">' + (v >= 100 ? Math.round(v) + '亿' : v.toFixed(0) + '亿') + '</text>';
    });
    inner += '<text x="' + (pl + iw - 6) + '" y="' + (pt + 10) + '" class="axis-label" text-anchor="end">融资总额（柱） · 事件数（点）</text>';
    el.innerHTML = svgWrap(inner, W, H);
    const svg = el.querySelector('svg');
    attachChartHover(svg, points, function (p) {
      return '<div class="tt-k">' + p.label + '</div><div class="tt-v">' + money(p.total) + '</div><div class="tt-sub">' + p.count + ' 笔交易</div>';
    });
  }

  function hBarChart(el, items, opts) {
    opts = opts || {};
    const H = Math.max(120, items.length * 36 + 10);
    const W = 620, pl = 78, pr = 96, pt = 8, pb = 8;
    const iw = W - pl - pr;
    const maxV = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
    let inner = '';
    items.forEach(function (it, idx) {
      const y = pt + idx * 36 + 10;
      const bw = Math.max(4, (it.value / maxV) * iw);
      inner += '<text x="' + (pl - 10) + '" y="' + (y + 14) + '" text-anchor="end" style="font-size:12px;fill:#475569">' + esc(it.label) + '</text>';
      inner += '<rect x="' + pl + '" y="' + y + '" width="' + iw + '" height="18" rx="4" fill="#eef2f6"/>';
      inner += '<rect x="' + pl + '" y="' + y + '" width="' + bw + '" height="18" rx="4" fill="' + esc(it.color) + '" opacity=".9"/>';
      inner += '<text x="' + (pl + bw + 8) + '" y="' + (y + 13) + '" style="font-size:12px;font-weight:700;fill:#14202e">' + (opts.money ? money(it.value) : it.value.toLocaleString()) + '</text>';
      if (it.sub) inner += '<text x="' + (pl + bw + 8) + '" y="' + (y + 25) + '" style="font-size:10px;fill:#94a3b8">' + esc(it.sub) + '</text>';
    });
    el.innerHTML = svgWrap(inner, W, H);
  }

  function renderSectorChart() {
    const d30 = deals.filter(function (d) { return inRange(d.date, 30); });
    const totals = {};
    d30.forEach(function (d) { totals[d.sector] = (totals[d.sector] || 0) + d.amount; });
    const items = D.sectors.map(function (s) {
      const v = totals[s.id] || 0;
      const cnt = d30.filter(function (d) { return d.sector === s.id; }).length;
      return { label: s.name, value: v, color: s.color, sub: cnt ? cnt + ' 笔' : '' };
    }).filter(function (i) { return i.value > 0; }).sort(function (a, b) { return b.value - a.value; });
    hBarChart($('sector-chart'), items, { money: true });
  }

  function donutChart(el, items, centerLabel) {
    const W = 210, H = 210, cx = 105, cy = 105, r = 72;
    const total = sum(items, function (i) { return i.value; }) || 1;
    let start = -Math.PI / 2;
    let inner = '';
    items.forEach(function (it) {
      const frac = it.value / total;
      const end = start + frac * Math.PI * 2;
      const large = end - start > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
      inner += '<path d="M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2 + '" fill="none" stroke="' + esc(it.color) + '" stroke-width="20"/>';
      start = end;
    });
    inner += '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" style="font-size:17px;font-weight:800;fill:#14202e">' + esc(centerLabel) + '</text>';
    inner += '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" style="font-size:10px;fill:#94a3b8">合计</text>';
    el.innerHTML = svgWrap(inner, W, H);
  }

  function groupedBars(el, labels, series) {
    const H = Math.max(150, labels.length * 38 + 12);
    const W = 620, pl = 54, pr = 40, pt = 10, pb = 10;
    const iw = W - pl - pr;
    const maxV = Math.max.apply(null, series.reduce(function (a, s) { return a.concat(s.values); }, [])) * 1.15 || 1;
    const groupW = iw / labels.length;
    const bw = Math.min(18, groupW / (series.length + 0.5));
    let inner = '';
    labels.forEach(function (lb, gi) {
      const gx = pl + gi * groupW;
      inner += '<text x="' + (gx + groupW / 2) + '" y="' + (H - pb + 12) + '" class="axis-label" text-anchor="middle">' + esc(lb) + '</text>';
      series.forEach(function (sd, si) {
        const v = sd.values[gi];
        const h = Math.max(2, (v / maxV) * (H - pt - pb - 16));
        const x = gx + groupW / 2 - (series.length * bw + (series.length - 1) * 4) / 2 + si * (bw + 4);
        const y = H - pb - 14 - h;
        inner += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="3" fill="' + esc(sd.color) + '" opacity=".9"/>';
        inner += '<text x="' + (x + bw / 2) + '" y="' + (y - 4) + '" text-anchor="middle" style="font-size:10px;fill:#64748b">' + v + '</text>';
      });
    });
    const legend = series.map(function (sd) { return '<span class="legend-item"><span class="legend-dot" style="background:' + esc(sd.color) + '"></span>' + esc(sd.name) + '</span>'; }).join('');
    el.innerHTML = svgWrap(inner, W, H) + '<div class="chart-legend">' + legend + '</div>';
  }

  function renderRoundChart() {
    const recent = deals.filter(function (d) { return inRange(d.date, state.range); });
    const dist = {};
    recent.forEach(function (d) { dist[d.round] = (dist[d.round] || 0) + d.amount; });
    const sorted = Object.keys(dist).sort(function (a, b) { return dist[b] - dist[a]; });
    const top = sorted.slice(0, 5).map(function (k) { return { label: k, value: dist[k], color: colorHash(k) }; });
    const other = sorted.slice(5).reduce(function (a, k) { return a + dist[k]; }, 0);
    if (other > 0) top.push({ label: '其他', value: other, color: '#94a3b8' });
    donutChart($('round-chart'), top, sorted.length ? sorted[0] : '-');
    const legend = top.map(function (t) {
      return '<span class="legend-item"><span class="legend-dot" style="background:' + esc(t.color) + '"></span>' + esc(t.label) + ' ' + (recent.length ? (t.value / sum(top, function (x) { return x.value; }) * 100).toFixed(0) : '0') + '%</span>';
    }).join('');
    $('round-legend').innerHTML = legend;
  }

  function renderRegionChart() {
    const recent = deals.filter(function (d) { return inRange(d.date, state.range); });
    const dist = {};
    recent.forEach(function (d) { dist[d.region] = (dist[d.region] || 0) + d.amount; });
    const items = Object.keys(dist).sort(function (a, b) { return dist[b] - dist[a]; }).slice(0, 6).map(function (k) {
      return { label: k, value: dist[k], color: colorHash(k) };
    });
    hBarChart($('region-chart'), items, { money: true });
  }

  function renderMoodChart() {
    const el = $('mood-chart');
    const W = 260, H = 150, cx = 130, cy = 128, r = 92;
    const pct = 78;
    const start = Math.PI, end = start + Math.PI * 2 * (pct / 100);
    const arc = function (from, to) {
      const x1 = cx + r * Math.cos(from), y1 = cy + r * Math.sin(from);
      const x2 = cx + r * Math.cos(to), y2 = cy + r * Math.sin(to);
      const large = to - from > Math.PI ? 1 : 0;
      return 'M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2;
    };
    let inner = '<path d="' + arc(start, start + Math.PI) + '" fill="none" stroke="#eef2f6" stroke-width="14" stroke-linecap="round"/>';
    inner += '<path d="' + arc(start, end) + '" fill="none" stroke="#0d9f6e" stroke-width="14" stroke-linecap="round"/>';
    el.innerHTML = svgWrap(inner, W, H);
    const bars = [
      ['一级市场', 84, '#0d9f6e'], ['二级市场', 72, '#2563eb'], ['政策环境', 66, '#d97706'], ['资金流动性', 79, '#7c3aed']
    ];
    $('mood-bars').innerHTML = bars.map(function (b) {
      return '<div class="mood-bar-row"><span class="lb">' + b[0] + '</span><div class="mood-track"><div class="mood-fill" style="width:' + b[1] + '%;background:' + b[2] + '"></div></div><span class="vl">' + b[1] + '</span></div>';
    }).join('');
  }

  function flowHtml() {
    const secChips = D.sectors.map(function (s) {
      const on = state.flowFilter.sectors.has(s.id);
      return '<button class="chip flow-sec ' + (on ? 'active' : '') + '" data-sec="' + s.id + '"><span class="dot" style="background:' + s.color + '"></span>' + s.name + '</button>';
    }).join('');
    const amtBtns = [3, 5, 10, 20].map(function (v) {
      return '<button class="' + (state.flowFilter.min === v ? 'active' : '') + '" data-min="' + v + '">≥' + v + '亿</button>';
    }).join('');
    return '<section class="page-head"><div><h1>资金流向图谱</h1><p class="page-sub">机构 · 公司 · 赛道 之间的资金网络</p></div><div class="head-actions"><button class="btn ghost" id="flow-reset">' + icon('maximize-2') + '重置视图</button></div></section>' +
      '<div class="card flow-canvas-card"><div class="card-body">' +
      '<div class="toolbar"><div class="chip-row flow-sec-row">' + secChips + '</div></div>' +
      '<div class="toolbar"><div class="range-pills flow-amt">' + amtBtns + '</div>' +
      '<label class="chip" style="cursor:pointer"><input type="checkbox" id="flow-cross" ' + (state.flowFilter.cross ? 'checked' : '') + ' style="width:14px;height:14px;margin:0">仅看跨境资金</label>' +
      '<div class="search-box flow-node-search"><span>' + icon('search') + '</span><input id="flow-q" placeholder="聚焦节点" value="' + esc(state.flowFilter.q) + '"></div></div>' +
      '<div class="flow-stage" id="flow-stage"></div>' +
      '<div class="flow-stats" id="flow-stats"></div>' +
      '</div></div>' +
      '<div class="flow-layout"><div class="card"><div class="card-body"><div class="sec-title">' + icon('info') + '节点说明</div>' +
      '<div class="chart-legend">' +
      '<span class="legend-item"><span class="legend-dot" style="background:#334155"></span>投资机构</span>' +
      '<span class="legend-item"><span class="legend-dot" style="background:#0d9f6e"></span>被投公司</span>' +
      '<span class="legend-item"><span class="legend-dot" style="background:#d97706"></span>赛道枢纽</span>' +
      '</div></div></div>' +
      '<div class="flow-side"><div class="card"><div class="card-body" id="flow-node-detail"><div class="empty-state">' + icon('share2') + '<div>节点详情</div></div></div></div></div></div>';
  }

  function buildFlowModel() {
    const secs = state.flowFilter.sectors.size ? Array.from(state.flowFilter.sectors) : D.sectors.map(function (s) { return s.id; });
    const minA = state.flowFilter.min;
    const fdeals = deals.filter(function (d) {
      return secs.indexOf(d.sector) >= 0 && d.amount >= minA && (!state.flowFilter.cross || d.cross);
    });
    const nodes = [];
    const nodeMap = new Map();
    function addNode(key, type, label, value, color) {
      let node = nodeMap.get(key);
      if (!node) {
        node = { key: key, type: type, label: label, value: 0, color: color, x: 0, y: 0, vx: 0, vy: 0, r: 8 };
        nodeMap.set(key, node);
        nodes.push(node);
      }
      node.value += value;
      return node;
    }
    D.sectors.forEach(function (s) { addNode('sector:' + s.id, 'sector', s.name, 0, s.color); });
    const compAmt = {};
    fdeals.forEach(function (d) { compAmt[d.company] = (compAmt[d.company] || 0) + d.amount; });
    Object.keys(compAmt).forEach(function (nm) {
      const co = COMP_MAP.get(nm) || {};
      addNode('co:' + nm, 'company', nm, compAmt[nm], sectorColor(co.sector));
    });
    const instAmt = {};
    fdeals.forEach(function (d) { [d.lead].concat(d.co).forEach(function (n) { instAmt[n] = (instAmt[n] || 0) + d.amount; }); });
    Object.keys(instAmt).forEach(function (nm) {
      addNode('inst:' + nm, 'institution', nm, instAmt[nm], colorHash(nm));
    });
    const edges = [];
    fdeals.forEach(function (d) {
      edges.push({ from: 'inst:' + d.lead, to: 'co:' + d.company, weight: d.amount, kind: 'lead', deal: d });
      d.co.forEach(function (c) {
        edges.push({ from: 'inst:' + c, to: 'co:' + d.company, weight: d.amount * 0.4, kind: 'co', deal: d });
      });
    });
    nodes.forEach(function (n) {
      if (n.type === 'company') {
        const co = COMP_MAP.get(n.label);
        if (co) edges.push({ from: 'co:' + n.label, to: 'sector:' + co.sector, weight: n.value * 0.18, kind: 'sector', deal: null });
      }
    });
    const totalAmount = sum(fdeals, function (d) { return d.amount; });
    nodes.forEach(function (n) {
      n.r = n.type === 'sector' ? 17 : (n.type === 'institution' ? 8 + Math.sqrt(n.value) * 0.8 : 7 + Math.sqrt(n.value) * 0.55);
      n.r = Math.min(n.r, n.type === 'sector' ? 17 : 15);
    });
    return { nodes: nodes, edges: edges, deals: fdeals, totalAmount: totalAmount };
  }

  function initFlowLayout(model) {
    const W = 1000, H = 720, cx = W / 2, cy = H / 2, R = 260;
    const secAngles = {};
    D.sectors.forEach(function (s, i) {
      secAngles[s.id] = -Math.PI / 2 + (i / D.sectors.length) * Math.PI * 2;
    });
    const sectorById = {};
    model.nodes.forEach(function (n) {
      if (n.type === 'sector') sectorById[n.label] = n;
    });
    const used = {};
    model.nodes.forEach(function (n) {
      if (n.type === 'sector') {
        const idx = D.sectors.findIndex(function (s) { return s.name === n.label; });
        n.x = cx + R * 0.32 * Math.cos(-Math.PI / 2 + (idx / D.sectors.length) * Math.PI * 2);
        n.y = cy + R * 0.32 * Math.sin(-Math.PI / 2 + (idx / D.sectors.length) * Math.PI * 2);
      } else if (n.type === 'company') {
        const co = COMP_MAP.get(n.label);
        const ang = secAngles[co.sector] + (Math.random() - 0.5) * 1.4;
        const rad = R * 0.58 + Math.random() * R * 0.14;
        n.x = cx + rad * Math.cos(ang);
        n.y = cy + rad * Math.sin(ang);
      } else {
        const ang = Math.random() * Math.PI * 2;
        const rad = R * 0.88 + Math.random() * R * 0.16;
        n.x = cx + rad * Math.cos(ang);
        n.y = cy + rad * Math.sin(ang);
        n._ang = ang; n._rad = rad;
      }
      n.vx = 0; n.vy = 0;
    });
  }

  function simulateFlow(model) {
    const nodes = model.nodes;
    const edges = model.edges;
    const W = 1000, H = 720, cx = W / 2, cy = H / 2, R = 250;
    const ideal = { 'institution-company': 165, 'company-sector': 125, 'institution-institution': 110, 'company-company': 100, 'sector-sector': 150, 'company-institution': 165, 'sector-company': 125, 'institution-sector': 190, 'sector-institution': 190 };
    for (let iter = 0; iter < 220; iter++) {
      const cool = 1 - iter / 240;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          let dx = a.x - b.x, dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) { dx = (Math.random() - 0.5) * 2; dy = (Math.random() - 0.5) * 2; d2 = dx * dx + dy * dy; }
          const f = 3400 / d2 * cool;
          const d = Math.sqrt(d2);
          a.vx += (dx / d) * f; a.vy += (dy / d) * f;
          b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
        }
      }
      edges.forEach(function (e) {
        const a = nodes.find(function (n) { return n.key === e.from; });
        const b = nodes.find(function (n) { return n.key === e.to; });
        if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const types = a.type + '-' + b.type;
        const il = ideal[types] || 150;
        const f = (d - il) * 0.09 * (e.kind === 'sector' ? 0.55 : 1);
        a.vx += (dx / d) * f; a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
      });
      nodes.forEach(function (n) {
        if (n.type === 'institution') {
          const dx = cx - n.x, dy = cy - n.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          const target = R * 0.92;
          const f = (d - target) * 0.012;
          n.vx += (dx / d) * f; n.vy += (dy / d) * f;
        }
        n.vx *= 0.78; n.vy *= 0.78;
        n.x += n.vx; n.y += n.vy;
        n.x = Math.max(20, Math.min(W - 20, n.x));
        n.y = Math.max(20, Math.min(H - 20, n.y));
      });
    }
  }

  function renderFlowSvg(model, selectedKey) {
    const stage = $('flow-stage');
    if (!stage) return;
    const W = 1000, H = 720;
    const q = (state.flowFilter.q || '').trim().toLowerCase();
    const maxW = Math.max.apply(null, model.edges.map(function (e) { return e.weight; })) || 1;
    const nodeByKey = {};
    model.nodes.forEach(function (n) { nodeByKey[n.key] = n; });
    let edgeHtml = '';
    model.edges.forEach(function (e) {
      const a = nodeByKey[e.from], b = nodeByKey[e.to];
      if (!a || !b) return;
      const w = Math.max(0.6, 2 + (e.weight / maxW) * 5.5);
      const hl = selectedKey && (e.from === selectedKey || e.to === selectedKey);
      const dim = selectedKey && !hl;
      edgeHtml += '<line class="flow-edge' + (hl ? ' hl' : '') + (dim ? ' dim' : '') + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="' + (e.kind === 'sector' ? '#f59e0b' : e.kind === 'co' ? '#7dd3fc' : '#0d9f6e') + '" stroke-width="' + w.toFixed(1) + '" opacity="' + (e.kind === 'sector' ? '0.16' : '0.32') + '" data-edge="' + esc(e.from) + '->' + esc(e.to) + '"/>';
    });
    let nodeHtml = '';
    model.nodes.forEach(function (n) {
      const matchQ = !q || n.label.toLowerCase().indexOf(q) >= 0;
      const isSel = selectedKey === n.key;
      const connected = selectedKey && model.edges.some(function (e) { return e.from === selectedKey && e.to === n.key || e.to === selectedKey && e.from === n.key; });
      const dim = (selectedKey && !isSel && !connected) || (q && !matchQ);
      const cls = 'flow-node' + (dim ? ' dim' : '');
      if (n.type === 'sector') {
        nodeHtml += '<g class="' + cls + '" data-node="' + esc(n.key) + '" transform="translate(' + n.x + ',' + n.y + ')"><circle r="' + n.r + '" fill="' + esc(n.color) + '" stroke="#fff" stroke-width="2.5"/><text class="flow-node-label hub" text-anchor="middle" dy="4">' + esc(n.label.slice(0, 4)) + '</text></g>';
      } else if (n.type === 'institution') {
        nodeHtml += '<g class="' + cls + '" data-node="' + esc(n.key) + '" transform="translate(' + n.x + ',' + n.y + ')"><circle r="' + n.r + '" fill="' + esc(n.color) + '" opacity=".92" stroke="#fff" stroke-width="2"/><text class="flow-node-label" text-anchor="middle" dy="' + (n.r + 14) + '">' + esc(n.label) + '</text></g>';
      } else {
        nodeHtml += '<g class="' + cls + '" data-node="' + esc(n.key) + '" transform="translate(' + n.x + ',' + n.y + ')"><circle r="' + n.r + '" fill="' + esc(n.color) + '" opacity=".95" stroke="#fff" stroke-width="2"/><text class="flow-node-label" text-anchor="middle" dy="' + (n.r + 13) + '">' + esc(n.label.slice(0, 7)) + '</text></g>';
      }
    });
    stage.innerHTML = svgWrap(edgeHtml + nodeHtml, W, H);
    const svg = stage.querySelector('svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    stage.__model = model;
    stage.__zoom = stage.__zoom || 1;
    stage.__panX = stage.__panX || 0;
    stage.__panY = stage.__panY || 0;
  }

  function bindFlowInteractions() {
    const stage = $('flow-stage');
    if (!stage) return;
    const svg = stage.querySelector('svg');
    let dragging = null;
    let moved = false;
    let scale = 1;
    const content = svg.querySelector('g');
    function applyView() {
      if (!content) return;
      content.setAttribute('transform', 'scale(' + scale + ')');
      content.style.transformOrigin = '50% 50%';
    }
    applyView();
    svg.addEventListener('wheel', function (e) {
      e.preventDefault();
      scale = Math.max(0.55, Math.min(2.2, scale * (e.deltaY < 0 ? 1.08 : 0.92)));
      applyView();
    }, { passive: false });
    svg.addEventListener('pointerdown', function (e) {
      const nodeEl = e.target.closest('.flow-node');
      if (!nodeEl) return;
      const key = nodeEl.getAttribute('data-node');
      const model = stage.__model;
      const n = model.nodes.find(function (x) { return x.key === key; });
      if (!n) return;
      const rect = svg.getBoundingClientRect();
      const sx = 1000 / rect.width;
      dragging = { n: n, startX: e.clientX, startY: e.clientY, nodeX: n.x, nodeY: n.y, moved: false };
      n._drag = true;
      svg.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    svg.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      const rect = svg.getBoundingClientRect();
      const dx = (e.clientX - dragging.startX) * (1000 / rect.width);
      const dy = (e.clientY - dragging.startY) * (720 / rect.height);
      dragging.n.x = dragging.nodeX + dx / scale;
      dragging.n.y = dragging.nodeY + dy / scale;
      if (Math.abs(e.clientX - dragging.startX) + Math.abs(e.clientY - dragging.startY) > 4) dragging.moved = true;
      renderFlowSvg(stage.__model, stage.__selectedKey || null);
      const n2 = stage.querySelector('[data-node="' + CSS.escape(dragging.n.key) + '"]');
      if (n2) { n2.setPointerCapture(e.pointerId); }
    });
    svg.addEventListener('pointerup', function (e) {
      if (!dragging) return;
      const wasMoved = dragging.moved;
      const key = dragging.n.key;
      dragging.n._drag = false;
      dragging = null;
      if (!wasMoved) {
        stage.__selectedKey = stage.__selectedKey === key ? null : key;
        renderFlowSvg(stage.__model, stage.__selectedKey);
        renderFlowDetail(stage.__model, stage.__selectedKey);
      }
    });
    svg.addEventListener('click', function (e) {
      const edge = e.target.closest('.flow-edge');
      if (edge) {
        const key = edge.getAttribute('data-edge').split('->')[1];
        if (key && stage.__model) {
          stage.__selectedKey = key;
          renderFlowSvg(stage.__model, key);
          renderFlowDetail(stage.__model, key);
        }
      }
    });
  }

  function renderFlowDetail(model, selectedKey) {
    const el = $('flow-node-detail');
    if (!el) return;
    if (!selectedKey) {
      el.innerHTML = '<div class="empty-state">' + icon('share2') + '<div>节点详情</div></div>';
      return;
    }
    const n = model.nodes.find(function (x) { return x.key === selectedKey; });
    if (!n) return;
    const relEdges = model.edges.filter(function (e) { return e.from === selectedKey || e.to === selectedKey; });
    const relDeals = model.deals.filter(function (d) {
      return selectedKey === 'co:' + d.company || selectedKey === 'inst:' + d.lead || d.co.indexOf(selectedKey.replace('inst:', '')) >= 0;
    }).slice().sort(function (a, b) { return b.amount - a.amount; }).slice(0, 6);
    let head = '', body = '';
    if (n.type === 'institution') {
      const it = INST_MAP.get(n.label) || {};
      head = '<div class="nd-name">' + esc(n.label) + '</div><div class="nd-sub">' + esc(it.type || '') + ' · ' + esc(it.region || '') + ' · 管理规模 ' + money(it.aum) + '</div>';
      body = '<div class="detail-kpis"><div class="detail-kpi"><div class="k">图谱内参与金额</div><div class="v">' + money(n.value) + '</div></div><div class="detail-kpi"><div class="k">关联交易</div><div class="v">' + relEdges.length + '</div></div></div>';
    } else if (n.type === 'company') {
      const co = COMP_MAP.get(n.label) || {};
      head = '<div class="nd-name">' + esc(n.label) + '</div><div class="nd-sub">' + esc(sectorName(co.sector)) + ' · ' + esc(co.region || '') + ' · 当前' + esc(co.stage || '') + '</div>';
      body = '<div class="detail-kpis"><div class="detail-kpi"><div class="k">图谱内融资额</div><div class="v">' + money(n.value) + '</div></div><div class="detail-kpi"><div class="k">估值</div><div class="v">' + money(co.estValuation) + '</div></div></div>';
    } else {
      head = '<div class="nd-name">' + esc(n.label) + '</div><div class="nd-sub">赛道枢纽</div>';
      const comps = model.nodes.filter(function (x) { return x.type === 'company' && COMP_MAP.get(x.label) && COMP_MAP.get(x.label).sector === D.sectors.find(function (s) { return s.name === n.label; }).id; });
      body = '<div class="detail-kpis"><div class="detail-kpi"><div class="k">关联公司</div><div class="v">' + comps.length + '</div></div><div class="detail-kpi"><div class="k">图谱内金额</div><div class="v">' + money(n.value) + '</div></div></div>';
    }
    const dealRows = relDeals.map(function (d) {
      return '<div class="flow-deal-row" data-deal-id="' + d.id + '"><div><div class="nm">' + esc(d.company) + ' · ' + esc(d.round) + '</div><div class="sub">' + fmtDate(d.date) + ' · 领投 ' + esc(d.lead) + '</div></div><div class="amt">' + money(d.amount) + '</div></div>';
    }).join('');
    el.innerHTML = '<div class="flow-node-detail">' + head + body + '<div style="margin-top:14px"><div class="sec-title">' + icon('banknote') + '关联交易</div>' + (dealRows || '<div style="color:#94a3b8;font-size:12px">暂无</div>') + '</div></div>';
    localizeDom(el);
  }

  function renderFlow() {
    return flowHtml();
  }

  function afterFlow() {
    const model = buildFlowModel();
    initFlowLayout(model);
    simulateFlow(model);
    const stage = $('flow-stage');
    stage.__model = model;
    stage.__selectedKey = null;
    renderFlowSvg(model, null);
    bindFlowInteractions();
    const total = model.totalAmount;
    $('flow-stats').innerHTML =
      '<div class="flow-stat"><span class="k">节点</span><span class="v">' + model.nodes.length + '</span></div>' +
      '<div class="flow-stat"><span class="k">资金关系</span><span class="v">' + model.edges.length + '</span></div>' +
      '<div class="flow-stat"><span class="k">交易金额</span><span class="v">' + money(total) + '</span></div>' +
      '<div class="flow-stat"><span class="k">交易笔数</span><span class="v">' + model.deals.length + '</span></div>';
    document.querySelectorAll('.flow-sec').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-sec');
        if (state.flowFilter.sectors.has(id)) state.flowFilter.sectors.delete(id); else state.flowFilter.sectors.add(id);
        afterFlow();
      });
    });
    document.querySelectorAll('.flow-amt button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.flowFilter.min = Number(btn.getAttribute('data-min'));
        afterFlow();
      });
    });
    $('flow-cross').addEventListener('change', function (e) {
      state.flowFilter.cross = e.target.checked;
      afterFlow();
    });
    $('flow-q').addEventListener('input', debounce(function () {
      state.flowFilter.q = $('flow-q').value;
      renderFlowSvg(stage.__model, stage.__selectedKey || null);
    }, 180));
    $('flow-reset').addEventListener('click', function () {
      state.flowFilter = { sectors: new Set(), min: 3, cross: false, q: '' };
      afterFlow();
    });
    localizeDom(document.body);
  }
  function filterDeals() {
    const f = state.dealFilter;
    return deals.filter(function (d) {
      if (!inRange(d.date, state.range)) return false;
      if (f.sector !== 'all' && d.sector !== f.sector) return false;
      if (f.round !== 'all' && d.round !== f.round) return false;
      if (d.amount < f.min) return false;
      if (f.q) {
        const q = f.q.toLowerCase();
        const hay = (d.company + ' ' + d.lead + ' ' + d.co.join(' ') + ' ' + d.note + ' ' + d.sectorName).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    }).sort(function (a, b) {
      const k = state.sort.key;
      let r = 0;
      if (k === 'amount') r = a.amount - b.amount;
      else if (k === 'company') r = a.company < b.company ? -1 : a.company > b.company ? 1 : 0;
      else r = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
      return r * state.sort.dir;
    });
  }

  function renderDeals() {
    const rows = filterDeals();
    const pageSize = 15;
    const pages = Math.max(1, Math.ceil(rows.length / pageSize));
    if (state.page > pages) state.page = pages;
    const pageRows = rows.slice((state.page - 1) * pageSize, state.page * pageSize);
    const totalAmt = sum(rows, function (d) { return d.amount; });
    const secOpts = '<option value="all">全部赛道</option>' + D.sectors.map(function (s) { return '<option value="' + s.id + '"' + (state.dealFilter.sector === s.id ? ' selected' : '') + '>' + s.name + '</option>'; }).join('');
    const roundOpts = '<option value="all">全部轮次</option>' + ['种子', '天使', 'A轮', 'A+轮', 'B轮', 'B+轮', 'C轮', 'C+轮', 'D轮', 'Pre-IPO', '战略轮'].map(function (r) { return '<option value="' + r + '"' + (state.dealFilter.round === r ? ' selected' : '') + '>' + r + '</option>'; }).join('');
    const amtOpts = [0, 3, 5, 10, 20].map(function (v) { return '<option value="' + v + '"' + (state.dealFilter.min === v ? ' selected' : '') + '>' + (v ? '≥' + v + '亿' : '全部金额') + '</option>'; }).join('');
    const sortIc = state.sort.dir === 1 ? 'chevron-up' : 'chevron-down';
    const head = '<section class="page-head"><div><h1>融资动态</h1><p class="page-sub">' + rows.length + ' 笔交易 · 合计 ' + money(totalAmt) + ' · 平均 ' + money(rows.length ? totalAmt / rows.length : 0) + '</p></div><div class="head-actions"><button class="btn ghost" id="deals-export">' + icon('download') + '导出CSV</button></div></section>';
    const toolbar = '<div class="toolbar">' +
      '<div class="search-box"><span>' + icon('search') + '</span><input id="deal-q" placeholder="公司 / 机构 / 备注" value="' + esc(state.dealFilter.q) + '"></div>' +
      '<select class="select" id="deal-sector">' + secOpts + '</select>' +
      '<select class="select" id="deal-round">' + roundOpts + '</select>' +
      '<select class="select" id="deal-min">' + amtOpts + '</select>' +
      '</div>';
    const th = function (key, label) {
      return '<th class="sortable" data-sort="' + key + '">' + label + (state.sort.key === key ? icon(sortIc) : '') + '</th>';
    };
    const body = pageRows.map(function (d) {
      const co = COMP_MAP.get(d.company) || {};
      return '<tr data-deal-id="' + d.id + '"><td class="date-cell">' + fmtDate(d.date) + '</td><td><div class="cell-name"><span class="cell-avatar" style="background:' + esc(d.sectorColor) + '">' + esc(initials(d.company)) + '</span><div><div class="nm">' + esc(d.company) + '</div><div class="sub">' + esc(co.stage || '') + ' · ' + esc(d.region) + '</div></div></div></td><td><span class="chip tag" style="color:' + esc(d.sectorColor) + ';background:' + esc(d.sectorColor) + '1a">' + esc(d.sectorName) + '</span></td><td>' + esc(d.round) + '</td><td class="amount-cell">' + money(d.amount) + '</td><td>' + esc(d.lead) + (d.cross ? ' <span class="chip tag blue">跨境</span>' : '') + '</td><td class="date-cell">' + esc(d.co.slice(0, 2).join('、') || '-') + '</td></tr>';
    }).join('');
    const pager = '<div class="pager"><span>第 ' + state.page + ' / ' + pages + ' 页 · 共 ' + rows.length + ' 条</span><div class="pg-btns"><button id="pg-prev" ' + (state.page <= 1 ? 'disabled' : '') + '>' + icon('chevron-left') + '</button><span>' + state.page + '</span><button id="pg-next" ' + (state.page >= pages ? 'disabled' : '') + '>' + icon('chevron-right') + '</button></div></div>';
    const table = '<div class="card deal-table-card"><div class="card-body">' + toolbar + '<div class="table-wrap"><table class="tbl"><thead><tr>' + th('date', '日期') + '<th>公司</th><th>赛道</th><th>轮次</th>' + th('amount', '金额') + '<th>领投方</th><th>跟投方</th></tr></thead><tbody>' + (body || '<tr><td colspan="7"><div class="empty-state">' + icon('search') + '<div>没有匹配的交易</div></div></td></tr>') + '</tbody></table></div>' + pager + '</div></div>';
    return head + table;
  }

  function afterDeals() {
    $('deal-q').addEventListener('input', debounce(function () { state.dealFilter.q = $('deal-q').value; state.page = 1; render(); }, 200));
    $('deal-sector').addEventListener('change', function (e) { state.dealFilter.sector = e.target.value; state.page = 1; render(); });
    $('deal-round').addEventListener('change', function (e) { state.dealFilter.round = e.target.value; state.page = 1; render(); });
    $('deal-min').addEventListener('change', function (e) { state.dealFilter.min = Number(e.target.value); state.page = 1; render(); });
    document.querySelectorAll('th.sortable').forEach(function (th) {
      th.addEventListener('click', function () {
        const k = th.getAttribute('data-sort');
        if (state.sort.key === k) state.sort.dir *= -1; else state.sort = { key: k, dir: -1 };
        render();
      });
    });
    $('pg-prev').addEventListener('click', function () { state.page = Math.max(1, state.page - 1); render(); });
    $('pg-next').addEventListener('click', function () { state.page = Math.min(Math.ceil(filterDeals().length / 15), state.page + 1); render(); });
    $('deals-export').addEventListener('click', function () {
      const rows = filterDeals();
      const cols = ['日期', '公司', '赛道', '轮次', '金额(亿元)', '领投方', '跟投方', '备注'].map(function (c) { return I18N.phrase(c, state.lang); });
      const csv = [cols.join(',')].concat(rows.map(function (d) {
        return [d.date, d.company, d.sectorName, d.round, d.amount, d.lead, d.co.join(';'), d.note.replace(/,/g, '，')].map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
      })).join('\n');
      downloadText('capital-flow-deals.csv', '\ufeff' + csv);
      toast(tl('交易明细已导出'));
    });
  }

  function instStats(name) {
    const list = byInst[name] || [];
    const d30 = list.filter(function (d) { return inRange(d.date, 30); });
    const amt = sum(list, function (d) { return d.amount; });
    return { total: list.length, d30: d30.length, amt: amt, last: list.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0] };
  }

  function renderInstitutions() {
    const f = state.instFilter;
    const list = D.institutions.filter(function (it) {
      if (f.type !== 'all' && it.type !== f.type) return false;
      if (f.sector !== 'all' && it.focus.indexOf(f.sector) < 0) return false;
      if (f.q) {
        const q = f.q.toLowerCase();
        if ((it.name + it.desc + it.region).toLowerCase().indexOf(q) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return (b.aum * b.scale) - (a.aum * a.scale); });
    const typeChips = ['all'].concat(D.institutions.map(function (i) { return i.type; }).filter(function (v, i, a) { return a.indexOf(v) === i; })).map(function (t) {
      return '<button class="chip inst-type ' + (f.type === t ? 'active' : '') + '" data-type="' + t + '">' + (t === 'all' ? '全部类型' : t) + '</button>';
    }).join('');
    const secOpts = '<option value="all">全部赛道</option>' + D.sectors.map(function (s) { return '<option value="' + s.id + '"' + (f.sector === s.id ? ' selected' : '') + '>' + s.name + '</option>'; }).join('');
    const head = '<section class="page-head"><div><h1>机构与公司</h1><p class="page-sub">' + D.institutions.length + ' 家机构 · ' + D.companies.length + ' 家公司 · ' + deals.length + ' 条交易</p></div></section>';
    const toolbar = '<div class="toolbar"><div class="chip-row">' + typeChips + '</div><div class="search-box"><span>' + icon('search') + '</span><input id="inst-q" placeholder="搜索机构" value="' + esc(f.q) + '"></div><select class="select" id="inst-sector">' + secOpts + '</select></div>';
    const cards = list.map(function (it) {
      const st = instStats(it.name);
      const focusTags = it.focus.slice(0, 3).map(function (s) { return '<span class="chip tag" style="color:' + esc(sectorColor(s)) + ';background:' + esc(sectorColor(s)) + '1a">' + esc(sectorName(s)) + '</span>'; }).join('');
      return '<div class="card inst-card" data-inst-name="' + esc(it.name) + '"><div class="inst-top"><span class="inst-avatar" style="background:' + esc(colorHash(it.name)) + '">' + esc(initials(it.name)) + '</span><div><div class="inst-name">' + esc(it.name) + '</div><div class="inst-meta">' + esc(it.type) + ' · ' + esc(it.region) + ' · 成立' + esc(it.founded) + '年</div></div></div><div class="inst-aum"><span class="v">' + money(it.aum) + '</span><span class="u">管理规模</span></div><div class="chip-row">' + focusTags + '</div><div class="inst-foot"><span>参与交易 <span class="stat">' + st.total + '</span></span><span>近30天 <span class="stat">' + st.d30 + '</span></span><span>参与金额 <span class="stat">' + money(st.amt) + '</span></span></div></div>';
    }).join('');
    const grid = '<div class="inst-grid">' + (cards || '<div class="empty-state" style="grid-column:1/-1">' + icon('search') + '<div>没有匹配的机构</div></div>') + '</div>';
    return head + toolbar + '<div style="height:14px"></div>' + grid;
  }

  function afterInstitutions() {
    document.querySelectorAll('.inst-type').forEach(function (btn) {
      btn.addEventListener('click', function () { state.instFilter.type = btn.getAttribute('data-type'); render(); });
    });
    $('inst-q').addEventListener('input', debounce(function () { state.instFilter.q = $('inst-q').value; render(); }, 200));
    $('inst-sector').addEventListener('change', function (e) { state.instFilter.sector = e.target.value; render(); });
  }

  function buildSignals() {
    const out = D.signals.slice();
    const inst30 = {};
    deals.filter(function (d) { return inRange(d.date, 30); }).forEach(function (d) {
      [d.lead].concat(d.co).forEach(function (n) { inst30[n] = (inst30[n] || 0) + 1; });
    });
    Object.keys(inst30).forEach(function (n) {
      if (inst30[n] >= 3 && !out.some(function (s) { return s.title.indexOf(n) >= 0; })) {
        out.push({ id: 'dyn-inst-' + n, level: 'medium', cat: '机构动态', title: I18N.dynamicSignal(state.lang, 'inst', n, inst30[n]), evidence: I18N.dynamicSignal(state.lang, 'evidI', n), refs: [n], ts: D.meta.asOf, dyn: true });
      }
    });
    const cur = {}, prev = {};
    const c30 = dateCutoff(30), p30 = dateCutoff(60);
    deals.forEach(function (d) {
      const dt = new Date(d.date + 'T00:00:00+08:00');
      if (dt >= c30) cur[d.sector] = (cur[d.sector] || 0) + d.amount;
      else if (dt >= p30) prev[d.sector] = (prev[d.sector] || 0) + d.amount;
    });
    D.sectors.forEach(function (s) {
      const cv = cur[s.id] || 0, pv = prev[s.id] || 0;
      const g = pctChange(cv, pv);
      if (cv > 20 && g >= 50 && !out.some(function (x) { return x.title.indexOf(s.name) >= 0; })) {
        out.push({ id: 'dyn-sec-' + s.id, level: 'high', cat: '赛道动量', title: I18N.dynamicSignal(state.lang, 'sector', s.name, g.toFixed(0)), evidence: I18N.dynamicSignal(state.lang, 'evidS', money(cv), money(pv)), refs: [], ts: D.meta.asOf, dyn: true });
      }
    });
    return out;
  }

  function renderSignals() {
    const all = buildSignals();
    const high = all.filter(function (s) { return s.level === 'high'; }).length;
    const active = all.length;
    const rulesOn = D.rules.filter(function (r) { return state.rules[r.id]; }).length;
    const f = state.signalFilter;
    const shown = all.filter(function (s) {
      if (f.level !== 'all' && s.level !== f.level) return false;
      if (f.cat !== 'all' && s.cat !== f.cat) return false;
      return true;
    });
    const head = '<section class="page-head"><div><h1>信号监控</h1><p class="page-sub">规则引擎检测 · 最新扫描 ' + esc(D.meta.asOf) + '</p></div><div class="head-actions"><button class="btn ghost" id="signal-scan">' + icon('refresh') + '立即扫描</button></div></section>';
    const stats = '<div class="signal-summary">' +
      '<div class="card signal-stat"><div class="k">高优先级信号</div><div class="v">' + high + ' <span class="delta" style="background:var(--red-soft);color:var(--red)">需关注</span></div></div>' +
      '<div class="card signal-stat"><div class="k">活跃信号</div><div class="v">' + active + ' <span class="delta" style="background:var(--blue-soft);color:var(--blue)">近12个月</span></div></div>' +
      '<div class="card signal-stat"><div class="k">启用规则</div><div class="v">' + rulesOn + '/8 <span class="delta" style="background:var(--accent-soft);color:var(--accent)">运行中</span></div></div>' +
      '<div class="card signal-stat"><div class="k">市场温度</div><div class="v">78 <span class="delta" style="background:var(--amber-soft);color:var(--amber)">偏热</span></div></div>' +
      '</div>';
    const filters = '<div class="toolbar"><div class="chip-row">' +
      [['all', '全部'], ['high', '高'], ['medium', '中'], ['low', '低']].map(function (p) { return '<button class="chip sig-level ' + (f.level === p[0] ? 'active' : '') + '" data-level="' + p[0] + '">' + p[1] + '优先级</button>'; }).join('') +
      '</div><div class="chip-row">' +
      ['all', '机构动态', '赛道动量', '资金流向', '估值预警'].map(function (c) { return '<button class="chip sig-cat ' + (f.cat === c ? 'active' : '') + '" data-cat="' + c + '">' + (c === 'all' ? '全部分类' : c) + '</button>'; }).join('') +
      '</div></div>';
    const cards = shown.map(function (s) {
      const lv = levelInfo(s.level);
      const ic = s.cat === '机构动态' ? 'users' : s.cat === '赛道动量' ? 'flame' : s.cat === '估值预警' ? 'alert' : 'globe';
      const refs = s.refs.slice(0, 3).map(function (r) { return '<span class="chip tag" data-inst-name="' + esc(r) + '">' + esc(r) + '</span>'; }).join('');
      return '<div class="card signal-card" id="sig-' + s.id + '"><div class="signal-ic ' + lv.cls + '">' + icon(ic) + '</div><div class="signal-main"><div class="signal-title">' + esc(s.title) + '<span class="chip tag ' + lv.cls + '">' + lv.label + '</span><span class="chip tag">' + esc(s.cat) + '</span></div><div class="signal-evidence">' + esc(s.evidence) + '</div><div class="signal-meta">' + icon('clock') + '<span>' + esc(s.ts) + '</span>' + (s.dyn ? '<span>规则自动生成</span>' : '<span>数据源交叉验证</span>') + refs + '</div></div><div class="signal-actions"><label class="switch"><input type="checkbox" data-sig="' + s.id + '" ' + (state.rules[s.id] !== false ? 'checked' : '') + '><span class="track"></span><span class="knob"></span></label></div></div>';
    }).join('');
    const rulesHtml = '<div class="card"><div class="card-head"><div class="card-title">' + icon('settings') + '规则引擎</div><div class="card-meta">可配置检测条件</div></div><div class="card-body"><div class="rules-grid">' + D.rules.map(function (r) {
      const lv = levelInfo(r.level);
      return '<div class="rule-row"><div><div class="nm">' + esc(r.name) + '</div><div class="desc">' + esc(r.desc) + '</div></div><span class="lv" style="background:var(--' + lv.cls + '-soft);color:var(--' + (lv.cls === 'red' ? 'red' : lv.cls === 'amber' ? 'amber' : 'blue') + ')">' + lv.label + '</span><label class="switch"><input type="checkbox" data-rule="' + r.id + '" ' + (state.rules[r.id] ? 'checked' : '') + '><span class="track"></span><span class="knob"></span></label></div>';
    }).join('') + '</div></div></div>';
    return head + stats + filters + '<div style="height:12px"></div>' + (cards || '<div class="card"><div class="empty-state">' + icon('radar') + '<div>暂无匹配信号</div></div></div>') + '<div style="height:16px"></div>' + rulesHtml;
  }

  function afterSignals() {
    const all = buildSignals();
    const high = all.filter(function (s) { return s.level === 'high'; }).length;
    $('signal-badge').textContent = high;
    document.querySelectorAll('.sig-level').forEach(function (b) {
      b.addEventListener('click', function () { state.signalFilter.level = b.getAttribute('data-level'); render(); });
    });
    document.querySelectorAll('.sig-cat').forEach(function (b) {
      b.addEventListener('click', function () { state.signalFilter.cat = b.getAttribute('data-cat'); render(); });
    });
    document.querySelectorAll('input[data-rule]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        state.rules[inp.getAttribute('data-rule')] = inp.checked;
        toast(inp.checked ? tl('规则已启用') : tl('规则已停用'));
      });
    });
    document.querySelectorAll('input[data-sig]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        const id = inp.getAttribute('data-sig');
        state.rules[id] = inp.checked;
        toast(inp.checked ? tl('信号已启用') : tl('信号已停用'));
      });
    });
    $('signal-scan').addEventListener('click', function () {
      const btn = this;
      btn.disabled = true;
      setTimeout(function () {
        btn.disabled = false;
        render();
        toast(tl('扫描完成 · 检测到 ') + buildSignals().length + tl(' 条活跃信号'));
      }, 900);
    });
  }

  function localReport() {
    const d30 = deals.filter(function (d) { return inRange(d.date, 30); });
    const prev30 = deals.filter(function (d) { const c = dateCutoff(30), p = dateCutoff(60); const dt = new Date(d.date + 'T00:00:00+08:00'); return dt >= p && dt < c; });
    const total30 = sum(d30, function (d) { return d.amount; });
    const prevTotal30 = sum(prev30, function (d) { return d.amount; });
    const g = pctChange(total30, prevTotal30);
    const secTotals = {};
    d30.forEach(function (d) { secTotals[d.sector] = (secTotals[d.sector] || 0) + d.amount; });
    const topSec = Object.keys(secTotals).sort(function (a, b) { return secTotals[b] - secTotals[a]; }).slice(0, 3);
    const topInstCnt = {};
    deals.filter(function (d) { return inRange(d.date, 90); }).forEach(function (d) { [d.lead].concat(d.co).forEach(function (n) { topInstCnt[n] = (topInstCnt[n] || 0) + 1; }); });
    const topInsts = Object.keys(topInstCnt).sort(function (a, b) { return topInstCnt[b] - topInstCnt[a]; }).slice(0, 3);
    const nb = D.flows.monthly.map(function (r) { return r[1]; });
    const nbDelta = pctChange(nb[nb.length - 1], nb[nb.length - 2]);
    const q = D.flows.quarterly;
    const inDelta = pctChange(q.inbound[q.inbound.length - 1], q.inbound[q.inbound.length - 2]);
    const outDelta = pctChange(q.outbound[q.outbound.length - 1], q.outbound[q.outbound.length - 2]);
    const sigs = buildSignals().filter(function (s) { return s.level !== 'low'; }).slice(0, 4);
    const report = {
      score: 78,
      summary: '近30天一级市场共完成 ' + d30.length + ' 笔交易，融资总额 ' + money(total30) + '，环比' + (g >= 0 ? '增长' : '下降') + ' ' + Math.abs(g).toFixed(1) + '%。资金向 AI、具身智能与国产算力高度集中，' + topSec.map(function (s) { return sectorName(s); }).join('、') + ' 贡献了主要增量；同时政府引导基金与产业资本在硬科技大额交易中的参与度明显上升。',
      market: [
        { k: '市场温度', v: '78 / 100', x: '较上月 +6，处于偏热区间' },
        { k: '赛道集中度', v: topSec.length ? (secTotals[topSec[0]] / (total30 || 1) * 100).toFixed(1) + '%' : '0%', x: '集中于 ' + (topSec[0] ? sectorName(topSec[0]) : '-') },
        { k: '单笔均值', v: money(d30.length ? total30 / d30.length : 0), x: '头部项目拉动明显' },
        { k: '交易数量', v: d30.length + ' 笔', x: '环比 ' + (g >= 0 ? '增加' : '减少') }
      ],
      sectors: topSec.map(function (s, i) {
        const cv = secTotals[s], pv = prev30.filter(function (d) { return d.sector === s; }).reduce(function (a, d) { return a + d.amount; }, 0);
        const pg = pctChange(cv, pv);
        return { name: sectorName(s), value: money(cv), g: pg, note: i === 0 ? '资金与政策合力推动' : '头部项目持续吸金' };
      }),
      insts: topInsts.map(function (n) {
        const it = INST_MAP.get(n) || {};
        const amt = sum(byInst[n] || [], function (d) { return d.amount; });
        return { name: n, type: it.type || '', count: topInstCnt[n], amt: money(amt), note: '近90天参与 ' + topInstCnt[n] + ' 笔' };
      }),
      flows: [
        { k: '北向资金', v: nb[nb.length - 1] + '亿', g: nbDelta, x: '连续三个月维持高净流入' },
        { k: '外资流入中国一级市场', v: money(q.inbound[q.inbound.length - 1]), g: inDelta, x: '环比回升' },
        { k: '中国资本出海', v: money(q.outbound[q.outbound.length - 1]), g: outDelta, x: '东南亚与中东占比扩大' }
      ],
      risks: sigs.map(function (s) { return { title: s.title, evidence: s.evidence }; }),
      focus: [
        'AI 大模型进入 D 轮前后估值谈判窗口，关注头部项目的估值锚点',
        '具身智能公司量产与交付数据成为下一轮融资定价关键',
        '国产 GPU D 轮密集交割后，观察生态适配与客户采购兑现',
        '消费品牌 Pre-IPO 窗口重启，关注海外收入与盈利质量',
        '政府引导基金出资比例上升，留意返投与落地条款变化'
      ]
    };
    const i18nSummary = I18N.summary(state.lang, { n: d30.length, total: money(total30), g: g, topSec: topSec.map(function (s) { return sectorName(s); }) });
    if (i18nSummary) report.summary = i18nSummary;
    const i18nFocus = I18N.focusList(state.lang);
    if (i18nFocus) report.focus = i18nFocus;
    return report;
  }

  function reportHtml(r, mode) {
    const focus = r.focus.map(function (f, i) { return '<div class="focus-item"><span class="n">' + (i + 1) + '</span><span class="tx">' + esc(f) + '</span></div>'; }).join('');
    const market = r.market.map(function (m) { return '<div class="report-item"><div class="k">' + esc(m.k) + '</div><div class="v">' + esc(m.v) + '</div><div class="x">' + esc(m.x) + '</div></div>'; }).join('');
    const secs = r.sectors.map(function (s) { return '<div class="report-item"><div class="k">' + esc(s.name) + '</div><div class="v">' + esc(s.value) + ' <span class="' + (s.g >= 0 ? 'g' : 'd') + '">' + (s.g >= 0 ? '+' : '') + s.g.toFixed(0) + '%</span></div><div class="x">' + esc(s.note) + '</div></div>'; }).join('');
    const insts = r.insts.map(function (i) { return '<div class="report-item"><div class="k">' + esc(i.name) + ' · ' + esc(i.type) + '</div><div class="v">' + esc(i.amt) + ' <span class="d">' + i.count + ' 笔</span></div><div class="x">' + esc(i.note) + '</div></div>'; }).join('');
    const flows = r.flows.map(function (fl) { return '<div class="report-item"><div class="k">' + esc(fl.k) + '</div><div class="v">' + esc(fl.v) + ' <span class="' + (fl.g >= 0 ? 'g' : 'd') + '">' + (fl.g >= 0 ? '+' : '') + fl.g.toFixed(1) + '%</span></div><div class="x">' + esc(fl.x) + '</div></div>'; }).join('');
    const risks = r.risks.map(function (s) { return '<div class="report-item"><div class="k">风险信号</div><div class="v">' + esc(s.title) + '</div><div class="x">' + esc(s.evidence) + '</div></div>'; }).join('');
    return '<div class="card report-card"><div class="report-hero"><div><h2>一级市场投资研判 · 近30天</h2><div class="sub">' + esc(D.meta.asOf) + ' · ' + esc(mode) + '' + '</div></div><div class="score"><div class="num">' + r.score + '</div><div class="lbl">市场温度 / 偏热</div></div></div><div class="report-body">' +
      '<div class="report-summary"><div class="mark"></div><p>' + esc(r.summary) + '</p></div>' +
      '<div class="report-section"><h3>' + icon('activity') + '市场温度</h3><div class="report-cols">' + market + '</div></div>' +
      '<div class="report-section"><h3>' + icon('flame') + '赛道热度</h3><div class="report-cols">' + secs + '</div></div>' +
      '<div class="report-section"><h3>' + icon('users') + '机构行为</h3><div class="report-cols">' + insts + '</div></div>' +
      '<div class="report-section"><h3>' + icon('globe') + '资金流向</h3><div class="report-cols">' + flows + '</div></div>' +
      '<div class="report-section"><h3>' + icon('alert') + '风险信号</h3><div class="report-cols">' + risks + '</div></div>' +
      '<div class="report-section"><h3>' + icon('target') + '未来两周关注</h3><div class="focus-list">' + focus + '</div></div>' +
      '</div></div>';
  }

  async function generateWithLLM(local) {
    const prompt = 'Analyze the China primary market. Write a concise Chinese research summary (under 200 Chinese characters) covering market temperature, hot sectors, institutional activity and key risks. Data:\n' + local.summary + '\nSectors: ' + local.sectors.map(function (s) { return s.name + ' ' + s.value + ' growth ' + s.g.toFixed(0) + '%'; }).join(' / ') + '\nInstitutions: ' + local.insts.map(function (i) { return i.name + ' ' + i.amt; }).join(' / ');
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.llmKey },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 800 })
    });
    if (!resp.ok) throw new Error('DeepSeek API ' + resp.status);
    const data = await resp.json();
    const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return text || null;
  }

  function renderEcosystem() {
    const f = D.flows;
    const fund = f.fundraising.values[f.fundraising.values.length - 1];
    const ipo = f.exits.ipos[f.exits.ipos.length - 1];
    const ma = f.exits.ma[f.exits.ma.length - 1];
    const usd = f.currencyMix[1][1];
    const head = '<section class="page-head"><div><h1>生态全景</h1><p class="page-sub">募资 · 退出 · 估值 · 币种 · 区域流动</p></div></section>';
    const stats = '<div class="kpi-grid">' +
      kpiCard('wallet', 'green', '新基金募资', fund + '亿', '', '<span>最新季度 · 环比 +8.9%</span>') +
      kpiCard('briefcase', 'blue', '退出事件', (ipo + ma), '起', '<span>IPO ' + ipo + ' · 并购 ' + ma + '</span>') +
      kpiCard('layers', 'amber', '估值中位数', '80', '亿', '<span>C轮 · 近12个月</span>') +
      kpiCard('banknote', 'violet', '美元占比', usd + '%', '', '<span>近12个月 · 跨境活跃</span>') +
      '</div>';
    const fundCard = '<div class="card chart-card"><div class="card-head"><div class="card-title">' + icon('wallet') + '季度募资规模</div><div class="card-meta">新基金募资（亿元）</div></div><div class="card-body"><div class="chart-box chart-md" id="eco-fund"></div></div></div>';
    const exitCard = '<div class="card chart-card"><div class="card-head"><div class="card-title">' + icon('briefcase') + '季度退出事件</div><div class="card-meta">IPO · 并购</div></div><div class="card-body"><div class="chart-box chart-md" id="eco-exits"></div></div></div>';
    const valCard = '<div class="card chart-card"><div class="card-head"><div class="card-title">' + icon('layers') + '估值阶梯</div><div class="card-meta">轮次估值中位数</div></div><div class="card-body"><div class="chart-box chart-md" id="eco-valuation"></div></div></div>';
    const curCard = '<div class="card chart-card"><div class="card-head"><div class="card-title">' + icon('banknote') + '币种结构</div><div class="card-meta">人民币 / 美元</div></div><div class="card-body"><div class="chart-box chart-sm" id="eco-currency"></div></div></div>';
    const regCard = '<div class="card chart-card"><div class="card-head"><div class="card-title">' + icon('map-pin') + '区域间资金流动</div><div class="card-meta">Top 10 城市间流向（亿元）</div></div><div class="card-body"><div class="chart-box chart-md" id="eco-region"></div></div></div>';
    const outCard = '<div class="card chart-card"><div class="card-head"><div class="card-title">' + icon('globe') + '跨境出海目的地</div><div class="card-meta">中国资本流向占比</div></div><div class="card-body"><div class="chart-box chart-sm" id="eco-outbound"></div></div></div>';
    return head + stats + '<div class="panel-grid two">' + fundCard + exitCard + '</div><div class="panel-grid two">' + valCard + regCard + '</div><div class="panel-grid two">' + curCard + outCard + '</div>';
  }

  function afterEcosystem() {
    const f = D.flows;
    hBarChart($('eco-fund'), f.fundraising.labels.map(function (l, i) { return { label: l, value: f.fundraising.values[i], color: '#0d9f6e' }; }), { money: true });
    groupedBars($('eco-exits'), f.exits.labels, [
      { name: 'IPO', values: f.exits.ipos, color: '#2563eb' },
      { name: '并购', values: f.exits.ma, color: '#f59e0b' }
    ]);
    hBarChart($('eco-valuation'), f.valuationTrend.map(function (x) { return { label: x[0], value: x[1], color: colorHash(x[0]) }; }), { money: true });
    donutChart($('eco-currency'), f.currencyMix.map(function (x) { return { label: x[0], value: x[1], color: x[2] }; }), '76%');
    hBarChart($('eco-region'), f.regionalFlow.map(function (x) { return { label: x[0] + '→' + x[1], value: x[2], color: colorHash(x[0] + x[1]) }; }), { money: true });
    donutChart($('eco-outbound'), f.outboundRegions.map(function (x) { return { label: x[0], value: x[1], color: x[2] }; }), '42%');
  }

  function renderIntel() {
    const mode = state.llmOn && state.llmKey ? 'DeepSeek 增强' : '本地分析引擎';
    const head = '<section class="page-head"><div><h1>AI研判</h1><p class="page-sub">自动生成的投资环境解读与机会扫描</p></div><div class="head-actions intel-toolbar"><span class="engine-pill">' + icon('sparkles') + esc(mode) + '</span><button class="btn accent" id="intel-gen">' + icon('zap') + '重新生成</button><button class="btn ghost" id="intel-copy">' + icon('copy') + '复制摘要</button><button class="btn ghost" id="intel-print">' + icon('print') + '导出PDF</button><button class="btn ghost" id="intel-settings">' + icon('settings') + '引擎设置</button></div></section>';
    const r = localReport();
    if (state.llmReport) r.summary = state.llmReport;
    return head + reportHtml(r, mode);
  }

  function afterIntel() {
    $('intel-gen').addEventListener('click', function () {
      const btn = this;
      btn.disabled = true;
      btn.innerHTML = icon('refresh') + tl('生成中...');
      const done = function (msg) {
        btn.disabled = false;
        btn.innerHTML = icon('zap') + tl('重新生成');
        state.reportSeed++;
        render();
        toast(msg || tl('研判报告已更新'));
      };
      setTimeout(function () {
        if (state.llmOn && state.llmKey) {
          generateWithLLM(localReport()).then(function (text) {
            if (text) { state.llmReport = text; done('DeepSeek 报告已生成'); }
            else { state.llmReport = null; done(); }
          }).catch(function () {
            state.llmReport = null;
            done('DeepSeek 调用失败，已回退本地引擎');
          });
        } else {
          state.llmReport = null;
          done();
        }
      }, 300);
    });
    $('intel-copy').addEventListener('click', function () {
      const r = localReport();
    if (state.llmReport) r.summary = state.llmReport;
      const text = '【资本流径 AI研判】' + r.summary;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast(tl('摘要已复制')); }, function () { toast(tl('复制失败'), 'error'); });
      } else {
        toast(tl('复制失败'), 'error');
      }
    });
    $('intel-print').addEventListener('click', function () { window.print(); });
    $('intel-settings').addEventListener('click', function () {
      openModal('<div class="modal-head"><h3>分析引擎设置</h3><button class="icon-btn" data-close-modal>' + icon('x') + '</button></div><div class="modal-body"><div class="field"><label>报告引擎</label><select id="llm-mode"><option value="local" ' + (!state.llmOn ? 'selected' : '') + '>本地规则引擎</option><option value="llm" ' + (state.llmOn ? 'selected' : '') + '>DeepSeek API</option></select></div><div class="field"><label>DeepSeek API Key</label><input type="password" id="llm-key" placeholder="sk-..." value="' + esc(state.llmKey) + '"><div class="hint">仅保存在本地浏览器，用于调用 DeepSeek 生成报告。</div></div><div class="modal-actions"><button class="btn ghost" data-close-modal>取消</button><button class="btn accent" id="llm-save">保存设置</button></div></div>');
      $('llm-save').addEventListener('click', function () {
        const mode = $('llm-mode').value;
        state.llmOn = mode === 'llm';
        state.llmKey = $('llm-key').value.trim();
        try {
          localStorage.setItem('cf_llm_key', state.llmKey);
          localStorage.setItem('cf_llm_on', state.llmOn ? '1' : '0');
        } catch (e) { /* noop */ }
        closeModal();
        render();
        toast(state.llmOn ? tl('已切换至 DeepSeek 引擎') : tl('已切换至本地引擎'));
      });
      document.querySelectorAll('[data-close-modal]').forEach(function (b) { b.addEventListener('click', closeModal); });
    });
  }
  function openDrawer(html) {
    const d = $('drawer'), b = $('drawer-backdrop');
    d.innerHTML = html;
    d.setAttribute('aria-hidden', 'false');
    d.classList.add('open');
    b.classList.add('open');
    fillIcons(d);
    localizeDom(d);
    const closeBtns = d.querySelectorAll('[data-close-drawer]');
    closeBtns.forEach(function (btn) { btn.addEventListener('click', closeDrawer); });
    const compBtns = d.querySelectorAll('[data-comp-name]');
    compBtns.forEach(function (btn) { btn.addEventListener('click', function () { openCompany(btn.getAttribute('data-comp-name')); }); });
    const instBtns = d.querySelectorAll('[data-inst-name]');
    instBtns.forEach(function (btn) { btn.addEventListener('click', function () { openInstitution(btn.getAttribute('data-inst-name')); }); });
    const dealBtns = d.querySelectorAll('[data-deal-id]');
    dealBtns.forEach(function (btn) { btn.addEventListener('click', function () { openDeal(Number(btn.getAttribute('data-deal-id'))); }); });
  }
  function closeDrawer() {
    $('drawer').classList.remove('open');
    $('drawer-backdrop').classList.remove('open');
    $('drawer').setAttribute('aria-hidden', 'true');
  }
  $('drawer-backdrop').addEventListener('click', closeDrawer);

  function openCompany(name) {
    const co = COMP_MAP.get(name);
    if (!co) return;
    const list = (byCompany[name] || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    const total = sum(list, function (d) { return d.amount; });
    const insts = new Set();
    list.forEach(function (d) { [d.lead].concat(d.co).forEach(function (n) { insts.add(n); }); });
    const dealRows = list.map(function (d) {
      return '<div class="company-row" data-deal-id="' + d.id + '"><div><div class="nm">' + esc(d.round) + ' · ' + money(d.amount) + '</div><div class="sub">' + fmtDate(d.date) + ' · 领投 ' + esc(d.lead) + '</div></div><div class="amt">' + fmtDate(d.date) + '</div></div>';
    }).join('');
    const tags = co.tags.map(function (t) { return '<span class="chip tag">' + esc(t) + '</span>'; }).join('');
    const chips = Array.from(insts).slice(0, 8).map(function (n) { return '<span class="chip tag blue" data-inst-name="' + esc(n) + '">' + esc(n) + '</span>'; }).join('');
    openDrawer('<div class="drawer-head"><span class="cell-avatar" style="width:44px;height:44px;font-size:15px;border-radius:12px;background:' + esc(sectorColor(co.sector)) + '">' + esc(initials(name)) + '</span><div class="ht"><h3>' + esc(name) + '</h3><div class="sub">' + esc(sectorName(co.sector)) + ' · ' + esc(co.region) + ' · 成立于' + co.founded + '</div></div><button class="icon-btn" data-close-drawer>' + icon('x') + '</button></div><div class="drawer-body">' +
      '<div class="drawer-section"><div class="desc-text">' + esc(co.desc) + '</div><div class="tags-row" style="margin-top:10px">' + tags + '</div></div>' +
      '<div class="drawer-section"><div class="detail-kpis"><div class="detail-kpi"><div class="k">累计融资</div><div class="v">' + money(total) + '</div></div><div class="detail-kpi"><div class="k">最新估值</div><div class="v">' + money(co.estValuation) + '</div></div><div class="detail-kpi"><div class="k">最新轮次</div><div class="v">' + esc(co.stage) + '</div></div><div class="detail-kpi"><div class="k">团队规模</div><div class="v">' + co.employees.toLocaleString() + ' <span class="u">人</span></div></div></div></div>' +
      '<div class="drawer-section"><h4>' + icon('banknote') + '融资历史 · ' + list.length + ' 笔</h4>' + (dealRows || '<div style="color:#94a3b8">暂无记录</div>') + '</div>' +
      '<div class="drawer-section"><h4>' + icon('users') + '投资机构</h4><div class="tags-row">' + (chips || '<span style="color:#94a3b8;font-size:12px">暂无</span>') + '</div></div>' +
      '</div>');
  }

  function openInstitution(name) {
    const it = INST_MAP.get(name);
    if (!it) return;
    const st = instStats(name);
    const list = (byInst[name] || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 8);
    const dealRows = list.map(function (d) {
      return '<div class="company-row" data-deal-id="' + d.id + '"><div><div class="nm">' + esc(d.company) + ' · ' + esc(d.round) + '</div><div class="sub">' + fmtDate(d.date) + ' · ' + esc(d.sectorName) + ' · ' + esc(d.region) + '</div></div><div class="amt">' + money(d.amount) + '</div></div>';
    }).join('');
    const focus = it.focus.map(function (s) { return '<span class="chip tag" style="color:' + esc(sectorColor(s)) + ';background:' + esc(sectorColor(s)) + '1a">' + esc(sectorName(s)) + '</span>'; }).join('');
    openDrawer('<div class="drawer-head"><span class="cell-avatar" style="width:44px;height:44px;font-size:15px;border-radius:12px;background:' + esc(colorHash(name)) + '">' + esc(initials(name)) + '</span><div class="ht"><h3>' + esc(name) + '</h3><div class="sub">' + esc(it.type) + ' · ' + esc(it.region) + ' · 成立' + esc(it.founded) + '年</div></div><button class="icon-btn" data-close-drawer>' + icon('x') + '</button></div><div class="drawer-body">' +
      '<div class="drawer-section"><div class="desc-text">' + esc(it.desc) + '</div><div class="tags-row" style="margin-top:10px">' + focus + '</div></div>' +
      '<div class="drawer-section"><div class="detail-kpis"><div class="detail-kpi"><div class="k">管理规模</div><div class="v">' + money(it.aum) + '</div></div><div class="detail-kpi"><div class="k">参与交易</div><div class="v">' + st.total + '</div></div><div class="detail-kpi"><div class="k">参与金额</div><div class="v">' + money(st.amt) + '</div></div><div class="detail-kpi"><div class="k">近30天出手</div><div class="v">' + st.d30 + '</div></div></div></div>' +
      '<div class="drawer-section"><h4>' + icon('banknote') + '近期交易</h4>' + (dealRows || '<div style="color:#94a3b8">暂无记录</div>') + '</div>' +
      '</div>');
  }

  function openDeal(id) {
    const d = deals.find(function (x) { return x.id === id; });
    if (!d) return;
    const co = COMP_MAP.get(d.company) || {};
    const related = (byCompany[d.company] || []).filter(function (x) { return x.id !== id; }).slice(0, 4).map(function (x) {
      return '<div class="company-row" data-deal-id="' + x.id + '"><div><div class="nm">' + esc(x.round) + ' · ' + money(x.amount) + '</div><div class="sub">' + fmtDate(x.date) + ' · 领投 ' + esc(x.lead) + '</div></div><div class="amt">' + fmtDate(x.date) + '</div></div>';
    }).join('');
    const invs = [d.lead].concat(d.co).map(function (n) { return '<span class="chip tag blue" data-inst-name="' + esc(n) + '">' + esc(n) + '</span>'; }).join('');
    openDrawer('<div class="drawer-head"><span class="cell-avatar" style="width:44px;height:44px;font-size:15px;border-radius:12px;background:' + esc(d.sectorColor) + '">' + esc(initials(d.company)) + '</span><div class="ht"><h3>' + esc(d.company) + ' · ' + esc(d.round) + '</h3><div class="sub">' + fmtDate(d.date) + ' · ' + esc(d.sectorName) + ' · ' + esc(d.region) + '</div></div><button class="icon-btn" data-close-drawer>' + icon('x') + '</button></div><div class="drawer-body">' +
      '<div class="drawer-section"><div class="detail-kpis"><div class="detail-kpi"><div class="k">本轮金额</div><div class="v">' + money(d.amount) + '</div></div><div class="detail-kpi"><div class="k">估值</div><div class="v">' + money(co.estValuation) + '</div></div><div class="detail-kpi"><div class="k">领投方</div><div class="v" style="font-size:14px">' + esc(d.lead) + '</div></div><div class="detail-kpi"><div class="k">跨境资金</div><div class="v" style="font-size:14px">' + (d.cross ? '是' : '否') + '</div></div></div></div>' +
      '<div class="drawer-section"><h4>' + icon('fileText') + '交易备注</h4><div class="desc-text">' + esc(d.note) + '</div></div>' +
      '<div class="drawer-section"><h4>' + icon('users') + '投资方</h4><div class="tags-row">' + invs + '</div></div>' +
      (related ? '<div class="drawer-section"><h4>' + icon('list') + '同公司历史融资</h4>' + related + '</div>' : '') +
      '</div>');
  }

  function searchMatches(q) {
    const s = q.trim().toLowerCase();
    if (!s) return { companies: [], insts: [], deals: [] };
    const companies = D.companies.filter(function (c) {
      return (c.name + ' ' + enNameOf(c.name) + ' ' + c.desc + ' ' + c.tags.join('') + ' ' + c.region).toLowerCase().indexOf(s) >= 0;
    }).slice(0, 5);
    const insts = D.institutions.filter(function (i) {
      return (i.name + ' ' + enNameOf(i.name) + ' ' + i.desc + ' ' + i.region + ' ' + i.type).toLowerCase().indexOf(s) >= 0;
    }).slice(0, 5);
    const dealList = deals.filter(function (d) {
      return (d.company + ' ' + enNameOf(d.company) + ' ' + d.lead + ' ' + enNameOf(d.lead) + ' ' + d.co.map(enNameOf).join(' ') + ' ' + d.note).toLowerCase().indexOf(s) >= 0;
    }).slice(0, 6);
    return { companies: companies, insts: insts, deals: dealList };
  }

  function renderSearchPop(q) {
    const pop = $('search-pop');
    const wrap = document.querySelector('.search-wrap');
    const rect = wrap.getBoundingClientRect();
    pop.style.position = 'fixed';
    pop.style.left = rect.left + 'px';
    pop.style.top = (rect.bottom + 8) + 'px';
    pop.style.width = Math.max(320, rect.width) + 'px';
    const m = searchMatches(q);
    const total = m.companies.length + m.insts.length + m.deals.length;
    if (!total) {
      pop.innerHTML = '<div class="sp-head">' + icon('search') + '未找到匹配项</div><div class="sp-empty">换个关键词试试</div>';
    } else {
      let html = '<div class="sp-head">' + icon('search') + '搜索结果 · ' + total + ' 项</div>';
      m.companies.forEach(function (c) {
        html += '<div class="sp-item" data-comp-name="' + esc(c.name) + '"><span class="cell-avatar" style="background:' + esc(sectorColor(c.sector)) + '">' + esc(initials(c.name)) + '</span><div><div class="nm">' + esc(c.name) + '</div><div class="sub">' + esc(sectorName(c.sector)) + ' · ' + esc(c.region) + ' · ' + esc(c.stage) + '</div></div><span class="ty">公司</span></div>';
      });
      m.insts.forEach(function (i) {
        html += '<div class="sp-item" data-inst-name="' + esc(i.name) + '"><span class="cell-avatar" style="background:' + esc(colorHash(i.name)) + '">' + esc(initials(i.name)) + '</span><div><div class="nm">' + esc(i.name) + '</div><div class="sub">' + esc(i.type) + ' · ' + esc(i.region) + ' · 管理' + money(i.aum) + '</div></div><span class="ty">机构</span></div>';
      });
      m.deals.forEach(function (d) {
        html += '<div class="sp-item" data-deal-id="' + d.id + '"><span class="cell-avatar" style="background:' + esc(d.sectorColor) + '">' + esc(initials(d.company)) + '</span><div><div class="nm">' + esc(d.company) + ' · ' + esc(d.round) + '</div><div class="sub">' + fmtDate(d.date) + ' · ' + money(d.amount) + ' · 领投 ' + esc(d.lead) + '</div></div><span class="ty">交易</span></div>';
      });
      pop.innerHTML = html;
      pop.querySelectorAll('[data-comp-name]').forEach(function (el) { el.addEventListener('click', function () { hideSearchPop(); openCompany(el.getAttribute('data-comp-name')); }); });
      pop.querySelectorAll('[data-inst-name]').forEach(function (el) { el.addEventListener('click', function () { hideSearchPop(); openInstitution(el.getAttribute('data-inst-name')); }); });
      pop.querySelectorAll('[data-deal-id]').forEach(function (el) { el.addEventListener('click', function () { hideSearchPop(); openDeal(Number(el.getAttribute('data-deal-id'))); }); });
    }
    localizeDom(pop);
    pop.hidden = false;
  }
  function hideSearchPop() { $('search-pop').hidden = true; }

  function renderAlertPop() {
    const pop = $('alert-pop');
    const sigs = buildSignals().slice(0, 3);
    pop.innerHTML = '<div class="pc-head"><span>最新信号</span><button class="icon-btn" id="alert-close" style="width:26px;height:26px">' + icon('x') + '</button></div>' +
      sigs.map(function (s) {
        const lv = levelInfo(s.level);
        return '<div class="pc-item" data-sig-nav="' + s.id + '"><span class="signal-ic ' + lv.cls + '" style="width:30px;height:30px;border-radius:8px">' + icon(s.cat === '机构动态' ? 'users' : 'flame') + '</span><div><div class="nm">' + esc(s.title) + '</div><div class="tm">' + esc(s.ts) + '</div></div></div>';
      }).join('');
    localizeDom(pop);
    pop.hidden = false;
    pop.querySelectorAll('[data-sig-nav]').forEach(function (el) {
      el.addEventListener('click', function () {
        pop.hidden = true;
        go('signals');
      });
    });
    $('alert-close').addEventListener('click', function () { pop.hidden = true; });
  }

  function openModal(html) {
    $('modal').innerHTML = html;
    $('modal').hidden = false;
    $('modal-backdrop').hidden = false;
    fillIcons($('modal'));
    localizeDom($('modal'));
  }
  function closeModal() {
    $('modal').hidden = true;
    $('modal-backdrop').hidden = true;
  }

  function bindTopbar() {
    $('lang-select').addEventListener('change', function (e) {
      state.lang = e.target.value;
      try { localStorage.setItem('cf_lang', state.lang); } catch (err) { /* noop */ }
      render();
    });
    $('range-select').addEventListener('change', function (e) {
      state.range = Number(e.target.value);
      render();
    });
    $('refresh-btn').addEventListener('click', function () {
      render();
      toast(tl('数据已刷新 · ') + D.meta.asOf);
    });
    $('alert-btn').addEventListener('click', function () {
      if ($('alert-pop').hidden) renderAlertPop(); else $('alert-pop').hidden = true;
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-wrap') && !e.target.closest('#search-pop')) hideSearchPop();
      if (!e.target.closest('#alert-btn') && !e.target.closest('#alert-pop')) $('alert-pop').hidden = true;
    });
    $('menu-btn').addEventListener('click', function () {
      $('sidebar').classList.toggle('open');
    });
    document.querySelectorAll('.nav-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const v = btn.getAttribute('data-view');
        if (v) go(v);
        $('sidebar').classList.remove('open');
      });
    });
    const input = $('global-search');
    input.addEventListener('input', function () { renderSearchPop(input.value); });
    input.addEventListener('focus', function () { if (input.value.trim()) renderSearchPop(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { hideSearchPop(); input.blur(); }
      if (e.key === 'Enter') {
        const m = searchMatches(input.value);
        const first = m.companies[0] || m.insts[0] || m.deals[0];
        if (first) {
          hideSearchPop();
          if (m.companies[0] === first) openCompany(first.name);
          else if (m.insts[0] === first) openInstitution(first.name);
          else openDeal(first.id);
          input.value = '';
        }
      }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.focus();
        input.select();
      }
      if (e.key === 'Escape') { closeDrawer(); closeModal(); hideSearchPop(); }
    });
  }

  async function loadRemoteData() {
    try {
      const resp = await fetch('data.json?t=' + Date.now(), { cache: 'no-store' });
      if (!resp.ok) return false;
      const data = await resp.json();
      if (!data || !data.deals || !data.institutions || !data.companies) return false;
      window.DATA = data;
      buildData();
      buildDerived();
      const upd = document.getElementById('side-update');
      if (upd && data.meta && data.meta.asOf) upd.textContent = tl('数据截至 ') + data.meta.asOf;
      return true;
    } catch (e) { return false; }
  }

  async function init() {
    fillIcons(document);
    bindTopbar();
    await loadRemoteData();
    render();
  }

  // Force graph overrides: keep zoom/drag stable across re-renders.
  function renderFlowSvg(model, selectedKey) {
    const stage = $('flow-stage');
    if (!stage) return;
    const W = 1000, H = 720;
    const q = (state.flowFilter.q || '').trim().toLowerCase();
    const maxW = Math.max.apply(null, model.edges.map(function (e) { return e.weight; })) || 1;
    const nodeByKey = {};
    model.nodes.forEach(function (n) { nodeByKey[n.key] = n; });
    let inner = '';
    model.edges.forEach(function (e) {
      const a = nodeByKey[e.from], b = nodeByKey[e.to];
      if (!a || !b) return;
      const w = Math.max(0.6, 2 + (e.weight / maxW) * 5.5);
      const hl = selectedKey && (e.from === selectedKey || e.to === selectedKey);
      const dim = selectedKey && !hl;
      inner += '<line class="flow-edge' + (hl ? ' hl' : '') + (dim ? ' dim' : '') + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="' + (e.kind === 'sector' ? '#f59e0b' : e.kind === 'co' ? '#7dd3fc' : '#0d9f6e') + '" stroke-width="' + w.toFixed(1) + '" opacity="' + (e.kind === 'sector' ? '0.16' : '0.32') + '" data-edge="' + esc(e.from) + '->' + esc(e.to) + '"/>';
    });
    model.nodes.forEach(function (n) {
      const matchQ = !q || n.label.toLowerCase().indexOf(q) >= 0;
      const isSel = selectedKey === n.key;
      const connected = selectedKey && model.edges.some(function (e) { return e.from === selectedKey && e.to === n.key || e.to === selectedKey && e.from === n.key; });
      const dim = (selectedKey && !isSel && !connected) || (q && !matchQ);
      const cls = 'flow-node' + (dim ? ' dim' : '');
      if (n.type === 'sector') {
        inner += '<g class="' + cls + '" data-node="' + esc(n.key) + '" transform="translate(' + n.x + ',' + n.y + ')"><circle r="' + n.r + '" fill="' + esc(n.color) + '" stroke="#fff" stroke-width="2.5"/><text class="flow-node-label hub" text-anchor="middle" dy="4">' + esc(n.label.slice(0, 4)) + '</text></g>';
      } else if (n.type === 'institution') {
        inner += '<g class="' + cls + '" data-node="' + esc(n.key) + '" transform="translate(' + n.x + ',' + n.y + ')"><circle r="' + n.r + '" fill="' + esc(n.color) + '" opacity=".92" stroke="#fff" stroke-width="2"/><text class="flow-node-label" text-anchor="middle" dy="' + (n.r + 14) + '">' + esc(n.label) + '</text></g>';
      } else {
        inner += '<g class="' + cls + '" data-node="' + esc(n.key) + '" transform="translate(' + n.x + ',' + n.y + ')"><circle r="' + n.r + '" fill="' + esc(n.color) + '" opacity=".95" stroke="#fff" stroke-width="2"/><text class="flow-node-label" text-anchor="middle" dy="' + (n.r + 13) + '">' + esc(n.label.slice(0, 7)) + '</text></g>';
      }
    });
    const scale = stage.__scale || 1;
    inner = '<g id="flow-content" transform="scale(' + scale + ')">' + inner + '</g>';
    stage.innerHTML = svgWrap(inner, W, H);
    localizeDom(stage);
    const svg = stage.querySelector('svg');
    svg.style.width = '100%';
    svg.style.height = '100%';
    stage.__model = model;
  }

  function bindFlowInteractions() {
    const stage = $('flow-stage');
    if (!stage) return;
    let drag = null;
    let raf = null;
    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      stage.__scale = Math.max(0.55, Math.min(2.2, (stage.__scale || 1) * (e.deltaY < 0 ? 1.08 : 0.92)));
      renderFlowSvg(stage.__model, stage.__selectedKey || null);
    }, { passive: false });
    stage.addEventListener('pointerdown', function (e) {
      const nodeEl = e.target.closest('.flow-node');
      if (!nodeEl) return;
      const key = nodeEl.getAttribute('data-node');
      const model = stage.__model;
      const n = model.nodes.find(function (x) { return x.key === key; });
      if (!n) return;
      const rect = stage.getBoundingClientRect();
      drag = { n: n, startX: e.clientX, startY: e.clientY, nodeX: n.x, nodeY: n.y, moved: false, scale: stage.__scale || 1, rectW: rect.width, rectH: rect.height };
      e.preventDefault();
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      const dx = (e.clientX - drag.startX) * (1000 / drag.rectW) / drag.scale;
      const dy = (e.clientY - drag.startY) * (720 / drag.rectH) / drag.scale;
      drag.n.x = Math.max(20, Math.min(980, drag.nodeX + dx));
      drag.n.y = Math.max(20, Math.min(700, drag.nodeY + dy));
      if (Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) > 4) drag.moved = true;
      if (!raf) {
        raf = requestAnimationFrame(function () {
          raf = null;
          renderFlowSvg(stage.__model, stage.__selectedKey || null);
        });
      }
    });
    window.addEventListener('pointerup', function () {
      if (!drag) return;
      const wasMoved = drag.moved;
      const key = drag.n.key;
      drag = null;
      if (!wasMoved) {
        stage.__selectedKey = stage.__selectedKey === key ? null : key;
        renderFlowSvg(stage.__model, stage.__selectedKey);
        renderFlowDetail(stage.__model, stage.__selectedKey);
      }
    });
    stage.addEventListener('click', function (e) {
      const edge = e.target.closest('.flow-edge');
      if (edge && stage.__model) {
        const key = edge.getAttribute('data-edge').split('->')[1];
        stage.__selectedKey = key;
        renderFlowSvg(stage.__model, key);
        renderFlowDetail(stage.__model, key);
      }
    });
  }

  window.CapitalFlowApp = { go: go, render: render, state: state };
  document.addEventListener('DOMContentLoaded', init);
})();