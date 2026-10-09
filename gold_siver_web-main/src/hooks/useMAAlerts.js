import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { saveToNotificationHistory } from "../components/tradingview/logger";

const API_URL = "https://api_gold.thinkdiff.us/notify_duong_trungbinh";
const WS_URL = "wss://api-ui.hyperliquid.xyz/ws";
const AUDIO_URL = "https://metalinvest.cloud/co_du_lieu_moi.mp3";
const NOTI_INTERVAL = 5 * 1000 * 60; // 10 giây (theo yêu cầu mới: thông báo liên tục)

const useMAAlerts = (isAppReady = true) => {
  const [maData, setMaData] = useState({ gold: null, silver: null });
  const [realtimePrices, setRealtimePrices] = useState({ XAU: 0, XAG: 0 });

  // Refs để dùng trong setInterval mà không bị reset interval
  const maDataRef = useRef({ gold: null, silver: null });
  const pricesRef = useRef({ XAU: 0, XAG: 0 });
  const lastNotiTime = useRef({ gold: 0, silver: 0 });
  const audioRef = useRef(new Audio(AUDIO_URL));

  useEffect(() => {
    maDataRef.current = maData;
  }, [maData]);

  useEffect(() => {
    pricesRef.current = realtimePrices;
  }, [realtimePrices]);

  const fetchHistory = async () => {
    try {
      console.log("[MA Alert] Fetching latest MA history data...");
      const response = await fetch(API_URL);
      const json = await response.json();

      const process = (data, label) => {
        if (!data || data.length < 200) {
          console.warn(`[MA Alert] Data for ${label} is insufficient.`);
          return null;
        }

        const targetDayIndex = 0;

        const calculateMAAt = (idx, periods) => {
          const slice = data.slice(idx, idx + periods);
          if (slice.length < periods) return null;
          return slice.reduce((sum, item) => sum + item.close, 0) / periods;
        };

        const maLevels = {
          ma50: data[targetDayIndex].ma50,
          ma200: data[targetDayIndex].ma200,
          ma100: calculateMAAt(targetDayIndex, 100),
          ma150: calculateMAAt(targetDayIndex, 150),
          date: data[targetDayIndex].date,
        };

        console.log(`[MA Alert] ${label} Levels calculated:`, maLevels);
        return maLevels;
      };

      setMaData({
        gold: process(json.data_vang, "Gold"),
        silver: process(json.data_bac, "Silver"),
      });
    } catch (error) {
      console.error("Error fetching MA history:", error);
    }
  };

  // WebSocket Connection (l2Book)
  useEffect(() => {
    fetchHistory();
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("[MA Alert] WebSocket Connected (l2Book channel)");
      ["cash:GOLD", "cash:SILVER"].forEach((coin) => {
        ws.send(
          JSON.stringify({
            method: "subscribe",
            subscription: { type: "l2Book", coin, nSigFigs: null },
          }),
        );
      });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.channel === "l2Book" && msg.data) {
          const coin = msg.data.coin;
          if (msg.data.levels && msg.data.levels[0] && msg.data.levels[0][0]) {
            const price = parseFloat(msg.data.levels[0][0].px);
            setRealtimePrices((prev) => ({
              ...prev,
              [coin === "cash:GOLD" ? "XAU" : "XAG"]: price,
            }));
          }
        }
      } catch (e) {}
    };

    return () => ws.close();
  }, []);

  // Monitoring Loop (Continuous Notification + Conditional Audio)
  useEffect(() => {
    const triggerUpdate = (label, price, info) => {
      const { ma150, ma200 } = info;

      // Điều kiện phát âm thanh và hiển thị thông báo: Giá < MA150 VÀ Giá < MA200
      const isAlarm = price < ma150 && price < ma200;

      if (isAlarm) {
        // Nội dung thông báo hiển thị thông số mốc
        const message = t("useMAAlerts.alertMessage", {
          asset: label,
          price: price.toFixed(2),
          ma150: ma150.toFixed(1),
          ma200: ma200.toFixed(1),
        });

        console.log(`[MA Alert] ALARM TRIGGERED for ${label}!`);
        audioRef.current.play().catch(() => {});

        // Gửi thông báo ra UI
        window.dispatchEvent(
          new CustomEvent("maPriceAlert", {
            detail: {
              message,
              type: "loss",
              id: `ma-${label}-${Date.now()}`,
            },
          }),
        );

        // LƯU VÀO LỊCH SỬ THÔNG BÁO
        saveToNotificationHistory(message, "MA_ALERT");
      }
    };

    const checkCycle = () => {
      const now = Date.now();
      const data = maDataRef.current;
      const prices = pricesRef.current;

      // Gold
      if (data.gold && prices.XAU > 0) {
        if (now - lastNotiTime.current.gold >= NOTI_INTERVAL) {
          triggerUpdate("Vàng", prices.XAU, data.gold);
          lastNotiTime.current.gold = now;
        }
      }

      // Silver
      if (data.silver && prices.XAG > 0) {
        if (now - lastNotiTime.current.silver >= NOTI_INTERVAL) {
          triggerUpdate("Bạc", prices.XAG, data.silver);
          lastNotiTime.current.silver = now;
        }
      }
    };

    const interval = setInterval(checkCycle, 10000);
    return () => clearInterval(interval);
  }, []);

  return { maData, realtimePrices };
};

export default useMAAlerts;
