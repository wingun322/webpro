document.addEventListener("DOMContentLoaded", () => {
  const cryptoListElement = document.getElementById("crypto-list");
  const sortBtns = document.querySelectorAll('.sort-btn');
  const toggleChangeTypeBtn = document.getElementById('toggle-change-type');
  let currentSort = 'name'; // 초기 정렬 기준 (기본은 이름순)
  let sortDirection = { // 정렬 방향 (true: 오름차순, false: 내림차순)
    name: true,
    price: true
  };
  let showChangePrice = true; // 변화액(true) 또는 변화율(false) 표시 여부
  let previousPrices = {}; // 가격 변화 추적 객체
  let cryptoData = []; // 암호화폐 데이터를 저장할 변수
  const apiBaseUrl = "https://api.bithumb.com/v1/candles/days";
  const backToListBtn = document.getElementById('back-to-list-btn');
  const cryptoInfoSection = document.getElementById("crypto-info-section");
  const chartSection = document.getElementById("chart-section");
  const chartTitle = document.getElementById("chart-title");
  const ctx = document.getElementById("priceChart").getContext("2d");
  let priceChart;

  // 변화율/변화액 전환 버튼 클릭 이벤트
  toggleChangeTypeBtn.addEventListener("click", () => {
    showChangePrice = !showChangePrice;
    toggleChangeTypeBtn.textContent = showChangePrice ? '변화액' : '변화율';
    renderCryptoList(); // 리스트 다시 렌더링
  });

  // 뒤로 가기 버튼 클릭 시 암호화폐 리스트로 돌아가기
  backToListBtn.addEventListener("click", () => {
    chartSection.style.display = 'none';  // 차트 숨기기
    cryptoInfoSection.style.display = 'block';  // 암호화폐 리스트 보이기
  });

  // 캔들 데이터 차트 생성/업데이트
  function updatePriceChart(candleData, title) {
    const labels = candleData.map(item => item.candle_date_time_kst.split('T')[0]);
    const openPrices = candleData.map(item => item.opening_price);
    const highPrices = candleData.map(item => item.high_price);
    const lowPrices = candleData.map(item => item.low_price);
    const closePrices = candleData.map(item => item.trade_price);

    // 차트가 이미 생성된 경우 업데이트
    if (priceChart) {
      priceChart.data.labels = labels;
      priceChart.data.datasets[0].data = openPrices;
      priceChart.data.datasets[1].data = highPrices;
      priceChart.data.datasets[2].data = lowPrices;
      priceChart.data.datasets[3].data = closePrices;
      priceChart.update();
    } else {
      // 새 차트 생성
      priceChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            { label: '시가', data: openPrices, borderColor: 'orange', fill: false },
            { label: '고가', data: highPrices, borderColor: 'green', fill: false },
            { label: '저가', data: lowPrices, borderColor: 'blue', fill: false },
            { label: '종가', data: closePrices, borderColor: 'red', fill: false },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: title },
          },
          scales: {
            x: {
              title: { display: true, text: '날짜' },
              reverse: true,  // X축 반전
            },
            y: {
              title: { display: true, text: '가격 (₩)' },
              position: 'right',
            },
          },
        },
      });
    }
  }

  async function fetchCryptoHistory(market, koreanName) {
    const apiUrl = `https://api.bithumb.com/v1/candles/days?market=${market}&count=30`;
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (Array.isArray(data)) {
        updatePriceChart(data, `${koreanName} (${market})`);
        chartSection.style.display = 'block';  // 차트 섹션을 보이도록 설정
        cryptoInfoSection.style.display = 'none';  // 암호화폐 리스트 숨기기
      } else {
        console.error('Unexpected data format:', data);
      }
    } catch (error) {
      console.error('Error fetching crypto history:', error);
    }
  }

  function toggleLoadingSpinner(show) {
    const spinner = document.getElementById('loading-spinner');
    spinner.style.display = show ? 'block' : 'none';
  }

  async function fetchAllCryptoPrices() {
    toggleLoadingSpinner(true);
    try {
      // 데이터 fetch 로직
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      toggleLoadingSpinner(false);
    }
  }

  // 정렬 함수 (가격순, 이름순)
  // 기존 sortCryptoList 함수 수정
  function sortCryptoList(criteria) {
    if (criteria === 'name') {
      cryptoData.sort((a, b) => {
        return sortDirection.name
            ? a.koreanName.localeCompare(b.koreanName) // 오름차순
            : b.koreanName.localeCompare(a.koreanName); // 내림차순
      });
    } else if (criteria === 'price') {
      cryptoData.sort((a, b) => {
        return sortDirection.price
            ? b.tradePrice - a.tradePrice // 내림차순
            : a.tradePrice - b.tradePrice; // 오름차순
      });
    } else if (criteria === 'changeAmount') {
      cryptoData.sort((a, b) => {
        return sortDirection.changeAmount
            ? b.signedChangePrice - a.signedChangePrice // 내림차순
            : a.signedChangePrice - b.signedChangePrice; // 오름차순
      });
    } else if (criteria === 'changeRate') {
      cryptoData.sort((a, b) => {
        return sortDirection.changeRate
            ? b.signedChangeRate - a.signedChangeRate // 내림차순
            : a.signedChangeRate - b.signedChangeRate; // 오름차순
      });
    }
    renderCryptoList(); // 정렬 후 다시 화면에 렌더링
    updateSortButtons(); // 버튼과 화살표 업데이트
  }


  function renderCryptoList() {
    cryptoListElement.innerHTML = ""; // 리스트 초기화
    cryptoData.forEach((crypto) => {
      const formattedPrice = `₩${crypto.tradePrice.toLocaleString()}`;
      // 변화액과 변화율을 선택적으로 표시
      const formattedChange = showChangePrice
          ? (crypto.signedChangePrice ? `${crypto.signedChangePrice.toLocaleString()}₩` : '-') // 변화액
          : (crypto.signedChangeRate ? `${(crypto.signedChangeRate * 100).toFixed(2)}%` : '-'); // 변화율

      // 이전 가격 업데이트
      previousPrices[crypto.market] = crypto.tradePrice;

      const listItem = document.createElement("li");

      // 변화 금액에 따른 화살표 표시 (세모 모양)
      let changeArrow = '';
      if (crypto.signedChangePrice > 0) {
        changeArrow = `<span class="triangle-up"></span>`; // 상승
      } else if (crypto.signedChangePrice < 0) {
        changeArrow = `<span class="triangle-down"></span>`; // 하락
      } else {
        changeArrow = `<span class="triangle-neutral"></span>`; // 보합
      }

      listItem.innerHTML = `
      <span>${crypto.koreanName}</span>
      <span style="color:${crypto.priceColor}">${formattedPrice} (${formattedChange} ${changeArrow})</span>
    `;

      // 암호화폐 클릭 시 과거 기록 보여주는 이벤트 추가
      listItem.addEventListener("click", () => {
        chartSection.style.display = 'block';  // 차트 섹션을 보이도록 설정
        chartTitle.textContent = `${crypto.koreanName} (${crypto.market})`;  // 차트 제목 업데이트
        fetchCryptoHistory(crypto.market, crypto.koreanName);  // 해당 암호화폐의 캔들 데이터 가져오기
      });

      cryptoListElement.appendChild(listItem);
    });
  }

  // 정렬 버튼 상태 업데이트
  function updateSortButtons() {
    sortBtns.forEach(button => {
      button.classList.remove('active');
      const arrow = button.querySelector('.arrow');
      if (arrow) {
        arrow.remove(); // 기존 화살표 제거
      }
    });

    let activeButton;
    if (currentSort === 'name') {
      activeButton = document.getElementById('sort-by-name');
      activeButton.classList.add('active');
      const arrow = document.createElement('span');
      arrow.classList.add('arrow');
      if (sortDirection.name) {
        arrow.classList.add('arrow-down'); // 오름차순
      } else {
        arrow.classList.add('arrow-up'); // 내림차순
      }
      activeButton.appendChild(arrow);
    } else if (currentSort === 'price') {
      activeButton = document.getElementById('sort-by-price');
      activeButton.classList.add('active');
      const arrow = document.createElement('span');
      arrow.classList.add('arrow');
      if (sortDirection.price) {
        arrow.classList.add('arrow-down'); // 내림차순
      } else {
        arrow.classList.add('arrow-up'); // 오름차순
      }
      activeButton.appendChild(arrow);
    } else if (currentSort === 'changeAmount') {
      activeButton = document.getElementById('sort-by-change-amount');
      activeButton.classList.add('active');
      const arrow = document.createElement('span');
      arrow.classList.add('arrow');
      if (sortDirection.changeAmount) {
        arrow.classList.add('arrow-down'); // 내림차순
      } else {
        arrow.classList.add('arrow-up'); // 오름차순
      }
      activeButton.appendChild(arrow);
    } else if (currentSort === 'changeRate') {
      activeButton = document.getElementById('sort-by-change-rate');
      activeButton.classList.add('active');
      const arrow = document.createElement('span');
      arrow.classList.add('arrow');
      if (sortDirection.changeRate) {
        arrow.classList.add('arrow-down'); // 내림차순
      } else {
        arrow.classList.add('arrow-up'); // 오름차순
      }
      activeButton.appendChild(arrow);
    }
  }


  // 정렬 버튼 클릭 이벤트 처리
  document.getElementById("sort-by-name").addEventListener("click", () => {
    if (currentSort === 'name') {
      sortDirection.name = !sortDirection.name;
    } else {
      currentSort = 'name';
      sortDirection.name = true;
    }
    sortCryptoList('name');
  });

  document.getElementById("sort-by-price").addEventListener("click", () => {
    if (currentSort === 'price') {
      sortDirection.price = !sortDirection.price;
    } else {
      currentSort = 'price';
      sortDirection.price = true;
    }
    sortCryptoList('price');
  });

  document.getElementById("sort-by-change-amount").addEventListener("click", () => {
    if (currentSort === 'changeAmount') {
      sortDirection.changeAmount = !sortDirection.changeAmount;
    } else {
      currentSort = 'changeAmount';
      sortDirection.changeAmount = true;
    }
    sortCryptoList('changeAmount');
  });

  document.getElementById("sort-by-change-rate").addEventListener("click", () => {
    if (currentSort === 'changeRate') {
      sortDirection.changeRate = !sortDirection.changeRate;
    } else {
      currentSort = 'changeRate';
      sortDirection.changeRate = true;
    }
    sortCryptoList('changeRate');
  });

  // 암호화폐 데이터 초기화 및 1분마다 업데이트
  async function fetchAllCryptoPrices() {
    try {
      const options = { method: 'GET', headers: { accept: 'application/json' } };
      let result;

      const marketResponse = await fetch('https://api.bithumb.com/v1/market/all?isDetails=false', options);
      const marketData = await marketResponse.json();

      if (Array.isArray(marketData)) {
        const markets = marketData.map(item => item.market).join(',');

        const tickerResponse = await fetch(`https://api.bithumb.com/v1/ticker?markets=${markets}`, options);
        const tickerData = await tickerResponse.json();

        if (Array.isArray(tickerData)) {
          result = tickerData.map(item => {
            const marketInfo = marketData.find(marketItem => marketItem.market === item.market);

            let priceColor;
            if (item.change === 'EVEN') {
              priceColor = 'black';
            } else if (item.change === 'RISE') {
              priceColor = 'red';
            } else if (item.change === 'FALL') {
              priceColor = 'blue';
            }

            return {
              market: item.market,
              tradePrice: item.trade_price,
              koreanName: marketInfo ? marketInfo.korean_name : 'N/A',
              priceColor: priceColor,
              signedChangePrice: item.signed_change_price,
              signedChangeRate: item.signed_change_rate
            };
          });

          cryptoData = result;
          sortCryptoList(currentSort); // 데이터를 받아오고 난 후, 정렬 및 렌더링
        }
      } else {
        console.error('Expected an array in marketData response');
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }

  // 데이터 로딩 및 주기적인 업데이트
  fetchAllCryptoPrices();
  let isFetching = false;
  setInterval(() => {
    if (!isFetching) {
      isFetching = true;
      fetchAllCryptoPrices().finally(() => {
        isFetching = false;
      });
    }
  }, 10000);
});
