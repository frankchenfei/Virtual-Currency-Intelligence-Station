/* 数据层：公开接口聚合、WebSocket 推送、离线演示数据兜底 */
const Data = (() => {
  const store = {
    tickers: {},
    klines: {},
    indicators: {},
    depth: {},
    news: [],
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
    { id: 9001, source: 'CoinDesk', title: '比特币现货 ETF 连续第四日净流入，机构配置需求升温', body: '多家资管机构的比特币现货 ETF 产品连续第四日录得净流入，市场对数字资产作为配置资产的态度进一步改善。', published_on: Date.now() / 1000 - 3600, categories: ['BTC', 'ETF'], url: 'https://www.coindesk.com', imageurl: '', sentiment: 'positive', coins: ['BTC'] },
    { id: 9002, source: 'The Block', title: '以太坊基金会宣布新一轮生态资助计划，Layer 2 扩容项目集中入选', body: '以太坊基金会公布新一轮资助名单，重点覆盖 Layer 2 扩容、账户抽象和开发者工具，生态活跃度回升。', published_on: Date.now() / 1000 - 7200, categories: ['ETH'], url: 'https://www.theblock.co', imageurl: '', sentiment: 'positive', coins: ['ETH'] },
    { id: 9003, source: 'CryptoSlate', title: 'Solana 网络单日交易笔数创新高，meme 与 DeFi 板块交易热度同时抬升', body: 'Solana 主网日交易笔数刷新纪录，低费率与高吞吐吸引更多零售和做市资金参与。', published_on: Date.now() / 1000 - 10800, categories: ['SOL'], url: 'https://cryptoslate.com', imageurl: '', sentiment: 'positive', coins: ['SOL'] },
    { id: 9004, source: 'Decrypt', title: '某交易所遭安全审计暴露 API 权限漏洞，涉及部分大户钱包授权', body: '安全审计报告披露某交易所 API 权限管理存在风险，提醒用户及时清理第三方授权并启用白名单。', published_on: Date.now() / 1000 - 18000, categories: ['Security'], url: 'https://decrypt.co', imageurl: '', sentiment: 'negative', coins: [] },
    { id: 9005, source: 'Cointelegraph', title: '欧洲监管机构重申 MiCA 稳定币合规要求，多家发行商调整储备披露', body: '欧洲监管机构再次强调 MiCA 框架下的稳定币储备透明要求，短期或增加发行商合规成本。', published_on: Date.now() / 1000 - 26000, categories: ['Regulation'], url: 'https://cointelegraph.com', imageurl: '', sentiment: 'negative', coins: [] },
    { id: 9006, source: 'Blockworks', title: 'BTC 减半后矿工收入结构变化，手续费占比阶段性升至 8%', body: '链上数据显示减半后矿工收入中手续费占比阶段性上升，网络活跃度保持韧性。', published_on: Date.now() / 1000 - 40000, categories: ['BTC', 'Mining'], url: 'https://blockworks.co', imageurl: '', sentiment: 'neutral', coins: ['BTC'] },
    { id: 9007, source: 'CoinGecko', title: 'AI 叙事代币板块周度资金关注度上升，与美股 AI 板块联动明显', body: 'AI 相关加密资产近一周关注度上升，市场将其视为与科技股联动的风险资产类别。', published_on: Date.now() / 1000 - 52000, categories: ['AI'], url: 'https://www.coingecko.com', imageurl: '', sentiment: 'neutral', coins: [] },
    { id: 9008, source: 'The Defiant', title: 'DeFi 总锁仓量周环比增长 3.2%，以太坊 L2 与再质押协议贡献主要增量', body: 'DeFi 总锁仓量延续增长，流动性集中在以太坊主网与 Layer 2 生态。', published_on: Date.now() / 1000 - 64000, categories: ['DeFi'], url: 'https://thedefiant.io', imageurl: '', sentiment: 'positive', coins: ['ETH'] }
  ];

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
      setStatus('binance', true, I18N.t('status.binance'), 'REST 24hr ticker');
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
      setStatus('news', true, I18N.t('status.news'), items.length + ' items');
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
        setStatus('cryptopanic', true, I18N.t('status.cryptopanic'), extra.length + ' items');
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
    store.news = items.length ? items : DEMO_NEWS;
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
        setStatus('whale', true, I18N.t('status.whale'), store.onchain.whales.length + ' tx');
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
    setStatus('klines', true, I18N.t('status.klines'), CONFIG.coins.length + ' symbols 1h');
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
      ws.onopen = () => setStatus('ws', true, I18N.t('status.ws'), CONFIG.coins.length + ' symbols');
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
    loadKlines, loadDepth, loadNews, loadFng, loadGlobal, loadOnchain, scanSignals, fmtNum, seededRandom, hashSeed, demoKlines
  };
})();
