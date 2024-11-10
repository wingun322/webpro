document.addEventListener("DOMContentLoaded", () => {
  const cryptoListElement = document.getElementById("crypto-list");
  const cryptoInfoSection = document.getElementById("crypto-info-section");
  let previousPrices = {}; // 저장할 이전 가격 객체

  // 모든 암호화폐 가격 가져오기
  async function fetchAllCryptoPrices() {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=krw&order=market_cap_desc&per_page=100&page=1&sparkline=false");
      const data = await response.json();

      cryptoListElement.innerHTML = "";
      data.forEach((crypto) => {
        const formattedPrice = `₩${crypto.current_price.toLocaleString()}`;

        // Compare current price with previous price
        let priceClass = '';
        if (previousPrices[crypto.id]) {
          if (crypto.current_price > previousPrices[crypto.id]) {
            priceClass = 'price-increase'; // Price increased
          } else if (crypto.current_price < previousPrices[crypto.id]) {
            priceClass = 'price-decrease'; // Price decreased
          }
        }

        // Update previous price for next comparison
        previousPrices[crypto.id] = crypto.current_price;

        const listItem = document.createElement("li");
        listItem.innerHTML = `<span>${crypto.name}</span><span class="price ${priceClass}">${formattedPrice}</span>`;

        // 암호화폐 클릭 시 과거 기록 보여주는 이벤트 추가
        listItem.addEventListener("click", () => fetchCryptoHistory(crypto.id, crypto.name));

        cryptoListElement.appendChild(listItem);
      });
    } catch (error) {
      console.error("암호화폐 가격을 가져오는데 실패했습니다.", error);
    }
  }

  // 초기 데이터 가져오기 및 1분마다 업데이트
  fetchAllCryptoPrices();
  setInterval(fetchAllCryptoPrices, 60000); // 1분마다 업데이트
});
