document.addEventListener("DOMContentLoaded", () => {
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
      loadingSpinner: document.getElementById('loading-spinner')
    };

    let state = {
      currentSort: 'name',
      sortDirection: { name: true, price: true, changeAmount: true, changeRate: true },
      showChangePrice: true,
      previousPrices: {},
      cryptoData: [],
      filteredCryptoData: [],
      priceChart: null,
      isFetching: false
    };

    const apiBaseUrl = "https://api.bithumb.com/v1/candles/days";

    elements.toggleChangeTypeBtn.addEventListener("click", toggleChangeType);
    elements.backToListBtn.addEventListener("click", showCryptoList);
    elements.dayCandleBtn.addEventListener('click', () => switchCandleChart(null));
    elements.minuteCandleBtn.addEventListener('click', () => switchCandleChart(5));
    elements.weekCandleBtn.addEventListener('click', () => switchCandleChart('week'));
    elements.monthCandleBtn.addEventListener('click', () => switchCandleChart('month'));
    elements.searchBar.addEventListener('input', filterCryptoList);

    function toggleChangeType() {
      state.showChangePrice = !state.showChangePrice;
      elements.toggleChangeTypeBtn.textContent = state.showChangePrice ? '변화액' : '변화율';
      renderCryptoList();
    }

    function showCryptoList() {
      if (window.candleInterval) {
        clearInterval(window.candleInterval);
      }
      elements.chartSection.style.display = 'none';
      elements.cryptoInfoSection.style.display = 'block';
      document.getElementById('news-section').style.display = 'none';
    }

    function startCandleDataInterval(market, unit, koreanName) {
      // 이전 인터벌이 있다면 제거
      if (window.candleInterval) {
        clearInterval(window.candleInterval);
      }
    
      // 새로운 인터벌 설정
      window.candleInterval = setInterval(() => {
        fetchCandleData(market, unit, koreanName);
      }, 60000); // 60000ms = 1분
    }

    function switchCandleChart(unit) {
      elements.dayCandleBtn.classList.remove('active');
      elements.minuteCandleBtn.classList.remove('active');
      elements.weekCandleBtn.classList.remove('active');
      elements.monthCandleBtn.classList.remove('active');

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

      const rawMarket = elements.chartTitle.textContent.match(/\(([^)]+)\)/);
      if (rawMarket) {
        const market = rawMarket[1];
        fetchCandleData(market, unit, elements.chartTitle.textContent);
        startCandleDataInterval(market, unit, elements.chartTitle.textContent);
      }
    }

    async function fetchCandleData(market, unit = null, koreanName) {
      const apiUrl = getCandleApiUrl(market, unit);
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (Array.isArray(data)) {
          updatePriceChart(data, `${koreanName} (${market}) - ${unit ? `${unit} 차트` : '일 차트'}`, unit);
          elements.chartSection.style.display = 'block';
          elements.cryptoInfoSection.style.display = 'none';
        } else {
          console.error('Unexpected data format:', data);
        }
      } catch (error) {
        console.error('Error fetching candle data:', error);
      }
    }

    function getCandleApiUrl(market, unit) {
      const baseUrl = "https://api.bithumb.com/v1/candles";
      if (unit === 'week') return `${baseUrl}/weeks?market=${market}&count=30`;
      if (unit === 'month') return `${baseUrl}/months?market=${market}&count=30`;
      if (unit) return `${baseUrl}/minutes/${unit}?market=${market}&count=30`;
      return `${baseUrl}/days?market=${market}&count=30`;
    }

    function updatePriceChart(candleData, title, unit) {
      const reversedData = [...candleData].reverse();
      
      const labels = reversedData.map(item => formatCandleDate(item.candle_date_time_kst, unit));
      const openPrices = reversedData.map(item => item.opening_price);
      const highPrices = reversedData.map(item => item.high_price);
      const lowPrices = reversedData.map(item => item.low_price);
      const closePrices = reversedData.map(item => item.trade_price);

      if (state.priceChart) {
        state.priceChart.destroy();
      }

      state.priceChart = new Chart(elements.ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: '시가',
              data: openPrices,
              borderColor: 'rgba(75, 192, 192, 1)',
              tension: 0.1
            },
            {
              label: '고가',
              data: highPrices,
              borderColor: 'rgba(255, 99, 132, 1)',
              tension: 0.1
            },
            {
              label: '저가',
              data: lowPrices,
              borderColor: 'rgba(54, 162, 235, 1)',
              tension: 0.1
            },
            {
              label: '종가',
              data: closePrices,
              borderColor: 'rgba(255, 206, 86, 1)',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              grid: {
                display: true
              },
              ticks: {
                autoSkip: false,
                maxRotation: 45,
                minRotation: 45,
                align: 'end'
              },
              min: labels.length - 30,
              max: labels.length - 1,
              pan: {
                enabled: true,
                mode: 'x'
              },
              zoom: {
                enabled: true,
                mode: 'x'
              }
            },
            y: {
              position: 'right',
              grid: {
                display: true
              }
            }
          },
          plugins: {
            zoom: {
              pan: {
                enabled: true,
                mode: 'x'
              },
              zoom: {
                wheel: {
                  enabled: true
                },
                pinch: {
                  enabled: true
                },
                mode: 'x'
              }
            },
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: title
            }
          }
        }
      });
    }

    function formatCandleDate(dateString, unit) {
      const candleDate = new Date(dateString);
      const now = new Date();
      if(unit == 'week'){
        return formatDate(candleDate);
      } else if (unit == 'month') {
        return formatDate(candleDate);
      } else if (unit) {
        const diffInMinutes = Math.floor((now - candleDate) / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
        if (diffInHours < 24) return `${diffInHours}시간 ${diffInMinutes % 60}분 전`;
        return formatDate(candleDate);
      }
      return formatDate(candleDate);
    }

    function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function filterCryptoList() {
      const searchInput = elements.searchBar.value.toLowerCase();
      state.filteredCryptoData = state.cryptoData.filter(item => item.koreanName.toLowerCase().includes(searchInput));
      renderCryptoList();
    }

    function renderCryptoList() {
      elements.cryptoList.innerHTML = "";
      const dataToRender = state.filteredCryptoData.length > 0 ? state.filteredCryptoData : state.cryptoData;
      dataToRender.forEach(crypto => {
        const listItem = createCryptoListItem(crypto);
        elements.cryptoList.appendChild(listItem);
      });
    }

    function createCryptoListItem(crypto) {
      const formattedPrice = `₩${crypto.tradePrice.toLocaleString()}`;
      const formattedChange = state.showChangePrice
        ? (crypto.signedChangePrice ? `${crypto.signedChangePrice.toLocaleString()}₩` : '-')
        : (crypto.signedChangeRate ? `${(crypto.signedChangeRate * 100).toFixed(2)}%` : '-');
      state.previousPrices[crypto.market] = crypto.tradePrice;

      const listItem = document.createElement("li");
      listItem.innerHTML = `
        <span>${crypto.koreanName}</span>
        <span style="color:${crypto.priceColor}">${formattedPrice} (${formattedChange} ${getChangeArrow(crypto.signedChangePrice)})</span>
      `;
      listItem.addEventListener("click", () => {
        elements.chartSection.style.display = 'block';
        elements.chartTitle.textContent = `${crypto.koreanName} (${crypto.market})`;
        fetchCryptoHistory(crypto.market, crypto.koreanName);
      });
      return listItem;
    }

    function getChangeArrow(changePrice) {
      if (changePrice > 0) return `<span class="triangle-up"></span>`;
      if (changePrice < 0) return `<span class="triangle-down"></span>`;
      return `<span class="triangle-neutral"></span>`;
    }

    async function fetchCryptoHistory(market, koreanName) {
      elements.dayCandleBtn.classList.remove('active');
      elements.minuteCandleBtn.classList.remove('active');
      elements.weekCandleBtn.classList.remove('active');
      elements.monthCandleBtn.classList.remove('active');
      
      elements.dayCandleBtn.classList.add('active');
      
      fetchCandleData(market, null, koreanName);
    }

    async function fetchAllCryptoPrices() {
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

    function mapTickerData(item, marketData) {
      const marketInfo = marketData.find(marketItem => marketItem.market === item.market);
      const priceColor = getPriceColor(item.change);
      return {
        market: item.market,
        tradePrice: item.trade_price,
        koreanName: marketInfo ? marketInfo.korean_name : 'N/A',
        priceColor: priceColor,
        signedChangePrice: item.signed_change_price,
        signedChangeRate: item.signed_change_rate
      };
    }

    function getPriceColor(change) {
      if (change === 'EVEN') return 'black';
      if (change === 'RISE') return 'red';
      if (change === 'FALL') return 'blue';
    }

    function toggleLoadingSpinner(show) {
      elements.loadingSpinner.style.display = show ? 'block' : 'none';
    }

    function sortCryptoList(criteria) {
      const dataToRender = state.filteredCryptoData.length > 0 ? state.filteredCryptoData : state.cryptoData;
      const sortFunctions = {
        name: (a, b) => state.sortDirection.name ? a.koreanName.localeCompare(b.koreanName) : b.koreanName.localeCompare(a.koreanName),
        price: (a, b) => state.sortDirection.price ? b.tradePrice - a.tradePrice : a.tradePrice - b.tradePrice,
        changeAmount: (a, b) => state.sortDirection.changeAmount ? b.signedChangePrice - a.signedChangePrice : a.signedChangePrice - b.signedChangePrice,
        changeRate: (a, b) => state.sortDirection.changeRate ? b.signedChangeRate - a.signedChangeRate : a.signedChangeRate - b.signedChangeRate
      };
      dataToRender.sort(sortFunctions[criteria]);
      renderCryptoList();
      updateSortButtons();
    }

    function updateSortButtons() {
      elements.sortBtns.forEach(button => {
        button.classList.remove('active');
        const arrow = button.querySelector('.arrow');
        if (arrow) arrow.remove();
      });

      const activeButton = document.getElementById(`sort-by-${state.currentSort}`);
      if (!activeButton) {
        console.error(`No button found for current sort: ${state.currentSort}`);
        return;
      }
      activeButton.classList.add('active');
      const arrow = document.createElement('span');
      arrow.classList.add('arrow', state.sortDirection[state.currentSort] ? 'arrow-down' : 'arrow-up');
      activeButton.appendChild(arrow);
    }

    document.getElementById("sort-by-name").addEventListener("click", () => toggleSort('name'));
    document.getElementById("sort-by-price").addEventListener("click", () => toggleSort('price'));
    document.getElementById("sort-by-changeAmount").addEventListener("click", () => toggleSort('changeAmount'));
    document.getElementById("sort-by-changeRate").addEventListener("click", () => toggleSort('changeRate'));

    function toggleSort(criteria) {
      if (state.currentSort === criteria) {
        state.sortDirection[criteria] = !state.sortDirection[criteria];
      } else {
        state.currentSort = criteria;
        state.sortDirection[criteria] = true;
      }
      sortCryptoList(criteria);
      updateSortButtons();
    }

    fetchAllCryptoPrices();
    setInterval(() => {
      if (!state.isFetching) {
        state.isFetching = true;
        fetchAllCryptoPrices().finally(() => {
          state.isFetching = false;
        });
      }
    }, 10000);

    function fetchNews() {
      const apiKey = '{your_api_key}';
      const url = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&api_key=${apiKey}`;

      fetch(url)
        .then(response => response.json())
        .then(data => {
          renderNews(data.Data);
        })
        .catch(error => console.error('Error fetching news:', error));
    }

    function renderNews(newsData) {
      const newsList = document.getElementById('news-list');
      newsList.innerHTML = ''; // Clear existing news

      newsData.forEach(article => {
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

    document.querySelector('.nav-menu a[href="#news-section"]').addEventListener('click', (event) => {
      event.preventDefault();
      showNewsSection();
      setActiveTab(event.target);
    });

    document.querySelector('.nav-menu a[href="#crypto-info-section"]').addEventListener('click', (event) => {
      event.preventDefault();
      showCryptoList();
      setActiveTab(event.target);
    });

    function showNewsSection() {
      elements.cryptoInfoSection.style.display = 'none';
      elements.chartSection.style.display = 'none';
      document.getElementById('news-section').style.display = 'block';
      fetchNews(); // Assuming you have a function to fetch and display news
    }

    function setActiveTab(selectedTab) {
      document.querySelectorAll('.nav-menu a').forEach(tab => {
        tab.classList.remove('active');
      });
      selectedTab.classList.add('active');
    }
  });