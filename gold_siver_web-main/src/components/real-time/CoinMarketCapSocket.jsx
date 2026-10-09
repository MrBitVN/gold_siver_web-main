import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

/**
 * Component kết nối WebSocket với CoinMarketCap
 * wss://push.coinmarketcap.com/ws?device=web&client_source=coin_detail_page
 * Đăng ký giá thời gian thực của Bitcoin (crypto_id: 1)
 */
const CoinMarketCapSocket = () => {
  const [btcData, setBtcData] = useState({
    price: null,
    prevPrice: null,
    change24h: null,
  });

  const wsRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(
          "wss://push.coinmarketcap.com/ws?device=web&client_source=coin_detail_page"
        );
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("🟢 [CoinMarketCap WS] Connected");
          // Đăng ký nhận giá cho Bitcoin (id: 1)
          const msg = {
            method: "subscribe",
            params: ["price@1"],
          };
          ws.send(JSON.stringify(msg));

          // Gửi heartbeat ping mỗi 15 giây
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ method: "ping" }));
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Parse tin nhắn giá đẩy về từ CMC WebSocket
            if (data && data.d) {
              const payload = data.d;
              if (payload.p != null) {
                setBtcData((prev) => ({
                  price: payload.p,
                  prevPrice: prev.price || payload.p,
                  change24h: payload.p24h != null ? payload.p24h : prev.change24h,
                }));
              }
            } else if (data && data.p != null) {
              setBtcData((prev) => ({
                price: data.p,
                prevPrice: prev.price || data.p,
                change24h: data.p24h != null ? data.p24h : prev.change24h,
              }));
            }
          } catch (err) {
            // Ignore format non-JSON
          }
        };

        ws.onclose = () => {
          console.warn("🟡 [CoinMarketCap WS] Closed. Reconnecting in 5s...");
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          reconnectTimerRef.current = setTimeout(connect, 5000);
        };

        ws.onerror = (err) => {
          console.error("🔴 [CoinMarketCap WS] Error:", err);
          ws.close();
        };
      } catch (e) {
        console.error("Lỗi kết nối CMC Socket:", e);
      }
    };

    connect();

    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Tính flash highlight khi giá thay đổi
  const [flashClass, setFlashClass] = useState("");
  useEffect(() => {
    if (!btcData.prevPrice || !btcData.price) return;
    if (btcData.price > btcData.prevPrice) {
      setFlashClass("flash-green");
    } else if (btcData.price < btcData.prevPrice) {
      setFlashClass("flash-red");
    }
    const timer = setTimeout(() => setFlashClass(""), 1000);
    return () => clearTimeout(timer);
  }, [btcData.price, btcData.prevPrice]);

  const isPos = (btcData.change24h || 0) >= 0;

  return (
    <div className={`ticker-item ${flashClass}`}>
      <span className="item-label" style={{ color: "#f7931a", fontWeight: "bold" }}>
        ₿ Bitcoin (CMC)
      </span>
      <div className="item-prices">
        <span style={{ color: "#fff", fontWeight: "bold" }}>
          {btcData.price
            ? `$${btcData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : "Đang tải..."}
        </span>
        {btcData.change24h != null && (
          <span
            className={`price-change ${isPos ? "positive" : "negative"}`}
            style={{ marginLeft: "8px" }}
          >
            {isPos ? "+" : ""}
            {btcData.change24h.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default CoinMarketCapSocket;
