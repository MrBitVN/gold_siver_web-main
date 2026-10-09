import { useState, useEffect, useMemo } from "react";
import {
  fetchExchangeRateHistory,
  processApiData,
  getExchangeRateByDate,
  getPreviousDate,
  getLatestDateWithData,
} from "../services/exchangeRateService";

/**
 * Custom hook quản lý logic fetch và process data tỷ giá
 * Cache data để tránh gọi API nhiều lần
 */
export const useExchangeRate = () => {
  const [rawData, setRawData] = useState(null);
  const [processedData, setProcessedData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data một lần khi mount
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchExchangeRateHistory();
        if (cancelled) return;

        const processed = processApiData(data);
        setRawData(data);
        setProcessedData(processed);
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading exchange rate data:", err);
          setError("Không thể tải dữ liệu tỷ giá. Vui lòng thử lại sau.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Hàm helper để lấy tỷ giá theo ngày
  const getRateByDate = useMemo(
    () => (dateStr) => {
      return getExchangeRateByDate(processedData, dateStr);
    },
    [processedData]
  );

  // Hàm helper để lấy ngày có dữ liệu mới nhất
  const getLatestDate = useMemo(
    () => () => {
      return getLatestDateWithData(processedData);
    },
    [processedData]
  );

  // Hàm helper để lấy tỷ giá ngày trước
  const getPreviousRate = useMemo(
    () => (dateStr) => {
      const previousDate = getPreviousDate(dateStr);
      return getExchangeRateByDate(processedData, previousDate);
    },
    [processedData]
  );

  return {
    processedData,
    loading,
    error,
    getRateByDate,
    getLatestDate,
    getPreviousRate,
  };
};

