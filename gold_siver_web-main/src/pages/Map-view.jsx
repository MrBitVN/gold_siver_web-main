import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./map-view.css";

import { useGeolocation } from "../hooks/useGeoLocation";
import { useParams, useNavigate } from "react-router-dom";
import { UseGoldOneDayPrices } from "../hooks/UseGoldOneDayPrices";

import CustomMarker from "../components/map-view/CustomMarker";
import PriceTableMap from "../components/map-view/price-table-map";
import { useMapEvents, useMap } from "react-leaflet";
import { addDistanceStoresWithinRadius } from "../components/GoldPriceDashboard";
const ClickIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
// ✅ Fix icon mặc định
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapView() {
  const navigate = useNavigate();
  const params = useParams();
  const { coords } = useGeolocation();
  console.log("All params:", params);
  console.log("GPS:", coords);

  // ✅ Tạo filterOptions chuẩn
  const filterOptions = useMemo(
    () => ({
      day: params.day ? Number(params.day) : null,
      month: params.month ? Number(params.month) : null,
      year: params.year ? Number(params.year) : null,
      hour: params.hour ? Number(params.hour) : null,
      minute: params.minute ? Number(params.minute) : null,
      region: params.region || "Vietnam",
      type: params.type || "gold",
    }),
    [params],
  );

  // ✅ Zoom chuẩn từ URL
  const zoom = params.z ? Number(params.z) : 13;

  const { loading, error, displayedPrices, loadingProgress } =
    UseGoldOneDayPrices(filterOptions);

  // ✅ Ưu tiên lat/lng từ URL, fallback GPS
  const lat = Number(params.lat) ? Number(params.lat) : coords?.latitude;
  const lng = Number(params.lng) ? Number(params.lng) : coords?.longitude;

  console.log("Tọa độ:", lat, lng);

  // ✅ Nếu chưa có GPS & URL
  if (!lat || !lng) {
    return <div>Đang lấy vị trí...</div>;
  }

  if (loading && displayedPrices.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải dữ liệu giá vàng...</p>
        {loadingProgress.total > 0 && (
          <p className="loading-progress">
            Đã tải {loadingProgress.loaded}/{loadingProgress.total} nguồn
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">⚠️ {error}</p>
        <button className="retry-btn" onClick={() => window.location.reload()}>
          Thử lại
        </button>
      </div>
    );
  }

  // ✅ Click bản đồ → đổi center + đổi URL
  const handleMapClick = ({ latNew, lngNew, zoomNew }) => {
    console.log("xử lý sự kiện");
    if (latNew && lngNew) {
      navigate(
        `/map-view/${filterOptions.region}/${filterOptions.type}/${filterOptions.day}/${filterOptions.month}/${filterOptions.year}/${filterOptions.hour}/${filterOptions.minute}/${zoomNew}/${latNew}/${lngNew}`,
        { replace: true },
      );
    } else {
      navigate(
        `/map-view/${filterOptions.region}/${filterOptions.type}/${filterOptions.day}/${filterOptions.month}/${filterOptions.year}/${filterOptions.hour}/${filterOptions.minute}/${zoomNew}/${lat}/${lng}`,
        { replace: true },
      );
    }
  };

  const displayedPricesFinal = addDistanceStoresWithinRadius(
    displayedPrices,
    coords.latitude,
    coords.longitude,
  );
  return (
    <div className="map-view">
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        className="map-container"
      >
        {/* ✅ BẢN ĐỒ VỆ TINH */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri"
        />

        {/* ✅ Lớp đường overlay */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
          attribution="Transportation © Esri"
          opacity={0.6}
        />

        {/* ✅ Marker vị trí hiện tại */}
        <Marker position={[lat, lng]} icon={ClickIcon}>
          <Tooltip direction="top" offset={[0, -20]} opacity={1}>
            Vị trí Click
          </Tooltip>
        </Marker>

        {/* ✅ Marker các cửa hàng vàng */}
        {displayedPricesFinal
          .filter((v) => v != null && v.maps && v.maps.length > 0)
          .flatMap((vendor) =>
            vendor.maps.map((mapItem, idx) => {
              const position = [mapItem.lat, mapItem.long];

              // ✅ Zoom lớn → CustomMarker
              if (zoom >= 18) {
                return (
                  <CustomMarker
                    key={`${vendor.name || "nhavang"}-${idx}`}
                    position={position}
                  >
                    <PriceTableMap vendorData={vendor} />
                  </CustomMarker>
                );
              }

              // ✅ Zoom nhỏ → Marker mặc định
              return (
                <Marker
                  key={`${vendor.name || "nhavang"}-${idx}`}
                  position={position}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -20]}
                    opacity={1}
                    permanent // ✅ QUAN TRỌNG: hiển thị luôn, không cần hover
                  >
                    {vendor.name || "Nhà vàng"}
                  </Tooltip>
                </Marker>
              );
            }),
          )}

        {/* ✅ CLICK BẢN ĐỒ → CẬP NHẬT URL + CENTER */}
        <MapEventHandler onChange={handleMapClick} />
      </MapContainer>
    </div>
  );
}
const MapEventHandler = ({ onChange }) => {
  const map = useMap();
  useMapEvents({
    // ✅ Bắt sự kiện CLICK
    click(e) {
      console.log("đã click");

      const { lat, lng } = e.latlng;
      const zoom = map.getZoom();

      if (onChange) {
        onChange({ latNew: lat, lngNew: lng, zoomNew: zoom });
      }
    },

    zoomend() {
      console.log("đã zoom");
      const zoom = map.getZoom();

      if (onChange) {
        onChange({
          latNew: null,
          lngNew: null,
          zoomNew: zoom,
        });
      }
    },
  });

  return null;
};
