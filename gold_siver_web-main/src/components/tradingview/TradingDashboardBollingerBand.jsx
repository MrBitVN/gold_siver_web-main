import React, { useState, useEffect, useRef } from "react";
import "./MetalStatusBars.css";
import useWilliamsR from "./useWilliamsR";
import WilliamsRNotification from "./WilliamsRNotification";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
const TradingDashboardBollingerBand = () => {
  const { t, i18n } = useTranslation();
  const API_GOLD = "https://api_gold.thinkdiff.us/volume_xauusd_phantich";
  const API_SILVER = "https://api_gold.thinkdiff.us/volume_xagusd_phantich";
  const WS_URL = "wss://api-ui.hyperliquid.xyz/ws";
  const COINS = ["cash:GOLD", "cash:SILVER"];

  const audioBuy = useRef(null);
  const audioSell = useRef(null);
  const audioWRBuy = useRef(null);
  const audioWRSell = useRef(null);
  const audioRSI = useRef(null); // Thêm audio RSI
  const lastMetalAudioTime = useRef({ GOLD: 0, SILVER: 0 });
  const lastRSIAudioTime = useRef({ GOLD: 0, SILVER: 0 }); // Debounce RSI

  const [wrNotifications, setWrNotifications] = useState([]);
  const [rsiNotification, setRsiNotification] = useState(null); // State cho thông báo RSI
  const [rsiFading, setRsiFading] = useState(false); // Hiệu ứng mờ khi tắt
  const navigate = useNavigate();

  const handleWRNotify = (notifData) => {
    setWrNotifications((prev) => [...prev, notifData]);
  };

  const { checkWRAlert } = useWilliamsR(
    audioWRBuy,
    audioWRSell,
    handleWRNotify,
  );

  useEffect(() => {
    audioBuy.current = new Audio("/vungmua.mp3");
    audioSell.current = new Audio("/vungban.mp3");
    audioWRBuy.current = new Audio("/williamBuy.mp3");
    audioWRSell.current = new Audio("/william_r_ban.mp3");
    audioRSI.current = new Audio("/audio_tingting_CVOL.mp3"); // Load audio ting ting
    [audioBuy, audioSell, audioWRBuy, audioWRSell, audioRSI].forEach((a) => {
      if (a.current) a.current.volume = 0.7;
    });
  }, []);

  const [data, setData] = useState({ gold: null, silver: null });
  const [prices, setPrices] = useState({ XAUUSD: 0, XAGUSD: 0 });
  const [totals, setTotals] = useState({ gold: 0, silver: 0 });
  const [activeDetail, setActiveDetail] = useState(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  const [etfNotification, setEtfNotification] = useState(null);

  const [metalStatus, setMetalStatus] = useState({
    GOLD: { height: 0, pct: "0.000", side: "up", status: "" },
    SILVER: { height: 0, pct: "0.000", side: "up", status: "" },
  });

  const ws = useRef(null);
  const lastUpdateRef = useRef(0);

  // Hàm trigger thông báo RSI
  const triggerRSINotify = (metal, type, value) => {
    const now = Date.now();
    if (now - lastRSIAudioTime.current[metal] < 30000) return; // Chỉ báo mỗi 30s

    audioRSI.current?.play().catch(() => {});
    setRsiNotification({
      message: `RSI ${metal}: ${type === "OB" ? "QUÁ MUA" : "QUÁ BÁN"} (${value.toFixed(2)})`,
      color: type === "OB" ? "#ff4d4d" : "#00ff88",
    });
    setRsiFading(false);
    lastRSIAudioTime.current[metal] = now;

    setTimeout(() => closeRSINotify(), 5000); // Tự tắt sau 5s
  };

  const closeRSINotify = () => {
    setRsiFading(true);
    setTimeout(() => {
      setRsiNotification(null);
      setRsiFading(false);
    }, 500); // Đợi mờ xong mới xóa
  };

  const calculateTotalValue = (price, fullData, type) => {
    if (!price || !fullData?.data?.rsi_data) return 0;
    const avg = fullData.data.rsi_data.trungbinh_rsi;
    const rsi = avg.rsi_trungbinh;
    const bbPos =
      ((price - avg.bb_lower_trungbinh) /
        (avg.bb_upper_trungbinh - avg.bb_lower_trungbinh)) *
      100;
    const wrVal = (avg.williams_r_trungbinh || 0) + 100;

    // Logic Check RSI
    if (rsi >= 70) triggerRSINotify(type, "OB", rsi);
    else if (rsi <= 30) triggerRSINotify(type, "OS", rsi);

    if (type) checkWRAlert(wrVal, type);
    return rsi + bbPos + wrVal;
  };

  const triggerEtfNotification = (type, side, pctValue) => {
    const metalName = type === "GOLD" ? "VÀNG" : "BẠC";
    const isUp = side === "up";
    setEtfNotification({
      label: `${metalName} BIẾN ĐỘNG MẠNH`,
      name: isUp ? `HÃY CÂN NHẮC BÁN CHỐT LỜI` : `HÃY CÂN NHẮC MUA VÀO`,
      message: `${metalName} ĐÃ ${isUp ? "TĂNG" : "GIẢM"} MẠNH`,
      color: type === "GOLD" ? "#FFD700" : "#E0E0E0",
      pct: parseFloat(pctValue),
      side: side,
      type: type,
    });
    setTimeout(() => setEtfNotification(null), 8000);
  };

  const getStatusLogic = (type, ratioValue) => {
    const threshold = type === "GOLD" ? 5 : 10;
    const absRatio = Math.abs(ratioValue);
    const height = Math.min((absRatio / threshold) * 100, 100);
    let side = ratioValue >= 0 ? "up" : "down";
    let status =
      absRatio >= threshold
        ? ratioValue > 0
          ? "CRITICAL_UP"
          : "CRITICAL_DOWN"
        : "";

    if (status && Date.now() - lastMetalAudioTime.current[type] > 60000) {
      const audioUrl =
        ratioValue > 0 ? "/ban_tang_10_phantram.mp3" : "/qua_ban.mp3";
      new Audio(audioUrl).play().catch(() => {});
      lastMetalAudioTime.current[type] = Date.now();
      triggerEtfNotification(type, side, absRatio.toFixed(3));
    }
    return { height, pct: absRatio.toFixed(3), side, status };
  };

  const connectSocket = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      COINS.forEach((coin) => {
        ws.current.send(
          JSON.stringify({
            method: "subscribe",
            subscription: { type: "activeAssetCtx", coin },
          }),
        );
      });
    };

    ws.current.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.channel !== "activeAssetCtx") return;

        const coin = msg.data?.coin;
        const price = parseFloat(msg.data?.ctx?.markPx);
        const prev = parseFloat(msg.data?.ctx?.prevDayPx);

        if (isNaN(price) || isNaN(prev)) return;

        const percent = ((price - prev) / prev) * 100;

        // Xác định đúng key để update
        let type = "";
        let priceKey = "";

        if (coin === "cash:GOLD") {
          type = "GOLD";
          priceKey = "XAUUSD";
        } else if (coin === "cash:SILVER") {
          type = "SILVER";
          priceKey = "XAGUSD";
        }

        if (!type) return;

        // --- BẮT ĐẦU UPDATE STATE ---

        // 1. Cập nhật % biến động và âm thanh
        setMetalStatus((prev) => ({
          ...prev,
          [type]: getStatusLogic(type, percent),
        }));

        // 2. Cập nhật giá realtime (Dùng priceKey: XAUUSD hoặc XAGUSD)
        setPrices((prev) => ({
          ...prev,
          [priceKey]: price,
        }));

        // 3. Cập nhật Total (Quan trọng nhất)
        const dataKey = type.toLowerCase(); // "gold" hoặc "silver"

        setData((currentData) => {
          const technicalData = currentData[dataKey];
          if (technicalData) {
            const newTotal = calculateTotalValue(price, technicalData, type);
            setTotals((prevTotals) => ({
              ...prevTotals,
              [dataKey]: newTotal,
            }));
          } else {
            console.warn(
              `Chưa có dữ liệu API cho ${dataKey}, không thể tính Total`,
            );
          }
          return currentData;
        });
      } catch (err) {
        console.error("Socket Message Error:", err);
      }
    };

    ws.current.onclose = () => {
      setTimeout(connectSocket, 3000);
    };
  };

  const fetchData = async () => {
    try {
      const [resGold, resSilver] = await Promise.all([
        fetch(API_GOLD).then((r) => r.json()),
        fetch(API_SILVER).then((r) => r.json()),
      ]);
      setData({ gold: resGold, silver: resSilver });
      setTotals({
        gold: calculateTotalValue(
          prices.XAUUSD || resGold.data.price_now,
          resGold,
          "GOLD",
        ),
        silver: calculateTotalValue(
          prices.XAGUSD || resSilver.data.price_now,
          resSilver,
          "SILVER",
        ),
      });
    } catch (e) {
      console.error("API Error:", e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    connectSocket();
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => {
      ws.current?.close();
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (!data.gold?.data?.rsi_data && !data.silver?.data?.rsi_data) {
    return null;
  }

  return (
    <div
      style={{
        padding: isMobile ? "5px" : "0",
        color: "#fff",
        fontFamily: "sans-serif",
        width: "100%",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      {/* COMPONENT HIỂN THỊ THÔNG BÁO WILLIAMS R */}
      <WilliamsRNotification
        notifications={wrNotifications}
        onRemove={(id) => {
          setWrNotifications((prev) => prev.filter((n) => n.id !== id));
        }}
      />

      {/* THÔNG BÁO RSI GÓC MÀN HÌNH */}
      {rsiNotification && (
        <div
          onClick={() => navigate("/rsi-dashboard")}
          style={{
            position: "fixed",
            bottom: "120px",
            left: "10px",
            backgroundColor: "#1a1a1a",
            border: `1px solid ${rsiNotification.color}`,
            padding: "10px 20px",
            borderRadius: "30px",
            zIndex: 10006,
            display: "flex",
            alignItems: "center",
            gap: "15px",
            boxShadow: `0 0 15px ${rsiNotification.color}44`,
            transition: "opacity 0.5s ease",
            opacity: rsiFading ? 0.3 : 1,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              color: rsiNotification.color,
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            {rsiNotification.message}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeRSINotify();
            }}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: "18px",
              padding: "0 5px",
            }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
            borderBottom: "1px solid #333",
            paddingBottom: "10px",
          }}
        >
          <div style={{ fontSize: isMobile ? "11px" : "14px" }}>
            {t("TradingDashboardBollingerBand.update")}:{" "}
            <span style={{ color: "#00ff88", fontWeight: "bold" }}>
              {data.gold?.data?.time_now
                ? data.gold.data.time_now.split(".")[0]
                : "--:--"}
            </span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={fetchData}
              style={{
                backgroundColor: "#35e858",
                color: "#fff",
                padding: "10px 25px",
                borderRadius: "8px",
                fontWeight: "bold",
                border: "none",
                cursor: "pointer",
              }}
            >
              {t("TradingDashboardBollingerBand.refresh")}
            </button>
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            marginBottom: "15px",
            color: totals.gold > totals.silver ? "#fff200" : "#c0c0c0",
            fontWeight: "900",
            fontSize: isMobile ? "14px" : "20px",
            textTransform: "uppercase",
          }}
        >
          {totals.gold > totals.silver
            ? t("TradingDashboardBollingerBand.goldStronger")
            : t("TradingDashboardBollingerBand.silverStronger")}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: isMobile ? "5px" : "20px",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <InstrumentCard
            title={t("TradingDashboardBollingerBand.gold")}
            price={prices.XAUUSD}
            total={totals.gold}
            fullData={data.gold}
            isMobile={isMobile}
            onOpenDetail={() => setActiveDetail("VÀNG")}
            statusCircle={metalStatus.GOLD}
          />
          <div
            style={{
              fontSize: isMobile ? "30px" : "80px",
              color: "#ff9800",
              fontWeight: "bold",
            }}
          >
            {totals.gold > totals.silver ? ">" : "<"}
          </div>
          <InstrumentCard
            title={t("TradingDashboardBollingerBand.silver")}
            price={prices.XAGUSD}
            total={totals.silver}
            fullData={data.silver}
            isMobile={isMobile}
            onOpenDetail={() => setActiveDetail("BẠC")}
            statusCircle={metalStatus.SILVER}
          />
        </div>
      </div>

      {etfNotification && (
        <div
          className={`etf-notification ${etfNotification.type === "GOLD" ? "gold-notification" : "silver-notification"}`}
          style={{
            bottom: "20px",
            left: "20px",
            position: "fixed",
            zIndex: 10005,
          }}
        >
          <div className="notification-inner">
            <button
              className="notification-close"
              onClick={() => setEtfNotification(null)}
            >
              ×
            </button>
            <div
              className="notification-label"
              style={{ color: etfNotification.color }}
            >
              {etfNotification.label}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{ fontSize: "12px", fontWeight: "700", color: "#fff" }}
                >
                  {etfNotification.name}
                </span>
                <span style={{ fontSize: "9px", color: "#9ca3af" }}>
                  {etfNotification.message}
                </span>
              </div>
              <span
                className={`notification-pct ${etfNotification.side === "up" ? "pos" : "neg"}`}
              >
                {etfNotification.side === "up" ? "+" : "-"}
                {etfNotification.pct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {activeDetail && (
        <DetailModal
          title={activeDetail}
          price={activeDetail === "VÀNG" ? prices.XAUUSD : prices.XAGUSD}
          fullData={activeDetail === "VÀNG" ? data.gold : data.silver}
          isMobile={isMobile}
          onClose={() => setActiveDetail(null)}
        />
      )}
    </div>
  );
};

// --- CÁC COMPONENT GIAO DIỆN ---

const InstrumentCard = ({
  title,
  price,
  total,
  fullData,
  onOpenDetail,
  isMobile,
  statusCircle,
}) => {
  if (!fullData || !fullData.data?.rsi_data)
    return (
      <div
        style={{
          flex: 1,
          background: "#111",
          height: "300px",
          borderRadius: "24px",
        }}
      />
    );
  const avg = fullData.data.rsi_data.trungbinh_rsi;
  const rsiVal = avg.rsi_trungbinh;
  const posValue =
    ((price - avg.bb_lower_trungbinh) /
      (avg.bb_upper_trungbinh - avg.bb_lower_trungbinh)) *
    100;
  const wrVal = (avg.williams_r_trungbinh || 0) + 100;
  const atrVal = avg.atr_14_trungbinh || 0;
  const { t } = useTranslation();
  const rsiC = rsiVal >= 70 ? "#ff4d4d" : rsiVal <= 30 ? "#00ff88" : "#fff";
  const bbC = posValue > 100 ? "#ff4d4d" : posValue < 0 ? "#00ff88" : "#fff";
  const atrC = atrVal <= 20 ? "#00ff88" : atrVal >= 80 ? "#ff4d4d" : "#fff";

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "transparent",
        borderRadius: isMobile ? "12px" : "24px",
        border: "1px solid #333",
        padding: isMobile ? "10px" : "30px",
        textAlign: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "15px",
          right: "20px",
          textAlign: "right",
        }}
      >
        <div style={{ fontSize: "11px", color: "#fff", fontWeight: "900" }}>
          {t("TradingDashboardBollingerBand.totalLabel", "TOTAL")}
        </div>
        <div
          style={{ fontSize: isMobile ? "12px" : "18px", fontWeight: "bold" }}
        >
          {total.toFixed(3)}
        </div>
      </div>
      <h3
        style={{
          fontSize: isMobile ? "16px" : "35px",
          color: (title === "VÀNG" || title === t("TradingDashboardBollingerBand.gold")) ? "#fff200" : "#c0c0c0",
          fontWeight: "bold",
          margin: "0",
        }}
      >
        {title}
      </h3>
      <div
        style={{
          fontSize: isMobile ? "12px" : "18px",
          color: rsiC,
          fontWeight: "900",
          marginBottom: "10px",
        }}
      >
        {rsiVal >= 70
          ? t("TradingDashboardBollingerBand.sell")
          : rsiVal <= 30
            ? t("TradingDashboardBollingerBand.buy")
            : t("TradingDashboardBollingerBand.sideway")}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridTemplateAreas: isMobile
            ? "unset"
            : '"rsi bb" "atr atr" "wr metal"',
          gap: isMobile ? "5px" : "2px",
          justifyItems: "center",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <div style={{ gridArea: isMobile ? "unset" : "rsi" }}>
          <Circle label="RSI" val={rsiVal} color={rsiC} isMobile={isMobile} />
        </div>
        <div style={{ gridArea: isMobile ? "unset" : "bb" }}>
          <Circle label="BB" val={posValue} color={bbC} isMobile={isMobile} />
        </div>
        <div
          style={{
            gridArea: isMobile ? "span 1 / span 2" : "atr",
            margin: isMobile ? "2px 0" : "5px 0",
          }}
        >
          <Circle
            label={`ATR ${title}`}
            val={atrVal}
            color={atrC}
            isMobile={isMobile}
            sizeOverride={isMobile ? 75 : 135}
          />
        </div>
        <div style={{ gridArea: isMobile ? "unset" : "wr" }}>
          <Circle
            label="WR"
            val={wrVal}
            color={wrVal >= 80 ? "#ff4d4d" : wrVal <= 20 ? "#00ff88" : "#fff"}
            isMobile={isMobile}
          />
        </div>

        <div style={{ gridArea: isMobile ? "unset" : "metal" }}>
          <Circle
            label={t("TradingDashboardBollingerBand.increaseDecrease")}
            val={statusCircle.height}
            color={
              statusCircle.status
                ? statusCircle.side === "up"
                  ? "#ff4d4d"
                  : "#00ff88"
                : title === "VÀNG"
                  ? "#FFD700"
                  : "#E0E0E0"
            }
            isMobile={isMobile}
            customText={`${statusCircle.side === "down" ? "-" : ""}${statusCircle.pct}%`}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          fontSize: isMobile ? "8px" : "13px",
          marginBottom: "10px",
        }}
      >
        <div>
          <span style={{ color: "#00ff88" }}>Lower:</span>{" "}
          {avg.bb_lower_trungbinh.toFixed(3)}
        </div>
        <div>
          <span style={{ color: "#888" }}>Middle:</span>{" "}
          {avg.bb_middle_trungbinh.toFixed(3)}
        </div>
        <div>
          <span style={{ color: "#ff4d4d" }}>Upper:</span>{" "}
          {avg.bb_upper_trungbinh.toFixed(3)}
        </div>
      </div>
      <div style={{ fontSize: isMobile ? "18px" : "45px", fontWeight: "bold" }}>
        ${price.toFixed(3)}
      </div>
      <button
        onClick={onOpenDetail}
        style={{
          marginTop: "10px",
          backgroundColor: "#222",
          color: "#fff",
          padding: "12px",
          borderRadius: "12px",
          width: "100%",
          border: "1px solid #444",
          cursor: "pointer",
          fontWeight: "900",
        }}
      >
        {t("TradingDashboardBollingerBand.viewDetail")}
      </button>
    </div>
  );
};

const Circle = ({
  label,
  subLabel,
  val,
  color,
  isMobile,
  customText,
  sizeOverride,
}) => {
  const size = sizeOverride || (isMobile ? 60 : 115);
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg
          viewBox="0 0 40 40"
          style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}
        >
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="#222"
            strokeWidth="2"
          />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray={`${Math.min(Math.max(val, 0), 100) * 1.13}, 113`}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isMobile && !sizeOverride ? "10px" : "18px",
            fontWeight: "900",
            color,
            textAlign: "center",
            padding: "0 5px",
          }}
        >
          {customText || val.toFixed(3)}
        </div>
      </div>
      <div style={{ textAlign: "center", marginTop: "2px" }}>
        <div
          style={{
            fontSize: isMobile ? "9px" : "13px",
            color: "#fff",
            fontWeight: "900",
            lineHeight: 1.1,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

const DetailModal = ({ title, price, fullData, onClose, isMobile }) => {
  if (!fullData?.data?.rsi_data?.rsi?.danhsach) return null;
  const listRSI = fullData.data.rsi_data.rsi.danhsach;
  const defaultColor = title === "VÀNG" ? "#fff200" : "#c0c0c0";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.98)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "#111",
          width: "98%",
          maxWidth: "1500px",
          maxHeight: "95vh",
          borderRadius: "24px",
          border: "1px solid #333",
          overflowY: "auto",
          padding: isMobile ? "10px" : "30px",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            background: "#ff4d4d",
            border: "none",
            color: "#fff",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ✕
        </button>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{ color: defaultColor, fontSize: "32px", margin: 0 }}>
            {t("TradingDashboardBollingerBand.detail")} {title}
          </h2>
          <div
            style={{ fontSize: "42px", fontWeight: "bold", color: "#ffbaba" }}
          >
            ${price.toFixed(3)}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: "25px",
          }}
        >
          {listRSI.map((item, idx) => {
            const pos =
              ((price - item.value.bb_lower) /
                (item.value.bb_upper - item.value.bb_lower)) *
              100;
            const rsi = item.value.rsi_value;
            const wr = (item.value.williams_r || 0) + 100;
            const rsiC = rsi >= 70 ? "#ff4d4d" : rsi <= 30 ? "#00ff88" : "#fff";
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: "#0b0e14",
                  padding: "25px",
                  borderRadius: "24px",
                  border: "1px solid #222",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    color: defaultColor,
                    marginBottom: "20px",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  {item.minute < 60
                    ? item.minute + " PHÚT"
                    : item.minute / 60 + " GIỜ"}
                </div>
                <div
                  style={{
                    position: "relative",
                    height: "185px",
                    width: "230px",
                    margin: "0 auto",
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0 }}>
                    <Circle
                      label="RSI"
                      val={rsi}
                      color={rsiC}
                      isMobile={true}
                      sizeOverride={75}
                    />
                  </div>
                  <div style={{ position: "absolute", top: 0, right: 0 }}>
                    <Circle
                      label="BB"
                      val={pos}
                      color={rsiC}
                      isMobile={true}
                      sizeOverride={75}
                    />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 5,
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                  >
                    <Circle
                      label="WR"
                      val={wr}
                      color={
                        wr >= 80 ? "#ff4d4d" : wr <= 20 ? "#00ff88" : "#fff"
                      }
                      isMobile={true}
                      sizeOverride={75}
                    />
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "22px",
                    color: rsiC,
                    fontWeight: "900",
                    margin: "20px 0",
                  }}
                >
                  {rsi >= 70
                    ? t("TradingDashboardBollingerBand.sell")
                    : rsi <= 30
                      ? t("TradingDashboardBollingerBand.buy")
                      : t("TradingDashboardBollingerBand.sideway")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TradingDashboardBollingerBand;
