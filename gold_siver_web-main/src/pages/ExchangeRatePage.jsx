import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format, parse, isValid } from "date-fns";
import { useTranslation } from "react-i18next";
import { useExchangeRate } from "../hooks/useExchangeRate";
import DatePickerWrapper from "../components/exchange-rate/DatePickerWrapper";
import ExchangeRateTable from "../components/exchange-rate/ExchangeRateTable";
import ExchangeRateChart from "../components/exchange-rate/ExchangeRateChart";
import USDHighlightBox from "../components/exchange-rate/USDHighlightBox";
import USDHistoryChart from "../components/exchange-rate/USDHistoryChart";
import RecentDatesList from "../components/exchange-rate/RecentDatesList";
import { parseDateFromUrl, formatDateForUrl } from "../utils/exchangeRateHelper";
import "./ExchangeRatePage.css";
import { logUserInfo } from "../utils/logUserInfo";
import axios from 'axios';
import BlackMarketExchangeRateTable from "../components/exchange-rate/BlackMarketExchangeRateTable";

/**
 * Trang Tỷ Giá USD
 */
const ExchangeRatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { t } = useTranslation();
  const { processedData, loading, error, getRateByDate, getLatestDate, getPreviousRate } = useExchangeRate();
  const [exchangeRates1, setExchangeRates] = useState(null);
  const [blackMarketLoading, setBlackMarketLoading] = useState(true);
  const [blackMarketError, setBlackMarketError] = useState(null);

  useEffect(() => {
    const fetchBlackMarketRates = async () => {
      try {
        setBlackMarketLoading(true);
        setBlackMarketError(null);

        const response = await axios.get(
          "https://api_gold.thinkdiff.us/tygia_chogia_vn"
        );

        if (Array.isArray(response?.data?.data?.data)) {
          setExchangeRates(response.data.data.data);
        } else {
          setBlackMarketError("Không tìm thấy dữ liệu tỷ giá");
        }
      } catch (error) {
        console.error("Error fetching black market rates:", error);
        setBlackMarketError("Không thể tải dữ liệu tỷ giá");
      } finally {
        setBlackMarketLoading(false);
      }
    };

    fetchBlackMarketRates();
  }, []);


  useEffect(() => {
    if (!location.pathname.startsWith("/ty-gia")) {
      navigate("/ty-gia", { replace: true });
      return;
    }
  }, [location.pathname, navigate]);
  useEffect(() => {
    (async () => {
      await logUserInfo("Màn hình ExchangeRatePage.jsx")
    })();
  }, []);

  // Parse date từ URL nếu có
  const urlDate = useMemo(() => {
    if (params.date) {
      // params.date có format "DD-MM-YYYY"
      const dateStr = parseDateFromUrl(params.date);
      const date = parse(dateStr, "yyyy-MM-dd", new Date());
      return isValid(date) ? date : new Date();
    }
    return new Date();
  }, [params.date]);

  const [selectedDate, setSelectedDate] = useState(urlDate);

  // Cập nhật selectedDate khi URL thay đổi
  useEffect(() => {
    setSelectedDate(urlDate);
  }, [urlDate]);

  // Format date thành string "YYYY-MM-DD"
  const selectedDateStr = useMemo(() => {
    return format(selectedDate, "yyyy-MM-dd");
  }, [selectedDate]);

  // Lấy ngày có dữ liệu mới nhất
  const latestDateStr = useMemo(() => {
    return getLatestDate();
  }, [getLatestDate]);

  // Lấy tỷ giá của ngày được chọn
  const exchangeRates = useMemo(() => {
    return getRateByDate(selectedDateStr);
  }, [selectedDateStr, getRateByDate]);

  // Kiểm tra xem ngày được chọn có dữ liệu không
  const hasDataForSelectedDate = useMemo(() => {
    return exchangeRates !== null && Object.keys(exchangeRates).length > 0;
  }, [exchangeRates]);

  // Lấy tỷ giá ngày trước để tính thay đổi
  const previousRates = useMemo(() => {
    if (!hasDataForSelectedDate) return null;
    return getPreviousRate(selectedDateStr);
  }, [selectedDateStr, hasDataForSelectedDate, getPreviousRate]);

  // Lấy USD rate (chỉ khi có dữ liệu)
  const usdRate = useMemo(() => {
    if (!hasDataForSelectedDate) return null;
    return exchangeRates?.USD_TUDO || exchangeRates?.USD || null;
  }, [exchangeRates, hasDataForSelectedDate]);

  const previousUsdRate = useMemo(() => {
    if (!hasDataForSelectedDate) return null;
    return previousRates?.USD_TUDO || previousRates?.USD || null;
  }, [previousRates, hasDataForSelectedDate]);

  // Xử lý khi người dùng chọn ngày mới - tự động update URL
  const handleDateChange = (date) => {
    if (!date) return;
    setSelectedDate(date);
    const dateStr = formatDateForUrl(format(date, "yyyy-MM-dd"));
    // Sử dụng replace: false để có thể back/forward, nhưng đảm bảo URL đúng
    navigate(`/ty-gia/${dateStr}`, { replace: false });
  };

  // Ngày tối đa và tối thiểu cho date picker
  const maxDate = new Date();
  const minDate = useMemo(() => {
    if (!processedData || Object.keys(processedData).length === 0) return null;
    const dates = Object.keys(processedData).sort();
    if (dates.length === 0) return null;
    return parse(dates[0], "yyyy-MM-dd", new Date());
  }, [processedData]);

  if (loading) {
    return (
      <div className="exchange-rate-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('exchangeRatePage.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exchange-rate-page">
        <div className="error-container">
          <p className="error-message">{t('exchangeRatePage.error', { error })}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            {t('exchangeRatePage.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exchange-rate-page">
      <div className="page-header">
        <h1 className="page-title">{t('exchangeRatePage.title')}</h1>
      </div>

      <div className="date-filter-section">
        <div className="date-picker-container">
          <label className="date-picker-label">{t('exchangeRatePage.selectDate')}</label>
          <DatePickerWrapper
            selected={selectedDate}
            onChange={handleDateChange}
            maxDate={maxDate}
            minDate={minDate}
          />
        </div>
      </div>

      {/* Thông báo nếu không có dữ liệu cho ngày được chọn */}
      {!hasDataForSelectedDate && latestDateStr && (
        <div className="no-data-notification">
          <p className="no-data-message">
            {t('exchangeRatePage.noDataWarning', { date: format(selectedDate, "dd/MM/yyyy") })}
          </p>
          <p className="latest-data-info">
            {t('exchangeRatePage.latestDataInfo', { date: format(parse(latestDateStr, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") })}
          </p>
          <button
            className="go-to-latest-btn"
            onClick={() => {
              const latestDate = parse(latestDateStr, "yyyy-MM-dd", new Date());
              handleDateChange(latestDate);
            }}
          >
            {t('exchangeRatePage.goToLatest')}
          </button>
        </div>
      )}

      {/* Khu vực 2 & 3: Bảng tỷ giá và Biểu đồ - chỉ hiển thị khi có dữ liệu */}
      {hasDataForSelectedDate && (
        <div className="main-content-grid">
          {/* Khu vực 2: Bảng tỷ giá (bên trái) */}
          <div className="table-section">
            {/* <ExchangeRateTable
              exchangeRates={exchangeRates}
              previousRates={previousRates}
            /> */}
            <BlackMarketExchangeRateTable exchangeRates={exchangeRates1} />

          </div>

          {/* Khu vực 3: Biểu đồ + USD Highlight Box (bên phải) */}
          <div className="chart-section">
            <USDHighlightBox usdRate={usdRate} previousUsdRate={previousUsdRate} />
            {/* <USDHistoryChart data={processedData} /> */}
            <ExchangeRateChart data={processedData} selectedCurrency="USD" />
          </div>
        </div>
      )}

      {/* Khu vực 4: Lịch sử tra cứu (phía dưới) */}
      <RecentDatesList data={processedData} count={7} />
    </div>
  );
};

export default ExchangeRatePage;

