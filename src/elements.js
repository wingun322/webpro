const elements = {
  cryptoList: document.getElementById("crypto-list"),
  sortBtns: document.querySelectorAll('.sort-btn'),
  toggleChangeTypeBtn: document.getElementById('toggle-change-type'),
  backToListBtn: document.getElementById('back-to-list-btn'),
  cryptoInfoSection: document.getElementById("crypto-info-section"),
  chartSection: document.getElementById("chart-section"),
  chartTitle: document.getElementById("chart-title"),
  ctx: document.getElementById("priceChart").getContext("2d"),
  dayCandleBtn: document.getElementById('day-candle-btn'),
  minuteCandleBtn: document.getElementById('minute-candle-btn'),
  weekCandleBtn: document.getElementById('week-candle-btn'),
  monthCandleBtn: document.getElementById('month-candle-btn'),
  searchBar: document.getElementById('search-bar'),
  loadingSpinner: document.getElementById('loading-spinner'),
  showAllBtn: document.getElementById('show-all'),
  showFavoritesBtn: document.getElementById('show-favorites'),
  alertModal: document.getElementById('alert-modal'),
  alertPrice: document.getElementById('alert-price'),
  alertCondition: document.getElementById('alert-condition'),
  saveAlertBtn: document.getElementById('save-alert'),
  closeModalBtn: document.getElementById('close-modal'),
  openPriceBtn: document.getElementById('open-price-btn'),
  highPriceBtn: document.getElementById('high-price-btn'),
  lowPriceBtn: document.getElementById('low-price-btn'),
};

export default elements; 