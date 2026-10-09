import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./NotificationStyles.css";

const SILVER_ETFS = ["SLV", "PSLV", "SILJ", "161226.SZ", "1542.T"];

const getCountryCode = (id) => {
  if (id.endsWith(".SZ") || id.endsWith(".SS")) return "cn";
  if (id.endsWith(".T")) return "jp";
  if (id === "PSLV") return "ca";
  return "us";
};

const getETFName = (id) => {
  const silverETFs = {
    SLV: "iShares Silver Trust",
    PSLV: "Sprott Physical Silver",
    ZSL: "3x Inverse Silver",
    SILJ: "Junior Silver Miners",
    "161226.SZ": "UBS Silver Futures",
    "1542.T": "Japan Physical Silver",
  };
  return silverETFs[id] || id;
};

const pickTopMovers = (stocks, etfGroup) => {
  if (!stocks) return { topGain: null, topLoss: null };
  const arr = Object.values(stocks)
    .map((s) => ({ ...s, changePercent: Number(s.changePercent) }))
    .filter((s) => etfGroup.includes(s.id) && !isNaN(s.changePercent));

  if (!arr.length) return { topGain: null, topLoss: null };
  return {
    topGain:
      arr
        .filter((s) => s.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)[0] || null,
    topLoss:
      arr
        .filter((s) => s.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)[0] || null,
  };
};

const getNextEntry = (stocks, direction) => {
  const { topGain, topLoss } = pickTopMovers(stocks, SILVER_ETFS);
  if (direction === "loss" && topLoss)
    return { entry: topLoss, labelKey: "SilverNotification.topLoss" };
  if (topGain) return { entry: topGain, labelKey: "SilverNotification.topGain" };
  return null;
};

const SilverNotification = ({ interval = 38000 }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState(null);
  const stocksRef = useRef({});
  const timerRef = useRef(null);
  const dirRef = useRef("gain");

  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.stocks) stocksRef.current = e.detail.stocks;
    };
    window.addEventListener("yahooStocksUpdated", handler);
    return () => window.removeEventListener("yahooStocksUpdated", handler);
  }, []);

  useEffect(() => {
    // Trong showOnce, thêm kiểm tra tránh set state khi component đã unmount
    const showOnce = () => {
      if (!stocksRef.current) return;

      const result = getNextEntry(stocksRef.current, dirRef.current);
      if (!result) return;

      setPayload({
        label: t(result.labelKey),
        name: getETFName(result.entry.id),
        pct: result.entry.changePercent,
        id: result.entry.id,
      });

      setVisible(true);

      // Tự động ẩn sau 12 giây
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 12000);

      // Optional: clear timeout nếu component unmount sớm
      return () => clearTimeout(hideTimer);
    };

    const initialTimeout = setTimeout(showOnce, 14000);
    timerRef.current = setInterval(showOnce, interval);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(timerRef.current);
    };
  }, [interval]);

  // Thay toàn bộ phần return của component bằng đoạn này:

  if (!visible || !payload) return null;

  return (
    <div
      className="etf-notification silver-notification"
      style={{
        top: "10px",
        left: "10px",
        width: "auto",
        minWidth: "220px",
        maxWidth: "280px",
        padding: "4px 8px",
      }}
    >
      <div className="notification-inner" style={{ padding: 0 }}>
        <button
          className="notification-close"
          onClick={() => setVisible(false)}
          style={{ top: "-2px", right: "-2px", fontSize: "16px" }}
        >
          ×
        </button>

        <div
          className="notification-label"
          style={{
            fontSize: "9px",
            textAlign: "left",
            padding: 0,
            marginBottom: "2px",
            opacity: 0.8,
          }}
        >
          {payload.label}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            <img
              src={`https://flagcdn.com/w20/${getCountryCode(payload.id)}.png`}
              style={{
                width: "14px",
                height: "auto",
                marginRight: "6px",
                borderRadius: "1px",
              }}
              alt="flag"
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#fbbf24",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {payload.name}
            </span>
          </div>

          <span
            className={`notification-pct ${payload.pct > 0 ? "pos" : "neg"}`}
            style={{
              fontSize: "11px",
              padding: "1px 5px",
              borderRadius: "4px",
              minWidth: "fit-content",
            }}
          >
            {payload.pct > 0 ? "+" : ""}
            {payload.pct.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default SilverNotification;
