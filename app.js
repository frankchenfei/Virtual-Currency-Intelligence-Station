/* 应用主控：交互、渲染与状态（多语言） */
const App = (() => {
  const state = {
    symbol: 'BTC',
    interval: '1h',
    overlays: { ma: true, boll: false, vol: true },
    newsSentiment: 'all',
    newsCoin: 'all',
    newsCategory: 'all'
  };

  const $ = id => document.getElementById(id);
  let resizeRaf = 0;
  let chatEntries = [];
  let chatLang = I18N.get();

  function esc(s) { return AI.esc(s); }

  function on(id, event, fn) {
    const el = document.getElementById(id);
    if (!el) return false;
    if (el.dataset.boundClick) return true;
    el.dataset.boundClick = '1';
    el.addEventListener(event, fn);
    return true;
  }

  function fmtTimeHM(ts) {
    const d = new Date(ts);
    return String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function relTime(sec) {
    const diff = Date.now() / 1000 - sec;
    if (diff < 60) return I18N.t('time.justNow');
    if (diff < 3600) return I18N.t('time.minAgo', { n: Math.floor(diff / 60) });
    if (diff < 86400) return I18N.t('time.hourAgo', { n: Math.floor(diff / 3600) });
    return I18N.t('time.dayAgo', { n: Math.floor(diff / 86400) });
  }

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), 2600);
  }

  function setActiveTab(view) {
    document.querySelectorAll('#mainTabs button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  }

  function initTabs() {
    return on('mainTabs', 'click', e => {
      const btn = e.target.closest('button');
      if (!btn) return;
      setActiveTab(btn.dataset.view);
      renderView(btn.dataset.view);
    });
  }

  function initLangSwitch() {
    return on('langSwitch', 'click', e => {
      const btn = e.target.closest('button[data-lang]');
      if (!btn) return;
      document.querySelectorAll('#langSwitch button').forEach(b => b.classList.toggle('active', b === btn));
      I18N.set(btn.dataset.lang);
      renderView(document.querySelector('.view.active').id.replace('view-', ''));
      renderStatus();
    });
  }

  function renderView(view) {
    if (view === 'market') renderMarket();
    if (view === 'news') renderNews();
    if (view === 'chain') renderChain();
    if (view === 'ai') renderAI();
  }

  function renderTicker() {
    const el = $('tickerStrip');
    if (!el) return;
    el.innerHTML = '';
    CONFIG.coins.forEach(c => {
      const t = Data.store.tickers[c.symbol] || {};
      const price = t.price != null ? Charts.fmtMoney(t.price) : '--';
      const chg = typeof t.change === 'number' && isFinite(t.change) ? t.change : null;
      const cls = chg == null ? 'flat' : chg > 0 ? 'up' : chg < 0 ? 'down' : 'flat';
      const btn = document.createElement('button');
      btn.className = 'ticker-item' + (state.symbol === c.symbol ? ' active' : '');
      btn.style.setProperty('--coin-color', c.color);
      btn.innerHTML =
        '<span class="coin-mark">' + esc(c.symbol.slice(0, 3)) + '</span>' +
        '<span class="ticker-main"><span class="ticker-symbol">' + c.symbol + '</span><span class="ticker-price">' + esc(price) + '</span></span>' +
        '<span class="ticker-sub"><span class="ticker-change ' + cls + '">' + (chg == null ? '--' : (chg > 0 ? '+' : '') + chg.toFixed(2) + '%') + '</span>' +
        '<span class="ticker-spark" data-spark="' + c.symbol + '"></span></span>';
      btn.addEventListener('click', () => selectSymbol(c.symbol));
      el.appendChild(btn);
      const sparkEl = btn.querySelector('.ticker-spark');
      Charts.drawSparkline(sparkEl, t.spark || [], c.color);
    });
  }

  function selectSymbol(symbol) {
    if (state.symbol === symbol) return;
    state.symbol = symbol;
    Data.setActive(symbol, state.interval);
    Data.loadKlines(symbol, state.interval);
    Data.loadDepth(symbol);
    renderMarket();
    toast(I18N.t('toast.switched', { symbol }));
  }

  function renderChart() {
    const key = state.symbol + ':' + state.interval;
    const klines = Data.store.klines[key];
    const ind = Data.store.indicators[key];
    const el = $('candleChart');
    if (!el) return;
    const tip = $('chartTip');
    const legend = $('ohlcLegend');
    const def = CONFIG.coins.find(c => c.symbol === state.symbol);
    const int = CONFIG.intervals.find(i => i.id === state.interval);
    $('chartTitle').textContent = state.symbol + '/USDT · ' + I18N.t(int.labelKey);

    const t = Data.store.tickers[state.symbol];
    if (t && t.price != null) {
      const chg = typeof t.change === 'number' && isFinite(t.change) ? t.change : null;
      const cls = chg == null ? 'flat' : chg > 0 ? 'up' : chg < 0 ? 'down' : 'flat';
      $('chartMeta').innerHTML =
        '<span><strong>' + Charts.fmtMoney(t.price) + '</strong> USDT</span>' +
        '<span class="' + cls + '">' + (chg == null ? '--' : (chg > 0 ? '+' : '') + chg.toFixed(2) + '%') + '</span>' +
        '<span>' + I18N.t('chart.high') + ' ' + Charts.fmtMoney(t.high) + '</span>' +
        '<span>' + I18N.t('chart.low') + ' ' + Charts.fmtMoney(t.low) + '</span>' +
        '<span>' + I18N.t('chart.vol') + ' ' + (t.quoteVolume != null ? Data.fmtNum(t.quoteVolume, 1) : '--') + '</span>';
    } else {
      $('chartMeta').textContent = def ? def.name : '';
    }

    if (!klines || !klines.data || !ind) {
      el.innerHTML = '<div class="empty-note">' + esc(I18N.t('chart.loading')) + '</div>';
      return;
    }

    Charts.drawCandles(el, klines.data, ind, {
      interval: state.interval,
      ma: state.overlays.ma,
      boll: state.overlays.boll,
      vol: state.overlays.vol,
      onHover: h => {
        tip.classList.remove('hidden');
        tip.innerHTML =
          '<strong>' + esc(h.time) + '</strong><br>' +
          I18N.t('chart.open') + ' ' + Charts.fmtMoney(h.o) + ' / ' + I18N.t('chart.high') + ' ' + Charts.fmtMoney(h.h) + '<br>' +
          I18N.t('chart.low') + ' ' + Charts.fmtMoney(h.l) + ' / ' + I18N.t('chart.close') + ' ' + Charts.fmtMoney(h.c) + '<br>' +
          I18N.t('chart.vol') + ' ' + Data.fmtNum(h.v, 0) +
          (h.rsi != null ? '<br>RSI ' + h.rsi.toFixed(1) : '') +
          (h.macd != null ? '<br>MACD ' + h.macd.toFixed(2) : '');
      },
      onLeave: () => tip.classList.add('hidden')
    });
    const src = klines.source === 'live' ? I18N.t('chart.live') : I18N.t('chart.demo');
    $('chartSource').textContent = I18N.t('chart.source') + ': ' + src;
    legend.textContent = I18N.t('metric.sma') + ' ' + (ind.sma20[ind.sma20.length - 1] != null ? Charts.fmtMoney(ind.sma20[ind.sma20.length - 1]) : '--') +
      ' · EMA12 ' + (ind.ema12[ind.ema12.length - 1] != null ? Charts.fmtMoney(ind.ema12[ind.ema12.length - 1]) : '--') +
      ' · ' + I18N.t('metric.boll') + ' ' + (ind.boll.upper[ind.boll.upper.length - 1] != null ? Charts.fmtMoney(ind.boll.upper[ind.boll.upper.length - 1]) + ' / ' + Charts.fmtMoney(ind.boll.lower[ind.boll.lower.length - 1]) : '--') +
      ' · ' + I18N.t('metric.atr') + ' ' + (ind.atr[ind.atr.length - 1] != null ? ind.atr[ind.atr.length - 1].toFixed(2) : '--');
  }

  function renderIndicators() {
    const key = state.symbol + ':1h';
    const ind = Data.store.indicators[key];
    const el = $('indicatorPanel');
    if (!el) return;
    if (!ind) { el.innerHTML = '<div class="empty-note">' + esc(I18N.t('chart.loading')) + '</div>'; return; }
    const i = ind.closes.length - 1;
    const l = Indicators.latest(ind, i);
    const now = new Date();
    $('indicatorTime').textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    const rsiState = l.rsi == null ? '--' : l.rsi < 30 ? I18N.t('hint.rsiOversold') : l.rsi > 70 ? I18N.t('hint.rsiOverbought') : I18N.t('hint.rsiNeutral');
    const trend = l.ema12 != null && l.ema26 != null ? (l.ema12 > l.ema26 ? I18N.t('hint.trendBull') : I18N.t('hint.trendBear')) : '--';
    const macdState = l.macdHist == null ? '--' : l.macdHist > 0 ? I18N.t('hint.macdBull') : I18N.t('hint.macdBear');
    const atrPct = l.atr && l.price ? (l.atr / l.price * 100).toFixed(2) + '%' : '--';

    const metrics = [
      [I18N.t('metric.rsi'), l.rsi == null ? '--' : l.rsi.toFixed(1), rsiState, l.rsi != null && (l.rsi < 30 || l.rsi > 70) ? (l.rsi < 30 ? 'up' : 'down') : 'flat'],
      [I18N.t('metric.macd'), l.macd == null || isNaN(l.macd) ? '--' : l.macd.toFixed(3), macdState, l.macdHist != null && l.macdHist > 0 ? 'up' : l.macdHist != null ? 'down' : 'flat'],
      [I18N.t('metric.ema'), l.ema12 != null && !isNaN(l.ema12) ? Charts.fmtMoney(l.ema12) : '--', 'EMA26 ' + (l.ema26 != null && !isNaN(l.ema26) ? Charts.fmtMoney(l.ema26) : '--'), trend === I18N.t('hint.trendBull') ? 'up' : trend === I18N.t('hint.trendBear') ? 'down' : 'flat'],
      [I18N.t('metric.sma'), l.sma20 == null || isNaN(l.sma20) ? '--' : Charts.fmtMoney(l.sma20), l.price != null && l.sma20 != null && !isNaN(l.sma20) ? (l.price > l.sma20 ? I18N.t('hint.priceAbove') : I18N.t('hint.priceBelow')) : '--', l.price != null && l.sma20 != null && !isNaN(l.sma20) && l.price > l.sma20 ? 'up' : 'flat'],
      [I18N.t('metric.atr'), l.atr == null ? '--' : l.atr.toFixed(2), atrPct, 'flat'],
      [I18N.t('metric.boll'), l.bollUpper == null || isNaN(l.bollUpper) ? '--' : Charts.fmtMoney(l.bollUpper), l.price != null && l.bollLower != null && !isNaN(l.bollLower) ? Charts.fmtMoney(l.bollLower) : '--', l.price != null && l.bollUpper != null && !isNaN(l.bollUpper) && l.price > l.bollUpper ? 'up' : l.price != null && l.bollLower != null && !isNaN(l.bollLower) && l.price < l.bollLower ? 'down' : 'flat'],
      [I18N.t('metric.madz'), l.zScore == null || isNaN(l.zScore) ? '--' : l.zScore.toFixed(2), Math.abs(l.zScore) > 3.5 ? I18N.t('hint.anomaly') : I18N.t('hint.anomalyNormal'), Math.abs(l.zScore) > 3.5 ? 'down' : 'flat'],
      [I18N.t('metric.ewma'), l.ewmaRet == null || isNaN(l.ewmaRet) ? '--' : (l.ewmaRet * 100).toFixed(3) + '%', I18N.t('hint.ewmaThreshold', { v: l.ewmaVol != null && !isNaN(l.ewmaVol) ? (l.ewmaVol * 250).toFixed(2) : '--' }), 'flat']
    ];

    el.innerHTML = metrics.map(m =>
      '<div class="metric"><span class="label">' + esc(m[0]) + '</span>' +
      '<span class="value ' + esc(m[3]) + '">' + esc(m[1]) + '</span>' +
      '<span class="hint">' + esc(m[2]) + '</span></div>'
    ).join('');
  }

  function renderSignals() {
    const el = $('signalPanel');
    if (!el) return;
    const list = Data.store.signals.filter(s => s.symbol === state.symbol).slice(0, 6);
    if (!list.length) {
      el.innerHTML = '<div class="empty-note">' + esc(I18N.t('signals.empty', { symbol: state.symbol })) + '</div>';
      return;
    }
    el.innerHTML = list.map(s => {
      const st = AI.signalText(s);
      return '<div class="signal-item" style="--signal-color:' + s.color + '">' +
        '<div class="signal-head"><span>' + esc(st.title) + '</span><span class="signal-time">' + esc(s.time) + '</span></div>' +
        '<div class="signal-msg">' + esc(st.msg) + '</div></div>';
    }).join('');
  }

  function renderMarketOverview() {
    const fng = Data.store.fng;
    const g = Data.store.global;
    const el = $('marketOverview');
    if (!el) return;
    const now = new Date();
    $('marketTime').textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    let html = '';
    if (fng) {
      const pct = Math.max(2, Math.min(98, fng.value));
      html += '<div class="gauge-block">' +
        '<div class="gauge-top"><span class="gauge-value">' + fng.value + '</span><span class="gauge-label">' + esc(I18N.t('overview.gauge')) + ' · ' + esc(AI.fngLabel()) + '</span></div>' +
        '<div class="gauge-bar"><span class="gauge-arrow" style="left:' + pct + '%"></span></div></div>';
    }
    if (g) {
      html += '<div class="market-cols">' +
        '<div class="market-cell"><span class="label">' + esc(I18N.t('overview.totalMc')) + '</span><span class="value">' + Data.fmtNum(g.totalMc, 1) + ' USD</span></div>' +
        '<div class="market-cell"><span class="label">' + esc(I18N.t('overview.vol24')) + '</span><span class="value">' + Data.fmtNum(g.totalVol, 1) + ' USD</span></div>' +
        '<div class="market-cell"><span class="label">' + esc(I18N.t('overview.btcShare')) + '</span><span class="value">' + (g.btcDominance != null ? g.btcDominance.toFixed(1) + '%' : '--') + '</span></div>' +
        '<div class="market-cell"><span class="label">' + esc(I18N.t('overview.ethShare')) + '</span><span class="value">' + (g.ethDominance != null ? g.ethDominance.toFixed(1) + '%' : '--') + '</span></div></div>';
    }
    const movers = Object.keys(Data.store.tickers).map(s => ({ s, v: Data.store.tickers[s] }))
      .filter(x => x.v && typeof x.v.change === 'number' && isFinite(x.v.change))
      .sort((a, b) => b.v.change - a.v.change);
    if (movers.length) {
      const maxAbs = Math.max.apply(null, movers.map(m => Math.abs(m.v.change))) || 1;
      html += '<div class="movers-list"><div class="movers-title">' + esc(I18N.t('overview.movers')) + '</div>';
      movers.forEach(m => {
        const pos = m.v.change >= 0;
        html += '<div class="mover-row"><span class="mover-sym">' + esc(m.s) + '</span>' +
          '<span class="mover-bar"><i style="width:' + (Math.abs(m.v.change) / maxAbs * 100).toFixed(1) + '%;background:' + (pos ? '#2fbf71' : '#f0546d') + '"></i></span>' +
          '<span class="mover-val ' + (pos ? 'up' : 'down') + '">' + (m.v.change > 0 ? '+' : '') + m.v.change.toFixed(2) + '%</span></div>';
      });
      html += '</div>';
    }
    el.innerHTML = html;
  }

  function renderMarket() {
    renderTicker();
    renderChart();
    renderIndicators();
    renderSignals();
    renderMarketOverview();
    renderDepth();
  }

  function renderDepth() {
    const d = Data.store.depth[state.symbol];
    const el = $('depthChart');
    if (!el) return;
    $('depthSymbol').textContent = state.symbol;
    if (!d) { el.innerHTML = '<div class="empty-note">' + esc(I18N.t('depth.loading')) + '</div>'; return; }
    Charts.drawDepth(el, d);
  }
  function renderSentiment() {
    const news = Data.store.news;
    const fng = Data.store.fng;
    const el = $('sentimentPanel');
    if (!el) return;
    const pos = news.filter(n => n.sentiment === 'positive').length;
    const neg = news.filter(n => n.sentiment === 'negative').length;
    const neu = Math.max(0, news.length - pos - neg);
    const score = news.length ? Math.round(((pos - neg) / news.length) * 100) : 0;
    const tone = score > 15 ? I18N.t('sent.tonePos') : score < -15 ? I18N.t('sent.toneNeg') : I18N.t('sent.toneNeu');
    const now = new Date();
    $('sentimentTime').textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const circleColor = score > 15 ? '#2fbf71' : score < -15 ? '#f0546d' : '#f4b942';
    const total = Math.max(news.length, 1);

    el.innerHTML =
      '<div class="sentiment-main">' +
      '<div class="sentiment-score" style="border-color:' + circleColor + '"><div><b>' + (score > 0 ? '+' : '') + score + '</b><span>' + esc(I18N.t('sent.scoreLabel')) + '</span></div></div>' +
      '<div class="sentiment-copy"><div class="big">' + esc(I18N.t('sent.title')) + ' ' + esc(tone) + '</div>' +
      '<div class="small">' + esc(I18N.t('sent.based', { n: news.length })) + '</div>' +
      (fng ? '<div class="small">' + esc(I18N.t('overview.gauge')) + ': ' + fng.value + (I18N.get() === 'zh' ? '（' : '(') + esc(AI.fngLabel()) + (I18N.get() === 'zh' ? '）' : ')') + '</div>' : '') + '</div></div>' +
      '<div class="sentiment-bars">' +
      '<div class="sentiment-bar"><span>' + esc(I18N.t('sent.positive')) + '</span><span class="track"><i style="width:' + (pos / total * 100).toFixed(1) + '%;background:#2fbf71"></i></span><span class="num">' + pos + '</span></div>' +
      '<div class="sentiment-bar"><span>' + esc(I18N.t('sent.neutral')) + '</span><span class="track"><i style="width:' + (neu / total * 100).toFixed(1) + '%;background:#8fa0ae"></i></span><span class="num">' + neu + '</span></div>' +
      '<div class="sentiment-bar"><span>' + esc(I18N.t('sent.negative')) + '</span><span class="track"><i style="width:' + (neg / total * 100).toFixed(1) + '%;background:#f0546d"></i></span><span class="num">' + neg + '</span></div></div>' +
      '<div class="sentiment-tags">' +
      (fng ? '<span class="tag">F&G ' + fng.value + ' · ' + esc(AI.fngLabel()) + '</span>' : '') +
      '<span class="tag">' + esc(I18N.t('sent.local')) + '</span><span class="tag">' + esc(relTime(news.length ? news[0].published_on : 0)) + '</span></div>';
  }

  function renderNewsFilters() {
    const el = $('newsCoinFilter');
    if (!el) return;
    const coins = ['all'].concat(CONFIG.coins.map(c => c.symbol));
    el.innerHTML = coins.map(sym => {
      const label = sym === 'all' ? I18N.t('news.allCoins') : sym;
      return '<button class="chip' + (state.newsCoin === sym ? ' active' : '') + '" data-coin="' + sym + '">' + esc(label) + '</button>';
    }).join('');
    el.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
      state.newsCoin = ch.dataset.coin;
      renderNews();
    }));
  }

  function newsTopic(n) {
    if (n.topic) return n.topic;
    const cats = n.categories || [];
    if (cats.some(c => ['Wallet', 'Custody', 'Institutional'].includes(c))) return 'wallet';
    if (cats.some(c => ['Regulation', 'Policy', 'Stablecoin', 'Legal'].includes(c))) return 'policy';
    if (cats.some(c => ['Upgrade', 'Tech', 'Security', 'Protocol', 'Network'].includes(c))) return 'tech';
    return 'market';
  }

  function renderNewsList() {
    const list = Data.store.news.filter(n => {
      if (state.newsSentiment !== 'all' && n.sentiment !== state.newsSentiment) return false;
      if (state.newsCoin !== 'all' && !(n.coins || []).includes(state.newsCoin)) return false;
      if (state.newsCategory !== 'all' && newsTopic(n) !== state.newsCategory) return false;
      return true;
    }).slice(0, 40);
    const el = $('newsList');
    if (!el) return;
    if (!list.length) { el.innerHTML = '<div class="empty-note">' + esc(I18N.t('news.noMatch')) + '</div>'; return; }

    const sentLabel = { positive: I18N.t('sent.positive'), negative: I18N.t('sent.negative'), neutral: I18N.t('sent.neutral') };
    el.innerHTML = list.map(n =>
      '<article class="news-item">' +
      '<span class="news-sent ' + n.sentiment + '">' + esc(sentLabel[n.sentiment]) + '</span>' +
      '<div>' +
      '<a class="news-title" href="' + esc(n.url || '#') + '" target="_blank" rel="noopener">' + esc(n.title) + '</a>' +
      (n.body ? '<div class="news-summary">' + esc(n.body.length > 180 ? n.body.slice(0, 180) + '...' : n.body) + '</div>' : '') +
      '<div class="news-meta"><span>' + esc(n.source) + '</span><span>·</span><span>' + esc(relTime(n.published_on)) + '</span>' +
      '<a href="' + esc(n.url || '#') + '" target="_blank" rel="noopener">' + esc(I18N.t('news.original')) + ' ↗</a>' +
      '<span class="news-cats">' + (n.coins || []).slice(0, 3).map(c => '<span class="tag">' + esc(c) + '</span>').join('') + '</span></div>' +
      '</div>' +
      (n.imageurl ? '<img class="news-img" src="' + esc(n.imageurl) + '" alt="" loading="lazy">' : '') +
      '</article>'
    ).join('');
    el.querySelectorAll('img.news-img').forEach(img => {
      img.addEventListener('error', () => { img.style.display = 'none'; });
    });
  }

  function renderNews() {
    renderSentiment();
    renderNewsFilters();
    renderNewsList();
    const brief = $('briefBody');
    if (brief) brief.innerHTML = AI.generateDailyBrief();
  }

  function renderChain() {
    const oc = Data.store.onchain;
    const now = new Date();
    const netTime = $('netTime'), memTime = $('mempoolTime'), netStats = $('netStats'), feePanel = $('feePanel'), defiPanel = $('defiPanel'), whalePanel = $('whalePanel'), flowPanel = $('flowPanel');
    if (!netStats || !feePanel || !defiPanel || !whalePanel || !flowPanel) return;
    netTime.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    memTime.textContent = oc.fees && oc.fees.source === 'live' ? 'Mempool.space' : I18N.t('status.demo');

    const b = oc.btc;
    netStats.innerHTML = b ? [
      [I18N.t('chain.block'), b.blocks != null ? Data.fmtNum(b.blocks, 0) : '--'],
      [I18N.t('chain.tx'), b.transactions != null ? Data.fmtNum(b.transactions, 0) : '--'],
      [I18N.t('chain.hashrate'), b.hashRate != null ? Data.fmtNum(b.hashRate / 1e9, 1) : '--'],
      [I18N.t('chain.miner'), b.minersRevenue != null ? Data.fmtNum(b.minersRevenue, 1) + ' USD' : '--']
    ].map(x => '<div class="stat-cell"><span class="label">' + esc(x[0]) + '</span><span class="value">' + x[1] + '</span><span class="delta"></span></div>').join('') :
      '<div class="empty-note">' + esc(I18N.t('chain.loading')) + '</div>';

    const fees = oc.fees;
    const mem = oc.mempool;
    let feeHtml = '';
    if (fees) {
      feeHtml += '<div class="fee-row"><span class="label">' + esc(I18N.t('chain.fastest')) + '</span><span class="value up">' + fees.fastest + '</span></div>' +
        '<div class="fee-row"><span class="label">' + esc(I18N.t('chain.half')) + '</span><span class="value">' + fees.half + '</span></div>' +
        '<div class="fee-row"><span class="label">' + esc(I18N.t('chain.hour')) + '</span><span class="value">' + fees.hour + '</span></div>';
    }
    if (mem) {
      const pct = Math.min(100, mem.count / 300000 * 100);
      feeHtml += '<div class="mempool-bar"><div class="mempool-track"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
        '<div class="mempool-note">' + esc(I18N.t('chain.mempool', { n: Data.fmtNum(mem.count, 0), v: Data.fmtNum(mem.vSize / 1e6, 1) })) + '</div></div>';
    }
    feePanel.innerHTML = feeHtml || '<div class="empty-note">' + esc(I18N.t('chain.loading')) + '</div>';

    const defi = oc.defi || [];
    defiPanel.innerHTML = '<div class="defi-row head"><span>' + esc(I18N.t('chain.table.chain')) + '</span><span class="defi-val">' + esc(I18N.t('chain.table.tvl')) + '</span><span class="defi-chg">' + esc(I18N.t('chain.table.change')) + '</span><span class="defi-val">' + esc(I18N.t('chain.table.share')) + '</span></div>' +
      defi.map(d => {
        const total = defi.reduce((a, x) => a + x.tvl, 0) || 1;
        const pct = (d.tvl / total * 100).toFixed(1);
        const color = d.name === 'Ethereum' ? '#7c8cf8' : d.name === 'Solana' ? '#2dd4bf' : d.name === 'Tron' ? '#f0546d' : d.name === 'BSC' ? '#f0b90b' : d.name === 'Base' ? '#58a6ff' : '#8fa0ae';
        return '<div class="defi-row"><span class="defi-name"><span class="defi-dot" style="background:' + color + '"></span>' + esc(d.name) + '</span>' +
          '<span class="defi-val">' + Data.fmtNum(d.tvl, 1) + '</span>' +
          '<span class="defi-chg ' + (d.change == null ? 'flat' : d.change >= 0 ? 'up' : 'down') + '">' + (d.change == null ? '--' : (d.change > 0 ? '+' : '') + d.change.toFixed(2) + '%') + '</span>' +
          '<span class="defi-val">' + pct + '%</span></div>';
      }).join('');

    const whales = oc.whales || [];
    $('whaleSource').textContent = oc.whalesSource === 'live' ? I18N.t('chain.whaleLive') : I18N.t('chain.whaleDemo');
    whalePanel.innerHTML = whales.map(w => {
      const inEx = w.side === 'in';
      const color = inEx ? '#2fbf71' : '#f0546d';
      return '<div class="whale-row"><span class="whale-ico" style="background:' + color + '">' + esc(w.chain.slice(0, 2)) + '</span>' +
        '<span class="whale-main"><span class="whale-amt">' + Data.fmtNum(w.amount, w.amount < 100 ? 2 : 1) + ' ' + esc(w.chain) + '</span>' +
        '<span class="whale-sub">' + esc(w.exchange) + ' · ' + fmtTimeHM(w.time) + '</span></span>' +
        '<span class="whale-side" style="color:' + color + '">' + esc(I18N.t(inEx ? 'chain.in' : 'chain.out')) + ' · ' + Data.fmtNum(w.usd, 1) + ' USD</span></div>';
    }).join('') || '<div class="empty-note">' + esc(I18N.t('ai.none')) + '</div>';

    const flows = oc.flows || [];
    $('flowNote').textContent = I18N.t('chain.flowNote');
    flowPanel.innerHTML = '<div class="flow-grid">' + flows.map(f => {
      const netPos = f.net >= 0;
      const abs = Math.abs(f.net);
      const maxAbs = Math.max.apply(null, flows.map(x => Math.abs(x.net))) || 1;
      return '<div class="flow-cell"><span class="label">' + esc(f.exchange) + ' · ' + esc(I18N.t('chain.in')) + '</span>' +
        '<span class="flow-num ' + (netPos ? 'up' : 'down') + '">' + (netPos ? '+' : '-') + abs.toFixed(1) + 'M</span>' +
        '<div class="flow-bar"><i style="width:' + (abs / maxAbs * 100).toFixed(1) + '%;background:' + (netPos ? '#2fbf71' : '#f0546d') + '"></i></div></div>';
    }).join('') + '</div>';
  }

  function renderSuggestions() {
    const el = $('suggestions');
    if (!el) return;
    el.innerHTML = I18N.t('ai.suggestions').split(' | ').map(s => '<button class="suggestion">' + esc(s) + '</button>').join('');
  }

  function welcomeContent() {
    const fng = Data.store.fng;
    const g = Data.store.global;
    const sugg = I18N.t('ai.suggestions').split(' | ');
    return {
      title: I18N.t('ai.welcomeTitle'),
      html: '<p>' + I18N.t('ai.welcome', {
        price: esc(sugg[0] || ''), rsi: esc(sugg[1] || ''), news: esc(sugg[2] || ''),
        sentiment: esc(sugg[3] || ''), chain: esc(sugg[4] || '')
      }) + '</p>' +
        '<p>' + (fng ? I18N.t('overview.gauge') + ' <strong>' + fng.value + '</strong>' + (I18N.get() === 'zh' ? '（' : '(') + esc(AI.fngLabel()) + (I18N.get() === 'zh' ? '）' : ')') : esc(I18N.t('ai.chainLoading'))) + (I18N.get() === 'zh' ? '，' : ', ') +
        (g ? I18N.t('overview.totalMc') + ' <strong>' + Data.fmtNum(g.totalMc, 1) + ' USD</strong>' : '') + (I18N.get() === 'zh' ? '。' : '.') + '</p>'
    };
  }

  function renderChat() {
    const chat = $('chatLog');
    if (!chat) return;
    chat.innerHTML = '';
    chatEntries.forEach(e => {
      const div = document.createElement('div');
      div.className = 'chat-msg ' + e.role;
      if (e.content.title) div.innerHTML = '<span class="src">' + esc(e.content.title) + '</span>';
      div.innerHTML += e.content.html || '';
      chat.appendChild(div);
    });
    chat.scrollTop = chat.scrollHeight;
  }

  function rehydrateChat() {
    if (chatLang === I18N.get()) return;
    chatLang = I18N.get();
    chatEntries.forEach(e => {
      if (e.welcome) e.content = welcomeContent();
      else if (e.query != null) e.content = AI.answer(e.query) || e.content;
    });
    renderChat();
  }

  function renderAI() {
    renderSuggestions();
    const fng = Data.store.fng;
    const g = Data.store.global;
    const insight = $('insightBody'), timeline = $('timelineBody'), chat = $('chatLog');
    if (!insight || !timeline || !chat) return;
    insight.innerHTML = AI.generateMarketInsight(state.symbol);
    $('timelineCount').textContent = Data.store.signals.length + ' · ' + I18N.t('ai.timeline');
    const list = Data.store.signals.slice(0, 16);
    timeline.innerHTML = list.length ? list.map(s => {
      const st = AI.signalText(s);
      const sev = s.severity === 'high' ? I18N.t('signals.high') : s.severity === 'medium' ? I18N.t('signals.medium') : I18N.t('signals.low');
      return '<div class="tl-row" style="--signal-color:' + s.color + '"><span class="tl-time">' + esc(s.time) + '</span>' +
        '<div class="tl-body"><div class="tl-title">' + esc(st.title) + ' <span class="muted">· ' + esc(st.type) + ' · ' + esc(sev) + '</span></div>' +
        '<div class="tl-sub">' + esc(st.msg) + '</div></div></div>';
    }).join('') : '<div class="empty-note">' + esc(I18N.t('ai.none')) + '</div>';

    if (!chatEntries.length) {
      appendChat('ai', welcomeContent(), null, true);
    } else {
      rehydrateChat();
      renderChat();
    }
  }
  function appendChat(role, content, query, welcome) {
    chatEntries.push({ role, content, query, welcome: !!welcome });
    if (welcome) chatLang = I18N.get();
    renderChat();
  }
  async function ask(text) {
    const q = String(text || '').trim();
    if (!q) return;
    appendChat('user', { html: esc(q) });
    const coin = AI.detectCoin(q);
    if (coin && !Data.store.indicators[coin + ':1h']) {
      appendChat('ai', { title: I18N.t('ai.chainLoading'), html: '<p>' + esc(I18N.t('ai.preparing', { symbol: coin })) + '</p>' });
      await Data.loadKlines(coin, '1h');
    }
    const ans = AI.answer(q);
    setTimeout(() => {
      appendChat('ai', ans, q);
    }, 180);
  }

  function renderStatus() {
    const st = Data.store.status;
    const liveCount = Object.values(st).filter(s => s && s.ok).length;
    const demoCount = Object.values(st).filter(s => s && !s.ok).length;
    const badge = $('liveBadge');
    if (!badge) return;
    const label = badge.querySelector('span');
    const STATUS_KEYS = { binance: 'status.binance', klines: 'status.klines', depth: 'status.depth', news: 'status.news', cryptopanic: 'status.cryptopanic', fng: 'status.fng', global: 'status.global', blockchain: 'status.blockchain', mempool: 'status.mempool', defillama: 'status.defillama', whale: 'status.whale', ws: 'status.ws' };
    const sourceLines = Object.keys(st).map(k => {
      const s = st[k];
      const cls = s.ok ? 'ok' : 'warn';
      const label = STATUS_KEYS[k] ? I18N.t(STATUS_KEYS[k]) : (s.label || k);
      return '<span class="' + cls + '">' + esc(label) + ': ' + esc(s.detail || (s.ok ? I18N.t('status.ok') : I18N.t('status.unavailable'))) + '</span>';
    }).join('');
    $('sourceStatus').innerHTML = sourceLines || '<span>' + esc(I18N.t('badge.checking')) + '</span>';

    const wsOk = st.ws && st.ws.ok;
    const binanceOk = st.binance && st.binance.ok;
    badge.classList.remove('live', 'mixed', 'offline');
    if (wsOk) {
      badge.classList.add('live');
      label.textContent = I18N.t('badge.ws');
    } else if (binanceOk) {
      badge.classList.add('live');
      label.textContent = I18N.t('badge.polling');
    } else if (liveCount === 0) {
      badge.classList.add('offline');
      label.textContent = I18N.t('badge.demo');
    } else {
      badge.classList.add('mixed');
      label.textContent = I18N.t('badge.mixed');
    }
    $('footerStatus').textContent = I18N.t('footer.source', {
      live: liveCount, demo: demoCount, time: new Date().toLocaleTimeString(I18N.get() === 'zh' ? 'zh-CN' : I18N.get() === 'es' ? 'es-ES' : 'en-US', { hour12: false })
    });
  }

  function initSettings() {
    const modal = $('settingsModal');
    const ok = on('settingsBtn', 'click', () => { modal.classList.remove('hidden'); renderStatus(); }) &&
      on('closeSettings', 'click', () => modal.classList.add('hidden')) &&
      on('settingsModal', 'click', e => { if (e.target === modal) modal.classList.add('hidden'); }) &&
      on('saveSettings', 'click', () => {
        Data.saveKeys({
          whaleAlert: $('keyWhale').value.trim(),
          cryptoPanic: $('keyCryptoPanic').value.trim(),
          cryptoCompare: $('keyCryptoCompare').value.trim()
        });
        modal.classList.add('hidden');
        toast(I18N.t('settings.saved'));
        Data.loadNews();
        Data.loadOnchain();
      });
    const keys = Data.getKeys();
    $('keyWhale').value = keys.whaleAlert || '';
    $('keyCryptoPanic').value = keys.cryptoPanic || '';
    $('keyCryptoCompare').value = keys.cryptoCompare || '';
    return ok && !!modal;
  }

  function initAskBox() {
    const ok = on('askForm', 'submit', e => {
      e.preventDefault();
      const val = $('askInput').value.trim();
      if (!val) return;
      setActiveTab('ai');
      renderView('ai');
      ask(val);
      $('askInput').value = '';
    }) &&
    on('chatForm', 'submit', e => {
      e.preventDefault();
      const val = $('chatInput').value.trim();
      if (!val) return;
      ask(val);
      $('chatInput').value = '';
    }) &&
    on('suggestions', 'click', e => {
      const btn = e.target.closest('.suggestion');
      if (btn) ask(btn.textContent);
    });
    renderSuggestions();
    return ok;
  }

  function initControls() {
    const ok =
      on('intervalSeg', 'click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        state.interval = btn.dataset.interval;
        Data.setActive(state.symbol, state.interval);
        document.querySelectorAll('#intervalSeg button').forEach(b => b.classList.toggle('active', b === btn));
        Data.loadKlines(state.symbol, state.interval);
        renderChart();
      }) &&
      on('overlayMa', 'click', () => { state.overlays.ma = !state.overlays.ma; $('#overlayMa').classList.toggle('active', state.overlays.ma); renderChart(); }) &&
      on('overlayBoll', 'click', () => { state.overlays.boll = !state.overlays.boll; $('#overlayBoll').classList.toggle('active', state.overlays.boll); renderChart(); }) &&
      on('overlayVol', 'click', () => { state.overlays.vol = !state.overlays.vol; $('#overlayVol').classList.toggle('active', state.overlays.vol); renderChart(); }) &&
      on('rescanBtn', 'click', () => { Data.scanSignals(); renderSignals(); toast(I18N.t('toast.rescan')); }) &&
      on('refreshBrief', 'click', () => { const b = $('briefBody'); if (b) b.innerHTML = AI.generateDailyBrief(); toast(I18N.t('toast.refreshed')); }) &&
      on('refreshInsight', 'click', () => { const i = $('insightBody'); if (i) i.innerHTML = AI.generateMarketInsight(state.symbol); toast(I18N.t('toast.insightRefreshed')); }) &&
      on('sentimentFilter', 'click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        state.newsSentiment = btn.dataset.sent;
        document.querySelectorAll('#sentimentFilter button').forEach(b => b.classList.toggle('active', b === btn));
        renderNewsList();
      }) &&
      on('newsCategoryFilter', 'click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        state.newsCategory = btn.dataset.cat;
        document.querySelectorAll('#newsCategoryFilter button').forEach(b => b.classList.toggle('active', b === btn));
        renderNewsList();
      });
    return ok;
  }

  function initResize() {
    const chart = $('candleChart');
    const depth = $('depthChart');
    if (!chart || !depth) return false;
    if (!window.ResizeObserver) return true;
    if (chart.dataset.ro) return true;
    chart.dataset.ro = '1';
    depth.dataset.ro = '1';
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (document.getElementById('view-market').classList.contains('active')) {
          renderChart();
          renderDepth();
        }
      });
    });
    ro.observe(chart);
    ro.observe(depth);
    return true;
  }

  function init() {
    const required = ['mainTabs', 'intervalSeg', 'overlaySeg', 'settingsModal', 'askForm', 'chatForm', 'sentimentFilter', 'newsCategoryFilter', 'candleChart', 'depthChart', 'tickerStrip', 'signalPanel', 'indicatorPanel', 'marketOverview', 'newsList', 'newsCoinFilter', 'sentimentPanel', 'briefBody', 'netStats', 'feePanel', 'defiPanel', 'whalePanel', 'flowPanel', 'chatLog', 'suggestions', 'insightBody', 'timelineBody', 'liveBadge', 'sourceStatus', 'langSwitch'];
    const missing = required.filter(id => !document.getElementById(id));
    if (missing.length) {
      setTimeout(init, 60);
      return;
    }
    if (window.__cryptoIntelStarted) return;
    window.__cryptoIntelStarted = true;
    const ok = initTabs() && initControls() && initSettings() && initAskBox() && initResize() && initLangSwitch();
    if (!ok) {
      setTimeout(init, 60);
      return;
    }
    I18N.translateStatic();
    document.querySelectorAll('#langSwitch button').forEach(b => b.classList.toggle('active', b.dataset.lang === I18N.get()));
    document.addEventListener('langchange', () => {
      Data.localizeStoreNews();
      renderView(document.querySelector('.view.active').id.replace('view-', ''));
      renderStatus();
    });
    Data.subscribe(() => {
      renderStatus();
      const activeView = document.querySelector('.view.active').id.replace('view-', '');
      renderView(activeView);
    });
    Data.start();
  }

  init();
  return { ask, state };
})();
