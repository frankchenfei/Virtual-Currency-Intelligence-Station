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
    { id: 9001, source: 'Vietnam.vn', title: '比特币逼近 65,000 美元，韩国封禁 Polymarket', body: '8月19日亚洲时段，BTC 一度逼近 65,000 美元，目前约 64,568 美元；韩国监管以赌博风险为由封锁 Polymarket。', titleEn: 'Bitcoin nears $65,000 as South Korea blocks Polymarket', titleEs: 'Bitcoin se acerca a los $65.000 mientras Corea del Sur bloquea Polymarket', bodyEn: 'On August 19, BTC approached $65,000 during the Asian session and traded near $64,568, while South Korean regulators blocked Polymarket over gambling concerns.', bodyEs: 'El 19 de agosto, BTC se acercó a los $65.000 durante la sesión asiática y cotizó cerca de $64.568, mientras los reguladores de Corea del Sur bloquearon Polymarket por preocupaciones de juego.', published_on: Date.now() / 1000 - 3600, categories: ['BTC', 'Regulation'], topic: 'policy', url: 'https://www.vietnam.vn/en/gia-bitcoin-hom-nay-19-8-2026-han-quoc-chan-polymarket-vi-lo-ngai-co-bac', imageurl: '', sentiment: 'neutral', coins: ['BTC'] },
    { id: 9002, source: 'Blockchain News', title: '富达 FBTC 录得 2,390 万美元比特币 ETF 流入', body: '8月19日，富达 FBTC 录得 2,390 万美元净流入，BTC 报约 64,534 美元，EMA50 支撑位于 63,853 美元，MACD 呈金叉。', titleEn: 'Fidelity FBTC logs $23.9M Bitcoin ETF inflow', titleEs: 'El FBTC de Fidelity registra entradas de 23,9 millones de dólares', bodyEn: 'On August 19, Fidelity FBTC recorded a $23.9 million net inflow; BTC traded near $64,535 with EMA50 support at $63,854 and a bullish MACD cross.', bodyEs: 'El 19 de agosto, el FBTC de Fidelity registró entradas netas de 23,9 millones de dólares; BTC cotizó cerca de $64.535 con soporte en EMA50 en $63.854 y cruce alcista de MACD.', published_on: Date.now() / 1000 - 7200, categories: ['BTC', 'ETF'], topic: 'market', url: 'https://blockchain.news/zh/flashnews/fidelity-fbtc-logs-23-9-million-bitcoin-etf-flow-zh', imageurl: '', sentiment: 'positive', coins: ['BTC'] },
    { id: 9003, source: 'Foresight News', title: '美 SEC 提出新加密货币发行规则，包含两项融资豁免和一项安全港条款', body: '美国 SEC 提出新的加密资产发行规则，拟包含两项融资豁免和一项安全港条款，市场关注合规路径进一步清晰。', titleEn: 'SEC proposes new crypto issuance rules with two funding exemptions and a safe harbor', titleEs: 'La SEC propone nuevas reglas de emisión cripto con dos exenciones de financiación y un puerto seguro', bodyEn: 'The US SEC proposed new rules for crypto asset issuance, including two funding exemptions and a safe harbor, which markets see as a clearer compliance path.', bodyEs: 'La SEC de EE.UU. propuso nuevas reglas de emisión de criptoactivos, incluida dos exenciones de financiación y un puerto seguro, lo que el mercado ve como un camino de cumplimiento más claro.', published_on: Date.now() / 1000 - 10800, categories: ['Regulation'], topic: 'policy', url: 'https://foresightnews.pro/news/detail/111127', imageurl: '', sentiment: 'neutral', coins: [] },
    { id: 9004, source: 'Foresight News', title: 'Solana 将于 Epoch 1020 首次缩短区块时间至 350 毫秒', body: 'Solana 核心开发者宣布，主网已激活首次 Slot 时间缩减，区块生成时间从约 400 毫秒降至 350 毫秒，预计 Epoch 1020 正式生效。', titleEn: 'Solana cuts slot time to 350ms at Epoch 1020', titleEs: 'Solana reduce el tiempo de slot a 350 ms en Epoch 1020', bodyEn: 'Solana developers activated the first slot-time reduction on mainnet, lowering block generation from about 400ms to 350ms at Epoch 1020.', bodyEs: 'Los desarrolladores de Solana activaron la primera reducción de tiempo de slot en mainnet, bajando la generación de bloques de unos 400 ms a 350 ms en Epoch 1020.', published_on: Date.now() / 1000 - 14400, categories: ['SOL', 'Upgrade'], topic: 'tech', url: 'https://foresightnews.pro/news/detail/111125', imageurl: '', sentiment: 'positive', coins: ['SOL'] },
    { id: 9005, source: 'ChainCatcher', title: '美国 SOL 现货 ETF 单日总净流入 158.43 万美元', body: 'SoSoValue 数据显示，美国 SOL 现货 ETF 单日净流入 158.43 万美元，历史总净流入达 9.02 亿美元。', titleEn: 'US SOL spot ETFs post $1.58M daily net inflow', titleEs: 'Los ETF al contado de SOL en EE.UU. registran entradas netas de 1,58 millones de dólares', bodyEn: 'SoSoValue data shows US SOL spot ETFs took in $1.58M net on the day, lifting cumulative inflows to $902M.', bodyEs: 'Los datos de SoSoValue muestran que los ETF al contado de SOL en EE.UU. sumaron 1,58 millones de dólares netos, elevando las entradas acumuladas a 902 millones.', published_on: Date.now() / 1000 - 18000, categories: ['SOL', 'ETF'], topic: 'market', url: 'https://www.chaincatcher.com/article/2283630', imageurl: '', sentiment: 'positive', coins: ['SOL'] },
    { id: 9006, source: 'Foresight News', title: 'Maya Protocol 遭安全漏洞攻击，损失约 170 万美元资产', body: 'Foresight News 消息，Maya Protocol 遭遇安全漏洞攻击，初步估计损失约 170 万美元资产，团队正在评估影响。', titleEn: 'Maya Protocol suffers security exploit, losing about $1.7M', titleEs: 'Maya Protocol sufre un exploit de seguridad y pierde unos 1,7 millones de dólares', bodyEn: 'Foresight News reports Maya Protocol was hit by a security exploit, with estimated losses of about $1.7 million; the team is assessing the impact.', bodyEs: 'Foresight News informa que Maya Protocol sufrió un exploit de seguridad con pérdidas estimadas de unos 1,7 millones de dólares; el equipo evalúa el impacto.', published_on: Date.now() / 1000 - 21600, categories: ['Security'], topic: 'tech', url: 'https://foresightnews.pro/news/detail/111127', imageurl: '', sentiment: 'negative', coins: [] },
    { id: 9007, source: 'Wu Blockchain', title: '花旗推出 Custody+ 托管平台，首批支持 BTC', body: '花旗宣布推出 Custody+ 数字资产托管平台，计划今年晚些时候上线，首批支持比特币等资产。', titleEn: 'Citi launches Custody+ platform with Bitcoin among first assets', titleEs: 'Citi lanza la plataforma Custody+ con Bitcoin entre sus primeros activos', bodyEn: 'Citi announced Custody+, a digital asset custody platform launching later this year with Bitcoin among the first supported assets.', bodyEs: 'Citi anunció Custody+, una plataforma de custodia de activos digitales que se lanzará este año con Bitcoin entre los primeros activos.', published_on: Date.now() / 1000 - 25200, categories: ['BTC', 'Institutional'], topic: 'wallet', url: 'https://www.sohu.com/a/1064571369_122014422', imageurl: '', sentiment: 'positive', coins: ['BTC'] },
    { id: 9008, source: 'Gate Square', title: 'ETH 在 1,900 美元附近震荡，多空筹码重新洗牌', body: '8月19日 ETH 围绕 1,900 美元反复震荡，市场多空筹码重新洗牌，短线方向仍待确认。', titleEn: 'ETH chops near $1,900 as bulls and bears reshuffle', titleEs: 'ETH oscila cerca de los $1.900 mientras se reacomodan largos y cortos', bodyEn: 'On August 19, ETH traded around $1,900 in a choppy range as positioning reshuffled, with short-term direction still unconfirmed.', bodyEs: 'El 19 de agosto, ETH operó alrededor de $1.900 con oscilaciones mientras se reacomodaban las posiciones; la dirección a corto plazo sigue sin confirmarse.', published_on: Date.now() / 1000 - 28800, categories: ['ETH'], topic: 'market', url: 'https://www.gateweb3.net/zh-tw/post/status/23540134', imageurl: '', sentiment: 'neutral', coins: ['ETH'] },
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
