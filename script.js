document.addEventListener("DOMContentLoaded", () => {
    const notificationBtn = document.createElement('button');
    notificationBtn.textContent = '알림 허용하기';
    notificationBtn.className = 'notification-btn';
    
    // 알림 상태 표시 요소 생성
    const notificationStatus = document.createElement('div');
    notificationStatus.className = 'notification-status';

    // 알림 권한 변경 감지
    navigator.permissions.query({name:'notifications'}).then(function(permissionStatus) {
        console.log('현재 알림 권한 상태:', permissionStatus.state);
        
        permissionStatus.onchange = function() {
            console.log('알림 권한 상태 변경:', this.state);
            updateNotificationStatus();
        };
    });
    
    // 알림 권한 상태 업데이트 함수
    function updateNotificationStatus() {
        if (!("Notification" in window)) {
            notificationStatus.textContent = '알림을 지원하지 않는 브라우저입니다';
            notificationStatus.className = 'notification-status error';
            notificationBtn.style.display = 'none';
            return;
        }

        const permission = Notification.permission;
        console.log('현재 브라우저 알림 권한:', permission);

        if (permission === "granted") {
            notificationStatus.textContent = '알림이 허용되었습니다 ✓';
            notificationStatus.className = 'notification-status success';
            notificationBtn.style.display = 'none';
        } else if (permission === "denied") {
            notificationStatus.textContent = '알림이 차단되었습니다 ✗';
            notificationStatus.className = 'notification-status error';
            notificationBtn.style.display = 'none';
        } else {
            notificationStatus.textContent = '알림 권한이 필요합니다';
            notificationStatus.className = 'notification-status warning';
            notificationBtn.style.display = 'block';
        }
    }

    // 헤더에 요소들 추가
    document.querySelector('.header').appendChild(notificationStatus);
    document.querySelector('.header').appendChild(notificationBtn);
    updateNotificationStatus();

    // 알림 버튼 클릭 이벤트
    notificationBtn.addEventListener('click', async () => {
        try {
            // 현재 권한 상태 확인
            if (Notification.permission === "denied") {
                alert("브라우저 설정에서 알림 권한이 차단되어 있습니다. 브라우저 설정에서 권한을 허용해주세요.");
                return;
            }

            // 권한 요청 전 상태 출력
            console.log('권한 요청 전 상태:', Notification.permission);
        
            // 권한 요청
            const permission = await Notification.requestPermission();
            console.log('알림 권한 요청 결과:', permission);
            
            // 권한 요청 후 상태 다시 확인
            console.log('권한 요청 후 상태:', Notification.permission);
            
            // 권한 상태 업데이트
            if (permission === "granted" && Notification.permission === "granted") {
                // 테스트 알림 보내기
                try {
                    await new Promise(resolve => setTimeout(resolve, 500)); // 약간의 지연 추가
                    const testNotification = new Notification("알림 테스트", {
                        body: "알림이 정상적으로 설정되었습니다.",
                        requireInteraction: true
                    });
                    
                    testNotification.onclick = function() {
                        window.focus();
                        this.close();
                    };
                    
                    console.log('테스트 알림 생성 성공');
                } catch (error) {
                    console.error('테스트 알림 생성 실패:', error);
                }
            }
            
            updateNotificationStatus();
        } catch (error) {
            console.error('알림 권한 요청 중 오류 발생:', error);
        }
    });

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
      closeModalBtn: document.getElementById('close-modal')
    };

    let state = {
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
      showOnlyFavorites: false
    };

    const apiBaseUrl = "https://api.bithumb.com/v1/candles/days";

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

    elements.saveAlertBtn.addEventListener('click', () => {
        saveAlert();
        elements.alertModal.style.display = 'none';
    });

    elements.closeModalBtn.addEventListener('click', () => {
        elements.alertModal.style.display = 'none';
    });

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

        // 즐겨찾기 버튼 이벤트
        const favBtn = listItem.querySelector('.favorite-btn');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(crypto.market);
        });

        // 알림 버튼 이벤트
        const alertBtn = listItem.querySelector('.alert-btn');
        alertBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showAlertModal(crypto.market, crypto.tradePrice);
        });

        // 차트 보기 이벤트
        listItem.addEventListener("click", () => {
            elements.chartSection.style.display = 'block';
            elements.chartTitle.textContent = `${crypto.koreanName} (${crypto.market})`;
            fetchCryptoHistory(crypto.market, crypto.koreanName);
        });

        elements.cryptoList.appendChild(listItem);
      });
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
      const url = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN`;

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

      const uniqueTitles = new Set(); // Set to track unique titles

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

    // toggleFavorite 함수 추가
    function toggleFavorite(market) {
        const index = state.favorites.indexOf(market);
        if (index === -1) {
            state.favorites.push(market);
        } else {
            state.favorites.splice(index, 1);
        }
        localStorage.setItem('favorites', JSON.stringify(state.favorites));
        renderCryptoList();
    }

    // showAlertModal 함수 수정
    function showAlertModal(market, currentPrice) {
        elements.alertModal.dataset.market = market;
        elements.alertPrice.value = currentPrice;
        elements.alertModal.style.display = 'block';
        renderAlertsList();
    }

    // 알림 목록 렌더링 함수 추가
    function renderAlertsList() {
        const alertsList = document.getElementById('alerts-list');
        alertsList.innerHTML = '';
        
        state.alerts.forEach((alert, index) => {
            const crypto = state.cryptoData.find(c => c.market === alert.market);
            if (!crypto) return;

            const alertItem = document.createElement('li');
            alertItem.className = `alert-item ${alert.active ? '' : 'inactive'}`;
            
            alertItem.innerHTML = `
                <div class="alert-info">
                    <strong>${crypto.koreanName}</strong><br>
                    목표가: ${alert.price.toLocaleString()}원 
                    (${alert.condition === 'above' ? '이상' : '이하'})
                    ${alert.active ? '' : ' - 완료'}
                </div>
                <div class="alert-actions">
                    <button class="delete-alert" data-index="${index}">삭제</button>
                </div>
            `;
            
            alertsList.appendChild(alertItem);
        });

        // 제 버튼 이벤트 리스너 추가
        document.querySelectorAll('.delete-alert').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                state.alerts.splice(index, 1);
                localStorage.setItem('alerts', JSON.stringify(state.alerts));
                renderAlertsList();
            });
        });
    }

    // saveAlert 함수 수정
    function saveAlert() {
        const market = elements.alertModal.dataset.market;
        const price = Number(elements.alertPrice.value);
        const condition = elements.alertCondition.value;

        if (!price || !market) return;

        const alert = {
            market,
            price,
            condition,
            active: true
        };

        state.alerts.push(alert);
        localStorage.setItem('alerts', JSON.stringify(state.alerts));
        renderAlertsList();
    }

    // checkAlerts 함수 수정
    function checkAlerts(cryptoData) {
        if (!("Notification" in window)) {
            console.log('이 브라우저는 알림을 지원하지 않습니다.');
            return;
        }

        // 권한 상태 확인 및 로깅
        const permission = Notification.permission;
        console.log('알림 체크 시 권한 상태:', permission);

        if (permission !== "granted") {
            console.log('알림 권한이 없습니다. 현재 상태:', permission);
            return;
        }

        state.alerts.forEach((alert, index) => {
            if (!alert.active) return;
            
            const crypto = cryptoData.find(c => c.market === alert.market);
            if (!crypto) return;

            const currentPrice = crypto.tradePrice;
            const alertTriggered = alert.condition === 'above' 
                ? currentPrice >= alert.price 
                : currentPrice <= alert.price;

            if (alertTriggered) {
                try {
                    const notification = new Notification(`${crypto.koreanName} 가격 알림`, {
                        body: `목표가 ${alert.price.toLocaleString()}원 ${alert.condition === 'above' ? '이상' : '이하'}으로 도달했습니다.\n현재가: ${currentPrice.toLocaleString()}원`,
                        icon: 'https://www.bithumb.com/favicon.ico',
                        requireInteraction: true,
                        tag: `price-alert-${crypto.market}`
                    });

                    notification.onclick = function() {
                        window.focus();
                        this.close();
                        showCryptoChart(crypto.market, crypto.koreanName);
                    };

                    state.alerts[index].active = false;
                    localStorage.setItem('alerts', JSON.stringify(state.alerts));
                    renderAlertsList();
                    
                    console.log('알림이 성공적으로 생성되었습니다:', crypto.koreanName);
                } catch (error) {
                    console.error('알림 생성 실패:', error);
                }
            }
        });
    }
});