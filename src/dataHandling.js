import state from './state.js';
import elements from './elements.js';

export function renderCryptoList() {
    elements.cryptoList.innerHTML = "";
    let dataToRender = state.filteredCryptoData.length > 0 ? state.filteredCryptoData : state.cryptoData;
    
    if (state.showOnlyFavorites) {
        dataToRender = dataToRender.filter(crypto => state.favorites.includes(crypto.market));
    }
    
    dataToRender.forEach(crypto => {
        const listItem = document.createElement("li");
        const isFavorite = state.favorites.includes(crypto.market);
        
        listItem.innerHTML = `
            <div class="crypto-item">
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-market="${crypto.market}">
                    ${isFavorite ? '★' : '☆'}
                </button>
                <span class="crypto-name">${crypto.koreanName}</span>
                <span class="crypto-price" style="color:${crypto.priceColor}">
                    ₩${crypto.tradePrice.toLocaleString()} 
                    (${state.showChangePrice ? 
                        (crypto.signedChangePrice ? `${crypto.signedChangePrice.toLocaleString()}₩` : '-') :
                        (crypto.signedChangeRate ? `${(crypto.signedChangeRate * 100).toFixed(2)}%` : '-')
                    }) 
                    ${getChangeArrow(crypto.signedChangePrice)}
                </span>
                <button class="alert-btn" data-market="${crypto.market}">⏰</button>
            </div>
        `;

        // 클릭 이벤트 추가
        listItem.querySelector('.crypto-item').addEventListener('click', (e) => {
            if (!e.target.classList.contains('favorite-btn') && !e.target.classList.contains('alert-btn')) {
              console.log('차트 데이터 요청:', crypto.market, crypto.koreanName); // 디버깅용
              elements.chartSection.style.display = 'block';
              elements.cryptoInfoSection.style.display = 'none';
              document.getElementById('news-section').style.display = 'none';
              fetchCryptoHistory(crypto.market, crypto.koreanName);
            }
        });

        // 즐겨찾기 버튼 이벤트
        listItem.querySelector('.favorite-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(crypto.market);
        });

        // 알림 버튼 이벤트
        listItem.querySelector('.alert-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showAlertModal(crypto.market, crypto.tradePrice);
        });

        elements.cryptoList.appendChild(listItem);
    });
}

export async function fetchAllCryptoPrices() {
    toggleLoadingSpinner(true);
    try {
      const options = { method: 'GET', headers: { accept: 'application/json' } };
      const marketResponse = await fetch('https://api.bithumb.com/v1/market/all?isDetails=false', options);
      const marketData = await marketResponse.json();
      if (Array.isArray(marketData)) {
        const markets = marketData.map(item => item.market).join(',');
        const tickerResponse = await fetch(`https://api.bithumb.com/v1/ticker?markets=${markets}`, options);
        const tickerData = await tickerResponse.json();
        if (Array.isArray(tickerData)) {
          state.cryptoData = tickerData.map(item => mapTickerData(item, marketData));
          checkAlerts(state.cryptoData);
          sortCryptoList(state.currentSort);
        }
      } else {
        console.error('Expected an array in marketData response');
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      toggleLoadingSpinner(false);
    }
}

export function filterCryptoList() {
    const searchInput = elements.searchBar.value.toLowerCase();
    state.filteredCryptoData = state.cryptoData.filter(item => item.koreanName.toLowerCase().includes(searchInput));
    renderCryptoList();
}

export function renderNews(newsData) {
    const newsList = document.getElementById('news-list');
    newsList.innerHTML = ''; // Clear existing news

    const uniqueTitles = new Set(); // Set to track unique titles

    newsData.forEach(article => {
        if (uniqueTitles.has(article.title)) {
            return; // Skip if the title is already in the set
        }
        uniqueTitles.add(article.title); // Add the title to the set

        const newsItem = document.createElement('div');
        newsItem.classList.add('news-card');
        newsItem.innerHTML = `
            <img src="${article.imageurl}" alt="${article.title}" class="news-image">
            <div class="news-content">
                <h3>${article.title}</h3>
                <p>${article.body}</p>
                <a href="${article.url}" target="_blank">Read more</a>
            </div>
        `;
        newsList.appendChild(newsItem);
    });
} 