import state from './state.js';
import elements from './elements.js';
import * as chart from './chart.js';
import * as notifications from './notifications.js';
import * as dataHandling from './dataHandling.js';

// 이벤트 리스너 설정 및 초기화
document.addEventListener("DOMContentLoaded", () => {
  // 초기화 코드
  notifications.initializeNotifications();
  dataHandling.fetchAllCryptoPrices();
  
  // 이벤트 리스너 설정
  elements.toggleChangeTypeBtn.addEventListener("click", toggleChangeType);
  elements.backToListBtn.addEventListener("click", showCryptoList);
  elements.dayCandleBtn.addEventListener('click', () => switchCandleChart(null));
  elements.minuteCandleBtn.addEventListener('click', () => switchCandleChart(5));
  elements.weekCandleBtn.addEventListener('click', () => switchCandleChart('week'));
  elements.monthCandleBtn.addEventListener('click', () => switchCandleChart('month'));
  elements.searchBar.addEventListener('input', filterCryptoList);
  document.getElementById("refresh-news-btn").addEventListener('click', fetchNews);
  elements.showAllBtn.addEventListener('click', () => {
      state.showOnlyFavorites = false;
      elements.showAllBtn.classList.add('active');
      elements.showFavoritesBtn.classList.remove('active');
      renderCryptoList();
});

  elements.showFavoritesBtn.addEventListener('click', () => {
      state.showOnlyFavorites = true;
      elements.showFavoritesBtn.classList.add('active');
      elements.showAllBtn.classList.remove('active');
      renderCryptoList();
  });
}); 