export function calculateMA(prices, period) {
    const ma = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        ma.push(null);
        continue;
      }
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      ma.push(sum / period);
    }
    return ma;
}

export function calculateRSI(prices, period = 14) {
    const changes = prices.map((price, i) => 
        i === 0 ? 0 : price - prices[i - 1]
      );
      
      let gains = changes.map(change => change > 0 ? change : 0);
      let losses = changes.map(change => change < 0 ? -change : 0);
      
      const rsi = [];
      let avgGain = gains.slice(0, period).reduce((a, b) => a + b) / period;
      let avgLoss = losses.slice(0, period).reduce((a, b) => a + b) / period;
      
      for (let i = period; i < prices.length; i++) {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
        
        avgGain = (avgGain * (period - 1) + gains[i]) / period;
        avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      }
      
      return Array(period).fill(null).concat(rsi);
}

export function calculateMACD(prices) {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macd = ema12.map((v, i) => v - ema26[i]);
    const signal = calculateEMA(macd, 9);
    
    return {
      macd,
      signal,
      histogram: macd.map((v, i) => v - signal[i])
    };
}