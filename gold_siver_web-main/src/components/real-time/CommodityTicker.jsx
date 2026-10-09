import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import MarketWatchSocket from "./MarketWatchSocket";
import HyperLiquidSocket from "./HyperLiquidSocket";
import { saveToNotificationHistory } from "../tradingview/logger";
import { translateText } from "../../services/translationService";

const getFlagCode = (quocgia) => {
  if (!quocgia) return "vn";
  const map = {
    USA: "us",
    US: "us",
    KOREAN: "kr",
    KOREA: "kr",
    UK: "gb",
    GB: "gb",
    UAE: "ae",
    CN: "cn",
    CHINA: "cn",
    RUSSIAN: "ru",
    RUSSIA: "ru",
    INDIA: "in",
    JAPAN: "jp",
    JP: "jp",
    SINGAPORE: "sg",
    SG: "sg",
    AUSTRALIA: "au",
    AU: "au",
    MALAYSIA: "my",
    MY: "my",
    INDONESIA: "id",
    ID: "id",
    THAILAND: "th",
    TH: "th",
    HONGKONG: "hk",
    HK: "hk",
    GERMANY: "de",
    DE: "de",
    FRANCE: "fr",
    FR: "fr",
    CANADA: "ca",
    CA: "ca",
    SWITZERLAND: "ch",
    CH: "ch",
  };
  return map[quocgia.toUpperCase()] || "vn";
};

const RAW_COMMODITIES = [
  { key: "brentOil", id: "209704782", defaultLabel: "Dầu Brent" },
  { key: "wtiOil", id: "205615174", defaultLabel: "Dầu WTI" },
  { key: "naturalGas", id: "205619834", defaultLabel: "Khí Gas" },
  { key: "steel", id: "210364718", defaultLabel: "Thép" },
  { key: "copper", id: "205617300", defaultLabel: "Đồng" },
  { key: "aluminum", id: "206001000", defaultLabel: "Nhôm" },
  { key: "bitcoin", id: "225893452", defaultLabel: "Bitcoin" },
];

const RAW_WATCHLIST = {
  210364718: { key: "steel", defaultLabel: "Thép" },
  209704782: { key: "brentOil", defaultLabel: "Dầu Brent" },
};

const RAW_WATCHLIST_HL = {
  BTC: { key: "bitcoin", defaultLabel: "Bitcoin" },
  ETH: { key: "ethereum", defaultLabel: "Ethereum" },
  "cash:GOLD": { key: "gold", defaultLabel: "Vàng" },
  "cash:SILVER": { key: "silver", defaultLabel: "Bạc" },
};

const HyperLiquidContent = React.memo(
  ({ data, intlSilver, checkNoti, labels, watchListHL }) => {
    useEffect(() => {
      checkNoti(data);
    }, [data, checkNoti]);

    const btc = data && data["BTC"];
    const eth = data && data["ETH"];
    const silver = data && data["cash:SILVER"];
    const gold = data && data["cash:GOLD"];

    return (
      <div
        className="ticker-group"
        style={{
          display: "flex",
          alignItems: "center",
          minWidth: "max-content",
          paddingRight: "40px",
        }}
      >
        <span className="group-label" style={{ color: "#fbbf24" }}>
          Hyperliquid
        </span>

        <div className="ticker-item">
          <span className="item-label">BTC hyperliquid</span>
          <span className="item-prices">{btc?.price || "..."}</span>
          <span
            className="item-prices"
            style={{
              color: btc?.percent > 0 ? "#22c55e" : "#ef4444",
              marginLeft: 6,
            }}
          >
            {btc?.percent !== undefined ? btc.percent.toFixed(2) + "%" : "..."}
          </span>
        </div>
        <div className="ticker-item">
          <span className="item-label">ETH hyperliquid</span>
          <span className="item-prices">{eth?.price || "..."}</span>
          <span
            className="item-prices"
            style={{
              color: eth?.percent > 0 ? "#22c55e" : "#ef4444",
              marginLeft: 6,
            }}
          >
            {eth?.percent ? eth.percent.toFixed(2) + "%" : "..."}
          </span>
        </div>
        <div className="ticker-item">
          <span className="item-label">SILVER hyperliquid</span>
          <span className="item-prices">{silver?.price || "..."}</span>
          <span
            className="item-prices"
            style={{
              color: silver?.percent > 0 ? "#22c55e" : "#ef4444",
              marginLeft: 6,
            }}
          >
            {silver?.percent ? silver.percent.toFixed(2) + "%" : "..."}
          </span>
        </div>
        <div className="ticker-item">
          <span className="item-label">GOLD hyperliquid</span>
          <span className="item-prices">{gold?.price || "..."}</span>
          <span
            className="item-prices"
            style={{
              color: gold?.percent > 0 ? "#22c55e" : "#ef4444",
              marginLeft: 6,
            }}
          >
            {gold?.percent ? gold.percent.toFixed(2) + "%" : "..."}
          </span>
        </div>

        {/* MỚI: BẠC QUỐC TẾ */}
        {intlSilver && intlSilver.length > 0 && (
          <span
            className="sub-group-label"
            style={{ color: "#9ca3af", marginLeft: "25px", fontWeight: "bold" }}
          >
            {labels.silverIntl}
          </span>
        )}
        {intlSilver &&
          intlSilver.map((item, i) => {
            const flagCode = getFlagCode(item.quocgia);
            return (
              <div
                className="ticker-item"
                key={`intls-${i}`}
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
                <span className="item-label" style={{ color: "#9ca3af" }}>
                  {item.label}:
                </span>
                <span
                  className="item-price"
                  style={{ marginLeft: "4px", color: "#fff" }}
                >
                  {item.value}
                </span>
              </div>
            );
          })}
      </div>
    );
  },
);

const Content = React.memo(
  ({ data, intlGold, checkNoti, labels, commodities }) => {
    useEffect(() => {
      checkNoti(data);
    }, [data, checkNoti]);

    return (
      <div
        className="ticker-group"
        style={{
          display: "flex",
          alignItems: "center",
          minWidth: "max-content",
          paddingRight: "40px",
        }}
      >
        <span className="group-label etf-label" style={{ color: "#f87171" }}>
          {labels.commodities}
        </span>

        {commodities.map((item) => {
          const stock = data && data[item.id];
          if (!stock) return null;
          const isPos = stock.changePercent >= 0;
          return (
            <div className="ticker-item" key={item.id}>
              <Link
                to={`/commodity/${item.id}`}
                className="stock-link"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <span className="item-label" style={{ fontWeight: "bold" }}>
                  {item.label}
                </span>
              </Link>
              <span
                className="price-val"
                style={{
                  marginLeft: "8px",
                  fontSize: "0.75rem",
                  color: "#fff",
                }}
              >
                {stock.price.toLocaleString()}
              </span>
              <span
                className={isPos ? "positive" : "negative"}
                style={{ marginLeft: "5px", fontSize: "0.75rem" }}
              >
                {isPos ? "+" : ""}
                {stock.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}

        {/* MỚI: VÀNG QUỐC TẾ */}
        {intlGold && intlGold.length > 0 && (
          <span
            className="sub-group-label"
            style={{ color: "#fbbf24", marginLeft: "25px", fontWeight: "bold" }}
          >
            {labels.goldIntl}
          </span>
        )}
        {intlGold &&
          intlGold.map((item, i) => {
            const flagCode = getFlagCode(item.quocgia);
            return (
              <div
                className="ticker-item"
                key={`intlg-${i}`}
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
                <span className="item-label" style={{ color: "#fbbf24" }}>
                  {item.label}:
                </span>
                <span
                  className="item-price"
                  style={{ marginLeft: "4px", color: "#fff" }}
                >
                  {item.value}
                </span>
              </div>
            );
          })}
      </div>
    );
  },
);

const CommodityTicker = ({ intlGold, intlSilver }) => {
  const { t } = useTranslation();

  // Localized commodity list
  const commodities = RAW_COMMODITIES.map((c) => ({
    id: c.id,
    label: t(`commodity.labels.${c.key}`, c.defaultLabel),
  }));

  const watchList = Object.fromEntries(
    Object.entries(RAW_WATCHLIST).map(([id, info]) => [
      id,
      t(`commodity.labels.${info.key}`, info.defaultLabel),
    ]),
  );

  const watchListHL = Object.fromEntries(
    Object.entries(RAW_WATCHLIST_HL).map(([id, info]) => [
      id,
      t(`commodity.labels.${info.key}`, info.defaultLabel),
    ]),
  );

  const [labels, setLabels] = useState({
    commodities: t("commodity.commodities"),
    goldIntl: t("commodity.goldIntl"),
    silverIntl: t("commodity.silverIntl"),
  });

  useEffect(() => {
    setLabels({
      commodities: t("commodity.commodities"),
      goldIntl: t("commodity.goldIntl"),
      silverIntl: t("commodity.silverIntl"),
    });
  }, [t]);

  const [notification, setNotification] = useState(null);
  const lastNotiTime = useRef({});
  const audioRef = useRef(new Audio("dxy_tang_giam.mp3"));

  useEffect(() => {
    if (notification) {
      const fullContent = `${notification.title} (Biến động: ${notification.isUp ? "+" : ""}${notification.percent}%)`;
      saveToNotificationHistory(fullContent, notification.type);
    }
  }, [notification]);

  const checkNotification = React.useCallback((data) => {
    Object.keys(watchList).forEach((id) => {
      const stock = data[id];
      if (!stock) return;

      const percent = stock.changePercent;
      const now = Date.now();

      const threshold = id === "209704782" ? 10.0 : 5.0;

      if (Math.abs(percent) >= threshold) {
        if (
          !lastNotiTime.current[id] ||
          now - lastNotiTime.current[id] > 60000
        ) {
          const isUp = percent > 0;

          setNotification({
            title: isUp
              ? t("commodity.increase", { item: watchList[id] })
              : t("commodity.decrease", { item: watchList[id] }),
            percent: percent.toFixed(2),
            isUp,
          });

          audioRef.current.play().catch(() => {});
          lastNotiTime.current[id] = now;

          setTimeout(() => setNotification(null), 8000);
        }
      }
    });
  }, []);

  const checkHyperLiquidNotification = React.useCallback((data) => {
    // Per-asset thresholds (absolute percent). ETH uses 5% as requested.
    const hlThresholds = {
      BTC: 5.0,
      ETH: 5.0,
      "cash:GOLD": 5.0,
      "cash:SILVER": 10.0,
    };

    Object.keys(watchListHL).forEach((id) => {
      const asset = data[id];
      if (!asset) return;
      const percent = asset.percent;
      if (percent == null) return;
      const now = Date.now();

      const threshold = hlThresholds[id] ?? 0.5;
      if (Math.abs(percent) >= threshold) {
        if (
          !lastNotiTime.current[id] ||
          now - lastNotiTime.current[id] > 60000
        ) {
          const isUp = percent > 0;
          // Escalate to 🚨 when movement is large relative to threshold
          const level =
            Math.abs(percent) >= Math.max(1.0, threshold * 2) ? "🚨" : "⚠️";

          setNotification({
            title: isUp
              ? t("commodity.increase", { item: `${level} ${watchListHL[id]}` })
              : t("commodity.decrease", { item: `${level} ${watchListHL[id]}` }),
            percent: percent.toFixed(2),
            isUp,
          });

          audioRef.current.play().catch(() => {});
          lastNotiTime.current[id] = now;
          setTimeout(() => setNotification(null), 8000);
        }
      }
    });
  }, []);

  const safeCheckNotification = checkNotification;
  const safeCheckHyperLiquidNotification = checkHyperLiquidNotification;

  return (
    <>
      {notification && (
        <div
          style={{
            position: "fixed",
            top: "5px",
            right: "5px",
            zIndex: 9999,
            padding: "4px 8px",
            borderRadius: "4px",
            background: notification.isUp ? "#1b5e20" : "#b71c1c",
            color: "#fff",
            fontSize: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ fontWeight: "bold" }}>
            {notification.title}
            <span
              onClick={() => setNotification(null)}
              style={{
                cursor: "pointer",
                fontSize: "10px",
                fontWeight: "bold",
                lineHeight: "1",
                marginLeft: "10px",
              }}
            >
              ✕
            </span>
          </div>

          <div style={{ fontSize: "11px" }}>
            {t("commodity.change", {
              percent: `${notification.isUp ? "+" : ""}${notification.percent}`,
            })}
          </div>
        </div>
      )}

      <MarketWatchSocket
        render={(marketData) => (
          <div
            className="ticker-row marquee-row"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: "4px",
            }}
          >
            <div className="marquee-wrapper marquee-slow marquee-reverse">
              <Content
                data={marketData}
                intlGold={intlGold}
                checkNoti={safeCheckNotification}
                labels={labels}
                commodities={commodities}
              />
              <Content
                data={marketData}
                intlGold={intlGold}
                checkNoti={safeCheckNotification}
                labels={labels}
                commodities={commodities}
              />
            </div>
          </div>
        )}
      />

      <HyperLiquidSocket
        render={(data) => (
          <div
            className="ticker-row marquee-row"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: "4px",
            }}
          >
            <div className="marquee-wrapper marquee-slow">
              <HyperLiquidContent
                data={data}
                intlSilver={intlSilver}
                checkNoti={safeCheckHyperLiquidNotification}
                labels={labels}
                watchListHL={watchListHL}
              />
              <HyperLiquidContent
                data={data}
                intlSilver={intlSilver}
                checkNoti={safeCheckHyperLiquidNotification}
                labels={labels}
                watchListHL={watchListHL}
              />
            </div>
          </div>
        )}
      />
    </>
  );
};

export default CommodityTicker;
