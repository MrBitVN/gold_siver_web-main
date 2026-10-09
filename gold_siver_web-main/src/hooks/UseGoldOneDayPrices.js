import { useEffect, useMemo, useState } from "react";
import {
  fetchVangOneDayData,
  getLatestUpdateTime,
  findNearestAvailableFile,
} from "../services/goldOneDay";
import { fetchVang247FileList } from "../services/allVang247Service";

// Custom hook quản lý dữ liệu + filter/sort theo yêu cầu
export const UseGoldOneDayPrices = (filterOptions) => {
  const [allPrices, setAllPrices] = useState([]);
  const [fomo, setFomo] = useState(null);
  const [news, setNews] = useState(null);
  const [charts, setCharts] = useState(null);
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
        const { day, month, year, hour, minute } = filterOptions;

        if (!day || !month || !year || !hour || !minute) {
          setLoading(false);
          setAllPrices([]);
          setError(null);
          return;
        }

        setLoading(true);
        setAllPrices([]);
        setError(null);
        setLoadingProgress({ loaded: 0, total: 1 });

        const normalizedHour = String(Number(hour));
        const normalizedMinute = String(Number(minute));

        try {
          const data = await fetchVangOneDayData(
            day,
            month,
            year,
            normalizedHour,
            normalizedMinute,
          );
          if (cancelled) return;
          setAllPrices(data.list_server || []);
          setFomo(data.phan_tich);
          setNews(data.tin_tuc);
          setCharts(data.bieu_do);
          setLoadingProgress({ loaded: 1, total: 1 });
          setError(null);
        } catch (err) {
          if (cancelled) return;

          if (err.isNotFound) {
            try {
              const fileList = await fetchVang247FileList(day, month, year);

              const parseDateFromFileUrl = (link) => {
                try {
                  const filename = link.split("/").pop().replace(".json", "");
                  const parts = filename.split("_");
                  if (parts.length >= 5) {
                    const [d, m, y, h, min] = parts;
                    return { day: d, month: m, year: y, hour: h, minute: min };
                  }
                  return null;
                } catch (e) {
                  return null;
                }
              };

              const parsedFiles = (fileList || [])
                .map((item) => parseDateFromFileUrl(item.link))
                .filter((f) => f !== null);

              const nearestFile = findNearestAvailableFile(
                parsedFiles,
                normalizedHour,
                normalizedMinute,
              );

              if (nearestFile) {
                const data = await fetchVangOneDayData(
                  nearestFile.day,
                  nearestFile.month,
                  nearestFile.year,
                  nearestFile.hour,
                  nearestFile.minute,
                );
                if (cancelled) return;
                setAllPrices(data.list_server || []);
                setFomo(data.phan_tich);
                setNews(data.tin_tuc);
                setCharts(data.bieu_do);
                setLoadingProgress({ loaded: 1, total: 1 });
                setError(null);
              } else {
                throw new Error(
                  `Không tìm thấy dữ liệu cho ngày ${day}/${month}/${year}`,
                );
              }
            } catch (fallbackErr) {
              if (!cancelled) {
                setError(
                  `Không tìm thấy dữ liệu cho ngày ${day}/${month}/${year} lúc ${normalizedHour}:${normalizedMinute}`,
                );
              }
            }
          } else {
            if (!cancelled) {
              setError(
                err.message ||
                  "Không thể tải dữ liệu giá vàng. Vui lòng thử lại sau.",
              );
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Lỗi hệ thống khi tải dữ liệu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadGoldPrices();

    return () => {
      cancelled = true;
    };
  }, [
    filterOptions.day,
    filterOptions.month,
    filterOptions.year,
    filterOptions.hour,
    filterOptions.minute,
  ]);

  const displayedPrices = useMemo(() => {
    if (!allPrices || !Array.isArray(allPrices)) return [];

    // ✅ Lọc bỏ các vendor null/undefined
    const validVendors = allPrices.filter((v) => v != null);

    // 1. Lọc Region (Việt Nam / Quốc tế)
    let regionFiltered = validVendors;
    if (filterOptions.region) {
      if (filterOptions.region === "vietnam") {
        regionFiltered = validVendors.filter(
          (vendor) =>
            vendor.quoc_gia === "Vietnam" ||
            vendor.quoc_gia === "Việt Nam" ||
            !vendor.quoc_gia,
        );
      } else if (filterOptions.region === "international") {
        regionFiltered = validVendors.filter(
          (vendor) =>
            vendor.quoc_gia &&
            vendor.quoc_gia !== "Vietnam" &&
            vendor.quoc_gia !== "Việt Nam",
        );
      } else {
        regionFiltered = validVendors.filter(
          (vendor) => vendor.quoc_gia === filterOptions.region,
        );
      }
    }

    // 2. Map và Filter Items an toàn (Sửa lỗi crash tại đây)
    const filtered = regionFiltered
      .map((vendor) => {
        // Hỗ trợ cả cấu trúc vendor.items và vendor.data.data.items cho quốc tế
        let rawItems = vendor.items || vendor.data?.data?.items || [];

        // Đảm bảo rawItems luôn là mảng để filter không bị crash
        if (!Array.isArray(rawItems)) rawItems = [];

        return {
          ...vendor,
          items: rawItems.filter((item) => {
            if (!item || !item.TYPE) return false;
            const itemType = item.TYPE.toUpperCase();
            if (filterOptions.type === "gold")
              return itemType === "VANG" || itemType === "GOLD";
            if (filterOptions.type === "silver")
              return itemType === "BAC" || itemType === "SILVER";
            return true;
          }),
        };
      })
      .filter((v) => v.items && v.items.length > 0);

    // 3. Logic cũ: Chuẩn hóa giá tiền tỉ / 1000
    const filteredItems = filtered.map((vendor) => ({
      ...vendor,
      items: vendor.items.map((item) => ({
        ...item,
        buy:
          Number(item.buy) > 1_000_000_000
            ? Number(item.buy) / 1000
            : Number(item.buy),
        sell:
          Number(item.sell) > 1_000_000_000
            ? Number(item.sell) / 1000
            : Number(item.sell),
      })),
    }));

    return filteredItems;
  }, [allPrices, filterOptions]);

  const lastUpdated = useMemo(
    () => getLatestUpdateTime(allPrices),
    [allPrices],
  );

  const availableCountries = useMemo(() => {
    const countries = new Set();
    if (Array.isArray(allPrices)) {
      allPrices.forEach((vendor) => {
        if (vendor.quoc_gia) {
          countries.add(vendor.quoc_gia);
        }
      });
    }
    return Array.from(countries).sort();
  }, [allPrices]);

  return {
    loading,
    error,
    displayedPrices,
    lastUpdated,
    loadingProgress,
    availableCountries,
    fomo,
    news,
    charts,
  };
};
