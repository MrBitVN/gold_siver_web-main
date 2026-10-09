import React, { useState, useEffect, useMemo, useRef } from "react";
import { fetchFearIndex, filterByDays } from "../../services/analysisService";
import GaugeChart from "./GaugeChart";
import AnimatedGaugeChart from "./AnimatedGaugeChart";
import FearGreedChart from "./FearGreedChart";
import "./FearGreedIndex.css";
import { useTranslation } from "react-i18next";
/**
 * Component: Fear & Greed Index
 * Tự động thông báo "JM Bullion Bán vàng- bạc chốt lời nhé" khi chỉ số >= 96 kèm âm thanh
 */
const FearGreedIndex = () => {
  const { t, i18n } = useTranslation();
  const [fullHistory, setFullHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30);

  // State quản lý thông báo
  const [notification, setNotification] = useState(null);
  const audioRef = useRef(null);

  // Fetch dữ liệu từ API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchFearIndex();
        setFullHistory(data);
        setError(null);
      } catch (err) {
        console.error("Error loading fear index:", err);
        setError(t("FearGreedIndex.error"));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Hàm kích hoạt thông báo và âm thanh
  const triggerAlert = (type, value) => {
    const msg = t(
      type === "sell"
        ? "FearGreedIndex.alertSell"
        : "FearGreedIndex.alertBuy",
      { value }
    );

    setNotification({ type, message: msg });

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => {
        console.warn("Trình duyệt chặn âm thanh tự động. Hãy tương tác với trang trước.", e);
      });
    }

    // Tự động ẩn thông báo sau 5 giây
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Logic tự động bắn Noti: nếu >95 => bán, nếu <70 => mua; lặp mỗi 2 phút
  useEffect(() => {
    let interval;
    const latestValue = fullHistory[fullHistory.length - 1]?.chiso;

    if (latestValue != null) {
      if (latestValue >= 95) {
        triggerAlert("sell", latestValue);
        interval = setInterval(() => triggerAlert("sell", latestValue), 120000); // 2 phút
      } else if (latestValue < 70) {
        triggerAlert("buy", latestValue);
        interval = setInterval(() => triggerAlert("buy", latestValue), 120000); // 2 phút
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fullHistory]);

  const displayHistory = useMemo(() => filterByDays(fullHistory, timeRange), [fullHistory, timeRange]);
  const latestIndex = useMemo(() => fullHistory.length > 0 ? fullHistory[fullHistory.length - 1] : null, [fullHistory]);
  const yesterdayIndex = useMemo(() => fullHistory.length >= 2 ? fullHistory[fullHistory.length - 2] : null, [fullHistory]);
  const weekAgoIndex = useMemo(() => fullHistory.length >= 8 ? fullHistory[fullHistory.length - 8] : null, [fullHistory]);
  const monthAgoIndex = useMemo(() => fullHistory.length >= 31 ? fullHistory[fullHistory.length - 31] : null, [fullHistory]);

  if (loading) return (
    <div className="fear-greed-section">
      <div className="loading-container"><div className="spinner"></div><p>{t("FearGreedIndex.loading")}</p></div>
    </div>
  );

  if (error) return (
    <div className="fear-greed-section">
      <div className="error-container"><p className="error-message">⚠️ {error}</p></div>
    </div>
  );

  if (!latestIndex) return null;

  return (
    <div className="fear-greed-section">
      {/* File âm thanh chính xác: jmbullion_check.mp3 */}
      <audio ref={audioRef} src="/jmbullion_check.mp3" preload="auto" />

      {/* Popup thông báo nhỏ gọn giữa màn hình */}
      {notification && (
        <div className={notification.type === "sell" ? "sell-notification" : "buy-notification"}>
          <button
            className="notification-close"
            onClick={() => setNotification(null)}
            aria-label="Close notification"
          >
            ✕
          </button>
          {notification.message}
        </div>
      )}

      <div className="section-header">
        <h2 className="section-title" style={{ color: "#2ECC71" }}>📊 {t("FearGreedIndex.brand")}</h2>
        <p className="section-subtitle">{t("FearGreedIndex.subtitle")}</p>
      </div>

      <div className="fear-greed-content">
        <div className="overview-section">
          <div className="main-gauge">
            <h3 className="gauge-title">{t("FearGreedIndex.currentIndex")}</h3>
            <AnimatedGaugeChart value={latestIndex.chiso} />
            <div className="gauge-date">{t("FearGreedIndex.update")}: {latestIndex.id_time}</div>
          </div>

          <div className="comparison-gauges">
            <div className="gauge-item">
              <h4>{t("FearGreedIndex.yesterday")}</h4>
              {yesterdayIndex ? <GaugeChart value={yesterdayIndex.chiso} size="small" showLabel={false} /> : <p className="no-data-small">{t("FearGreedIndex.noData")}</p>}
            </div>
            <div className="gauge-item">
              <h4>{t("FearGreedIndex.lastWeek")}</h4>
              {weekAgoIndex ? <GaugeChart value={weekAgoIndex.chiso} size="small" showLabel={false} /> : <p className="no-data-small">{t("FearGreedIndex.noData")}</p>}
            </div>
            <div className="gauge-item">
              <h4>{t("FearGreedIndex.lastMonth")}</h4>
              {monthAgoIndex ? <GaugeChart value={monthAgoIndex.chiso} size="small" showLabel={false} /> : <p className="no-data-small">{t("FearGreedIndex.noData")}</p>}
            </div>
          </div>
        </div>

        <div className="history-section">
          <div className="history-header">
            <h3 className="history-title">{t("FearGreedIndex.history")}</h3>
            <div className="time-filter">
              {[7, 30, 90, 365].map((range) => (
                <button
                  key={range}
                  className={`filter-btn ${timeRange === range ? "active" : ""}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range === 365
                    ? t("FearGreedIndex.oneYear")
                    : t("FearGreedIndex.days", { count: range })}
                </button>
              ))}
            </div>
          </div>
          <FearGreedChart data={displayHistory} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(FearGreedIndex);