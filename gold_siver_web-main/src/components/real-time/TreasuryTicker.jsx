import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { saveToNotificationHistory } from "../tradingview/logger";
import { translateText } from "../../services/translationService";
import { fetchLiveTreasuryRates } from "../../services/treasuryService";

const API_URL = "https://api_gold.thinkdiff.us/treasury_all_countries";

const itemsDef = [
  { key: "us_1year", label: "US 1Y", flag: "us" },
  { key: "us_2year", label: "US 2Y", flag: "us" },
  { key: "us_5year", label: "US 5Y", flag: "us" },
  { key: "us_10year", label: "US 10Y", flag: "us" },
  { key: "us_30year", label: "US 30Y", flag: "us" },
  { key: "england_2year", label: "UK 2Y", flag: "gb" },
  { key: "england_10year", label: "UK 10Y", flag: "gb" },
  { key: "germany_2year", label: "GER 2Y", flag: "de" },
  { key: "germany_10year", label: "GER 10Y", flag: "de" },
  { key: "japan_2year", label: "JPN 2Y", flag: "jp" },
  { key: "japan_10year", label: "JPN 10Y", flag: "jp" },
];

const TreasuryTicker = () => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [notification, setNotification] = useState(null); // Trạng thái hiển thị khung cảnh báo góc phải
  const intervalRef = useRef(null);
  const lastAlertTimeRef = useRef({});
  const lastChangeAlertTimeRef = useRef({}); // Dành riêng cho cảnh báo biến động (change >= 0.05)

  // File âm thanh yêu cầu
  const audioRef = useRef(new Audio("https://metalinvest.cloud/vungban.mp3"));

  // --- EFFECT LƯU LỊCH SỬ KHI CÓ NOTIFICATION MỚI ---
  useEffect(() => {
    if (notification) {
      const fullContent = `${notification.title} (${notification.detail || (notification.isUp ? "+" : "")}${notification.percent}%)`;
      saveToNotificationHistory(fullContent, "TREASURY_CHANGE");
    }
  }, [notification]);

  const fetchData = async () => {
    try {
      let treasuryData = {};
      try {
        const response = await fetch(API_URL);
        const json = await response.json();
        if (json.status === "success") {
          treasuryData = json.data.treasury || {};
        }
      } catch (e) {
        console.warn("[TreasuryTicker] Fallback API failed, using TradingView live rates...");
      }

      // Merge live rates from TradingView live scanner for US Treasury yields
      const liveTV = await fetchLiveTreasuryRates();
      if (liveTV) {
        const mapping = {
          us_1year: "US1Y",
          us_2year: "US2Y",
          us_5year: "US5Y",
          us_10year: "US10Y",
          us_30year: "US30Y",
        };
        Object.entries(mapping).forEach(([key, tvKey]) => {
          if (liveTV[tvKey]) {
            treasuryData[key] = {
              price: liveTV[tvKey].cur,
              change: liveTV[tvKey].change,
              changePercent: liveTV[tvKey].changePct,
            };
          }
        });
      }

      if (Object.keys(treasuryData).length > 0) {
        setData(treasuryData);


        const now = Date.now();
        for (const item of itemsDef) {
          const val = treasuryData[item.key];
          if (!val) continue;

          // 1. CẢNH BÁO MỐC 4.5% (Vào UI Ticker)
          if (parseFloat(val.price) >= 4.5) {
            if (
              !lastAlertTimeRef.current[item.key] ||
              now - lastAlertTimeRef.current[item.key] > 300000
            ) {
              lastAlertTimeRef.current[item.key] = now;
              const message = t("treasury.highAlert", {
                label: item.label,
                price: parseFloat(val.price).toFixed(3),
              });
              window.dispatchEvent(
                new CustomEvent("maPriceAlert", {
                  detail: {
                    message,
                    type: "loss",
                    id: `treasury-${item.key}-${now}`,
                  },
                }),
              );
              saveToNotificationHistory(message, "TREASURY_ALERT_45");
            }
          }

          // 1b. CẢNH BÁO NHẬT BẢN > 2.49%
          if (item.key.startsWith("japan") && parseFloat(val.price) > 2.49) {
            if (
              !lastAlertTimeRef.current[`${item.key}-jpn-2.49`] ||
              now - lastAlertTimeRef.current[`${item.key}-jpn-2.49`] > 300000
            ) {
              lastAlertTimeRef.current[`${item.key}-jpn-2.49`] = now;
              const message = t("treasury.japanAlert", {
                label: item.label,
                price: parseFloat(val.price).toFixed(3),
              });
              window.dispatchEvent(
                new CustomEvent("maPriceAlert", {
                  detail: {
                    message,
                    type: "loss",
                    id: `treasury-${item.key}-jpn-${now}`,
                  },
                }),
              );
              saveToNotificationHistory(message, "TREASURY_ALERT_JP_249");
            }
          }

          // 2. CẢNH BÁO BIẾN ĐỘNG (CHANGE >= 0.05) (Vào UI Góc phải giống CommodityTicker)
          const changeVal = parseFloat(val.change);
          if (!isNaN(changeVal) && Math.abs(changeVal) >= 0.05) {
            if (
              !lastChangeAlertTimeRef.current[item.key] ||
              now - lastChangeAlertTimeRef.current[item.key] > 300000
            ) {
              lastChangeAlertTimeRef.current[item.key] = now;

              const isUp = changeVal > 0;
              const title = isUp
                ? t("treasury.up", { label: item.label })
                : t("treasury.down", { label: item.label });
              
              const detail = t("treasury.change", {
                percent: `${isUp ? "+" : "-"}${Math.abs(changeVal).toFixed(3)}`,
              });

              const symbolMap = {
                "us_5year": "^FVX",
                "us_10year": "^TNX",
                "us_30year": "^TYX",
              };
              const symbol = symbolMap[item.key] || null;

              setNotification({
                title,
                detail,
                percent: Math.abs(changeVal).toFixed(3), // Hiện số và phần trăm
                isUp,
                symbol,
              });

              // Phát âm thanh và tắt thông báo sau 8 giây
              audioRef.current.play().catch(() => {});
              setTimeout(() => setNotification(null), 8000);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching Treasury data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 120000); // 2 minutes

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [t]);

  const items = itemsDef;

  const [treasuryLabel, setTreasuryLabel] = useState(t("treasury.label"));

  useEffect(() => {
    let isActive = true;

    const updateLabel = async () => {
      const currentLang = i18n.language || "vi";
      if (currentLang.startsWith("vi")) {
        if (isActive) setTreasuryLabel(t("treasury.label"));
        return;
      }

      const translated = await translateText(t("treasury.label"), currentLang);
      if (isActive) setTreasuryLabel(translated);
    };

    updateLabel();
    return () => {
      isActive = false;
    };
  }, [i18n.language, t]);

  const Content = () => (
    <div className="ticker-group">
      <span
        className="group-label"
        style={{ background: "#4ade80", color: "#064e3b" }}
      >
        {treasuryLabel}
      </span>
      {items.map((item) => {
        const val = data?.[item.key];
        if (!val) return null;
        const isPos = parseFloat(val.change) >= 0;

        return (
          <div className="ticker-item" key={item.key}>
            <img
              src={`https://flagcdn.com/w40/${item.flag}.png`}
              style={{ width: "18px", marginRight: "6px" }}
              alt=""
            />
            <span className="item-label" style={{ fontWeight: "700" }}>
              {item.label}:
            </span>
            <span
              className="item-price"
              style={{ color: "#fff", marginLeft: "4px" }}
            >
              {parseFloat(val.price).toFixed(3)}%
            </span>
            <span
              className={isPos ? "positive" : "negative"}
              style={{
                marginLeft: "5px",
                fontSize: "0.7rem",
                fontWeight: "bold",
              }}
            >
              {isPos ? "+" : "-"}
              {Math.abs(parseFloat(val.change)).toFixed(3)}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* KHUNG THÔNG BÁO GÓC PHẢI */}
      {notification && (
        <div
          onClick={() => {
            if (notification.symbol) {
              window.dispatchEvent(new CustomEvent('show-stock-detail', { detail: notification.symbol }));
            }
          }}
          style={{
            position: "fixed",
            top: "50px", // Để tránh đè chập lên khung của Hàng Hóa nếu hiện cùng lúc
            right: "5px",
            zIndex: 9999,
            padding: "6px 10px",
            borderRadius: "6px",
            background: notification.isUp ? "#1b5e20" : "#b71c1c",
            color: "#fff",
            fontSize: "13px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.2)",
            cursor: notification.symbol ? "pointer" : "default",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{notification.title}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setNotification(null);
              }}
              style={{
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "bold",
                marginLeft: "15px",
              }}
            >
              ✕
            </span>
          </div>
          <div style={{ fontSize: "12px", marginTop: "4px" }}>
            {notification.detail ||
              t("treasury.change", {
                percent: `${notification.isUp ? "+" : "-"}${notification.percent}`,
              })}
          </div>
        </div>
      )}

      <div className="ticker-row marquee-row">
        <div className="marquee-wrapper">
          <Content />
          <Content />
        </div>
      </div>
    </>
  );
};

export default TreasuryTicker;
