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


/* 1. 현재 위치 가져오기 함수 */
var userProfileOverlay = null; // 전역 변수

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude,
                lon = position.coords.longitude;
            var currentPos = new kakao.maps.LatLng(lat, lon);

            // 1. 기존 프사 마커 제거 (중복 방지)
            if (userProfileOverlay) {
                userProfileOverlay.setMap(null);
            }

            // 2. 로그인 상태라면 프사 마커 생성
            if (typeof userProfileImg !== 'undefined' && userProfileImg && userProfileImg !== '') {
                // script.js 수정
                var content = `
                    <div class="my-profile-marker">
                        <img src="${userProfileImg}" class="my-profile-img">
                        <div class="my-profile-pin"></div>
                    </div>
                `;

                userProfileOverlay = new kakao.maps.CustomOverlay({
                    position: currentPos,
                    content: content,
                    yAnchor: 1.1,
                    zIndex: 999 // 다른 마커보다 항상 위에 뜨도록 설정
                });
                userProfileOverlay.setMap(map);
                // ⭐ 중요: markers.push(userProfileOverlay)를 하지 않습니다! (지우개 방지)
            } else {
                // 로그인 안 했을 때만 일반 마커로 표시하고 지우개 배열에 넣음
                var marker = new kakao.maps.Marker({ position: currentPos });
                marker.setMap(map);
                markers.push(marker);
            }

            map.setCenter(currentPos);
            centerPosition = currentPos;
        });
    }
}

/* 2. 장소 검색 함수 (⭐ 카테고리 라벨 변경 기능 추가) */
function searchPlaces(category) {
    // 1. 카테고리 표시 변경
    const titleElement = document.getElementById('category-title');
    if (titleElement) titleElement.innerText = `<${category}>`;
    
    // 2. 먼저 장고 DB(내가 검증한 맛집)에 있는지 확인
    fetch(`/api/recommend/?category=${category}`)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                console.log("DB에서 맛집 발견!");
                allPlaces = data.results;
                displayRandomPlaces();
            } else {
                // 3. DB에 없다면? 카카오 API 실시간 검색 실행!
                console.log("DB에 없어서 카카오 API로 실시간 검색합니다.");
                searchViaKakao(category);
            }
        })
        .catch(error => {
            console.error('에러 발생, 카카오 검색으로 전환:', error);
            searchViaKakao(category);
        });
}



/* 2. 위치 검색으로 기준점 변경 함수 */
// 2026-01-21 01:25 수정 - 검색 시 해당 위치에도 빨간 마커 표시
function setLocation() {
    var location = document.getElementById('location-input').value;
    if (!location) { 
        alert('지역을 입력해 주세요.'); 
        return; 
    }

    ps.keywordSearch(location, function(data, status) {
        if (status === kakao.maps.services.Status.OK) {
            // 검색된 첫 번째 장소의 좌표
            var searchPos = new kakao.maps.LatLng(data[0].y, data[0].x);
            
            // 전역 변수 업데이트 및 지도 이동
            centerPosition = searchPos;
            map.setCenter(centerPosition);

            // --- 빨간 마커 표시 로직 추가 ---
            var imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
                imageSize = new kakao.maps.Size(34, 36),
                imageOption = {offset: new kakao.maps.Point(17, 36)};
                
            var markerImage = new kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

            var searchMarker = new kakao.maps.Marker({
                position: searchPos,
                image: markerImage
            });

            // 지도에 마커 올리기
            searchMarker.setMap(map);
            // ------------------------------

            console.log("검색 위치 기준점 설정 완료:", location);
        } else { 
            alert('입력한 지역을 찾을 수 없습니다.'); 
        }
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
    for (var i = 0; i < places.length; i++) {
        var placePosition = new kakao.maps.LatLng(places[i].y, places[i].x);
        
        var marker = new kakao.maps.Marker({
            map: map,
            position: placePosition
        });
        markers.push(marker);

        (function (marker, place) {
            kakao.maps.event.addListener(marker, 'click', function () {
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
    }
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
    for (var i = 0; i < markers.length; i++) {
        // 일반 마커(Marker 객체)만 지우고, 커스텀 오버레이(프사)는 건드리지 않음
        if (markers[i] instanceof kakao.maps.Marker) {
            markers[i].setMap(null);
        }
    }
    // 배열에서 일반 마커만 제거
    markers = markers.filter(m => !(m instanceof kakao.maps.Marker));
}

function showWarningMessage() { document.getElementById('warning-message').style.display = 'block'; }
function hideWarningMessage() { document.getElementById('warning-message').style.display = 'none'; }


// 2026-01-21 00:47 수정 - 검색 결과 데이터 할당 로직 보완
function searchViaKakao(category) {
    // 1. 위치 정보가 없으면 현재 지도의 중심을 기준으로 잡기 (사용성 개선)
    if (!centerPosition) {
        centerPosition = map.getCenter();
        console.log("위치 미설정으로 현재 지도 중심을 기준으로 검색합니다.");
    }

    ps.keywordSearch(category, function(data, status) {
        if (status === kakao.maps.services.Status.OK) {
            // ⭐ [중요] 실시간 검색 결과를 바구니 두 곳에 모두 담아줘야 합니다!
            allPlaces = data;       // 현재 보여줄 장소들
            initialPlaces = data.slice(); // 리셋 대비용 전체 복사본
            
            // 1. 기존에 찍혀있던 마커들을 싹 지워줍니다 (중복 방지)
            clearMarkers(); 
            
            // 2. 검색된 모든 장소에 마커를 찍어줍니다
            displayPlaces(data); 
            
            // 3. 리스트에 랜덤 3개를 뿌려줍니다
            displayRandomPlaces();

            console.log(`${category} 검색 성공: ${data.length}개의 식당을 찾았습니다.`);
            displayRandomPlaces(); // 이제 화면에 그리기 시작!
        } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
            alert("주변 5km 이내에 해당 식당이 없습니다. 지도를 옮겨보세요!");
        } else {
            alert("카카오 API 연결에 문제가 발생했습니다.");
        }
    }, {
        location: centerPosition,
        radius: 5000, // 2km는 너무 좁을 수 있으니 5km로 확장!
        sort: kakao.maps.services.SortBy.DISTANCE 
    });
}

// script.js 맨 아래에 추가
document.getElementById('location-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        setLocation();
    }
});



// 카드 바깥을 클릭하면 닫히게 하는 센스 (선택 사항)
window.onclick = function(event) {
    if (!event.target.closest('.auth-section')) {
        const card = document.getElementById('userCard');
        if (card && card.classList.contains('show')) {
            card.classList.remove('show');
        }
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const trigger = document.getElementById('menuTrigger');
    const card = document.getElementById('userCard');

    if (trigger && card) {
        // 1. 화살표 버튼 클릭 시 카드 토글
        trigger.addEventListener('click', function(e) {
            e.stopPropagation(); // 부모 요소로 클릭 이벤트 전파 방지
            card.classList.toggle('show');
            console.log("Card toggled. Current classes:", card.className); // 디버깅용
        });

        // 2. 카드 내부를 클릭했을 때 카드가 닫히지 않게 방지
        card.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // 3. 카드 바깥쪽(화면 아무데나) 클릭하면 닫히게 설정
        document.addEventListener('click', function() {
            if (card.classList.contains('show')) {
                card.classList.remove('show');
            }
        });
    }
});