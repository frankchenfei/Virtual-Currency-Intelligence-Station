/* 技术指标与异常检测计算库 */
const Indicators = (() => {
  function sma(values, period) {
    const out = new Array(values.length).fill(null);
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
      if (i >= period) sum -= values[i - period];
      if (i >= period - 1) out[i] = sum / period;
    }
    return out;
  }

  function ema(values, period) {
    const out = new Array(values.length).fill(null);
    const k = 2 / (period + 1);
    let prev = null;
    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) continue;
      if (prev == null) prev = values.slice(0, i + 1).reduce((a, b) => a + b, 0) / (i + 1);
      else prev = values[i] * k + prev * (1 - k);
      out[i] = prev;
    }
    return out;
  }

  function rsi(closes, period = 14) {
    const out = new Array(closes.length).fill(null);
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      const gain = Math.max(diff, 0);
      const loss = Math.max(-diff, 0);
      if (i <= period) {
        avgGain += gain;
        avgLoss += loss;
        if (i === period) {
          avgGain /= period;
          avgLoss /= period;
          out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
        }
      } else {
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
      }
    }
    return out;
  }

  function macd(closes, fast = 12, slow = 26, signal = 9) {
    const emaFast = ema(closes, fast);
    const emaSlow = ema(closes, slow);
    const line = closes.map((_, i) => (emaFast[i] != null && emaSlow[i] != null) ? emaFast[i] - emaSlow[i] : null);
    const signalLine = smaFromValid(line, signal);
    const hist = line.map((v, i) => (v != null && signalLine[i] != null ? v - signalLine[i] : null));
    return { line, signal: signalLine, hist };
  }

  function smaFromValid(values, period) {
    const out = new Array(values.length).fill(null);
    let count = 0, sum = 0;
    for (let i = 0; i < values.length; i++) {
      if (values[i] == null) continue;
      sum += values[i];
      count++;
      if (count > period) {
        const removed = values[i - period];
        if (removed != null) { sum -= removed; count--; }
      }
      if (count >= period) out[i] = sum / period;
    }
    return out;
  }

  function bollinger(closes, period = 20, mult = 2) {
    const mid = sma(closes, period);
    const upper = new Array(closes.length).fill(null);
    const lower = new Array(closes.length).fill(null);
    for (let i = period - 1; i < closes.length; i++) {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = mid[i];
      const variance = slice.reduce((a, v) => a + (v - mean) ** 2, 0) / period;
      const sd = Math.sqrt(variance);
      upper[i] = mean + mult * sd;
      lower[i] = mean - mult * sd;
    }
    return { mid, upper, lower };
  }

  function atr(klines, period = 14) {
    const out = new Array(klines.length).fill(null);
    const trs = [];
    for (let i = 0; i < klines.length; i++) {
      const h = klines[i][2], l = klines[i][3], c = klines[i][4];
      const prevClose = i > 0 ? klines[i - 1][4] : c;
      trs.push(Math.max(h - l, Math.abs(h - prevClose), Math.abs(l - prevClose)));
    }
    let sum = 0;
    for (let i = 0; i < trs.length; i++) {
      sum += trs[i];
      if (i >= period) sum -= trs[i - period];
      if (i >= period - 1) out[i] = sum / period;
    }
    return out;
  }

  function modifiedZScore(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const devs = values.map(v => Math.abs(v - median)).sort((a, b) => a - b);
    const mad = devs[Math.floor(devs.length / 2)] || 1e-9;
    return values.map(v => (0.6745 * (v - median)) / mad);
  }

  function ewma(values, alpha = 0.3) {
    const out = [];
    let prev = values[0];
    for (let i = 0; i < values.length; i++) {
      if (i === 0) prev = values[0];
      else prev = alpha * values[i] + (1 - alpha) * prev;
      out.push(prev);
    }
    return out;
  }

  function buildAll(klines) {
    const closes = klines.map(k => +k[4]);
    const returns = closes.map((c, i) => (i > 0 ? (c - closes[i - 1]) / closes[i - 1] : 0));
    return {
      closes,
      highs: klines.map(k => +k[2]),
      lows: klines.map(k => +k[3]),
      vols: klines.map(k => +k[5]),
      sma20: sma(closes, 20),
      sma50: sma(closes, 50),
      ema12: ema(closes, 12),
      ema26: ema(closes, 26),
      rsi: rsi(closes, 14),
      macd: macd(closes),
      boll: bollinger(closes),
      atr: atr(klines),
      zScore: modifiedZScore(returns),
      ewmaRet: ewma(returns, 0.2),
      ewmaVol: ewma(returns.map(r => Math.abs(r)), 0.2)
    };
  }

  function latest(obj, i) {
    return {
      price: obj.closes[i],
      sma20: obj.sma20[i],
      sma50: obj.sma50[i],
      ema12: obj.ema12[i],
      ema26: obj.ema26[i],
      rsi: obj.rsi[i],
      macd: obj.macd.line[i],
      macdSignal: obj.macd.signal[i],
      macdHist: obj.macd.hist[i],
      bollUpper: obj.boll.upper[i],
      bollMid: obj.boll.mid[i],
      bollLower: obj.boll.lower[i],
      atr: obj.atr[i],
      zScore: obj.zScore[i],
      ewmaRet: obj.ewmaRet[i]
    };
  }

  return { sma, ema, rsi, macd, bollinger, atr, modifiedZScore, ewma, buildAll, latest };
})();
