/* ===================================================
   MarkerClustering (네이버 지도 마커 클러스터링)
   - 네이버 지도 API v3 공식 예제 기반
   - 가까운 마커끼리 묶어서 숫자로 표시
   - 지도를 확대하면 개별 마커가 펼쳐짐
   - 출처: https://github.com/navermaps/maps.js.ncp
   =================================================== */

var MarkerClustering = function(options) {
  this._map = null;
  this._markers = [];
  this._clusters = [];
  this._mapRelations = null;

  /* 기본 옵션 설정 */
  this._minClusterSize = options.minClusterSize || 2;
  this._maxZoom = options.maxZoom || 13;
  this._gridSize = options.gridSize || 100;
  this._icons = options.icons || [];
  this._indexGenerator = options.indexGenerator || [];
  this._stylingFunction = options.stylingFunction || function() {};
  this._disableClickZoom = options.disableClickZoom || false;
  this._averageCenter = options.averageCenter || false;

  this.setMarkers(options.markers || []);
  this.setMap(options.map || null);
};

/* --- naver.maps.OverlayView 상속 --- */
MarkerClustering.prototype = new naver.maps.OverlayView();
MarkerClustering.prototype.constructor = MarkerClustering;

/* 지도에 오버레이가 추가될 때 호출 */
MarkerClustering.prototype.onAdd = function() {
  var overlay = this.getPanes().overlayLayer;
  this._mapRelations = naver.maps.Event.addListener(this.getMap(), 'idle', naver.maps.Util.bind(this._onIdle, this));

  if (this._markers.length > 0) {
    this._createClusters();
    this._updateClusters();
  }
};

/* 지도에서 오버레이가 제거될 때 호출 */
MarkerClustering.prototype.onRemove = function() {
  naver.maps.Event.removeListener(this._mapRelations);
  this._clearClusters();
  this._geoTree = null;
  this._mapRelations = null;
};

/* 지도 상태가 바뀔 때 (줌, 이동 등) */
MarkerClustering.prototype.draw = function() {
  /* draw는 idle 이벤트에서 처리 */
};

/* 지도가 idle 상태가 될 때 (이동/줌 완료 후) */
MarkerClustering.prototype._onIdle = function() {
  this._clearClusters();
  this._createClusters();
  this._updateClusters();
};

/* 마커 설정 */
MarkerClustering.prototype.setMarkers = function(markers) {
  this._markers = markers || [];
};

/* 마커 가져오기 */
MarkerClustering.prototype.getMarkers = function() {
  return this._markers;
};

/* 지도 설정 */
MarkerClustering.prototype.setMap = function(map) {
  if (this._map) {
    this.onRemove();
  }
  this._map = map;
  if (map) {
    this.setMap_superclass(map);
  }
};

/* 부모 클래스의 setMap 호출 */
MarkerClustering.prototype.setMap_superclass = function(map) {
  naver.maps.OverlayView.prototype.setMap.call(this, map);
};

/* 지도 가져오기 */
MarkerClustering.prototype.getMap = function() {
  return this._map;
};

/* --- 클러스터 생성 --- */
MarkerClustering.prototype._createClusters = function() {
  var map = this.getMap();
  if (!map) return;

  var bounds = map.getBounds();
  var zoom = map.getZoom();

  /* 현재 줌이 maxZoom보다 크면 → 클러스터링 안 하고 개별 마커 표시 */
  if (zoom > this._maxZoom) {
    for (var i = 0; i < this._markers.length; i++) {
      var marker = this._markers[i];
      if (bounds.hasPoint(marker.getPosition())) {
        marker.setMap(map);
      }
    }
    return;
  }

  /* 그리드 기반으로 마커 클러스터링 */
  for (var i = 0; i < this._markers.length; i++) {
    var marker = this._markers[i];
    var position = marker.getPosition();

    /* 화면 밖의 마커는 건너뜀 */
    /* 넓은 범위를 포함하도록 bounds를 약간 확장 */
    var extendedBounds = this._getExtendedBounds(bounds);
    if (!extendedBounds.hasPoint(position)) continue;

    /* 이미 클러스터에 속해있는지 확인 */
    var clusterFound = false;
    for (var j = 0; j < this._clusters.length; j++) {
      var cluster = this._clusters[j];
      /* 클러스터의 중심과 마커 사이의 거리(픽셀)가 gridSize 이내인지 확인 */
      if (this._isMarkerInClusterBounds(marker, cluster)) {
        cluster.addMarker(marker);
        clusterFound = true;
        break;
      }
    }

    /* 속할 클러스터가 없으면 새 클러스터 생성 */
    if (!clusterFound) {
      var newCluster = new Cluster(this);
      newCluster.addMarker(marker);
      this._clusters.push(newCluster);
    }
  }
};

/* 마커가 클러스터 범위 안에 있는지 확인 (픽셀 거리 기반) */
MarkerClustering.prototype._isMarkerInClusterBounds = function(marker, cluster) {
  var map = this.getMap();
  var proj = map.getProjection();
  var clusterCenter = cluster.getCenter();
  if (!clusterCenter) return false;

  var markerPosition = marker.getPosition();
  var clusterPoint = proj.fromCoordToOffset(clusterCenter);
  var markerPoint = proj.fromCoordToOffset(markerPosition);

  var dx = clusterPoint.x - markerPoint.x;
  var dy = clusterPoint.y - markerPoint.y;
  var distance = Math.sqrt(dx * dx + dy * dy);

  return distance <= this._gridSize;
};

/* bounds를 gridSize만큼 확장 */
MarkerClustering.prototype._getExtendedBounds = function(bounds) {
  var map = this.getMap();
  var proj = map.getProjection();

  var ne = bounds.getNE();
  var sw = bounds.getSW();

  var nePoint = proj.fromCoordToOffset(ne);
  var swPoint = proj.fromCoordToOffset(sw);

  nePoint.x += this._gridSize;
  nePoint.y -= this._gridSize;
  swPoint.x -= this._gridSize;
  swPoint.y += this._gridSize;

  var newNE = proj.fromOffsetToCoord(nePoint);
  var newSW = proj.fromOffsetToCoord(swPoint);

  return new naver.maps.LatLngBounds(newSW, newNE);
};

/* --- 클러스터 업데이트 (화면에 표시) --- */
MarkerClustering.prototype._updateClusters = function() {
  var map = this.getMap();

  for (var i = 0; i < this._clusters.length; i++) {
    var cluster = this._clusters[i];
    cluster.updateCluster(map);
  }
};

/* --- 클러스터 모두 제거 --- */
MarkerClustering.prototype._clearClusters = function() {
  for (var i = 0; i < this._clusters.length; i++) {
    this._clusters[i].destroy();
  }
  this._clusters = [];

  /* 모든 마커도 지도에서 제거 */
  for (var i = 0; i < this._markers.length; i++) {
    this._markers[i].setMap(null);
  }
};

/* 아이콘 인덱스 결정 (마커 개수에 따라 다른 아이콘 사용) */
MarkerClustering.prototype._getIconIndex = function(count) {
  var indexGenerator = this._indexGenerator;

  for (var i = indexGenerator.length - 1; i >= 0; i--) {
    if (count >= indexGenerator[i]) {
      return i;
    }
  }
  return 0;
};


/* ===================================================
   Cluster 클래스 (개별 클러스터)
   - 하나의 클러스터 = 가까운 마커들의 묶음
   - 마커가 1개면 그냥 마커 표시
   - 마커가 2개 이상이면 숫자 원으로 표시
   =================================================== */

var Cluster = function(markerClustering) {
  this._markerClustering = markerClustering;
  this._clusterCenter = null;
  this._clusterMarkers = [];
  this._clusterMarker = null; /* 클러스터를 대표하는 마커 (숫자 원) */
};

/* 클러스터에 마커 추가 */
Cluster.prototype.addMarker = function(marker) {
  /* 첫 번째 마커가 클러스터의 중심이 됨 */
  if (this._clusterMarkers.length === 0) {
    this._clusterCenter = marker.getPosition();
  }
  this._clusterMarkers.push(marker);
};

/* 클러스터 중심 좌표 */
Cluster.prototype.getCenter = function() {
  return this._clusterCenter;
};

/* 클러스터 안의 마커 개수 */
Cluster.prototype.getCount = function() {
  return this._clusterMarkers.length;
};

/* 클러스터를 지도에 표시 */
Cluster.prototype.updateCluster = function(map) {
  var count = this.getCount();

  if (count === 0) return;

  /* 마커가 minClusterSize 미만이면 개별 마커를 그대로 표시 */
  if (count < this._markerClustering._minClusterSize) {
    for (var i = 0; i < this._clusterMarkers.length; i++) {
      this._clusterMarkers[i].setMap(map);
    }
    return;
  }

  /* 마커가 minClusterSize 이상이면 → 클러스터 마커(숫자 원) 표시 */
  if (!this._clusterMarker) {
    var iconIndex = this._markerClustering._getIconIndex(count);
    var icon = this._markerClustering._icons[iconIndex];

    this._clusterMarker = new naver.maps.Marker({
      position: this._clusterCenter,
      map: map,
      icon: icon,
    });

    /* 스타일링 함수 호출 (숫자 텍스트 넣기) */
    this._markerClustering._stylingFunction(this._clusterMarker, count);

    /* 클러스터 클릭 시 확대 */
    if (!this._markerClustering._disableClickZoom) {
      var self = this;
      naver.maps.Event.addListener(this._clusterMarker, 'click', function() {
        map.setZoom(map.getZoom() + 2, { animate: true });
        map.panTo(self._clusterCenter);
      });
    }
  } else {
    this._clusterMarker.setMap(map);
  }
};

/* 클러스터 제거 */
Cluster.prototype.destroy = function() {
  if (this._clusterMarker) {
    this._clusterMarker.setMap(null);
    this._clusterMarker = null;
  }
  this._clusterMarkers = [];
  this._clusterCenter = null;
};
