import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./FilterBar.css";
import TimeRangeSelector from "./TimeRangeSelector";
import MapView from "../../pages/Map-view";
import { Link } from "react-router-dom";
import { useGeolocation } from "../../hooks/useGeoLocation";

// Thêm props showComparison và onToggleComparison để điều khiển giao diện so sánh quốc tế
const FilterBar = React.memo(({
  filterOptions,
  onFilterChange,
  uiFilter,
  setUiFilter,
  availableCountries,
  showAnalysis,
  onToggleAnalysis,
  showComparison,
  onToggleComparison,
  disableAutoRedirect = false,
}) => {
  const { t } = useTranslation();
  const { region, type, day, month, year, hour, minute } = filterOptions;
  const normalizedRegion = region?.toString?.().toLowerCase?.();
  const isVietnamRegion = normalizedRegion === "vietnam";
  const isInternationalRegion = normalizedRegion === "international";
  const actualRegion = normalizedRegion || region;
  const { coords, erroll } = useGeolocation();

  const setType = useCallback((type) => {
    onFilterChange({ ...filterOptions, type });
  }, [filterOptions, onFilterChange]);

  const setRegion = useCallback((regionValue) => {
    const normalized = regionValue.toString().toLowerCase();

    if (normalized === "international") {
      setUiFilter((prev) => ({ ...prev, distanceKm: "all" }));
      onFilterChange({ ...filterOptions, region: normalized, country: "international" });
    }

    if (normalized === "vietnam") {
      setUiFilter((prev) => ({ ...prev, distanceKm: "20" }));
      onFilterChange({ ...filterOptions, region: normalized, country: "VIETNAM" });
    }
  }, [filterOptions, onFilterChange, setUiFilter]);

  const onChangeSortBy = (sortBy) => {
    setUiFilter((pre) => ({ ...pre, sortBy: sortBy }));
  }

  const onChangeSortOrder = (order) => {
    setUiFilter((pre) => ({ ...pre, sortOrder: order }));
  }

  const onChangeDistanceKm = (distanceKm) => {
    setUiFilter((pre) => ({ ...pre, distanceKm: distanceKm }));
  }

  useEffect(() => {
    if (isVietnamRegion && uiFilter.distanceKm === "all") {
      setUiFilter((prev) => ({ ...prev, distanceKm: "20" }));
    } else if (isInternationalRegion && uiFilter.distanceKm !== "all") {
      setUiFilter((prev) => ({ ...prev, distanceKm: "all" }));
    }
  }, [isVietnamRegion, isInternationalRegion, uiFilter.distanceKm, setUiFilter]);

  const mapUrl = coords ? `/map-view/${actualRegion}/${type}/${day}/${month}/${year}/${hour}/${minute}/13/${coords.latitude}/${coords.longitude}` : "#"

  return (
    <div className="filter-bar">
      <div className="filter-container">
        <div className="toolbar">
          <div className="topbar">
            {/* Region pills */}
            <div className="pill-group">
              <button className={`pill-btn ${isVietnamRegion ? "active" : ""}`} onClick={() => setRegion("vietnam")}>
                🇻🇳 {t('FilterBar.vietnam', 'Việt Nam')}
              </button>
              <button className={`pill-btn ${isInternationalRegion ? "active" : ""}`} onClick={() => setRegion("international")}>
                🌍 {t('FilterBar.international', 'Quốc Tế')}
              </button>
            </div>

            {/* Type pills */}
            <div className="pill-group">
              <button className={`pill-btn ${filterOptions.type === "gold" ? "active" : ""}`} onClick={() => setType("gold")}>{t('ForexNews.tabs.gold', 'Vàng')}</button>
              <button className={`pill-btn ${filterOptions.type === "silver" ? "active" : ""}`} onClick={() => setType("silver")}>{t('AnalysisGoldSilverTable.silver', 'Bạc')}</button>
            </div>

            <div className="pill-group">
              <Link
                className={`pill-btn ${!coords ? "disabled" : ""}`}
                to={mapUrl}
                onClick={(e) => !coords && e.preventDefault()}
              >
                {t('FilterBar.openMap', 'Mở bản đồ')}
              </Link>
            </div>

            {/* CỤM NÚT PHÂN TÍCH & SO SÁNH */}
            <div className="pill-group">
              {/* Bảng giá / Phân tích */}
              <button
                className={`pill-btn ${showAnalysis ? "active" : ""}`}
                onClick={() => {
                  onToggleComparison(false);
                  onToggleAnalysis(!showAnalysis);
                }}
              >
                {showAnalysis ? `📊 ${t('common.bar', 'Phân tích')}` : `💰 ${t('menu.goldPrice', 'Bảng giá')}`}
              </button>
              {/* So sánh quốc gia */}
              {onToggleComparison && (
                <button
                  className={`pill-btn ${showComparison ? "active" : ""}`}
                  onClick={() => {
                    onToggleAnalysis(false);
                    onToggleComparison(!showComparison);
                  }}
                >
                  🌐 {t('FilterBar.compareCountries', 'So sánh quốc gia')}
                </button>
              )}

            </div>
          </div>

          {/* Các dropdown sắp xếp giữ nguyên bên dưới */}
          <div className="pill-selects">
            {/* ... (giữ nguyên phần select cũ của anh) ... */}
            <label className="pill-select">
              <span className="label">{t('FilterBar.sortBy', 'Sắp xếp Theo')}</span>
              <select value={uiFilter.sortBy} onChange={(e) => onChangeSortBy(e.target.value)}>
                <option value="reputation">{t('FilterBar.reputation', 'Độ uy tín')}</option>
                <option value="buyPrice">{t('FilterBar.buyPriceLabel', 'Giá mua vào')}</option>
                <option value="sellPrice">{t('FilterBar.sellPriceLabel', 'Giá bán ra')}</option>
                <option value="spread">{t('FilterBar.spread', 'Chênh lệch giá')}</option>
              </select>
            </label>

            <TimeRangeSelector disableAutoRedirect={disableAutoRedirect} />

            {/* Lọc theo khoảng cách km - chỉ hiện khi region = vietnam */}
            {isVietnamRegion && (
              <label className="pill-select">
                <span className="label">📍 {t('FilterBar.distance', 'Khoảng cách')}</span>
                <select
                  value={uiFilter.distanceKm}
                  onChange={(e) => onChangeDistanceKm(e.target.value)}
                >
                  <option value="all">{t('common.all', 'Tất cả')}</option>
                  <option value="5">{t('FilterBar.withinKm', { km: 5 }, 'Trong 5 km')}</option>
                  <option value="10">{t('FilterBar.withinKm', { km: 10 }, 'Trong 10 km')}</option>
                  <option value="20">{t('FilterBar.withinKm', { km: 20 }, 'Trong 20 km')}</option>
                  <option value="50">{t('FilterBar.withinKm', { km: 50 }, 'Trong 50 km')}</option>
                  <option value="100">{t('FilterBar.withinKm', { km: 100 }, 'Trong 100 km')}</option>
                  <option value="200">{t('FilterBar.withinKm', { km: 200 }, 'Trong 200 km')}</option>
                  <option value="2000">{t('FilterBar.withinKm', { km: 2000 }, 'Trong 2000 km')}</option>
                </select>
              </label>
            )}

            {/* ... tiếp tục các select khác ... */}
          </div>
        </div>
      </div>
    </div >
  );
});

FilterBar.displayName = 'FilterBar';
export default FilterBar;