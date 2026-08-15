/* 全局配置：币种、周期、数据源与端点 */
const CONFIG = {
  coins: [
    { symbol: 'BTC', name: 'Bitcoin', color: '#f4b942', base: 67450 },
    { symbol: 'ETH', name: 'Ethereum', color: '#7c8cf8', base: 3520 },
    { symbol: 'SOL', name: 'Solana', color: '#2dd4bf', base: 178 },
    { symbol: 'BNB', name: 'BNB', color: '#f0b90b', base: 605 },
    { symbol: 'XRP', name: 'XRP', color: '#6c8ef5', base: 0.62 },
    { symbol: 'DOGE', name: 'Dogecoin', color: '#f4b400', base: 0.168 },
    { symbol: 'ADA', name: 'Cardano', color: '#37c0a8', base: 0.46 },
    { symbol: 'AVAX', name: 'Avalanche', color: '#e45858', base: 29.5 },
    { symbol: 'LINK', name: 'Chainlink', color: '#5a8bf0', base: 14.8 },
    { symbol: 'LTC', name: 'Litecoin', color: '#b7c4d3', base: 84.2 },
    { symbol: 'DOT', name: 'Polkadot', color: '#e44d8c', base: 8.6 },
    { symbol: 'POL', name: 'Polygon', color: '#8352ff', base: 0.56 },
    { symbol: 'UNI', name: 'Uniswap', color: '#ff5d9e', base: 12.1 },
    { symbol: 'ATOM', name: 'Cosmos', color: '#6d7cff', base: 9.3 },
    { symbol: 'NEAR', name: 'NEAR Protocol', color: '#58a6ff', base: 6.9 },
    { symbol: 'APT', name: 'Aptos', color: '#6ee7b7', base: 12.4 },
    { symbol: 'ARB', name: 'Arbitrum', color: '#3d8bfd', base: 1.12 },
    { symbol: 'OP', name: 'Optimism', color: '#ff6b6b', base: 2.45 },
    { symbol: 'SUI', name: 'Sui', color: '#4da2ff', base: 1.95 },
    { symbol: 'TON', name: 'Toncoin', color: '#45aef5', base: 7.3 },
    { symbol: 'TRX', name: 'TRON', color: '#ef4444', base: 0.32 },
    { symbol: 'SHIB', name: 'Shiba Inu', color: '#ff9933', base: 0.000032 },
    { symbol: 'PEPE', name: 'Pepe', color: '#9acd32', base: 0.000019 },
    { symbol: 'BCH', name: 'Bitcoin Cash', color: '#8dc63f', base: 520 },
    { symbol: 'ETC', name: 'Ethereum Classic', color: '#4caf50', base: 32 },
    { symbol: 'FIL', name: 'Filecoin', color: '#00ab6e', base: 6.6 },
    { symbol: 'INJ', name: 'Injective', color: '#2bb8ff', base: 33 },
    { symbol: 'SEI', name: 'Sei', color: '#8e7cf3', base: 0.66 },
    { symbol: 'ICP', name: 'Internet Computer', color: '#a78bfa', base: 12.8 },
    { symbol: 'HBAR', name: 'Hedera', color: '#6f8cff', base: 0.11 }
  ],
  intervals: [
    { id: '15m', labelKey: 'interval.15m', binance: '15m', limit: 150 },
    { id: '1h', labelKey: 'interval.1h', binance: '1h', limit: 220 },
    { id: '4h', labelKey: 'interval.4h', binance: '4h', limit: 180 },
    { id: '1d', labelKey: 'interval.1d', binance: '1d', limit: 150 }
  ],
  endpoints: {
    binanceRest: 'https://data-api.binance.vision',
    binanceWs: 'wss://stream.binance.com:9443/stream',
    cryptocompareNews: 'https://min-api.cryptocompare.com/data/v2/news/',
    alternativeFng: 'https://api.alternative.me/fng/',
    defillama: 'https://api.llama.fi/v2/chains',
    mempoolFee: 'https://mempool.space/api/v1/fees/recommended',
    mempoolStats: 'https://mempool.space/api/mempool',
    blockchainStats: 'https://api.blockchain.info/stats',
    coingeckoGlobal: 'https://api.coingecko.com/api/v3/global',
    cryptopanic: 'https://cryptopanic.com/api/v1/posts/',
    whaleAlert: 'https://api.whale-alert.io/v1/transactions'
  }
};

const APP_STORE_KEY = 'cryptoIntelKeys_v1';
