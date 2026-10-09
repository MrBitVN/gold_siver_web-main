import React, { useMemo, useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import FilterBar from "./filter-bar/FilterBar";
import PriceTable from "./table-price/PriceTable";
import { useGeolocation } from "../hooks/useGeoLocation";
import { convertToKey } from "../utils/convertToKey";
import { Link, useNavigate } from "react-router-dom";
// import ComparisonChart from "./GoldPriceDashboard/ComparisonChart"; // Tạm comment vì logic đang dùng navigate

const GoldPriceDashboard = React.memo(
  ({
    loading,
    error,
    displayedPrices,
    filterOptions,
    onFilterChange,
    loadingProgress,
    availableCountries,
    showAnalysis,
    onToggleAnalysis,
    exchangeRateUSD,
    uiFilter: uiFilterProp,
    setUiFilter: setUiFilterProp,
    showFilterBar = true,
  }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { coords, errorLocation } = useGeolocation(); // Sửa typo errorLocaion
    const normalizedRegion = filterOptions.region?.toString?.().toLowerCase?.();
    const isInternationalRegion = normalizedRegion === "international";

    // --- 1. LOCAL STATE ---
    // Dùng props nếu được truyền từ ngoài, ngược lại dùng local state
    const [localUiFilter, setLocalUiFilter] = useState({
      sortBy: "reputation",
      sortOrder: "asc",
      distanceKm: "all",
    });
    const uiFilter = uiFilterProp ?? localUiFilter;
    const setUiFilter = setUiFilterProp ?? setLocalUiFilter;

    // Reset filter khi region/type thay đổi
    useEffect(() => {
      setUiFilter((prev) => ({
        ...prev,
        distanceKm: isInternationalRegion ? "all" : "20", // Có thể cân nhắc logic check coords trước khi set mặc định 20km
      }));
    }, [isInternationalRegion, filterOptions.type]);

    // --- 2. DATA PROCESSING (Gộp Normalize + Distance Filter) ---
    // Sử dụng useMemo để tính toán danh sách cuối cùng, tránh dùng useEffect + useState
    const finalProcessedPrices = useMemo(() => {
      let result = [];

      // A. Tách SJC Tự Do & Normalize Items
      displayedPrices.forEach((vendor) => {
        const specialItems = [];
        const normalItems = [];

        vendor.items.forEach((item) => {
          if (item.product === "SJC Tu Do") {
            specialItems.push(item);
          } else {
            normalItems.push(item);
          }
        });

        // Vendor gốc (nếu còn items)
        if (normalItems.length > 0) {
          result.push({
            ...vendor,
            items: normalItems,
            skipDistanceFilter: false,
          });
        }

        // Vendor SJC Tự Do tách riêng
        specialItems.forEach((item) => {
          result.push({
            ...vendor,
            name: vendor.name + " - " + item.product,
            items: [item],
            do_uy_tin: 1,
            skipDistanceFilter: true,
          });
        });
      });

      // B. Tính khoảng cách (nếu có tọa độ)
      if (coords && typeof coords.latitude === "number" && typeof coords.longitude === "number") {
        result = addDistanceStoresWithinRadius(
          result,
          coords.latitude,
          coords.longitude,
        );
      } else {
        result = result.map((v) => ({ ...v, distance: null }));
      }

      // C. Lọc theo khoảng cách (Logic được chuyển vào đây thay vì useEffect riêng)
      if (uiFilter.distanceKm !== "all") {
        const km = Number(uiFilter.distanceKm);
        result = result.filter(
          (v) =>
            v.skipDistanceFilter || (v.distance != null && v.distance <= km),
        );
      }

      return result;
    }, [displayedPrices, coords, uiFilter.distanceKm]);

    // --- 3. GROUPING ---
    const { trustGroups, trustLevels } = useMemo(() => {
      let groups = {};
      let levels = [];
      const isSortByReputation = uiFilter.sortBy === "reputation";

      if (isSortByReputation) {
        finalProcessedPrices.forEach((item) => {
          const trust = item.do_uy_tin ?? 0;
          if (!groups[trust]) groups[trust] = [];
          groups[trust].push(item);
        });

        levels = Object.keys(groups)
          .map(Number)
          .sort((a, b) => (uiFilter.sortOrder === "asc" ? a - b : b - a));
      } else {
        // Nếu sort tiêu chí khác, gom tất cả vào 1 nhóm để dễ map
        groups = { 0: finalProcessedPrices };
        levels = [0];
      }

      return { trustGroups: groups, trustLevels: levels };
    }, [finalProcessedPrices, uiFilter.sortBy, uiFilter.sortOrder]);

    // --- 4. SORTING ---
    const sortVendorItems = useCallback(
      (items) => {
        const { sortBy, sortOrder } = uiFilter;

        return [...items].sort((a, b) => {
          let aVal = 0,
            bVal = 0;

          // Helper lấy item đại diện (9999 hoặc SJC Tự Do)
          const getRepItem = (vendor) =>
            vendor.items.find(
              (it) => it.purity === "9999" || it.product === "SJC Tu Do",
            );

          const aItem = getRepItem(a);
          const bItem = getRepItem(b);

          switch (sortBy) {
            case "buyPrice":
              aVal = aItem?.buy ?? 0;
              bVal = bItem?.buy ?? 0;
              break;
            case "sellPrice":
            case "gold9999":
              aVal = aItem?.sell ?? 0;
              bVal = bItem?.sell ?? 0;
              break;
            case "reputation":
              aVal = a.do_uy_tin ?? 0;
              bVal = b.do_uy_tin ?? 0;
              break;
            case "spread":
              aVal = aItem ? aItem.sell - aItem.buy : 0;
              bVal = bItem ? bItem.sell - bItem.buy : 0;
              break;
            default:
              break;
          }

          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        });
      },
      [uiFilter.sortBy, uiFilter.sortOrder],
    );

    const isAllFilter = uiFilter.sortBy === "reputation";
    const { region, type, day, month, year, hour, minute } = filterOptions;
    const comparisonSellChartUrl = `/comparison-chart/${region}/${type}/${day}/${month}/${year}/${hour}/${minute}/`;

    // --- RENDER ---
    if (loading && displayedPrices.length === 0) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('GoldPriceDashboard.loadingPrices')}</p>
          {loadingProgress.total > 0 && (
            <p className="loading-progress">
              {t('GoldPriceDashboard.loadingProgress', { loaded: loadingProgress.loaded, total: loadingProgress.total })}
            </p>
          )}
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
          <button
            className="retry-btn"
            onClick={() => window.location.reload()}
          >
            {t('GoldPriceDashboard.retry')}
          </button>
        </div>
      );
    }

    return (
      <>
        {showFilterBar && (
          <FilterBar
            filterOptions={filterOptions}
            onFilterChange={onFilterChange}
            uiFilter={uiFilter}
            setUiFilter={setUiFilter}
            availableCountries={availableCountries}
            showAnalysis={showAnalysis}
            onToggleAnalysis={onToggleAnalysis}
            showComparison={false}
            onToggleComparison={() => {}}
          />
        )}

        {finalProcessedPrices.length === 0 ? (
          <div className="no-data">
            <p>{t('GoldPriceDashboard.noData')}</p>
          </div>
        ) : (
          <>
            {loading && (
              <div className="loading-banner">
                <span className="spinner-small"></span>
                {t('GoldPriceDashboard.loadingMore')} ({loadingProgress.loaded}/
                {loadingProgress.total})
              </div>
            )}

            {trustLevels.map((level) => {
              const vendors = sortVendorItems(trustGroups[level]);
              // Tạo query string cho danh sách các nhà vàng trong nhóm này
              const nameGoldHouseList = vendors
                .map((o) => convertToKey(o?.name))
                .join("|");

              return (
                <div key={level} className="trust-group">
                  {isAllFilter && (
                    <h3 className="trust-header">{t('GoldPriceDashboard.reputationLevel', { level })}</h3>
                  )}

                  {/* Action Buttons */}
                  <div className="group-actions">
                    <button
                      className="pill-btn"
                      onClick={() =>
                        navigate(`/so-sanh-nha-vang?data=${nameGoldHouseList}`)
                      }
                    >
                      {t('GoldPriceDashboard.compareHistoryBtn')}
                    </button>
                    <Link
                      to={`${comparisonSellChartUrl}${level}`}
                      className="pill-btn"
                    >
                      {t('GoldPriceDashboard.compareCurrentBtn', { type: filterOptions.type === "gold" ? t('AnalysisGoldSilverTable.gold') : t('AnalysisGoldSilverTable.silver') })}
                    </Link>
                  </div>

                  <div
                    className={`price-grid ${filterOptions.region === "international" ? "grid-international" : ""}`}
                  >
                    {vendors.map((priceData, index) => (
                      <PriceTable
                        key={`${priceData.name}-${index}`} // Key nên unique hơn index nếu có thể
                        vendorData={priceData}
                        isInternational={
                          filterOptions.region === "international"
                        }
                        exchangeRateUSD={exchangeRateUSD}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </>
    );
  },
);

GoldPriceDashboard.displayName = "GoldPriceDashboard";

// --- UTILS (Nên tách ra file riêng nếu được) ---
function distanceInKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 == null || lon1 == null || lat2 == null || lon2 == null ||
    Number.isNaN(lat1) || Number.isNaN(lon1) || Number.isNaN(lat2) || Number.isNaN(lon2)
  ) {
    return null;
  }

  const R = 6371;
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLon = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((Number(lat1) * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export const addDistanceStoresWithinRadius = (stores, userLat, userLong) => {
  if (!stores || !Array.isArray(stores)) return [];

  return stores
    .filter((store) => store != null)
    .map((store) => {
      if (!store.maps || !Array.isArray(store.maps) || store.maps.length === 0) {
        return { ...store, distance: null };
      }

      const distances = store.maps
        .map((m) => distanceInKm(userLat, userLong, m.lat, m.long))
        .filter((d) => d != null && !Number.isNaN(d));

      if (distances.length === 0) return { ...store, distance: null };
      return { ...store, distance: Math.min(...distances) };
    });
};

export default GoldPriceDashboard;
