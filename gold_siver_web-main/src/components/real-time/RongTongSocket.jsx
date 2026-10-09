import React, { useState, useEffect, useRef } from "react";
import protobuf from "protobufjs";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { saveToNotificationHistory } from "../tradingview/logger";

// --- Cấu hình Yahoo Protobuf ---
const schemaJSON = {
  nested: {
    Yaticker: {
      fields: {
        id: { type: "string", id: 1 },
        price: { type: "float", id: 2 },
        changePercent: { type: "float", id: 8 },
        change: { type: "float", id: 12 },
      },
    },
  },
};

const nameMapping = {
  "Au99.99": "黄金9999(Vàng) ",
  "Ag(T+D)": "白银T+D(Bạc)",
};

const RongTongSocket = () => {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState({});
  const [yahooStocks, setYahooStocks] = useState({});
  const [rate, setRate] = useState(0.144218);
  const [notification, setNotification] = useState(null);

  const dataRef = useRef({});
  const yahooStocksRef = useRef({});
  const wsRef = useRef(null);
  const wsYahooRef = useRef(null);
  const wsReconnectTimerRef = useRef(null);
  const wsReconnectAttemptsRef = useRef(0);
  const wsYahooReconnectTimerRef = useRef(null);
  const wsYahooReconnectAttemptsRef = useRef(0);
  const updateTimerRef = useRef(null);
  const audioRef = useRef(new Audio("dxy_tang_giam.mp3"));
  const lastNotiTime = useRef(0);

  // Bắt sự kiện khi có thông báo DXY mới
  useEffect(() => {
    if (notification) {
      const fullContent = `${notification.isUp ? t("dxy.up") : t("dxy.down")} (${t("dxy.change", {
        percent: `${notification.isUp ? "+" : ""}${notification.percent}`,
      })
        })`;
      saveToNotificationHistory(fullContent, "DXY_UPDATE");
    }
  }, [notification, t]);

  useEffect(() => {
    const connectWS = () => {
      if (wsRef.current && wsRef.current.readyState === 1) return;
      if (wsReconnectTimerRef.current) {
        clearTimeout(wsReconnectTimerRef.current);
        wsReconnectTimerRef.current = null;
      }
      const ws = new WebSocket("wss://rtjwbqt.jzj9999.com:8443/gateway");
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        wsReconnectAttemptsRef.current = 0;
        const packets = [
          "CCAQACIpKicKA3J0ahIgPdX5OFO8hZAxBHr6qFsSZvneyfoH0NIbRCiRS93ANdM=",
          "CBIQFiL5AQoHQXU5OS45OQoHQXUoVCtEKQoJSlpKX2F1X1BTCglKWkpfYXVfUEIKCUpaSl9hZ19QUwoJSlpKX2FnX1BCCglKWkpfcHRfUFMKCUpaSl9wdF9QQgoJSlpKX3BkX1BTCglKWkpfcGRfUEIKCVJIX0paTF9QUwoJUkhfSlpMX1BCCglKWkpfSVJfUFMKCUpaSl9JUl9QQgoJSlpKX1JVX1BTCglKWkpfUlVfUEIKB0FnKFQrRCkKB1B0OTkuOTUKBEdMTkMKBFBMTkMKBFBBTkMKBFNMTkMKAlJICgNYQVUKA1hBRwoDWEFQCgNYUEQKBlVTRENOSBIBAA==",
        ];
        packets.forEach((p, i) =>
          setTimeout(() => {
            if (ws.readyState === 1)
              ws.send(Uint8Array.from(atob(p), (c) => c.charCodeAt(0)));
          }, i * 300),
        );
      };

      ws.onmessage = (e) => {
        const buffer = new Uint8Array(e.data);
        if (buffer.length < 50) return;
        const view = new DataView(buffer.buffer);
        const ascii = new TextDecoder().decode(buffer);
        let hasUpdate = false;

        Object.keys(nameMapping).forEach((id) => {
          const idx = ascii.indexOf(id);
          if (idx !== -1) {
            let buy, sell;
            const rawNumbers = [];
            const limit = Math.min(idx + 500, buffer.length - 8);
            for (let i = idx; i < limit; i++) {
              try {
                const v = view.getFloat64(i, true);
                if (v > 1000 && v < 50000) {
                  rawNumbers.push({ val: v, offset: i - idx });
                }
              } catch (err) { }
            }
            if (id === "Au99.99") {
              const prefBuy = rawNumbers.find(
                (n) => n.offset > 100 && n.offset < 1200,
              )?.val;
              const prefSell = rawNumbers.find(
                (n) => n.offset > 30 && n.offset < 300 && n.val < 4000,
              )?.val;
              if (prefBuy && prefSell) {
                buy = prefBuy;
                sell = prefSell;
              }
            } else if (id === "Ag(T+D)") {
              const validAg = rawNumbers.filter((n) => n.val > 5000);
              if (validAg.length >= 2) {
                buy = validAg[0].val;
                sell = validAg[1].val;
              }
            }
            if (buy && sell) {
              const prev = dataRef.current[id] || {};
              if (prev.sell !== sell || prev.buy !== buy) {
                dataRef.current[id] = {
                  id,
                  name: nameMapping[id],
                  buy,
                  sell,
                  prevSell: prev.sell,
                };
                hasUpdate = true;
              }
            }
          }
        });

        if (hasUpdate) {
          if (updateTimerRef.current == null) {
            updateTimerRef.current = setTimeout(() => {
              setData({ ...dataRef.current });
              updateTimerRef.current = null;
            }, 250);
          }
        }
      };
      ws.onclose = () => {
        wsReconnectAttemptsRef.current = Math.min(
          wsReconnectAttemptsRef.current + 1,
          6,
        );
        const delay = Math.min(
          30000,
          1000 * Math.pow(2, wsReconnectAttemptsRef.current),
        );
        wsReconnectTimerRef.current = setTimeout(connectWS, delay);
      };
    };

    const connectYahoo = () => {
      if (wsYahooRef.current && wsYahooRef.current.readyState === 1) return;
      if (wsYahooReconnectTimerRef.current) {
        clearTimeout(wsYahooReconnectTimerRef.current);
        wsYahooReconnectTimerRef.current = null;
      }
      const root = protobuf.Root.fromJSON(schemaJSON);
      const Yaticker = root.lookupType("Yaticker");
      const wsY = new WebSocket("wss://streamer.finance.yahoo.com/?version=2");
      wsYahooRef.current = wsY;

      wsY.onopen = () => {
        wsYahooReconnectAttemptsRef.current = 0;
        if (wsY.readyState === 1)
          wsY.send(JSON.stringify({ subscribe: ["DX-Y.NYB"] }));
      };

      wsY.onmessage = async (event) => {
        try {
          const rawData = JSON.parse(event.data);
          if (rawData.message) {
            const bytes = Uint8Array.from(window.atob(rawData.message), (c) =>
              c.charCodeAt(0),
            );
            const decoded = Yaticker.decode(bytes);
            const changeP = decoded.changePercent;
            const now = Date.now();

            if (
              Math.abs(changeP) >= 0.1 &&
              now - lastNotiTime.current >= 30000
            ) {
              const isUp = changeP > 0;

              setNotification({
                percent: changeP.toFixed(2),
                isUp: isUp,
              });
              audioRef.current.play().catch(() => { });
              lastNotiTime.current = now;
              setTimeout(() => setNotification(null), 8000);
            }

            const prev = yahooStocksRef.current[decoded.id] || {};
            if (prev.price !== decoded.price) {
              yahooStocksRef.current[decoded.id] = {
                ...prev,
                ...decoded,
                prevPrice: prev.price,
              };
              setYahooStocks({ ...yahooStocksRef.current });
            }
          }
        } catch (e) { }
      };
      wsY.onclose = () => {
        wsYahooReconnectAttemptsRef.current = Math.min(
          wsYahooReconnectAttemptsRef.current + 1,
          6,
        );
        const delay = Math.min(
          30000,
          1000 * Math.pow(2, wsYahooReconnectAttemptsRef.current),
        );
        wsYahooReconnectTimerRef.current = setTimeout(connectYahoo, delay);
      };
    };

    connectWS();
    connectYahoo();
    return () => {
      wsRef.current?.close();
      wsYahooRef.current?.close();
      if (wsReconnectTimerRef.current)
        clearTimeout(wsReconnectTimerRef.current);
      if (wsYahooReconnectTimerRef.current)
        clearTimeout(wsYahooReconnectTimerRef.current);
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    };
  }, []);

  return (
    <>
      {notification && (
        <div
          className={`dxy-noti ${notification.isUp ? "noti-up" : "noti-down"}`}
          style={{
            position: "fixed",
            top: "5px",
            right: "5px",
            zIndex: 9999,
            // Giảm padding tối đa để màu nền sát chữ
            padding: "4px 8px",
            borderRadius: "4px",
            width: "fit-content",
            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            // Màu nền đỏ/xanh thuần, không gradient để trông gọn hơn
            background: notification.isUp ? "#1b5e20" : "#b71c1c",
            color: "#fff",
            display: "flex",
            flexDirection: "column", // Đẩy biến động xuống dòng
            alignItems: "flex-start",
            gap: "2px", // Khoảng cách giữa 2 dòng cực nhỏ
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                whiteSpace: "nowrap",
              }}
            >
              {notification.isUp ? t("dxy.up") : t("dxy.down")}
            </span>
            <span
              onClick={() => setNotification(null)}
              style={{
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                lineHeight: "1",
              }}
            >
              ✕
            </span>
          </div>

          <div
            style={{
              fontSize: "11px",
              opacity: "0.9",
              whiteSpace: "nowrap",
            }}
          >
            {t("dxy.change", {
              percent: `${notification.isUp ? "+" : ""}${notification.percent}`,
            })}
          </div>
        </div>
      )}

      <div className="ticker-group">
        {Object.values(data).map((stock) => (
          <RongTongTickerItem key={stock.id} stock={stock} rate={rate} />
        ))}
        {yahooStocks["DX-Y.NYB"] && (
          <Link
            to="/dxy-chart"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <YahooDXYItem stock={yahooStocks["DX-Y.NYB"]} />
          </Link>
        )}
      </div>
    </>
  );
};

const RongTongTickerItem = ({ stock, rate }) => {
  const [flashClass, setFlashClass] = useState("");
  useEffect(() => {
    if (!stock.prevSell || !stock.sell) return;
    setFlashClass(stock.sell > stock.prevSell ? "flash-green" : "flash-red");
    const timer = setTimeout(() => setFlashClass(""), 1000);
    return () => clearTimeout(timer);
  }, [stock.sell]);

  const convert = (val) => (val * rate * 31.1035) / 1000;

  return (
    <div className={`ticker-item ${flashClass}`}>
      <span
        className="item-label"
        style={{ color: stock.id === "Au99.99" ? "#ffd700" : "#ffffff" }}
      >
        {stock.name}
      </span>
      <div className="item-prices">
        <span className="price-buy">Mua: {convert(stock.buy).toFixed(3)}$</span>
        <span className="price-sell">
          Bán: {convert(stock.sell).toFixed(3)}$
        </span>
      </div>
    </div>
  );
};

const YahooDXYItem = ({ stock }) => {
  const [flashClass, setFlashClass] = useState("");
  useEffect(() => {
    if (!stock.prevPrice || !stock.price) return;
    setFlashClass(stock.price > stock.prevPrice ? "flash-green" : "flash-red");
    const timer = setTimeout(() => setFlashClass(""), 1000);
    return () => clearTimeout(timer);
  }, [stock.price]);
  const isPositive = stock.change >= 0;
  return (
    <div className={`ticker-item ${flashClass}`}>
      <span className="item-label" style={{ color: "#fff" }}>
        DXY
      </span>
      <div className="item-prices">
        <span style={{ color: "#fff" }}>{stock.price?.toFixed(3)}</span>
        <span
          className={`price-change ${isPositive ? "positive" : "negative"}`}
          style={{ marginLeft: "8px" }}
        >
          {isPositive ? "+" : ""}
          {stock.change?.toFixed(2)} ({isPositive ? "+" : ""}
          {stock.changePercent?.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
};

export default RongTongSocket;
