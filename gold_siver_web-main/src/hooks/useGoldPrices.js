import { useEffect, useMemo, useState } from "react";
import {
  fetchGoldPricesIncremental,
  getLatestUpdateTime,
} from "../services/goldService";

// Custom hook quản lý dữ liệu + filter/sort theo yêu cầu
export const useGoldPrices = (filterOptions) => {
  const [allPrices, setAllPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState({
    loaded: 0,
    total: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const loadGoldPrices = async () => {
      try {
        setLoading(true);
        setAllPrices([]);
        setError(null);
        setLoadingProgress({ loaded: 0, total: 20 }); // 20 APIs

        // Incremental loading: hiển thị vendor ngay khi xong
        await fetchGoldPricesIncremental((vendor, loaded, total) => {
          if (cancelled) return;

          // Cập nhật progress
          setLoadingProgress({ loaded, total });

          // Thêm vendor vào danh sách (tránh duplicate)
          setAllPrices((prev) => {
            // ✅ Kiểm tra vendor không null trước
            if (!vendor || !vendor.site) return prev;
            const key = vendor.site || vendor.name;
            const exists = prev.find((v) => v && (v.site || v.name) === key);
            if (exists) return prev;
            return [...prev, vendor];
          });
        });

        if (!cancelled) {
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading gold prices:", err);
          setError("Không thể tải dữ liệu giá vàng. Vui lòng thử lại sau.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadGoldPrices();

    return () => {
      cancelled = true;
    };
  }, []);

  // Lọc + Sắp xếp theo reference item (9999 cho vàng, 1KG_BAC_999 cho bạc)
  const displayedPrices = useMemo(() => {
    // 0) Lọc theo region (Việt Nam / Quốc Tế)
    let regionFiltered = allPrices;
    if (filterOptions.region) {
      if (filterOptions.region === "vietnam") {
        // Chỉ lấy vendors Việt Nam
        regionFiltered = allPrices.filter(
          (vendor) =>
            vendor.quoc_gia === "Vietnam" ||
            vendor.quoc_gia === "Việt Nam" ||
            !vendor.quoc_gia,
        );
      } else if (filterOptions.region === "international") {
        // Chỉ lấy vendors quốc tế (không phải Việt Nam)
        regionFiltered = allPrices.filter(
          (vendor) =>
            vendor.quoc_gia &&
            vendor.quoc_gia !== "Vietnam" &&
            vendor.quoc_gia !== "Việt Nam",
        );
      }
    }

    // 1) Lọc theo quốc gia cụ thể (trong region đã chọn)
    let countryFiltered = regionFiltered;
    if (filterOptions.country && filterOptions.country !== "all") {
      countryFiltered = regionFiltered.filter(
        (vendor) => vendor.quoc_gia === filterOptions.country,
      );
    }

    // 2) Lọc theo loại (vàng/bạc)
    const filtered = countryFiltered
      .map((vendor) => ({
        ...vendor,
        items: vendor.items.filter((item) => {
          const itemType = item.TYPE?.toUpperCase();
          if (filterOptions.type === "gold")
            return itemType === "VANG" || itemType === "GOLD";
          if (filterOptions.type === "silver")
            return itemType === "BAC" || itemType === "SILVER";
          return true;
        }),
      }))
      .filter((v) => v.items.length > 0);

    const getReferenceItem = (vendor) => {
      const refPurity =
        filterOptions.type === "silver" ? "1KG_BAC_999" : "9999";
      return vendor.items.find((it) => it.purity === refPurity) || null;
    };

    if (!filterOptions.sortBy) return filtered;

    const sign = filterOptions.sortOrder === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      if (filterOptions.sortBy === "reputation") {
        const ar = Number(a.do_uy_tin ?? 0);
        const br = Number(b.do_uy_tin ?? 0);
        //do uy tin
        return ar - br;
      }

      // Sắp xếp theo chênh lệch giá (spread = sell - buy)
      if (filterOptions.sortBy === "spread") {
        const aRef = getReferenceItem(a);
        const bRef = getReferenceItem(b);

        if (!aRef && !bRef) return 0;
        if (!aRef) return 1;
        if (!bRef) return -1;

        const aSpread = (aRef.sell ?? 0) - (aRef.buy ?? 0);
        const bSpread = (bRef.sell ?? 0) - (bRef.buy ?? 0);

        return (aSpread - bSpread) * sign;
      }

      const aRef = getReferenceItem(a);
      const bRef = getReferenceItem(b);
      if (!aRef && !bRef) return 0;
      if (!aRef) return 1;
      if (!bRef) return -1;

      const aVal = filterOptions.sortBy === "buyPrice" ? aRef.buy : aRef.sell;
      const bVal = filterOptions.sortBy === "buyPrice" ? bRef.buy : bRef.sell;

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      return (aVal - bVal) * sign;
    });

    return sorted;
  }, [allPrices, filterOptions]);

  const lastUpdated = useMemo(
    () => getLatestUpdateTime(allPrices),
    [allPrices],
  );

  // Danh sách quốc gia có trong dữ liệu (để hiển thị trong filter)
  const availableCountries = useMemo(() => {
    const countries = new Set();
    allPrices.forEach((vendor) => {
      if (vendor.quoc_gia) {
        countries.add(vendor.quoc_gia);
      }
    });
    return Array.from(countries).sort();
  }, [allPrices]);

  return {
    loading,
    error,
    displayedPrices,
    lastUpdated,
    loadingProgress,
    availableCountries,
  };
};
