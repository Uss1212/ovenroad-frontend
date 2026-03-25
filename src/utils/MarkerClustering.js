/* ===================================================
   MarkerClustering 유틸리티
   - 네이버 지도 API v3 공식 마커 클러스터링
   - 가까운 마커끼리 묶어서 숫자로 표시
   - 지도를 확대하면 개별 마커가 펼쳐짐
   - 참고: https://navermaps.github.io/maps.js.ncp/docs/tutorial-marker-cluster.example.html
   =================================================== */

/**
 * 마커 클러스터링을 초기화하는 함수
 * @param {naver.maps.Map} map - 네이버 지도 객체
 * @param {Array} markers - 마커 배열
 * @param {Object} options - 클러스터링 옵션
 * @returns {MarkerClustering} 클러스터링 객체
 */
export function createMarkerClustering(map, markers, options = {}) {
  /* 네이버 지도 라이브러리가 없으면 실행 안 함 */
  if (!window.naver || !window.naver.maps) return null;

  /* --- 클러스터 아이콘 스타일 --- */
  /* 마커 개수에 따라 다른 크기와 색상의 원형 아이콘 표시 */

  /* 작은 클러스터 (2~9개): 작은 갈색 원 */
  const smallClusterIcon = {
    content: `<div style="
      width: 40px; height: 40px;
      border-radius: 50%;
      background: #c96442;
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700;
      box-shadow: 0 2px 8px rgba(201, 100, 66, 0.4);
      border: 2px solid white;
    "></div>`,
    size: new window.naver.maps.Size(40, 40),
    anchor: new window.naver.maps.Point(20, 20),
  };

  /* 중간 클러스터 (10~29개): 중간 갈색 원 */
  const mediumClusterIcon = {
    content: `<div style="
      width: 50px; height: 50px;
      border-radius: 50%;
      background: #92400e;
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; font-weight: 700;
      box-shadow: 0 3px 12px rgba(146, 64, 14, 0.4);
      border: 2px solid white;
    "></div>`,
    size: new window.naver.maps.Size(50, 50),
    anchor: new window.naver.maps.Point(25, 25),
  };

  /* 큰 클러스터 (30개 이상): 큰 갈색 원 */
  const largeClusterIcon = {
    content: `<div style="
      width: 60px; height: 60px;
      border-radius: 50%;
      background: #78350f;
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 700;
      box-shadow: 0 4px 16px rgba(120, 53, 15, 0.4);
      border: 3px solid white;
    "></div>`,
    size: new window.naver.maps.Size(60, 60),
    anchor: new window.naver.maps.Point(30, 30),
  };

  /* --- 클러스터링 객체 생성 --- */
  const clustering = new MarkerClustering({
    /* 클러스터링을 적용할 지도 */
    map: map,
    /* 클러스터링할 마커 배열 */
    markers: markers,
    /* 최소 클러스터 크기: 마커가 2개 이상 겹쳐야 클러스터로 묶음 */
    minClusterSize: 2,
    /* 그리드 사이즈: 이 픽셀 범위 안에 있는 마커끼리 묶음 (클수록 많이 묶임) */
    gridSize: options.gridSize || 120,
    /* 최대 줌: 이 줌 레벨까지 클러스터링 적용 (더 확대하면 개별 마커 표시) */
    maxZoom: options.maxZoom || 16,
    /* 클러스터 아이콘 (마커 개수에 따라 다른 아이콘 사용) */
    icons: [smallClusterIcon, mediumClusterIcon, largeClusterIcon],
    /* 아이콘 선택 기준: 몇 개일 때 어떤 아이콘을 쓸지 */
    indexGenerator: [2, 10, 30],
    /* 스타일링 함수: 클러스터 마커에 개수 표시 */
    stylingFunction: (clusterMarker, count) => {
      /* clusterMarker의 내부 엘리먼트(div)에 숫자를 넣어줌 */
      const element = clusterMarker.getElement();
      if (element) {
        const div = element.querySelector('div');
        if (div) {
          div.textContent = count;
        }
      }
    },
  });

  return clustering;
}
