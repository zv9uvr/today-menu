/* 0. 카카오맵 초기 설정 */
var mapContainer = document.getElementById('map'), // 지도를 표시할 div 
    mapOption = {
        center: new kakao.maps.LatLng(37.5665, 126.9780), // 지도의 중심좌표 (서울시청)
        level: 4 // 지도의 확대 레벨
    };

var map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다
var ps = new kakao.maps.services.Places(); // 장소 검색 객체를 생성합니다
var infowindow = new kakao.maps.InfoWindow({ zIndex: 1 }); // 인포윈도우 객체 생성

var centerPosition; // 현재 기준 위치를 저장할 변수
var markers = []; // 지도에 표시된 마커 객체를 담을 배열
var allPlaces = []; // 현재 검색된 장소 중 아직 리스트에 안 보여준 장소들
var initialPlaces = []; // 현재 카테고리에서 검색된 전체 장소 (리셋용)
var selectedCategory = ''; // 선택된 카테고리 저장

/* 기존에 있던 getCurrentLocation 함수 등이 이 아래로 이어지면 됩니다 */

/* 1. 현재 위치 가져오기 함수 */
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude,
                lon = position.coords.longitude;
            
            centerPosition = new kakao.maps.LatLng(lat, lon);
            map.setCenter(centerPosition);
            
            // 내 위치에 마커 표시
            new kakao.maps.Marker({
                map: map,
                position: centerPosition
            });
            alert("현재 위치로 설정되었습니다!");
        });
    } else {
        alert("이 브라우저에서는 위치 정보를 사용할 수 없습니다.");
    }
}

/* 2. 상단 물결 글자 효과 (기존 코드 유지) */
const staticText = document.getElementById("static-wave");
if (staticText) {
    const content = staticText.innerText;
    staticText.innerHTML = ""; 

    content.split("").forEach((char, index) => {
        const span = document.createElement("span");
        span.innerText = char;
        const yOffset = Math.sin(index * 1) * 1.5; 
        span.style.transform = `translateY(${yOffset}px)`;
        staticText.appendChild(span);
    });
}

/* 3. 장소 검색 함수 (⭐ 카테고리 라벨 변경 기능 추가) */
function searchPlaces(category) {
    // 지도 위 겹줄 테두리 중앙의 글자를 바꿉니다.
    const titleElement = document.getElementById('category-title');
    if (titleElement) {
        titleElement.innerText = `<${category}>`;
    }

    selectedCategory = category;
    if (!centerPosition) {
        alert('먼저 지역을 설정해 주세요.');
        return;
    }

    clearMarkers();
    allPlaces = [];
    initialPlaces = [];
    hideWarningMessage();

    var options = {
        location: centerPosition, 
        radius: 1000
    };

    ps.keywordSearch(category, function(data, status) {
        if (status === kakao.maps.services.Status.OK) {
            allPlaces = data.slice();
            initialPlaces = data.slice();
            displayPlaces(data);
            displayRandomPlaces(); 
        } else {
            alert('검색 결과가 없습니다.');
        }
    }, options);
}

// --- 아래는 지동 작동을 위한 나머지 핵심 함수들입니다 ---

function setLocation() {
    var location = document.getElementById('location-input').value;
    if (!location) { alert('지역을 입력해 주세요.'); return; }
    ps.keywordSearch(location, function(data, status) {
        if (status === kakao.maps.services.Status.OK) {
            centerPosition = new kakao.maps.LatLng(data[0].y, data[0].x);
            map.setCenter(centerPosition);
        } else { alert('입력한 지역을 찾을 수 없습니다.'); }
    });
}

/* 3. 장소 검색 결과 중 랜덤 3개 표시 함수 */
function displayRandomPlaces() {
    // === [수정] REFRESH 버튼 아이콘 애니메이션 강제 리셋 로직 ===
    const refreshBtn = document.querySelector('.refresh-button');
    if (refreshBtn) {
        const svg = refreshBtn.querySelector('svg');
        if (svg) {
            // 1. 기존 애니메이션을 완전히 제거
            svg.style.animation = 'none';
            
            // 2. 브라우저가 변화를 감지할 시간을 줌 (setTimeout)
            setTimeout(() => {
                svg.style.animation = 'spin_357 0.6s ease-in-out';
            }, 10); 
        }
    }
    // ===============================================

    var listEl = document.getElementById('restaurant-list');
    // 기존 아이템 삭제
    listEl.querySelectorAll('.restaurant-item').forEach(item => item.remove());

    if (allPlaces.length === 0) {
        showWarningMessage();
        return;
    }

    // 랜덤으로 3개 추출
    var randomPlaces = shuffleArray(allPlaces).slice(0, 3);
    // 남은 목록에서 제외 (중복 방지)
    allPlaces = allPlaces.filter(place => !randomPlaces.includes(place));

    for (var i = 0; i < randomPlaces.length; i++) {
        var place = randomPlaces[i];
        
        // 1. 바깥쪽 버튼 생성 (neobtn 클래스 추가)
        var itemEl = document.createElement('button');
        itemEl.className = 'neobtn restaurant-item'; // neobtn 클래스 부여
        itemEl.style.width = "100%"; // 리스트 꽉 차게
        itemEl.style.marginBottom = "15px"; 
        
        // 2. 안쪽 입체 레이어(button_top) 생성
        var topSpan = document.createElement('span');
        topSpan.className = 'button_top'; // neobtn의 핵심 클래스
        topSpan.innerText = place.place_name;
        topSpan.style.display = "block"; 
        
        itemEl.appendChild(topSpan);
        listEl.appendChild(itemEl);

        /* displayRandomPlaces 함수 내부의 클릭 이벤트 수정 */
        (function(place) {
            itemEl.addEventListener('click', function() {
                var position = new kakao.maps.LatLng(place.y, place.x);
                map.panTo(position);

                // 밋밋한 창 대신 상세 정보가 담긴 커스텀 HTML 구성
                var content = `
                    <div class="custom-infowindow">
                        <div class="info-title">${place.place_name}</div>
                        <div class="info-body">
                            <span class="info-address">${place.road_address_name || place.address_name}</span>
                            <span class="info-phone">${place.phone || '전화번호 없음'}</span>
                            <a href="${place.place_url}" target="_blank" class="info-link">상세보기 ❯</a>
                        </div>
                    </div>
                `;

                infowindow.setContent(content);
                infowindow.open(map, new kakao.maps.Marker({
                    map: map,
                    position: position
                }));
            });
        })(place);
    }
}

/* 4. 지도에 마커를 표시하는 함수 */
function displayPlaces(places) {
    var bounds = new kakao.maps.LatLngBounds(); // 지도 범위를 재설정하기 위한 객체

    for (var i = 0; i < places.length; i++) {
        var placePosition = new kakao.maps.LatLng(places[i].y, places[i].x);
        
        // 마커 생성 및 지도 표시
        var marker = new kakao.maps.Marker({
            map: map,
            position: placePosition
        });
        markers.push(marker); // 관리용 배열에 추가

        // 마커 클릭 시 인포윈도우 표시 (클로저 처리)
        (function(marker, place) {
            kakao.maps.event.addListener(marker, 'click', function() {
                var content = `
                    <div class="custom-infowindow">
                        <div class="info-title">${place.place_name}</div>
                        <div class="info-body">
                            <span class="info-address">${place.road_address_name || place.address_name}</span>
                            <a href="${place.place_url}" target="_blank" class="info-link">상세보기 ❯</a>
                        </div>
                    </div>
                `;
                infowindow.setContent(content);
                infowindow.open(map, marker);
            });
        })(marker, places[i]);

        bounds.extend(placePosition); // 검색된 장소들을 포함하도록 범위 확장
    }
    
    // 검색된 장소들이 다 보이도록 지도 범위 조절
    map.setBounds(bounds);
}

function resetRestaurants() {
    document.getElementById('restaurant-list').querySelectorAll('.restaurant-item').forEach(item => item.remove());
    infowindow.close();
    hideWarningMessage();
    allPlaces = initialPlaces.slice();
    displayRandomPlaces();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function clearMarkers() {
    for (var i = 0; i < markers.length; i++) { markers[i].setMap(null); }
    markers = [];
}

function showWarningMessage() { document.getElementById('warning-message').style.display = 'block'; }
function hideWarningMessage() { document.getElementById('warning-message').style.display = 'none'; }