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
    { id: 9001, source: 'ChainCatcher', title: '美联储加息后比特币震荡企稳，周内跌近 4%', body: '美联储宣布加息后，BTC 在决议公布后一小时一度跌至 75,355 美元，随后回升至约 76,180 美元。', titleEn: 'Bitcoin stabilizes after Fed rate hike, down nearly 4% this week', titleEs: 'Bitcoin se estabiliza tras la subida de tipos de la Fed, cerca de un 4% abajo en la semana', bodyEn: 'After the Fed rate decision, BTC briefly dropped to $75,355 within an hour before rebounding to about $76,180.', bodyEs: 'Tras la decisión de la Fed, BTC cayó brevemente a $75.355 en una hora antes de rebotar a unos $76.180.', published_on: Date.now() / 1000 - 3600, categories: ['BTC', 'Fed'], topic: 'market', url: 'https://www.chaincatcher.com/article/2290342', imageurl: '', sentiment: 'neutral', coins: ['BTC'] },
    { id: 9002, source: 'Digital Today', title: '美国 Clarity 法案闯关失败，比特币回落至 7.6 万美元区间', body: '《数字资产市场清晰法案》未能在参议院通过终止辩论表决，BTC 承压回落至 76,000 美元附近。', titleEn: 'US Clarity bill fails, bitcoin slips back to the $76,000 range', titleEs: 'Fracasa el proyecto Clarity de EE.UU. y bitcoin retrocede al rango de $76.000', bodyEn: 'The Digital Asset Market Clarity Act failed a Senate cloture vote, pressuring BTC back toward the $76,000 area.', bodyEs: 'La Ley de Claridad del Mercado de Activos Digitales no superó la votación de cierre en el Senado, presionando a BTC de vuelta hacia los $76.000.', published_on: Date.now() / 1000 - 7200, categories: ['Regulation', 'Policy'], topic: 'policy', url: 'https://www.digitaltoday.co.kr/cn/view/104439/clarity-bill-fails-reigniting-digital-asset-tax-controversy', imageurl: '', sentiment: 'negative', coins: ['BTC'] },
    { id: 9003, source: 'TokenPost', title: '过去 24 小时加密杠杆头寸清算约 2.6173 亿美元', body: '加密市场杠杆清算约 2.6173 亿美元，其中空单占比约 54.46%，BTC、ETH 波动较为温和。', titleEn: 'About $261.73M in crypto leverage liquidated in 24 hours', titleEs: 'Unos $261,73 millones en posiciones apalancadas liquidadas en 24 horas', bodyEn: 'Roughly $261.73 million in crypto leveraged positions were liquidated over 24 hours, with shorts accounting for about 54.46%.', bodyEs: 'Se liquidaron cerca de $261,73 millones en posiciones apalancadas en 24 horas, con las posiciones cortas representando cerca del 54,46%.', published_on: Date.now() / 1000 - 10800, categories: ['Market', 'Liquidation'], topic: 'market', url: 'http://tw.tokenpost.com/news/blockchain/45750', imageurl: '', sentiment: 'negative', coins: ['BTC','ETH'] },
    { id: 9004, source: 'Digital Today', title: 'Solana 启用 V1 交易格式，单笔交易数据上限升至 4096 字节', body: 'Solana 主网已启用 V1 交易格式，单笔交易数据上限提高至 4096 字节，较此前扩大逾 3 倍。', titleEn: 'Solana enables Transaction V1, raising transaction data limit to 4,096 bytes', titleEs: 'Solana activa Transaction V1 y eleva el límite de datos por transacción a 4.096 bytes', bodyEn: 'Solana mainnet activated the V1 transaction format, raising the maximum transaction data size to 4,096 bytes, more than tripling the previous limit.', bodyEs: 'La red principal de Solana activó el formato de transacción V1, elevando el tamaño máximo de datos por transacción a 4.096 bytes, más del triple del límite anterior.', published_on: Date.now() / 1000 - 14400, categories: ['SOL', 'Upgrade'], topic: 'tech', url: 'https://www.digitaltoday.co.kr/cn/view/104549/solana-triples-transaction-data-capacity-upgrades-performance-amid-record-network-activity', imageurl: '', sentiment: 'positive', coins: ['SOL'] },
    { id: 9005, source: 'Digital Today', title: 'CFTC 主席称将直接推进加密监管框架', body: '在 Clarity 法案闯关失败后，CFTC 主席 Michael Selik 表示将利用现有参议院授权直接推进加密货币监管框架。', titleEn: 'CFTC chief says he will push crypto regulation directly', titleEs: 'El jefe de la CFTC dice que impulsará directamente la regulación cripto', bodyEn: 'After the Clarity bill failed, CFTC Chair Michael Selik said he will directly pursue a crypto regulatory framework using existing Senate authority.', bodyEs: 'Tras el fracaso del proyecto Clarity, el presidente de la CFTC Michael Selik dijo que impulsará directamente un marco regulatorio cripto usando la autoridad existente del Senado.', published_on: Date.now() / 1000 - 18000, categories: ['Regulation', 'CFTC'], topic: 'policy', url: 'https://www.digitaltoday.co.kr/en/view/104457/us-cftc-chief-says-he-will-push-crypto-regulation-directly', imageurl: '', sentiment: 'neutral', coins: [] },
    { id: 9006, source: 'CoinTelegraph', title: '比特币重新站上 76,000 美元，市场情绪逐步修复', body: 'BTC 从美联储决议后的低点回升至约 76,180 美元，SOL 涨至约 99.01 美元，市场风险偏好有所修复。', titleEn: 'Bitcoin climbs back above $76,000 as risk appetite recovers', titleEs: 'Bitcoin vuelve por encima de $76.000 mientras se recupera el apetito de riesgo', bodyEn: 'BTC recovered from its post-Fed low to around $76,180, while SOL rose to about $99.01 as risk appetite improved.', bodyEs: 'BTC se recuperó desde el mínimo posterior a la Fed hasta unos $76.180, mientras SOL subía a cerca de $99,01 a medida que mejoraba el apetito de riesgo.', published_on: Date.now() / 1000 - 21600, categories: ['BTC', 'SOL'], topic: 'market', url: 'https://cointelegraph-cn.com/flash-news/24324412', imageurl: '', sentiment: 'positive', coins: ['BTC','SOL'] },
    { id: 9007, source: 'TokenPost', title: 'ETH 回升至 2,420 美元附近，24 小时上涨约 0.90%', body: 'ETH 从约 2,369 美元低点反弹至 2,420 美元附近，日内上涨约 0.90%，短线情绪有所企稳。', titleEn: 'ETH rebounds to near $2,420, up about 0.90% in 24 hours', titleEs: 'ETH rebota hasta cerca de $2.420, subiendo cerca de un 0,90% en 24 horas', bodyEn: 'ETH bounced from a low near $2,369 to about $2,420, gaining roughly 0.90% on the day as sentiment stabilized.', bodyEs: 'ETH rebotó desde un mínimo cerca de $2.369 hasta unos $2.420, subiendo cerca del 0,90% en el día a medida que se estabilizaba la confianza.', published_on: Date.now() / 1000 - 25200, categories: ['ETH', 'Market'], topic: 'market', url: 'http://tw.tokenpost.com/news/blockchain/45754', imageurl: '', sentiment: 'positive', coins: ['ETH'] },
    { id: 9008, source: 'ChainCatcher', title: 'Coinbase Wallet 上线 Pulse 模式', body: 'Brian Armstrong 在 X 平台表示 Coinbase Wallet 已上线 Pulse 模式，用户可下载应用体验新交易界面。', titleEn: 'Coinbase Wallet launches Pulse mode', titleEs: 'Coinbase Wallet lanza el modo Pulse', bodyEn: 'Brian Armstrong said on X that Coinbase Wallet has launched Pulse mode, letting users download the app to try the new trading interface.', bodyEs: 'Brian Armstrong dijo en X que Coinbase Wallet lanzó el modo Pulse, permitiendo a los usuarios descargar la app para probar la nueva interfaz de trading.', published_on: Date.now() / 1000 - 28800, categories: ['Wallet', 'Coinbase'], topic: 'wallet', url: 'https://www.chaincatcher.com/article/2289311', imageurl: '', sentiment: 'positive', coins: ['ETH'] },
    { id: 9009, source: 'Particle News', title: 'Rabby Wallet 提醒用户防范 App Store 假冒应用', body: '近期出现名为“Rabby Wallet & Crypto Solution”的假冒应用，相关仿冒钱包已造成约 160 万美元资金损失。', titleEn: 'Rabby Wallet warns users about fake App Store app', titleEs: 'Rabby Wallet advierte sobre una aplicación falsa en la App Store', bodyEn: 'A fake app called "Rabby Wallet & Crypto Solution" appeared on the App Store, and related cloned wallets have been linked to roughly $1.6 million in stolen funds.', bodyEs: 'Una aplicación falsa llamada "Rabby Wallet & Crypto Solution" apareció en la App Store y se ha vinculado a cerca de 1,6 millones de dólares en fondos robados.', published_on: Date.now() / 1000 - 32400, categories: ['Wallet', 'Security'], topic: 'wallet', url: 'https://particle.news/story/defillama-forces-apple-to-remove-fake-app-after-staged-wallet-drain', imageurl: '', sentiment: 'negative', coins: [] },
    { id: 9010, source: 'BlockBeats', title: 'MetaMask 推出 AI Agent Wallet，支持链上自动交易', body: 'MetaMask 正式推出 Agent Wallet，AI 代理可在用户设定的限额内自主执行链上交易，并支持 Claude Code、Codex 等框架。', titleEn: 'MetaMask launches AI Agent Wallet for autonomous on-chain trading', titleEs: 'MetaMask lanza Agent Wallet para operaciones autónomas on-chain', bodyEn: 'MetaMask launched Agent Wallet, letting AI agents execute on-chain trades within user-defined limits and connect to frameworks such as Claude Code and Codex.', bodyEs: 'MetaMask lanzó Agent Wallet, que permite a los agentes de IA ejecutar operaciones on-chain dentro de límites definidos y conectar marcos como Claude Code y Codex.', published_on: Date.now() / 1000 - 36000, categories: ['Wallet', 'AI'], topic: 'wallet', url: 'https://en.theblockbeats.news/flash/360235', imageurl: '', sentiment: 'positive', coins: ['ETH'] },
    { id: 9011, source: 'BlockBeats', title: 'Coinbase Wallet 内部测试社交与 AI 功能', body: 'Coinbase 正在测试新版钱包，将社交发现、AI 和 Mini App 整合为一体化平台。', titleEn: 'Coinbase Wallet tests social, AI and Mini App integration', titleEs: 'Coinbase Wallet prueba la integración social, IA y Mini Apps', bodyEn: 'Coinbase is testing a new wallet version that builds an integrated platform across social discovery, AI and Mini Apps.', bodyEs: 'Coinbase está probando una nueva versión de wallet que integra descubrimiento social, IA y Mini Apps.', published_on: Date.now() / 1000 - 39600, categories: ['Wallet', 'AI'], topic: 'wallet', url: 'https://en.theblockbeats.news/flash/302586', imageurl: '', sentiment: 'neutral', coins: ['ETH'] },
    { id: 9012, source: 'Foresight News', title: 'Trust Wallet 将优化“隐藏垃圾币”功能入口', body: 'CZ 改变此前判断，认为隐藏代币是实用功能；Trust Wallet 团队表示将很快优化该功能入口。', titleEn: 'Trust Wallet to improve hidden token feature entry', titleEs: 'Trust Wallet mejorará el acceso a la función de ocultar tokens', bodyEn: 'CZ changed his earlier view, saying hiding tokens is useful; Trust Wallet said it will optimize the feature entry soon.', bodyEs: 'CZ cambió su opinión anterior y dijo que ocultar tokens es útil; Trust Wallet afirmó que optimizará pronto el acceso a esa función.', published_on: Date.now() / 1000 - 43200, categories: ['Wallet'], topic: 'wallet', url: 'https://foresightnews.pro/news/detail/110994', imageurl: '', sentiment: 'neutral', coins: ['BNB'] },
    { id: 9013, source: 'Cointelegraph', title: '欧盟 MiCA 稳定币规则进入执行阶段', body: '欧洲监管继续推进 MiCA 稳定币储备透明与发行合规要求，多家发行商调整储备披露与运营安排。', titleEn: 'EU MiCA stablecoin rules enter implementation phase', titleEs: 'Las reglas MiCA para stablecoins entran en fase de implementación', bodyEn: 'European regulators are advancing MiCA reserve transparency and issuance compliance, with several issuers adjusting disclosures and operations.', bodyEs: 'Los reguladores europeos avanzan en la transparencia de reservas y el cumplimiento de emisión bajo MiCA; varios emisores ajustan divulgaciones y operaciones.', published_on: Date.now() / 1000 - 46800, categories: ['Regulation', 'Stablecoin'], topic: 'policy', url: 'https://www.cointelegraph.com', imageurl: '', sentiment: 'neutral', coins: [] },
    { id: 9014, source: 'Gate News', title: '以太坊基金会审核 66 项 Hegotá 升级提案', body: '以太坊网络路线图聚焦 L2 扩容、账户抽象与开发者工具，66 项 Hegotá 提案进入审核阶段。', titleEn: 'Ethereum Foundation reviews 66 Hegotá upgrade proposals', titleEs: 'La Fundación Ethereum revisa 66 propuestas de actualización Hegotá', bodyEn: 'Ethereum roadmap work is focused on L2 scaling, account abstraction and developer tools, with 66 Hegotá proposals under review.', bodyEs: 'La hoja de ruta de Ethereum se centra en escalado L2, abstracción de cuentas y herramientas para desarrolladores, con 66 propuestas Hegotá en revisión.', published_on: Date.now() / 1000 - 50400, categories: ['ETH', 'Upgrade'], topic: 'tech', url: 'https://www.gatenode.irish/zh/news/detail/gate-daily-report-august-17-curiosity-driven-viewing-of-the-bull-is-coming-23501912', imageurl: '', sentiment: 'positive', coins: ['ETH'] },
    { id: 9015, source: 'ChainCatcher', title: '美国稳定币监管法案推进，市场关注合规标准', body: '美国立法机构继续推进稳定币监管法案，若通过将强化储备、赎回和信息披露要求。', titleEn: 'US stablecoin regulation advances as markets watch compliance standards', titleEs: 'Avanza la regulación de stablecoins en EE.UU. mientras el mercado observa los estándares de cumplimiento', bodyEn: 'US lawmakers are advancing stablecoin legislation that would strengthen reserve, redemption and disclosure requirements if passed.', bodyEs: 'Los legisladores de EE.UU. avanzan en una ley de stablecoins que reforzaría reservas, reembolsos y divulgaciones si se aprueba.', published_on: Date.now() / 1000 - 54000, categories: ['Regulation', 'Stablecoin'], topic: 'policy', url: 'https://www.chaincatcher.com/article/2283190', imageurl: '', sentiment: 'neutral', coins: [] },
    { id: 9016, source: 'Bitcoin Magazine', title: '比特币生态讨论 OP_CAT 与 Layer 2 扩容提案', body: '开发者社区持续讨论 OP_CAT、比特币 Layer 2 与可编程性升级，若激活可能增强链上应用能力。', titleEn: 'Bitcoin community debates OP_CAT and Layer 2 scaling', titleEs: 'La comunidad de Bitcoin debate OP_CAT y el escalado de Layer 2', bodyEn: 'Developers are discussing OP_CAT, Bitcoin Layer 2 and programmability upgrades, which could expand on-chain application capabilities if activated.', bodyEs: 'Los desarrolladores debaten OP_CAT, Layer 2 de Bitcoin y mejoras de programabilidad que podrían ampliar las aplicaciones on-chain si se activan.', published_on: Date.now() / 1000 - 57600, categories: ['BTC', 'Upgrade'], topic: 'tech', url: 'https://bitcoinmagazine.com', imageurl: '', sentiment: 'positive', coins: ['BTC'] }
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
