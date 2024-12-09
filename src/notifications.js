import state from './state.js';
import elements from './elements.js';

export function initializeNotifications() {
    const notificationBtn = document.createElement('button');
    notificationBtn.textContent = '알림 허용하기';
    notificationBtn.className = 'notification-btn';
    
    // 알림 상태 표시 요소 생성
    const notificationStatus = document.createElement('div');
    notificationStatus.className = 'notification-status';
    
    // 알림 권한 상태 업데이트 함수
    function updateNotificationStatus() {
        if (!("Notification" in window)) {
            notificationStatus.textContent = '알림을 지원하지 않는 브라우저입니다';
            notificationStatus.className = 'notification-status error';
            notificationBtn.style.display = 'none';
            return;
        }

        const permission = Notification.permission;

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

            // 권한 요청
            const permission = await Notification.requestPermission();
            
            updateNotificationStatus();
        } catch (error) {
            console.error('알림 권한 요청 중 오류 발생:', error);
        }
    });
}

export function checkAlerts(cryptoData) {
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

export function saveAlert() {
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