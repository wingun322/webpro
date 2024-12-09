// 전역 상태 객체
const state = {
  currentSort: 'name',
  sortDirection: { name: true, price: true, changeAmount: true, changeRate: true },
  showChangePrice: true,
  previousPrices: {},
  cryptoData: [],
  filteredCryptoData: [],
  priceChart: null,
  isFetching: false,
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
  alerts: JSON.parse(localStorage.getItem('alerts') || '[]'),
  showOnlyFavorites: false,
  indicators: {
    ma: false,
    rsi: false,
    macd: false
  },
  currentCandleData: null,
  currentTitle: '',
  currentUnit: 'day',
  currentMarket: null,
  currentName: null,
  priceIndicators: {
    open: true,
    high: true,
    low: true,
    close: true
  }
};

export default state; 