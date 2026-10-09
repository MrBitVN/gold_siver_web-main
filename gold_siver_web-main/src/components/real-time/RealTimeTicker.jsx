import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useTranslation } from "react-i18next";

import useRealTimeData from "../../hooks/useRealTimeData";
import YahooFinanceSocket from "./YahooFinanceSocket";
import RongTongSocket from "./RongTongSocket";
import CoinMarketCapSocket from "./CoinMarketCapSocket";
import MiningStock from "../MiningStock";
import StockTicker from "./StockTicker";
import CommodityTicker from "./CommodityTicker";
import TreasuryTicker from "./TreasuryTicker";
import "./RealTimeTicker.css";
import { translateText } from "../../services/translationService";

import { saveToNotificationHistory } from "../tradingview/logger";

const RealTimeTicker = ({ liveData }) => {
  const [prevPrices, setPrevPrices] = useState({});
  const [notifications, setNotifications] = useState([]); // Quản lý danh sách thông báo
  const [isAlertEnabled, setIsAlertEnabled] = useState(() => {
    return localStorage.getItem("stock_alerts_enabled") === "true"; // Mặc định disable (false)
  });
  const lastAlertTimeRef = useRef({});

  const toggleAlerts = () => {
    setIsAlertEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("stock_alerts_enabled", next ? "true" : "false");
      if (!next) {
        setNotifications([]); // Xóa thông báo hiện tại khi tắt
      }
      return next;
    });
  };

  // Cập nhật đường dẫn âm thanh từ thư mục public
  const audioAlert = useRef(new Audio("/thi_truong_chung_khoan.mp3"));

  // Hàm xóa thông báo sau khi hết thời gian hiển thị
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // LOGIC XỬ LÝ THÔNG BÁO VÀ ÂM THANH (Cảnh báo Sàn/Stock)
  useEffect(() => {
    const handleAlert = (e) => {
      // Chỉ hiển thị khi tính năng thông báo được BẬT
      if (localStorage.getItem("stock_alerts_enabled") !== "true") return;

      const decoded = e.detail;
      const now = Date.now();

      // Nếu tăng hoặc giảm mạnh >= 5%
      if (Math.abs(decoded.changePercent) >= 5) {
        // Chống lặp âm thanh trong vòng 3 phút (180.000ms)
        if (
          !lastAlertTimeRef.current[decoded.id] ||
          now - lastAlertTimeRef.current[decoded.id] > 180000
        ) {
          lastAlertTimeRef.current[decoded.id] = now;

          // Phát âm thanh báo động
          audioAlert.current.play().catch(() => {
            console.warn(
              "Cần tương tác với trang web (click) để kích hoạt âm thanh tự động.",
            );
          });

          // Nội dung thông báo
          const symbol = decoded.id.replace("^", "");
          const isPositive = decoded.changePercent >= 0;
          const messageContent = isPositive
            ? t("RealTimeTicker.strongIncrease", {
                symbol,
                percent: `${decoded.changePercent >= 0 ? "+" : ""}${decoded.changePercent.toFixed(2)}`,
              })
            : t("RealTimeTicker.strongDecrease", {
                symbol,
                percent: `${decoded.changePercent >= 0 ? "+" : ""}${decoded.changePercent.toFixed(2)}`,
              });

          // Tạo thông báo mới hiển thị trên màn hình
          const notiId = now + Math.random();

          setNotifications((prev) => [
            ...prev,
            {
              id: notiId,
              message: messageContent,
              type: isPositive ? "gain" : "loss",
              symbol: decoded.id,
            },
          ]);
          // 2. LƯU VÀO LỊCH SỬ (THÊM DÒNG NÀY)
          saveToNotificationHistory(messageContent, "STOCK_ALERT");

          // Tự động xóa thông báo sau 6 giây
          setTimeout(() => removeNotification(notiId), 6000);
        }
      }
    };

    window.addEventListener("yahooPriceAlert", handleAlert);
    return () => window.removeEventListener("yahooPriceAlert", handleAlert);
  }, [removeNotification]);

  // LOGIC XỬ LÝ THÔNG BÁO MA (Cảnh báo Kỹ thuật chạy ngầm)
  useEffect(() => {
    const handleMAPriceAlert = (e) => {
      // Chỉ hiển thị khi tính năng thông báo được BẬT
      if (localStorage.getItem("stock_alerts_enabled") !== "true") return;

      const { message, type, id } = e.detail;
      const notiId = id || `ma-noti-${Date.now()}`;

      let symbol = null;
      if (id) {
        if (id.includes("Vàng") || id.includes("gold")) symbol = "GC=F";
        else if (id.includes("Bạc") || id.includes("silver")) symbol = "SI=F";
        else if (id.includes("treasury-us_10year")) symbol = "^TNX";
        else if (id.includes("treasury-us_5year")) symbol = "^FVX";
        else if (id.includes("treasury-us_30year")) symbol = "^TYX";
      }

      setNotifications((prev) => {
        // Tránh trùng lặp ID (đặc biệt là cái ma-system-test)
        if (prev.some((n) => n.id === notiId)) return prev;

        return [
          ...prev,
          {
            id: notiId,
            message,
            type: type || "loss",
            symbol,
          },
        ];
      });

      // Tự động xóa thông báo sau 8 giây (để lâu hơn một chút vì tin nhắn MA thường dài)
      setTimeout(() => removeNotification(notiId), 8000);
    };

    window.addEventListener("maPriceAlert", handleMAPriceAlert);
    return () => window.removeEventListener("maPriceAlert", handleMAPriceAlert);
  }, [removeNotification]);

  const { i18n, t } = useTranslation();
  const [dynamicLabels, setDynamicLabels] = useState({
    market: t("RealTimeTicker.market"),
    goldVn: t("RealTimeTicker.goldVn"),
    silverVn: t("RealTimeTicker.silverVn"),
    chinaSpot: t("RealTimeTicker.chinaSpot"),
    miningStock: t("RealTimeTicker.miningStock"),
  });

  useEffect(() => {
    let isActive = true;

    const updateLabels = () => {
      if (!isActive) return;
      setDynamicLabels({
        market: t("RealTimeTicker.market"),
        goldVn: t("RealTimeTicker.goldVn"),
        silverVn: t("RealTimeTicker.silverVn"),
        chinaSpot: t("RealTimeTicker.chinaSpot"),
        miningStock: t("RealTimeTicker.miningStock"),
      });
    };

    updateLabels();
    return () => {
      isActive = false;
    };
  }, [i18n.language, t]);

  const prices = useMemo(() => {
    if (!liveData) return null;
    const isVi = i18n.language === "vi";

    const formatVal = (val, type = "gold") => {
      const num = Number(val) || 0;
      if (isVi) {
        return (
          (num / 1000000).toFixed(2) + (type === "gold" ? "tr/lượng" : "tr/kg")
        );
      }
      return num.toFixed(0) + " USD/Ounce";
    };

    const formatName = (key) => {
      return key; // Keep original ID like anhminh_gold
    };

    const processGroup = (groupData, type) => {
      if (!groupData) return [];
      // If it's the old structure { buy, sell, usd }, we should probably not show it this way
      // But we expect the new structure { vendor1: { vnd, usd }, vendor2: ... }
      return Object.entries(groupData)
        .filter(([_, item]) => {
          const val = isVi ? item?.vnd : item?.usd;
          return val && val > 0;
        })
        .map(([key, item]) => ({
          label: formatName(key),
          value: formatVal(isVi ? item.vnd : item.usd, type),
          quocgia: item.quocgia,
        }));
    };

    return {
      vnGold: processGroup(liveData.vnGold, "gold"),
      vnSilver: processGroup(liveData.vnSilver, "silver"),
      intlGold: processGroup(liveData.intlGold, "gold"),
      intlSilver: processGroup(liveData.intlSilver, "silver"),
    };
  }, [liveData, i18n.language]);

  const DomesticContent = () => (
    <div className="ticker-group">
      <span className="group-label">🏆 {dynamicLabels.market}</span>
      {/* Vàng Việt Nam */}
      {prices?.vnGold && prices.vnGold.length > 0 && (
        <>
          <span
            className="sub-group-label"
            style={{ color: "#ffd700", marginLeft: "15px", fontWeight: "bold" }}
          >
            {dynamicLabels.goldVn}
          </span>
          {prices.vnGold.map((p, i) => (
            <TickerRow key={`vng-${i}`} item={p} color="#ffd700" />
          ))}
        </>
      )}

      {prices?.vnSilver && prices.vnSilver.length > 0 && (
        <>
          <span
            className="sub-group-label"
            style={{ color: "#e0e0e0", marginLeft: "25px", fontWeight: "bold" }}
          >
            {dynamicLabels.silverVn}
          </span>
          {prices.vnSilver.map((p, i) => (
            <TickerRow key={`vns-${i}`} item={p} color="#e0e0e0" />
          ))}
        </>
      )}
    </div>
  );

  return (
    <div className="real-time-ticker">
      {/* KHUNG THÔNG BÁO HIỆN ĐẠI (MẶC ĐỊNH TẮT - BẤM ĐỂ BẬT/TẮT) */}
      <div className="modern-noti-container">
        <div
          className={`modern-noti-toggle ${isAlertEnabled ? "active" : ""}`}
          onClick={toggleAlerts}
          title={isAlertEnabled ? "Tắt thông báo biến động giá" : "Bật thông báo biến động giá"}
        >
          <span className="noti-toggle-icon">{isAlertEnabled ? "🔔" : "🔕"}</span>
          <span className="noti-toggle-label">
            {isAlertEnabled ? "Báo biến động: BẬT" : "Báo biến động: TẮT"}
          </span>
          <span className="noti-toggle-indicator"></span>
        </div>

        {isAlertEnabled && notifications.map((n) => (
          <div 
            key={n.id} 
            className={`modern-noti-item ${n.type}`}
            style={{ cursor: n.symbol ? "pointer" : "default" }}
            onClick={() => {
              if (n.symbol) {
                window.dispatchEvent(new CustomEvent('show-stock-detail', { detail: n.symbol }));
              }
            }}
          >
            <div className="noti-glass-effect"></div>
            <div className="noti-content">
              <div className="noti-icon">{n.type === "gain" ? "🚀" : "📉"}</div>
              <span className="noti-message">{n.message}</span>
              <button
                className="noti-close-modern"
                onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(n.id);
                }}
              >
                ✕
              </button>
            </div>
            <div className="noti-progress-bar"></div>
          </div>
        ))}
      </div>

      <div className="ticker-scroll-container">
        <div className="ticker-content">
          <YahooFinanceSocket />
          <CoinMarketCapSocket />
          <TreasuryTicker />

          <div className="ticker-row marquee-row">
            <div className="marquee-wrapper">
              <DomesticContent />
              <DomesticContent />
            </div>
          </div>

          <StockTicker type="etf" />

          <div
            className="ticker-row marquee-row"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: "4px",
            }}
          >
            <div className="marquee-wrapper marquee-slow">
              <div className="ticker-group">
                <span
                  className="group-label etf-label"
                  style={{ color: "#3b82f6", marginRight: '20px' }}
                >
                  {dynamicLabels.chinaSpot}
                </span>
                <RongTongSocket />
              </div>
              <div className="ticker-group">
                <span
                  className="group-label etf-label"
                  style={{ color: "#3b82f6", marginRight: '20px' }}
                >
                  {dynamicLabels.chinaSpot}
                </span>
                <RongTongSocket />
              </div>
            </div>
          </div>

          <div
            className="ticker-row marquee-row"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: "4px",
            }}
          >
            <div className="marquee-wrapper marquee-slow marquee-reverse">
              <div className="ticker-group">
                <span
                  className="group-label etf-label"
                  style={{ color: "#fbbf24" }}
                >
                  {dynamicLabels.miningStock}
                </span>
                <MiningStock showTitle={false} />
              </div>
              <div className="ticker-group">
                <span
                  className="group-label etf-label"
                  style={{ color: "#fbbf24" }}
                >
                  {dynamicLabels.miningStock}
                </span>
                <MiningStock showTitle={false} />
              </div>
            </div>
          </div>

          <StockTicker type="stock" />
          
          <CommodityTicker
            intlGold={prices?.intlGold}
            intlSilver={prices?.intlSilver}
          />
        </div>
      </div>
    </div>
  );
};

const getFlagCode = (quocgia) => {
  if (!quocgia) return "vn";
  const map = {
    USA: "us",
    US: "us",
    KOREAN: "kr",
    KOREA: "kr",
    UK: "gb",
    UAE: "ae",
    CN: "cn",
    CHINA: "cn",
    RUSSIAN: "ru",
    RUSSIA: "ru",
    INDIA: "in",
    JAPAN: "jp",
    SINGAPORE: "sg",
    AUSTRALIA: "au",
  };
  return map[quocgia.toUpperCase()] || "vn";
};

const TickerRow = ({ item, color }) => {
  if (!item)
    return (
      <div className="ticker-item">
        <span className="item-label">---</span>
      </div>
    );
  const flagCode = getFlagCode(item.quocgia);
  return (
    <div
      className="ticker-item"
      style={{ display: "inline-flex", alignItems: "center" }}
    >
      {flagCode && (
        <img
          src={`https://flagcdn.com/w20/${flagCode}.png`}
          alt={flagCode}
          style={{
            width: "18px",
            height: "13px",
            marginRight: "6px",
            borderRadius: "2px",
          }}
        />
      )}
      <span className="item-label" style={{ color }}>
        {item.label}:
      </span>
      <span className="item-price" style={{ marginLeft: "4px" }}>
        {item.value}
      </span>
    </div>
  );
};

export default RealTimeTicker;
