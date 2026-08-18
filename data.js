/* 数据层：公开接口聚合、WebSocket 推送、离线演示数据兜底 */
const Data = (() => {
  const store = {
    tickers: {},
    klines: {},
    indicators: {},
    depth: {},
    news: [],
    newsSource: null,
    fng: null,
    fngHistory: [],
    global: null,
    onchain: { btc: null, fees: null, mempool: null, defi: [], whales: [], flows: [] },
    signals: [],
    lastUpdate: null,
    status: {}
  };
  const listeners = [];
  const timers = [];
  let notifyTimer = null;

  function subscribe(fn) { listeners.push(fn); }
  function notify() {
    if (notifyTimer) return;
    notifyTimer = setTimeout(() => {
      notifyTimer = null;
      listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    }, 600);
  }

  function setActive(symbol, interval) {
    store.activeSymbol = symbol;
    if (interval) store.activeInterval = interval;
  }

  function getKeys() {
    try { return JSON.parse(localStorage.getItem(APP_STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveKeys(keys) {
    localStorage.setItem(APP_STORE_KEY, JSON.stringify(keys));
  }

  function setStatus(id, ok, label, detail) {
    store.status[id] = { ok, label, detail: detail || '' };
  }

  function fetchJson(url, timeout = 9000, opts = {}) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    const headers = Object.assign({ Accept: 'application/json' }, opts.headers || {});
    return fetch(url, Object.assign({}, opts, { headers, signal: ctrl.signal }))
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .finally(() => clearTimeout(timer));
  }

  function fmtNum(n, digits = 2) {
    if (n == null || isNaN(n)) return '--';
    if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(digits) + 'B';
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(digits) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(digits) + 'K';
    return n.toFixed(digits);
  }

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function seededRandom(seed) {
    let s = seed || 1;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const coinDef = symbol => CONFIG.coins.find(c => c.symbol === symbol);

  function demoKlines(symbol, interval) {
    const def = coinDef(symbol);
    const int = CONFIG.intervals.find(i => i.id === interval);
    const rand = seededRandom(hashSeed(symbol + interval + 'k'));
    const points = [];
    let price = def.base * (0.92 + rand() * 0.16);
    const ms = interval === '15m' ? 900000 : interval === '1h' ? 3600000 : interval === '4h' ? 14400000 : 86400000;
    const now = Date.now();
    const start = now - (int.limit - 1) * ms;
    for (let i = 0; i < int.limit; i++) {
      const drift = (rand() - 0.46) * 0.02;
      const vol = 0.008 + rand() * 0.02;
      const open = price;
      const close = Math.max(open * (1 + drift), def.base * 0.01);
      const high = Math.max(open, close) * (1 + rand() * vol);
      const low = Math.min(open, close) * (1 - rand() * vol);
      const volume = (def.base > 500 ? 200 : 20000) * (0.4 + rand() * 1.6);
      points.push([start + i * ms, open, high, low, close, volume, start + i * ms + ms, '0', 0, '0', '0', '0']);
      price = close;
    }
    return points;
  }

  function demoTickers() {
    const out = {};
    CONFIG.coins.forEach(c => {
      const rand = seededRandom(hashSeed(c.symbol + 't'));
      const change = -7 + rand() * 16;
      const price = c.base * (1 + change / 100) * (0.985 + rand() * 0.03);
      out[c.symbol] = {
        price, change, high: price * 1.02, low: price * 0.985,
        volume: (c.base > 500 ? 2e4 : 2e6) * (0.5 + rand()),
        quoteVolume: (c.base > 500 ? 1.2e9 : 4e8) * (0.5 + rand()),
        source: 'demo'
      };
    });
    return out;
  }

  function demoDepth(symbol) {
    const t = store.tickers[symbol];
    const price = t ? t.price : coinDef(symbol).base;
    const rand = seededRandom(hashSeed(symbol + 'd'));
    const bids = [], asks = [];
    for (let i = 0; i < 30; i++) {
      const pB = price * (1 - (i + 1) * 0.0004);
      const pA = price * (1 + (i + 1) * 0.0004);
      bids.push([+pB.toFixed(2), +(rand() * 3 + 0.5).toFixed(3)]);
      asks.push([+pA.toFixed(2), +(rand() * 3 + 0.5).toFixed(3)]);
    }
    return { bids, asks, price, source: 'demo' };
  }

  const DEMO_NEWS = [
    { id: 9001, source: 'Gate News', title: '比特币重返 64,000 美元，美联储 9 月维持利率不变概率升至 69%', body: '8月18日，比特币反弹至 64,000 美元上方，市场对美联储 9 月维持利率不变的定价概率升至 69%，2 年期美债收益率明显下行。', titleEn: 'Bitcoin reclaims $64,000 as Fed hold odds rise to 69% for September', titleEs: 'Bitcoin recupera los $64.000 y suben al 69% las probabilidades de que la Fed mantenga tasas en septiembre', bodyEn: 'On August 18, Bitcoin rallied above $64,000 as market pricing for the Fed holding rates steady in September climbed to 69% and two-year Treasury yields fell.', bodyEs: 'El 18 de agosto, Bitcoin subió por encima de $64.000 mientras la probabilidad de que la Fed mantenga las tasas en septiembre alcanzó el 69% y cayeron los rendimientos del bono a dos años.', published_on: Date.now() / 1000 - 3600, categories: ['BTC', 'Macro'], url: 'https://web.gate.it/zh/news/detail/the-probability-that-the-fed-will-keep-interest-rates-unchanged-in-23522743', imageurl: '', sentiment: 'positive', coins: ['BTC'] },
    { id: 9002, source: 'Blockchain News', title: '富达 FBTC 比特币 ETF 单日净流入 1.119 亿美元', body: '8月18日富达旗下 FBTC 录得 1.119 亿美元单日净流入，机构对现货比特币产品的需求持续。', titleEn: 'Fidelity FBTC Bitcoin ETF records $111.9M daily net inflow', titleEs: 'El ETF de Bitcoin FBTC de Fidelity registra entradas netas por 111,9 millones de dólares', bodyEn: "Fidelity's FBTC posted a $111.9 million net inflow on August 18, underscoring sustained institutional demand for spot Bitcoin products.", bodyEs: 'El FBTC de Fidelity registró entradas netas de 111,9 millones de dólares el 18 de agosto, reflejando una demanda institucional sostenida por los productos al contado de Bitcoin.', published_on: Date.now() / 1000 - 7200, categories: ['BTC', 'ETF'], url: 'https://blockchain.news/zh/flashnews/fidelity-111-9m-fbtc-bitcoin-etf-inflow-zh', imageurl: '', sentiment: 'positive', coins: ['BTC'] },
    { id: 9003, source: 'Gate Research', title: 'Gate 研究院：BTC 重返 64,000 美元，稳定币监管加速', body: '加密市场回暖，BTC 上涨约 2%，美国稳定币监管继续推进，Harmony 宣布大规模链上回滚计划。', titleEn: 'Gate Research: BTC reclaims $64,000 as stablecoin regulation accelerates', titleEs: 'Gate Research: BTC recupera los $64.000 mientras se acelera la regulación de stablecoins', bodyEn: 'The crypto market firmed as BTC rose about 2%, US stablecoin regulation advanced, and Harmony announced a large on-chain rollback plan.', bodyEs: 'El mercado cripto se fortaleció con BTC subiendo cerca del 2%, avanzó la regulación de stablecoins en EE.UU. y Harmony anunció un amplio plan de rollback on-chain.', published_on: Date.now() / 1000 - 10800, categories: ['BTC', 'Regulation'], url: 'https://web.gate.it/zh/research/article/gate-research-btc-reclaims-64000-stablecoin-regulation-accelerates', imageurl: '', sentiment: 'neutral', coins: ['BTC'] },
    { id: 9004, source: 'Gate News', title: '比特币突破 64K，AI 代币下跌超 3%，DeFi 上涨 1.06%', body: '8月18日比特币突破 64,000 美元，AI 叙事代币整体下跌超过 3%，DeFi 板块上涨约 1.06%，市场风格明显分化。', titleEn: 'Bitcoin tops $64K while AI tokens slide over 3% and DeFi gains 1.06%', titleEs: 'Bitcoin supera los $64K, los tokens de IA caen más de 3% y DeFi sube 1,06%', bodyEn: 'On August 18, Bitcoin cleared $64,000 while AI-narrative tokens fell more than 3% and DeFi gained about 1.06%, showing a clear sector rotation.', bodyEs: 'El 18 de agosto, Bitcoin superó los $64.000 mientras los tokens de narrativa IA cayeron más del 3% y DeFi subió cerca del 1,06%, con una clara rotación sectorial.', published_on: Date.now() / 1000 - 14400, categories: ['AI', 'DeFi'], url: 'https://www.gateweb3.net/zh-tw/news/detail/bitcoin-breaks-64k-while-ai-tokens-slide-3-on-august-18-defi-gains-106-23524061', imageurl: '', sentiment: 'neutral', coins: [] },
    { id: 9005, source: 'ChainCatcher', title: 'Solana 巨鲸沉寂逾 2 年后再次买入 47,535 枚 SOL', body: 'Lookonchain 监测显示，Solana 巨鲸 GvHYQQ 沉寂逾两年后再次买入 47,535 枚 SOL，价值约 360 万美元。', titleEn: 'Dormant Solana whale returns after two years to buy 47,535 SOL', titleEs: 'Una ballena de Solana vuelve tras dos años y compra 47.535 SOL', bodyEn: 'Lookonchain data shows Solana whale GvHYQQ bought 47,535 SOL worth about $3.6 million after more than two years of dormancy.', bodyEs: 'Los datos de Lookonchain muestran que la ballena de Solana GvHYQQ compró 47.535 SOL por unos 3,6 millones de dólares tras más de dos años de inactividad.', published_on: Date.now() / 1000 - 18000, categories: ['SOL', 'Whale'], url: 'https://www.chaincatcher.com/article/2283424', imageurl: '', sentiment: 'positive', coins: ['SOL'] },
    { id: 9006, source: 'ChainCatcher', title: '监测到约 3,905 万 USDT 转入 Coinbase', body: 'Coinglass 数据显示，8月18日监测到约 3,905 万 USDT 从未知钱包转入 Coinbase，可能为交易所带来买盘流动性。', titleEn: '$39.05M USDT moves to Coinbase', titleEs: '39,05 millones de USDT se transfieren a Coinbase', bodyEn: 'Coinglass data shows about $39.05 million in USDT moved from an unknown wallet to Coinbase on August 18, potentially adding exchange buy-side liquidity.', bodyEs: 'Los datos de Coinglass muestran que unos 39,05 millones de USDT pasaron de una billetera desconocida a Coinbase el 18 de agosto, lo que podría añadir liquidez compradora.', published_on: Date.now() / 1000 - 21600, categories: ['Stablecoin', 'Exchange'], url: 'https://www.chaincatcher.com/zh-tw/article/2283429', imageurl: '', sentiment: 'neutral', coins: [] },
    { id: 9007, source: 'BlockBeats', title: '比特币空头巨鲸自愿降杠杆后仍遭强平，亏损超 156 万美元', body: '链上分析师监测显示，一位持有 1.25 亿美元空头的巨鲸自愿减少 1200 枚 BTC 仓位后仍被强平，亏损超 156 万美元。', titleEn: 'Bitcoin short whale liquidated after voluntary deleveraging, loss exceeds $1.56M', titleEs: 'Una ballena bajista de Bitcoin es liquidada tras reducir su apalancamiento, con pérdidas de más de 1,56 millones de dólares', bodyEn: 'On-chain analysts tracked a whale holding a $125 million short who reduced by 1,200 BTC before liquidation, with losses exceeding $1.56 million.', bodyEs: 'Analistas on-chain siguieron a una ballena con un corto de 125 millones de dólares que redujo 1.200 BTC antes de ser liquidada, con pérdidas superiores a 1,56 millones.', published_on: Date.now() / 1000 - 25200, categories: ['BTC', 'Whale'], url: 'https://en.theblockbeats.news/flash/362070', imageurl: '', sentiment: 'negative', coins: ['BTC'] },
    { id: 9008, source: 'Gate Square', title: 'ETH 在 1,900 美元附近延续震荡，等待变盘', body: '8月18日 ETH 合约在 1,898-1,916 美元区间窄幅波动，市场整体处于蓄势待变状态。', titleEn: 'ETH holds a tight range near $1,900 as it awaits a breakout', titleEs: 'ETH sigue consolidando cerca de los $1.900 a la espera de una ruptura', bodyEn: 'On August 18, ETH traded in a narrow $1,898-$1,916 range, with the market coiling for a potential move.', bodyEs: 'El 18 de agosto, ETH operó en un rango estrecho de 1.898-1.916 dólares, con el mercado acumulando presión para un posible movimiento.', published_on: Date.now() / 1000 - 28800, categories: ['ETH'], url: 'https://www.gatenode.irish/zh/post/status/23524598', imageurl: '', sentiment: 'neutral', coins: ['ETH'] }
  ];

  function localizeNews(list) {
    const lang = I18N.get();
    if (lang === 'en') return list.map(n => n.titleEn ? Object.assign({}, n, { title: n.titleEn, body: n.bodyEn || n.body }) : n);
    if (lang === 'es') return list.map(n => n.titleEs ? Object.assign({}, n, { title: n.titleEs, body: n.bodyEs || n.body }) : n);
    return list.map(n => {
      const src = DEMO_NEWS.find(d => d.id === n.id);
      return src ? Object.assign({}, n, { title: src.title, body: src.body }) : n;
    });
  }

  function localizeStoreNews() {
    if (store.newsSource === 'demo' && store.news.length) store.news = localizeNews(store.news);
  }

  function demoWhales() {
    const rows = [
      { chain: 'BTC', amount: 1248.5, usd: 84_200_000, side: 'in', exchange: 'Binance', time: Date.now() - 8 * 60000 },
      { chain: 'ETH', amount: 9800, usd: 34_500_000, side: 'out', exchange: 'OKX', time: Date.now() - 34 * 60000 },
      { chain: 'BTC', amount: 860.2, usd: 58_000_000, side: 'out', exchange: 'Coinbase', time: Date.now() - 71 * 60000 },
      { chain: 'SOL', amount: 185_000, usd: 32_900_000, side: 'in', exchange: 'Bybit', time: Date.now() - 128 * 60000 },
      { chain: 'ETH', amount: 5120, usd: 18_000_000, side: 'in', exchange: 'Unknown', time: Date.now() - 190 * 60000 },
      { chain: 'BTC', amount: 430.8, usd: 29_100_000, side: 'out', exchange: 'Unknown', time: Date.now() - 260 * 60000 }
    ];
    return rows;
  }

  function demoFlows() {
    return [
      { exchange: 'Binance', net: -142.6, inflow: 386, outflow: 528.6, max: 100 },
      { exchange: 'Bybit', net: -58.3, inflow: 152, outflow: 210.3, max: 100 },
      { exchange: 'OKX', net: 36.8, inflow: 208, outflow: 171.2, max: 100 },
      { exchange: 'Coinbase', net: 22.5, inflow: 140, outflow: 117.5, max: 100 }
    ];
  }

  async function loadTickers() {
    try {
      const symbols = CONFIG.coins.map(c => c.symbol + 'USDT');
      const url = CONFIG.endpoints.binanceRest + '/api/v3/ticker/24hr?symbols=' + encodeURIComponent(JSON.stringify(symbols));
      const rows = await fetchJson(url, 8000);
      rows.forEach(r => {
        const sym = r.symbol.replace('USDT', '');
        store.tickers[sym] = {
          price: +r.lastPrice, change: +r.priceChangePercent,
          high: +r.highPrice, low: +r.lowPrice,
          volume: +r.volume, quoteVolume: +r.quoteVolume, source: 'live'
        };
      });
      setStatus('binance', true, I18N.t('status.binance'), I18N.t('status.ticker24'));
    } catch (e) {
      store.tickers = demoTickers();
      setStatus('binance', false, I18N.t('status.binance'), I18N.t('status.demo'));
    }
    notify();
  }

  async function loadKlines(symbol, interval) {
    const int = CONFIG.intervals.find(i => i.id === interval);
    const key = symbol + ':' + interval;
    try {
      const url = CONFIG.endpoints.binanceRest + '/api/v3/klines?symbol=' + symbol + 'USDT&interval=' + int.binance + '&limit=' + int.limit;
      const rows = await fetchJson(url, 9000);
      store.klines[key] = { data: rows, source: 'live' };
      setStatus('klines', true, I18N.t('status.klines'), symbol + ' ' + interval);
    } catch (e) {
      store.klines[key] = { data: demoKlines(symbol, interval), source: 'demo' };
      setStatus('klines', false, I18N.t('status.klines'), I18N.t('status.demo'));
    }
    store.indicators[key] = Indicators.buildAll(store.klines[key].data);
    notify();
  }

  async function loadDepth(symbol) {
    try {
      const url = CONFIG.endpoints.binanceRest + '/api/v3/depth?symbol=' + symbol + 'USDT&limit=40';
      const d = await fetchJson(url, 7000);
      store.depth[symbol] = {
        bids: d.bids.slice(0, 30).map(b => [+b[0], +b[1]]),
        asks: d.asks.slice(0, 30).map(a => [+a[0], +a[1]]),
        price: store.tickers[symbol] ? store.tickers[symbol].price : null,
        source: 'live'
      };
      setStatus('depth', true, I18N.t('status.depth'), symbol + ' 40');
    } catch (e) {
      store.depth[symbol] = demoDepth(symbol);
      setStatus('depth', false, I18N.t('status.depth'), I18N.t('status.demo'));
    }
    notify();
  }

  function scoreNewsItem(item) {
    if (window.AI && typeof window.AI.scoreNews === 'function') return AI.scoreNews(item);
    return { sentiment: 'neutral', score: 0, coins: [] };
  }

  async function loadNews() {
    const keys = getKeys();
    let items = [];
    try {
      const url = CONFIG.endpoints.cryptocompareNews + '?lang=EN&sortOrder=latest' + (keys.cryptoCompare ? '&api_key=' + encodeURIComponent(keys.cryptoCompare) : '');
      const data = await fetchJson(url, 10000);
      items = (data.Data || []).slice(0, 40).map(n => ({
        id: n.id, source: n.source_info ? n.source_info.name : (n.source || 'CryptoCompare'),
        title: n.title, body: n.body, categories: n.categories || [],
        published_on: n.published_on, url: n.url, imageurl: n.imageurl || '', sentiment: 'neutral', coins: []
      }));
      setStatus('news', true, I18N.t('status.news'), I18N.t('status.items', { n: items.length }));
    } catch (e) {
      setStatus('news', false, I18N.t('status.news'), I18N.t('status.demo'));
    }

    if (keys.cryptoPanic) {
      try {
        const url = CONFIG.endpoints.cryptopanic + '?auth_token=' + encodeURIComponent(keys.cryptoPanic) + '&kind=news&filter=hot&public=true&currencies=BTC,ETH,SOL,BNB,XRP,DOGE';
        const data = await fetchJson(url, 10000);
        const extra = (data.results || []).slice(0, 30).map((p, i) => ({
          id: 'cp-' + p.id + '-' + i, source: p.source ? p.source.title : 'CryptoPanic',
          title: p.title, body: p.url || '', categories: (p.currencies || []).map(c => c.code),
          published_on: new Date(p.published_at).getTime() / 1000, url: p.url, imageurl: '',
          sentiment: 'neutral', coins: (p.currencies || []).map(c => c.code)
        }));
        items = items.concat(extra);
        setStatus('cryptopanic', true, I18N.t('status.cryptopanic'), I18N.t('status.items', { n: extra.length }));
      } catch (e) {
        setStatus('cryptopanic', false, I18N.t('status.cryptopanic'), I18N.t('status.checkKey'));
      }
    }

    items.forEach(n => {
      const scored = scoreNewsItem(n);
      n.sentiment = scored.sentiment;
      n.score = scored.score;
      n.coins = scored.coins.length ? scored.coins : n.coins;
    });
    store.news = items.length ? items : localizeNews(DEMO_NEWS);
    store.newsSource = items.length ? 'api' : 'demo';
    notify();
  }

  async function loadFng() {
    try {
      const data = await fetchJson(CONFIG.endpoints.alternativeFng + '?limit=14', 8000);
      store.fng = { value: +data.data[0].value, label: data.data[0].value_classification };
      store.fngHistory = data.data.slice(0, 14).map(d => ({ value: +d.value, label: d.value_classification, time: d.timestamp * 1000 }));
      setStatus('fng', true, I18N.t('status.fng'), store.fng.value + ' / 100');
    } catch (e) {
      store.fng = { value: 54, label: 'Neutral', source: 'demo' };
      store.fngHistory = [];
      setStatus('fng', false, I18N.t('status.fng'), I18N.t('status.demo'));
    }
    notify();
  }

  async function loadGlobal() {
    try {
      const data = await fetchJson(CONFIG.endpoints.coingeckoGlobal, 9000);
      const g = data.data;
      store.global = {
        btcDominance: g.market_cap_percentage ? g.market_cap_percentage.btc : null,
        ethDominance: g.market_cap_percentage ? g.market_cap_percentage.eth : null,
        totalMc: g.total_market_cap ? g.total_market_cap.usd : null,
        totalVol: g.total_volume ? g.total_volume.usd : null,
        mcChange: g.market_cap_change_percentage_24h_usd || 0, source: 'live'
      };
      setStatus('global', true, I18N.t('status.global'), 'cap & share');
    } catch (e) {
      store.global = { btcDominance: 52.4, ethDominance: 17.8, totalMc: 2_420_000_000_000, totalVol: 86_500_000_000, mcChange: 1.2, source: 'demo' };
      setStatus('global', false, I18N.t('status.global'), I18N.t('status.demo'));
    }
    notify();
  }

  async function loadOnchain() {
    await Promise.allSettled([
      (async () => {
        try {
          const s = await fetchJson(CONFIG.endpoints.blockchainStats, 9000);
          store.onchain.btc = {
            blocks: s.blocks, transactions: s.n_tx, hashRate: s.hash_rate, minersRevenue: s.miners_revenue_usd,
            mempoolSize: s.mempool_size, tradeVolume: s.trade_volume_btc, totalBtc: s.totalbc, source: 'live'
          };
          setStatus('blockchain', true, I18N.t('status.blockchain'), 'Blockchain.info');
        } catch (e) {
          store.onchain.btc = { blocks: 858_000, transactions: 512_000, hashRate: 610_000_000_000, minersRevenue: 41_800_000, source: 'demo' };
          setStatus('blockchain', false, I18N.t('status.blockchain'), I18N.t('status.demo'));
        }
      })(),
      (async () => {
        try {
          const fees = await fetchJson(CONFIG.endpoints.mempoolFee, 8000);
          const mem = await fetchJson(CONFIG.endpoints.mempoolStats, 8000);
          store.onchain.fees = { fastest: fees.fastestFee, half: fees.halfHourFee, hour: fees.hourFee, source: 'live' };
          store.onchain.mempool = { count: mem.count, vSize: mem.vsize, totalFee: mem.total_fee, source: 'live' };
          setStatus('mempool', true, I18N.t('status.mempool'), 'Mempool.space');
        } catch (e) {
          store.onchain.fees = { fastest: 38, half: 22, hour: 12, source: 'demo' };
          store.onchain.mempool = { count: 96_000, vSize: 118_000_000, totalFee: 14.2, source: 'demo' };
          setStatus('mempool', false, I18N.t('status.mempool'), I18N.t('status.demo'));
        }
      })(),
      (async () => {
        try {
          const rows = await fetchJson(CONFIG.endpoints.defillama, 12000);
          store.onchain.defi = rows.filter(r => r.tvl > 0).sort((a, b) => b.tvl - a.tvl).slice(0, 8).map(r => ({
            name: r.name, tvl: r.tvl, change: r.change_1d != null ? r.change_1d : null
          }));
          setStatus('defillama', true, I18N.t('status.defillama'), 'TVL');
        } catch (e) {
          store.onchain.defi = [
            { name: 'Ethereum', tvl: 58_000_000_000, change: 1.8 },
            { name: 'Solana', tvl: 5_200_000_000, change: 4.6 },
            { name: 'BSC', tvl: 4_800_000_000, change: -0.6 },
            { name: 'Arbitrum', tvl: 3_900_000_000, change: 2.1 },
            { name: 'Tron', tvl: 7_800_000_000, change: 0.3 },
            { name: 'Base', tvl: 2_700_000_000, change: 5.9 }
          ];
          setStatus('defillama', false, I18N.t('status.defillama'), I18N.t('status.demo'));
        }
      })()
    ]);

    const keys = getKeys();
    try {
      if (keys.whaleAlert) {
        const url = CONFIG.endpoints.whaleAlert + '?api_key=' + encodeURIComponent(keys.whaleAlert) + '&min_value=10000000&limit=20';
        const data = await fetchJson(url, 9000);
        store.onchain.whales = (data.transactions || []).map(t => ({
          chain: (t.blockchain || 'BTC').toUpperCase().slice(0, 4),
          amount: t.amount || 0, usd: t.amount_usd || 0,
          side: t.from && t.from.owner_type === 'exchange' ? 'out' : 'in',
          exchange: (t.from && t.from.owner_type === 'exchange' ? t.from.name : (t.to && t.to.owner_type === 'exchange' ? t.to.name : 'Unknown')) || 'Unknown',
          time: new Date(t.timestamp * 1000).getTime()
        }));
        store.onchain.whalesSource = 'live';
        setStatus('whale', true, I18N.t('status.whale'), I18N.t('status.txCount', { n: store.onchain.whales.length }));
      } else {
        store.onchain.whales = demoWhales();
        store.onchain.whalesSource = 'demo';
        setStatus('whale', false, I18N.t('status.whale'), I18N.t('status.demo'));
      }
    } catch (e) {
      store.onchain.whales = demoWhales();
      store.onchain.whalesSource = 'demo';
      setStatus('whale', false, I18N.t('status.whale'), I18N.t('status.demo'));
    }

    store.onchain.flows = demoFlows();
    notify();
  }

  async function loadAllKlines() {
    const int = CONFIG.intervals.find(i => i.id === '1h');
    await Promise.allSettled(CONFIG.coins.map(async coin => {
      const key = coin.symbol + ':1h';
      try {
        const url = CONFIG.endpoints.binanceRest + '/api/v3/klines?symbol=' + coin.symbol + 'USDT&interval=' + int.binance + '&limit=100';
        const rows = await fetchJson(url, 9000);
        store.klines[key] = { data: rows, source: 'live' };
      } catch (e) {
        store.klines[key] = { data: demoKlines(coin.symbol, '1h'), source: 'demo' };
      }
      store.indicators[key] = Indicators.buildAll(store.klines[key].data);
      const closes = store.klines[key].data.map(k => +k[4]);
      if (store.tickers[coin.symbol]) store.tickers[coin.symbol].spark = closes.slice(-24);
    }));
    setStatus('klines', true, I18N.t('status.klines'), I18N.t('status.symbols1h', { n: CONFIG.coins.length }));
    notify();
  }

  function signalKey(symbol, type, direction) {
    return symbol + ':' + type + ':' + direction;
  }

  function scanSignals() {
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const newSignals = [];
    CONFIG.coins.forEach(coin => {
      const ind = store.indicators[coin.symbol + ':1h'];
      if (!ind) return;
      const i = ind.closes.length - 1;
      const l = Indicators.latest(ind, i);
      const change = store.tickers[coin.symbol] ? store.tickers[coin.symbol].change : null;
      const push = (kind, dir, severity, color, vals) => {
        const key = coin.symbol + ':' + kind + ':' + dir;
        newSignals.push({ key, symbol: coin.symbol, kind, dir, severity, time: timeStr, color, vals: vals || {} });
      };
      if (l.rsi != null) {
        if (l.rsi < 30) push('rsi', 'os', 'medium', '#2dd4bf', { v: l.rsi.toFixed(1) });
        if (l.rsi > 70) push('rsi', 'ob', 'medium', '#f4b942', { v: l.rsi.toFixed(1) });
      }
      if (l.macdHist != null && ind.macd.hist[i - 1] != null) {
        if (l.macdHist > 0 && ind.macd.hist[i - 1] <= 0) push('macd', 'bull', 'medium', '#2fbf71', { v: l.macd != null ? l.macd.toFixed(3) : '' });
        if (l.macdHist < 0 && ind.macd.hist[i - 1] >= 0) push('macd', 'bear', 'medium', '#f0546d', { v: l.macd != null ? l.macd.toFixed(3) : '' });
      }
      if (l.ema12 != null && l.ema26 != null && ind.ema12[i - 1] != null && ind.ema26[i - 1] != null) {
        const prevBull = ind.ema12[i - 1] > ind.ema26[i - 1];
        const nowBull = l.ema12 > l.ema26;
        if (!prevBull && nowBull) push('ema', 'bull', 'medium', '#2fbf71', {});
        if (prevBull && !nowBull) push('ema', 'bear', 'medium', '#f0546d', {});
      }
      if (l.bollUpper != null) {
        if (l.price > l.bollUpper) push('boll', 'up', 'high', '#2fbf71', { v: l.price });
        if (l.price < l.bollLower) push('boll', 'down', 'high', '#f0546d', { v: l.price });
      }
      if (Math.abs(l.zScore) > 3.5) push('anomaly', 'z', 'high', '#f4b942', { v: l.zScore.toFixed(2) });
      const dev = l.ewmaRet - l.ewmaVol * 2.5;
      if (Math.abs(l.ewmaRet) > l.ewmaVol * 2.5 && Math.abs(l.ewmaRet) > 0.006) push('anomaly', 'ewma', 'high', '#f4b942', { v: (dev * 100).toFixed(2) });
      if (change != null && !isNaN(change) && Math.abs(change) >= 5) {
        push('move', change > 0 ? 'up' : 'down', 'low', change > 0 ? '#2fbf71' : '#f0546d', { pct: (change > 0 ? '+' : '') + change.toFixed(2) + '%' });
      }
    });

    const existing = new Set(store.signals.map(s => s.key));
    newSignals.forEach(s => { if (!existing.has(s.key)) store.signals.unshift(s); });
    store.signals = store.signals.slice(0, 160);
    notify();
  }

  let ws = null;
  function startWebSocket() {
    try {
      const streams = CONFIG.coins.map(c => c.symbol.toLowerCase() + 'usdt@miniTicker').join('/');
      ws = new WebSocket(CONFIG.endpoints.binanceWs + '?streams=' + streams);
      ws.onmessage = ev => {
        try {
          const msg = JSON.parse(ev.data);
          const data = msg.data;
          const sym = data.s.toUpperCase().replace('USDT', '');
          const t = store.tickers[sym];
          if (t) {
            t.price = +data.c;
            const op = +data.o;
            const chg = op ? ((+data.c - op) / op) * 100 : NaN;
            if (!isNaN(chg)) t.change = chg;
            t.high = Math.max(t.high || +data.c, +data.h);
            t.low = t.low ? Math.min(t.low, +data.l) : +data.l;
            t.source = 'ws';
            if (t.spark && t.spark.length) { t.spark.push(+data.c); if (t.spark.length > 60) t.spark.shift(); }
          }
          notify();
        } catch (e) { /* ignore malformed frame */ }
      };
      ws.onerror = () => { setStatus('ws', false, I18N.t('status.ws'), I18N.t('status.unavailable')); try { ws.close(); } catch (e) {} ws = null; };
      ws.onopen = () => setStatus('ws', true, I18N.t('status.ws'), I18N.t('status.symbols', { n: CONFIG.coins.length }));
    } catch (e) {
      setStatus('ws', false, I18N.t('status.ws'), I18N.t('status.unavailable'));
    }
  }

  async function start() {
    setStatus('binance', false, I18N.t('status.binance'), I18N.t('status.connecting'));
    setStatus('klines', false, I18N.t('status.klines'), I18N.t('status.connecting'));
    setStatus('depth', false, I18N.t('status.depth'), I18N.t('status.connecting'));
    setStatus('news', false, I18N.t('status.news'), I18N.t('status.connecting'));
    setStatus('fng', false, I18N.t('status.fng'), I18N.t('status.connecting'));
    await Promise.allSettled([loadTickers(), loadFng(), loadGlobal(), loadNews(), loadOnchain()]);
    await loadAllKlines();
    await Promise.allSettled([loadKlines('BTC', '1h'), loadDepth('BTC')]);
    scanSignals();
    notify();

    startWebSocket();
    timers.push(setInterval(() => loadTickers(), 15000));
    timers.push(setInterval(() => loadDepth(store.activeSymbol || 'BTC'), 20000));
    timers.push(setInterval(() => loadKlines(store.activeSymbol || 'BTC', store.activeInterval || '1h'), 60000));
    timers.push(setInterval(() => loadNews(), 300000));
    timers.push(setInterval(() => loadOnchain(), 180000));
    timers.push(setInterval(() => loadFng(), 600000));
    timers.push(setInterval(() => loadGlobal(), 600000));
    timers.push(setInterval(() => scanSignals(), 30000));
  }

  return {
    store, subscribe, start, getKeys, saveKeys, setStatus, fetchJson, setActive,
    loadKlines, loadDepth, loadNews, loadFng, loadGlobal, loadOnchain, scanSignals, fmtNum, seededRandom, hashSeed, demoKlines, localizeStoreNews
  };
})();
