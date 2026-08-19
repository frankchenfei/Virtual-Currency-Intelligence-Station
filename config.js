/* 全局配置：币种、周期、数据源与端点 */
const CONFIG = {
  coins: [
    { symbol: 'BTC', name: 'Bitcoin', color: '#f4b942', base: 64396.64},
    { symbol: 'ETH', name: 'Ethereum', color: '#7c8cf8', base: 1910.61},
    { symbol: 'SOL', name: 'Solana', color: '#2dd4bf', base: 76.88},
    { symbol: 'BNB', name: 'BNB', color: '#f0b90b', base: 603},
    { symbol: 'XRP', name: 'XRP', color: '#6c8ef5', base: 0.9989},
    { symbol: 'DOGE', name: 'Dogecoin', color: '#f4b400', base: 0.06998},
    { symbol: 'ADA', name: 'Cardano', color: '#37c0a8', base: 0.1742},
    { symbol: 'AVAX', name: 'Avalanche', color: '#e45858', base: 6.355},
    { symbol: 'LINK', name: 'Chainlink', color: '#5a8bf0', base: 9.53},
    { symbol: 'LTC', name: 'Litecoin', color: '#b7c4d3', base: 44.41},
    { symbol: 'DOT', name: 'Polkadot', color: '#e44d8c', base: 0.755},
    { symbol: 'POL', name: 'Polygon', color: '#8352ff', base: 0.08266},
    { symbol: 'UNI', name: 'Uniswap', color: '#ff5d9e', base: 3.289},
    { symbol: 'ATOM', name: 'Cosmos', color: '#6d7cff', base: 1.417},
    { symbol: 'NEAR', name: 'NEAR Protocol', color: '#58a6ff', base: 1.592},
    { symbol: 'APT', name: 'Aptos', color: '#6ee7b7', base: 0.531},
    { symbol: 'ARB', name: 'Arbitrum', color: '#3d8bfd', base: 0.0757},
    { symbol: 'OP', name: 'Optimism', color: '#ff6b6b', base: 0.0817},
    { symbol: 'SUI', name: 'Sui', color: '#4da2ff', base: 0.6545},
    { symbol: 'TON', name: 'Toncoin', color: '#45aef5', base: 1.6},
    { symbol: 'TRX', name: 'TRON', color: '#ef4444', base: 0.3326},
    { symbol: 'SHIB', name: 'Shiba Inu', color: '#ff9933', base: 0.00000445},
    { symbol: 'PEPE', name: 'Pepe', color: '#9acd32', base: 0.00000259},
    { symbol: 'BCH', name: 'Bitcoin Cash', color: '#8dc63f', base: 203.4},
    { symbol: 'ETC', name: 'Ethereum Classic', color: '#4caf50', base: 6.09},
    { symbol: 'FIL', name: 'Filecoin', color: '#00ab6e', base: 0.635},
    { symbol: 'INJ', name: 'Injective', color: '#2bb8ff', base: 4.137},
    { symbol: 'SEI', name: 'Sei', color: '#8e7cf3', base: 0.03864},
    { symbol: 'ICP', name: 'Internet Computer', color: '#a78bfa', base: 2.199},
    { symbol: 'HBAR', name: 'Hedera', color: '#6f8cff', base: 0.06776},
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
