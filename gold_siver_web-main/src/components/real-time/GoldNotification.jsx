import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./NotificationStyles.css";

const GOLD_ETFS = [
  "GLD",
  "GLDM",
  "518880.SS",
  "159937.SZ",
  "159934.SZ",
  "518800.SS",
];

const getCountryCode = (id) => {
  if (id.endsWith(".SZ") || id.endsWith(".SS")) return "cn";
  if (id.endsWith(".T")) return "jp";
  if (id === "PHYS") return "ca";
  return "us";
};

const getETFName = (id) => {
  const goldETFs = {
    GLD: "SPDR Gold Shares",
    GLDM: "SPDR Gold MiniShares",
    PHYS: "Sprott Physical Gold",
    "518880.SS": "Huaan Yifu Gold ETF",
    "159937.SZ": "Bosera Gold Open",
    "159934.SZ": "E Fund Management",
    "518800.SS": "Guotai Asset Management",
    "1540.T": "Japan Physical Gold",
  };
  return goldETFs[id] || id;
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
  const { topGain, topLoss } = pickTopMovers(stocks, GOLD_ETFS);
  if (direction === "loss" && topLoss)
    return { entry: topLoss, labelKey: "GoldNotification.topLoss" };
  if (topGain) return { entry: topGain, labelKey: "GoldNotification.topGain" };
  return null;
};

const GoldNotification = ({ interval = 30000 }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState(null);
  const stocksRef = useRef({});
  const timerRef = useRef(null);
  const dirRef = useRef("loss");

  const playNotificationSound = () => {
    try {
      const sound = new Audio("/beep.mp3");
      sound.volume = 0.7;
      sound.play().catch(() => {});
    } catch (err) {}
  };

  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.stocks) stocksRef.current = e.detail.stocks;
    };
    window.addEventListener("yahooStocksUpdated", handler);
    return () => window.removeEventListener("yahooStocksUpdated", handler);
  }, []);

  useEffect(() => {
    const showOnce = () => {
      const result = getNextEntry(stocksRef.current, dirRef.current);
      if (!result) return;

      setPayload({
        label: t(result.labelKey),
        name: getETFName(result.entry.id),
        pct: result.entry.changePercent,
        id: result.entry.id,
      });

      setVisible(true);
      if (Math.abs(result.entry.changePercent) >= 10) playNotificationSound();

      setTimeout(() => setVisible(false), 12000);
      dirRef.current = dirRef.current === "loss" ? "gain" : "loss";
    };

    const initialTimeout = setTimeout(showOnce, 29000);
    timerRef.current = setInterval(showOnce, interval);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(timerRef.current);
    };
  }, [interval]);

  if (!payload) return null;

  return (
    <div
      className="etf-notification gold-notification"
      style={{
        bottom: "10px", // Đặt ở dưới theo code gốc của bạn
        left: "10px",
        width: "auto",
        minWidth: "220px",
        maxWidth: "280px",
        padding: "4px 8px",
      }}
      aria-hidden={!visible}
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
              style={{ width: "14px", marginRight: "6px", borderRadius: "1px" }}
              alt="flag"
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#f1c40f", // Màu vàng sáng hơn cho text
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

export default GoldNotification;
