/* AI 层：情绪分析、市场解读、每日简报、智能问答（多语言） */
const AI = (() => {
  const LEXICON = {
    '上涨': 2, '暴涨': 3, '飙升': 3, '新高': 2.5, '突破': 1.8, '反弹': 1.5, '回升': 1.5, '回暖': 1.5,
    '下跌': -2, '暴跌': -3, '崩盘': -3.5, '新低': -2.5, '跌破': -1.8, '回落': -1.5, '抛售': -2, '清算': -2.5,
    '黑客': -3, '被盗': -3.5, '攻击': -2.5, '漏洞': -2, '诉讼': -2, '罚款': -2, '调查': -1.5, '禁令': -2.5,
    '监管': -1.2, '限制': -1.3, '合规': -0.8, '风险': -1, '警告': -1.2,
    '批准': 2, '通过': 1.8, '利好': 2.5, '合作': 1.5, '上线': 1.2, '升级': 1, '增长': 1.5, '创新高': 2.8,
    '流入': 1.8, '增持': 2, '回购': 2, '采用': 1.5, '需求': 1, '共识': 1.2,
    '流出': -1.5, '减持': -1.8, '抛压': -2, '通胀': -1, '衰退': -2.5, '关税': -1.2,
    'surge': 2.5, 'rally': 2, 'soar': 2.5, 'record': 1.8, 'high': 1, 'bullish': 2, 'adoption': 1.5, 'approve': 2, 'inflow': 1.8,
    'crash': -3, 'plunge': -2.5, 'slump': -2, 'hack': -3, 'exploit': -2.8, 'lawsuit': -2, 'ban': -2.5, 'risk': -1.2,
    'bearish': -2, 'outflow': -1.5, 'selloff': -2, 'liquidation': -2.5,
    'sube': 2, 'subida': 2, 'repunte': 1.8, 'record': 1.8, 'aprobaci': 2, 'adopci': 1.5, 'crece': 1.5, 'crecimiento': 1.5, 'entrada': 1.5,
    'cae': -2, 'caida': -2, 'caída': -2, 'desplome': -3, 'hackeo': -3, 'regulaci': -1.2, 'riesgo': -1.2, 'venta': -1.5, 'sancion': -2, 'salida': -1.5
  };

  const COIN_ALIASES = {
    btc: 'BTC', bitcoin: 'BTC', 比特币: 'BTC', 大饼: 'BTC',
    eth: 'ETH', ethereum: 'ETH', ether: 'ETH', 以太坊: 'ETH', 姨太: 'ETH',
    sol: 'SOL', solana: 'SOL',
    bnb: 'BNB', 币安币: 'BNB',
    xrp: 'XRP', ripple: 'XRP', 瑞波: 'XRP',
    doge: 'DOGE', dogecoin: 'DOGE', 狗狗币: 'DOGE',
    ada: 'ADA', cardano: 'ADA', 艾达: 'ADA',
    avax: 'AVAX', avalanche: 'AVAX', 雪崩: 'AVAX',
    link: 'LINK', chainlink: 'LINK', 预言机: 'LINK',
    ltc: 'LTC', litecoin: 'LTC', 莱特币: 'LTC',
    dot: 'DOT', polkadot: 'DOT', 波卡: 'DOT',
    pol: 'POL', polygon: 'POL', matic: 'POL', 马蹄: 'POL',
    uni: 'UNI', uniswap: 'UNI',
    atom: 'ATOM', cosmos: 'ATOM',
    near: 'NEAR',
    apt: 'APT', aptos: 'APT',
    arb: 'ARB', arbitrum: 'ARB',
    op: 'OP', optimism: 'OP',
    sui: 'SUI',
    ton: 'TON', toncoin: 'TON',
    trx: 'TRX', tron: 'TRX',
    shib: 'SHIB', shiba: 'SHIB',
    pepe: 'PEPE',
    bch: 'BCH', 'bitcoin cash': 'BCH',
    etc: 'ETC', 'ethereum classic': 'ETC',
    fil: 'FIL', filecoin: 'FIL',
    inj: 'INJ', injective: 'INJ',
    sei: 'SEI',
    icp: 'ICP', 'internet computer': 'ICP',
    hbar: 'HBAR', hedera: 'HBAR'
  };

  const FNG_ZH = {
    'Extreme Fear': '极度恐慌', 'Fear': '恐慌', 'Neutral': '中性', 'Greed': '贪婪', 'Extreme Greed': '极度贪婪'
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function detectCoin(text) {
    const low = text.toLowerCase();
    for (const key of Object.keys(COIN_ALIASES)) {
      const re = new RegExp('(^|[^a-z0-9])' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)', 'i');
      if (re.test(low)) return COIN_ALIASES[key];
    }
    return null;
  }

  function scoreNews(item) {
    const text = (item.title || '') + ' ' + (item.body || '');
    let score = 0, hits = 0;
    Object.keys(LEXICON).forEach(w => {
      const re = new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const m = text.match(re);
      if (m) { score += LEXICON[w] * m.length; hits += m.length; }
    });
    const sentiment = score >= 0.8 ? 'positive' : score <= -0.8 ? 'negative' : 'neutral';
    const coins = [];
    Object.keys(COIN_ALIASES).forEach(key => {
      const re = new RegExp('(^|[^a-z0-9])' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)', 'i');
      if (re.test(text) && !coins.includes(COIN_ALIASES[key])) coins.push(COIN_ALIASES[key]);
    });
    return { sentiment, score: Math.round(score * 10) / 10, coins };
  }

  function fmtPct(v, digits) {
    if (v == null || isNaN(v)) return '--';
    return (v > 0 ? '+' : '') + v.toFixed(digits == null ? 2 : digits) + '%';
  }

  function fngLabel() {
    const f = Data.store.fng;
    if (!f || !f.label) return '';
    if (I18N.get() === 'zh' && FNG_ZH[f.label]) return FNG_ZH[f.label];
    return f.label;
  }

  function indicatorSummary(symbol) {
    const ind = Data.store.indicators[symbol + ':1h'];
    if (!ind) return null;
    const i = ind.closes.length - 1;
    const l = Indicators.latest(ind, i);
    const t = Data.store.tickers[symbol] || {};
    const atrPct = l.atr && l.price ? (l.atr / l.price) * 100 : null;
    const trend = l.ema12 > l.ema26 ? (l.price > l.sma20 ? I18N.t('hint.trendBull') + ' / ' + I18N.t('hint.priceAbove') : I18N.t('hint.trendBull')) : (l.price < l.sma20 ? I18N.t('hint.trendBear') : I18N.t('hint.trendBear'));
    const macdState = l.macdHist > 0 ? I18N.t('hint.macdBull') : I18N.t('hint.macdBear');
    const bollState = l.price > l.bollUpper ? I18N.t('hint.bollUpper') : l.price < l.bollLower ? I18N.t('hint.bollLower') : I18N.t('hint.rsiNeutral');
    return { trend, rsi: l.rsi, macdState, macd: l.macd, macdSignal: l.macdSignal, bollState, atrPct, price: l.price, change: t.change, sma20: l.sma20, ema12: l.ema12, ema26: l.ema26 };
  }

  function newsFor(symbol) {
    const items = Data.store.news.filter(n => (n.coins || []).includes(symbol));
    if (!items.length) return null;
    const pos = items.filter(n => n.sentiment === 'positive').length;
    const neg = items.filter(n => n.sentiment === 'negative').length;
    const neu = items.length - pos - neg;
    return { items, pos, neg, neu };
  }

  const SIG_KEYS = {
    'rsi:os': ['sig.rsiOs.title', 'sig.rsiOs.msg'],
    'rsi:ob': ['sig.rsiOb.title', 'sig.rsiOb.msg'],
    'macd:bull': ['sig.macdBull.title', 'sig.macdBull.msg'],
    'macd:bear': ['sig.macdBear.title', 'sig.macdBear.msg'],
    'ema:bull': ['sig.emaBull.title', 'sig.emaBull.msg'],
    'ema:bear': ['sig.emaBear.title', 'sig.emaBear.msg'],
    'boll:up': ['sig.bollUp.title', 'sig.bollUp.msg'],
    'boll:down': ['sig.bollDown.title', 'sig.bollDown.msg'],
    'anomaly:z': ['sig.anomalyZ.title', 'sig.anomalyZ.msg'],
    'anomaly:ewma': ['sig.anomalyEwma.title', 'sig.anomalyEwma.msg'],
    'move:up': ['sig.move.title', 'sig.move.msg'],
    'move:down': ['sig.move.title', 'sig.move.msg']
  };

  function signalText(s) {
    const keys = SIG_KEYS[s.kind + ':' + s.dir] || SIG_KEYS['rsi:os'];
    const vals = Object.assign({ symbol: s.symbol }, s.vals || {});
    return {
      title: I18N.t(keys[0], vals),
      msg: I18N.t(keys[1], vals),
      type: I18N.t('sig.type.' + s.kind)
    };
  }

  function generateMarketInsight(symbol) {
    const sum = indicatorSummary(symbol);
    if (!sum) return '<p>' + esc(I18N.t('ai.chainLoading')) + '...</p>';
    const def = CONFIG.coins.find(c => c.symbol === symbol);
    const news = newsFor(symbol);
    const fng = Data.store.fng;
    const parts = [];
    parts.push('<div class="insight-h1">' + esc(I18N.t('ai.techSec')) + '</div>');
    const sep = I18N.get() === 'zh' ? '，' : ', ';
    const chgText = sum.change != null ? sep + '24h ' + (sum.change > 0 ? '+' : '') + sum.change.toFixed(2) + '%' : '';
    const rsiTxt = sum.rsi == null ? '--' : sum.rsi.toFixed(1);
    parts.push('<p>' + I18N.t('ai.insightIntro', {
      symbol, name: esc(def ? def.name : ''), price: Charts.fmtMoney(sum.price), change: chgText,
      trend: esc(sum.trend), rsi: rsiTxt, macd: esc(sum.macdState), bb: esc(sum.bollState)
    }) + '</p>');
    if (sum.atrPct != null) {
      const volKey = sum.atrPct > 3 ? 'ai.volHigh' : sum.atrPct < 1 ? 'ai.volLow' : 'ai.volMid';
      parts.push('<p>' + I18N.t('ai.insightVol', { v: sum.atrPct.toFixed(2), vol: esc(I18N.t(volKey)) }) + '</p>');
    }

    parts.push('<div class="insight-h1">' + esc(I18N.t('ai.newsSec')) + '</div>');
    if (news && news.items.length) {
      const toneKey = news.pos > news.neg ? 'ai.newsTonePos' : news.neg > news.pos ? 'ai.newsToneNeg' : 'ai.newsToneNeu';
      parts.push('<p>' + I18N.t('ai.newsSummary', { symbol, n: news.items.length, pos: news.pos, neg: news.neg, neu: news.neu, tone: esc(I18N.t(toneKey)) }) + '</p>');
      parts.push('<p>' + I18N.t('ai.headline', { title: esc(news.items[0].title) }) + '</p>');
    } else {
      parts.push('<p>' + I18N.t('ai.noNews', { symbol }) + '</p>');
    }

    parts.push('<div class="insight-h1">' + esc(I18N.t('ai.verdictSec')) + '</div>');
    let verdictKey = 'ai.verdictNeutral';
    if (sum.trend.indexOf(I18N.t('hint.trendBull')) === 0 && sum.rsi > 55 && sum.rsi < 75 && (!news || news.pos >= news.neg)) verdictKey = 'ai.verdictBull';
    else if (sum.trend.indexOf(I18N.t('hint.trendBear')) === 0 && sum.rsi < 45 && (!news || news.neg >= news.pos)) verdictKey = 'ai.verdictBear';
    else if (sum.rsi != null && sum.rsi < 30) verdictKey = 'ai.verdictOversold';
    else if (sum.rsi != null && sum.rsi > 70) verdictKey = 'ai.verdictOverbought';
    let verdict = I18N.t(verdictKey);
    if (fng) {
      const levelKey = fng.value > 60 ? 'ai.fngHigh' : fng.value < 40 ? 'ai.fngLow' : 'ai.fngMid';
      verdict += I18N.t('ai.fngSuffix', { v: fng.value, label: esc(fngLabel()), level: esc(I18N.t(levelKey)) });
    }
    parts.push('<p><strong>' + verdict + '</strong></p>');
    return parts.join('');
  }

  function generateDailyBrief() {
    const parts = [];
    const fng = Data.store.fng;
    const g = Data.store.global;
    let mcchg = '';
    if (g && g.mcChange != null) {
      const cls = g.mcChange >= 0 ? 'up' : 'down';
      mcchg = ' · 24h <span class="' + cls + '">' + fmtPct(g.mcChange) + '</span>';
    }
    const fngTxt = fng ? fng.value + ' (' + esc(fngLabel()) + ')' : '--';
    parts.push('<p>' + I18N.t('brief.marketLine', { fng: fngTxt, mc: g ? Data.fmtNum(g.totalMc, 1) : '--', mcchg, dom: g && g.btcDominance != null ? g.btcDominance.toFixed(1) + '%' : '--' }) + '</p>');

    const movers = Object.keys(Data.store.tickers).map(s => ({ s, v: Data.store.tickers[s] }))
      .filter(x => x.v && typeof x.v.change === 'number' && isFinite(x.v.change))
      .sort((a, b) => b.v.change - a.v.change);
    parts.push('<div class="brief-h1">' + esc(I18N.t('brief.moversTitle')) + '</div>');
    if (movers.length) {
      parts.push('<ul class="brief-list">');
      movers.slice(0, 3).forEach(m => parts.push('<li><strong>' + m.s + '</strong> <span class="' + (m.v.change >= 0 ? 'up' : 'down') + '">' + fmtPct(m.v.change) + '</span></li>'));
      movers.slice(-3).reverse().forEach(m => parts.push('<li><strong>' + m.s + '</strong> <span class="' + (m.v.change >= 0 ? 'up' : 'down') + '">' + fmtPct(m.v.change) + '</span></li>'));
      parts.push('</ul>');
    }

    const news = Data.store.news;
    const pos = news.filter(n => n.sentiment === 'positive').length;
    const neg = news.filter(n => n.sentiment === 'negative').length;
    const neu = news.length - pos - neg;
    parts.push('<div class="brief-h1">' + esc(I18N.t('brief.newsTitle')) + '</div>');
    const tone = pos > neg * 1.3 ? I18N.t('sent.tonePos') : neg > pos * 1.3 ? I18N.t('sent.toneNeg') : I18N.t('sent.toneNeu');
    parts.push('<p>' + I18N.t('brief.newsLine', { n: news.length, pos, neg, neu, tone: esc(tone) }) + '</p>');
    if (news.length) parts.push('<p><strong>' + esc(news[0].title) + '</strong></p>');

    const signals = Data.store.signals.filter(s => {
      const now = new Date();
      const hm = s.time.split(':');
      return now.getHours() === +hm[0] && now.getMinutes() === +hm[1];
    });
    parts.push('<div class="brief-h1">' + esc(I18N.t('brief.signalsTitle')) + '</div>');
    const highCount = signals.filter(s => s.severity === 'high').length;
    const highSuffix = signals.length ? (I18N.get() === 'zh' ? '，其中高优先级 ' + highCount + ' 条' : ', ' + highCount + ' high priority') : '';
    parts.push('<p>' + I18N.t('brief.signalsLine', { n: signals.length, high: highSuffix }) + '</p>');
    parts.push('<p><span class="muted">' + esc(I18N.t('brief.disclaimer')) + '</span></p>');
    return parts.join('');
  }

  function priceAnswer(symbol) {
    const t = Data.store.tickers[symbol];
    const def = CONFIG.coins.find(c => c.symbol === symbol);
    if (!t) return { title: symbol, html: '<p>' + esc(I18N.t('ai.chainLoading')) + '...</p>' };
    const pct = typeof t.change === 'number' && isFinite(t.change) ? fmtPct(t.change) : '--';
    return {
      title: I18N.t('ai.priceTitle', { symbol }),
      html: '<p>' + I18N.t('ai.priceHtml', {
        symbol, name: esc(def ? def.name : ''), price: Charts.fmtMoney(t.price), pct,
        high: Charts.fmtMoney(t.high), low: Charts.fmtMoney(t.low),
        vol: Data.fmtNum(t.volume, 0), quote: Data.fmtNum(t.quoteVolume, 1), source: esc(t.source || '--')
      }) + '</p>'
    };
  }

  function rsiAnswer(symbol) {
    const sum = indicatorSummary(symbol);
    if (!sum || sum.rsi == null) return { title: I18N.t('ai.rsiTitle', { symbol }), html: '<p>' + esc(I18N.t('ai.chainLoading')) + '...</p>' };
    const stateKey = sum.rsi < 30 ? 'ai.rsiStateOs' : sum.rsi > 70 ? 'ai.rsiStateOb' : 'ai.rsiStateNeu';
    const explainKey = sum.rsi < 30 ? 'ai.rsiExplain' : sum.rsi > 70 ? 'ai.rsiExplainOb' : 'ai.rsiExplainNeu';
    return {
      title: I18N.t('ai.rsiTitle', { symbol }),
      html: '<p>' + I18N.t('ai.rsiHtml', { symbol, v: sum.rsi.toFixed(1), state: esc(I18N.t(stateKey)) }) + '</p>' +
        '<p>' + esc(I18N.t(explainKey)) + '</p>'
    };
  }

  function trendAnswer(symbol) {
    const sum = indicatorSummary(symbol);
    if (!sum) return { title: I18N.t('ai.trendTitle', { symbol }), html: '<p>' + esc(I18N.t('ai.chainLoading')) + '...</p>' };
    const advKey = sum.ema12 > sum.ema26 ? 'ai.trendAdviceBull' : 'ai.trendAdviceBear';
    return {
      title: I18N.t('ai.trendTitle', { symbol }),
      html: '<p>' + I18N.t('ai.trendHtml', {
        symbol, trend: esc(sum.trend), e12: Charts.fmtMoney(sum.ema12), e26: Charts.fmtMoney(sum.ema26),
        sma: Charts.fmtMoney(sum.sma20), advice: esc(I18N.t(advKey))
      }) + '</p>'
    };
  }

  function signalsAnswer(symbol) {
    const list = Data.store.signals.filter(s => s.symbol === symbol).slice(0, 5);
    if (!list.length) return { title: I18N.t('ai.signalTitle', { symbol }), html: '<p>' + esc(I18N.t('ai.signalNone', { symbol })) + '</p>' };
    return {
      title: I18N.t('ai.signalTitle', { symbol }),
      html: '<ul>' + list.map(s => {
        const st = signalText(s);
        return '<li><strong>' + esc(st.title) + '</strong>（' + esc(st.type) + '）' + esc(st.msg) + '</li>';
      }).join('') + '</ul>'
    };
  }

  function newsAnswer(symbol) {
    const n = newsFor(symbol);
    if (!n || !n.items.length) return { title: I18N.t('ai.newsTitle', { symbol }), html: '<p>' + esc(I18N.t('ai.newsNone', { symbol })) + '</p>' };
    const sent = { positive: I18N.t('sent.positive'), negative: I18N.t('sent.negative'), neutral: I18N.t('sent.neutral') };
    return {
      title: I18N.t('ai.newsTitle', { symbol }),
      html: '<p>' + I18N.t('ai.newsList', { n: n.items.length, pos: n.pos, neg: n.neg, neu: n.neu }) + '</p>' +
        '<ul>' + n.items.slice(0, 4).map(it => '<li><strong>' + esc(it.title) + '</strong> <span class="muted">（' + esc(it.source) + ' · ' + esc(sent[it.sentiment] || '') + '）</span></li>').join('') + '</ul>'
    };
  }

  function sentimentAnswer() {
    const fng = Data.store.fng;
    const news = Data.store.news;
    const pos = news.filter(n => n.sentiment === 'positive').length;
    const neg = news.filter(n => n.sentiment === 'negative').length;
    if (!fng) return { title: I18N.t('ai.sentimentTitle'), html: '<p>' + esc(I18N.t('ai.chainLoading')) + '...</p>' };
    const advKey = fng.value >= 60 ? 'ai.fngHigh' : fng.value <= 40 ? 'ai.fngLow' : 'ai.fngMid';
    return {
      title: I18N.t('ai.sentimentTitle'),
      html: '<p>' + I18N.t('ai.sentimentHtml', { v: fng.value, label: esc(fngLabel()), n: news.length, pos, neg, neu: news.length - pos - neg, advice: esc(I18N.t(advKey)) }) + '</p>'
    };
  }

  function chainAnswer() {
    const btc = Data.store.onchain.btc;
    const fees = Data.store.onchain.fees;
    const defi = Data.store.onchain.defi || [];
    const blockTxt = btc ? I18N.t('chain.block') + ' <strong>' + Data.fmtNum(btc.blocks, 0) + '</strong> · ' + I18N.t('chain.tx') + ' <strong>' + Data.fmtNum(btc.transactions, 0) + '</strong>' : I18N.t('ai.chainLoading');
    const defiTxt = defi.length ? defi.slice(0, 3).map(d => d.name + ' <strong>' + Data.fmtNum(d.tvl, 1) + '</strong>').join(' / ') : '--';
    return {
      title: I18N.t('ai.chainTitle'),
      html: '<p>' + I18N.t('ai.chainHtml', {
        block: blockTxt,
        f: fees ? fees.fastest : '--', h: fees ? fees.half : '--', hour: fees ? fees.hour : '--', defi: defiTxt
      }) + '</p>'
    };
  }

  function marketAnswer() {
    const g = Data.store.global;
    const fng = Data.store.fng;
    const fngTxt = fng ? '<strong>' + fng.value + '</strong>（' + esc(fngLabel()) + '）' : esc(I18N.t('ai.chainLoading'));
    return {
      title: I18N.t('ai.marketTitle'),
      html: '<p>' + I18N.t('ai.marketHtml', {
        mc: g ? Data.fmtNum(g.totalMc, 1) : '--', vol: g ? Data.fmtNum(g.totalVol, 1) : '--',
        dom: g && g.btcDominance != null ? g.btcDominance.toFixed(1) + '%' : '--', fng: fngTxt
      }) + '</p>'
    };
  }

  function defAnswer(q) {
    const defs = [
      ['rsi', 'ai.def.rsi'],
      ['macd', 'ai.def.macd'],
      ['boll', 'ai.def.boll'],
      ['bandas', 'ai.def.boll'],
      ['均线', 'ai.def.ma'], ['media m', 'ai.def.ma'], ['moving average', 'ai.def.ma'],
      ['atr', 'ai.def.atr'],
      ['whale', 'ai.def.whale'], ['ballena', 'ai.def.whale'], ['巨鲸', 'ai.def.whale'],
      ['z-score', 'ai.def.zscore'], ['zscore', 'ai.def.zscore'], ['z score', 'ai.def.zscore'], ['修正z', 'ai.def.zscore']
    ];
    const hit = defs.find(d => q.includes(d[0]));
    if (!hit) return null;
    return { title: I18N.t(hit[1] + '.t'), html: '<p>' + esc(I18N.t(hit[1] + '.h')) + '</p>' };
  }

  function answer(text) {
    const q = String(text || '').trim().toLowerCase();
    if (!q) return null;

    const isDefinitionQuery = /什么是|是什么|what is|what's|qué es|que es|解释|explicar/.test(q);
    const coin = detectCoin(q);
    const def = (!coin && isDefinitionQuery) ? defAnswer(q) : null;
    if (def) return def;

    const hasPrice = /价格|现价|行情|多少钱|price|precio|cuanto vale|cotiza/.test(q);
    const hasRsi = /rsi|强弱|超买|超卖|sobrecompra|sobreventa/.test(q);
    const hasTrend = /趋势|均线|ema|macd|金叉|死叉|看多|看空|trend|tendencia|moving|media movil|media móvil/.test(q);
    const hasSignal = /信号|异动|异常|signal|señal|anomal/.test(q);
    const hasNews = /新闻|资讯|消息|news|noticia|informaci/.test(q);
    const hasSent = /情绪|恐慌|贪婪|fng|fear|sentiment|sentimiento|miedo|codicia/.test(q);
    const hasChain = /链上|gas|手续费|矿工|内存池|mempool|on.?chain|cadena|comision|comisión|minero/.test(q);
    const hasDefi = /defi|tvl|锁仓/.test(q);
    const hasMarket = /市场|大盘|整体|总市值|市值|market|mercado|capitalizaci/.test(q);
    const hasVol = /成交量|成交额|量能|volume|volumen/.test(q);

    if (hasMarket && !coin) return marketAnswer();
    if (coin) {
      if (hasPrice || hasVol) return priceAnswer(coin);
      if (hasRsi) return rsiAnswer(coin);
      if (hasTrend) return trendAnswer(coin);
      if (hasSignal) return signalsAnswer(coin);
      if (hasNews) return newsAnswer(coin);
      return { title: coin + ' · ' + I18N.t('ai.insight'), html: generateMarketInsight(coin) };
    }
    if (hasSent) return sentimentAnswer();
    if (hasChain || hasDefi) return chainAnswer();
    if (hasNews) {
      const n = Data.store.news;
      if (!n.length) return { title: I18N.t('news.title'), html: '<p>' + esc(I18N.t('ai.chainLoading')) + '...</p>' };
      return {
        title: I18N.t('news.title'),
        html: '<ul>' + n.slice(0, 5).map(it => '<li><strong>' + esc(it.title) + '</strong> <span class="muted">（' + esc(it.source) + '）</span></li>').join('') + '</ul>'
      };
    }

    const items = I18N.t('ai.suggestions').split(' | ');
    return {
      title: I18N.t('ai.helpTitle'),
      html: '<p>' + I18N.t('ai.helpHtml', {
        a: esc(items[0] || ''), b: esc(items[1] || ''), c: esc(items[2] || ''), d: esc(items[3] || ''), e: esc(items[4] || '')
      }) + '</p>'
    };
  }

  return { scoreNews, detectCoin, generateMarketInsight, generateDailyBrief, answer, signalText, esc };
})();
