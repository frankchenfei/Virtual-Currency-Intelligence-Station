# CryptoIntel 虚拟货币情报站

一个纯前端的加密货币情报站，覆盖行情、资讯、链上、AI 分析四类情报，支持中文 / English / Español 三语切换，监控 30 个主流币种。可直接双击 `index.html` 打开，或部署到任意静态托管平台。

## 快速开始

- 直接打开 `index.html`（推荐）
- 或在本目录启动静态服务器：

```bash
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 功能模块

### 行情总览
- Binance 实时 24h 行情与 WebSocket 推送（不可用时自动降级为轮询或演示数据），覆盖 BTC/ETH/SOL/BNB/XRP/DOGE/ADA/AVAX/LINK/LTC/DOT/POL/UNI/ATOM/NEAR/APT/ARB/OP/SUI/TON/TRX/SHIB/PEPE/BCH/ETC/FIL/INJ/SEI/ICP/HBAR
- K 线图：15m / 1h / 4h / 1d，支持 MA / BOLL / VOL 叠加与悬停信息
- 订单簿深度图、恐慌贪婪指数、全局市值与 BTC/ETH 占比
- 技术指标面板：RSI、MACD、EMA、SMA、ATR、布林带
- 信号引擎：RSI 超买超卖、MACD/EMA 金叉死叉、布林突破、修正 Z-Score 与 EWMA 异常检测

### 资讯情报
- CryptoCompare 免费资讯接口聚合，支持 CryptoPanic 密钥扩展
- 本地情感词典对资讯做利好/利空/中性打分，并自动关联相关币种
- 币种与情绪筛选、AI 今日简报

### 链上洞察
- BTC 网络健康：区块高度、交易笔数、算力、矿工收入（Blockchain.info）
- 手续费与内存池（Mempool.space）
- DeFi 链上 TVL（DefiLlama）
- 巨鲸雷达：配置 Whale Alert API Key 后启用实时数据，否则展示演示数据
- 交易所资金流向面板（演示数据，生产建议接入 CryptoQuant / Glassnode）

### AI 助手
- 中英文自然语言问答：价格、RSI、趋势、信号、资讯、情绪、链上、概念解释
- AI 市场解读与信号时间线

## 上线部署

纯静态站点，无构建步骤，把本目录内容上传到任意静态托管即可。

### GitHub Pages

1. 新建仓库，上传本目录全部文件（包含 `.nojekyll`）。
2. 仓库 `Settings -> Pages -> Deploy from a branch`，选择分支和根目录。
3. 访问 `https://<用户名>.github.io/<仓库名>/`。

### Netlify

1. 打开 [app.netlify.com/drop](https://app.netlify.com/drop)，直接把本目录拖进去。
2. 或连接 Git 仓库：Build command 留空，Publish directory 填 `.`。
3. 自动启用 HTTPS。

### Vercel

1. 连接 Git 仓库导入项目，Framework Preset 选 Other 或 Static，无需构建命令。
2. 或使用 CLI：`vercel --prod`。

### Cloudflare Pages / 对象存储

- Cloudflare Pages：`wrangler pages deploy . --project-name=crypto-intel`
- 阿里云 OSS / 腾讯云 COS：开启静态网站托管，配置 CDN 与 HTTPS 证书。

### 上线注意事项

- API 密钥只保存在浏览器 localStorage，不会写进代码；公开站点上访客各自的密钥互不影响。
- 免费公开接口有频率限制，公开访问量大时建议后续加一个无服务器代理（Cloudflare Worker / Vercel Function）做缓存与聚合。
- 仓库已包含 `netlify.toml`、`vercel.json`、`_headers`，内置安全响应头与 CSP。

## 数据源与 API 配置

点右上角齿轮打开配置：

- Whale Alert API Key：启用真实巨鲸监控
- CryptoPanic API Key：启用多源实时资讯
- CryptoCompare API Key：提高资讯接口配额

所有接口均来自公开免费端点；接口不可用时自动切换到内置演示数据，保证界面可用。

## 文件结构

```text
index.html        页面骨架
favicon.svg       站点图标
css/styles.css    样式
js/i18n.js        三语核心与语言切换
js/lang-zh.js     中文语言包
js/lang-en.js     English language pack
js/lang-es.js     Español language pack
js/config.js      币种与接口配置
js/indicators.js  技术指标计算
js/data.js        数据聚合、轮询、WebSocket、演示数据
js/charts.js      SVG 图表
js/ai.js          情绪分析、简报、问答
js/app.js         应用主控与交互
netlify.toml      Netlify 部署配置
vercel.json       Vercel 部署配置
_headers          通用安全响应头
.nojekyll         GitHub Pages 部署标记
```

## 说明

本项目为情报站 MVP，情绪分析、问答与市场解读由本地规则引擎生成，不构成投资建议。后续可继续接入 LLM API、向量检索与更完整的链上数据源。
