import state from './state.js';
import elements from './elements.js';
import { calculateMA, calculateRSI, calculateMACD } from './indicators.js';

export function updatePriceChart(candleData, title, unit) {
    const reversedData = [...candleData].reverse();
    const labels = reversedData.map(item => formatCandleDate(item.candle_date_time_kst, unit));
    const closePrices = reversedData.map(item => item.trade_price);
    
    const datasets = [
      {
        label: '종가',
        data: closePrices,
        borderColor: 'rgba(255, 206, 86, 1)',
        tension: 0.1
      }
    ];

    if (state.priceIndicators.open) {
      datasets.push({
        label: '시가',
        data: reversedData.map(item => item.opening_price),
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      });
    }
    if (state.priceIndicators.high) {
      datasets.push({
        label: '고가',
        data: reversedData.map(item => item.high_price),
        borderColor: 'rgba(255, 99, 132, 1)',
        tension: 0.1
      });
    }
    if (state.priceIndicators.low) {
      datasets.push({
        label: '저가',
        data: reversedData.map(item => item.low_price),
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.1
      });
    }

    if (state.indicators.ma) {
      const ma5 = calculateMA(closePrices, 5);
      const ma20 = calculateMA(closePrices, 20);
      const ma60 = calculateMA(closePrices, 60);

      datasets.push(
        {
          label: 'MA5',
          data: ma5,
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          fill: false
        },
        {
          label: 'MA20',
          data: ma20,
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          fill: false
        },
        {
          label: 'MA60',
          data: ma60,
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          fill: false
        }
      );
    }

    if (state.indicators.rsi) {
      const rsiData = calculateRSI(closePrices);
      datasets.push({
        label: 'RSI',
        data: rsiData,
        borderColor: 'rgba(153, 102, 255, 1)',
        yAxisID: 'rsi'
      });
    }

    if (state.indicators.macd) {
      const macdData = calculateMACD(closePrices);
      datasets.push(
        {
          label: 'MACD',
          data: macdData.macd,
          borderColor: 'rgba(255, 159, 64, 1)',
          yAxisID: 'macd'
        },
        {
          label: 'Signal',
          data: macdData.signal,
          borderColor: 'rgba(255, 99, 132, 1)',
          yAxisID: 'macd'
        }
      );
    }

    if (state.priceChart) {
      state.priceChart.destroy();
    }

    const scales = {
      x: {
        type: 'category',
        grid: { display: true }
      },
      y: {
        position: 'right',
        grid: { display: true }
      }
    };

    if (state.indicators.rsi) {
      scales.rsi = {
        position: 'right',
        min: 0,
        max: 100,
        grid: { display: true }
      };
    }

    if (state.indicators.macd) {
      scales.macd = {
        position: 'right',
        grid: { display: true }
      };
    }

    state.priceChart = new Chart(elements.ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false
          },
          zoom: {
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: 'xy'
            },
            pan: { enabled: true }
          }
        },
         scales
      }
    });

    if (state.priceChart) {
      state.priceChart.destroy();
    }
  
    state.priceChart = new Chart(elements.ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        // 기존 옵션 유지
      }
    });
}

export function switchCandleChart(unit) {
    console.log('switchCandleChart 호출됨:', unit);  // 디버깅용
        
    // 버튼 상태 초기화
    elements.dayCandleBtn.classList.remove('active');
    elements.minuteCandleBtn.classList.remove('active');
    elements.weekCandleBtn.classList.remove('active');
    elements.monthCandleBtn.classList.remove('active');

    // 활성 버튼 설정
    switch(unit) {
        case 5:
            elements.minuteCandleBtn.classList.add('active');
            break;
        case 'week':
            elements.weekCandleBtn.classList.add('active');
            break;
        case 'month':
            elements.monthCandleBtn.classList.add('active');
            break;
        default:
            elements.dayCandleBtn.classList.add('active');
    }

    // state에서 현재 마켓 정보 확인
    if (state.currentMarket && state.currentName) {
        fetchCandleData(state.currentMarket, unit, state.currentName);
        startCandleDataInterval(state.currentMarket, unit, state.currentName);
    } else {
        console.error('마켓 정보를 찾을 수 없습니다');
    }
}

export async function fetchCandleData(market, unit, name) {
    const apiUrl = getCandleApiUrl(market, unit);
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      if (Array.isArray(data)) {
        // 상태 업데이트
        state.currentCandleData = data;
        state.currentTitle = name;
        state.currentUnit = unit;
        
        // 차트 업데이트
        updatePriceChart(data, name, unit);
        elements.chartSection.style.display = 'block';
        elements.cryptoInfoSection.style.display = 'none';
      } else {
        console.error('Unexpected data format:', data);
      }
    } catch (error) {
      console.error('Error fetching candle data:', error);
    }
} 