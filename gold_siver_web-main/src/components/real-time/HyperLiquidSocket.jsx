import React, { useEffect, useRef, useState } from "react";

const WS_URL = "wss://api-ui.hyperliquid.xyz/ws";

const COINS = [
  "BTC",
  "ETH",
  "cash:SILVER",
  "cash:GOLD"
];

const HyperLiquidSocket = ({ render }) => {

  const wsRef = useRef(null);

  const [market, setMarket] = useState({
    BTC: {},
    ETH: {},
    "cash:SILVER": {},
    "cash:GOLD": {}
  });

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("HyperLiquid Connected");

      COINS.forEach((coin) => {

        ws.send(JSON.stringify({
          method: "subscribe",
          subscription: {
            type: "l2Book",
            coin: coin,
            nSigFigs: null
          }
        }));

      });

      // BTC extra data
      COINS.forEach((coin) => {
        ws.send(JSON.stringify({
          method: "subscribe",
          subscription: {
            type: "activeAssetCtx",
            coin: coin
          }
        }));
      });

    };

    ws.onmessage = (event) => {
      console.log("RAW WS:", event.data);
      try {
        const msg = JSON.parse(event.data);
        console.log("PARSED WS:", msg);
        if (!msg.channel) return;
        if (msg.channel === "l2Book") {

          const coin = msg.data?.coin || msg.subscription?.coin;

          const bid = msg.data?.levels?.[0]?.[0];

          if (!bid?.px) return;

          setMarket(prev => ({
            ...prev,
            [coin]: {
              ...prev[coin],
              bid: bid.px,
              price: bid.px
            }
          }));
        }
        if (msg.channel === "activeAssetCtx") {
          console.log("Active Asset Price:", msg.data.ctx.prevDayPx, msg.data.ctx.markPx);
          const coin = msg.data?.coin;

          const price = parseFloat(msg.data?.ctx?.markPx);
          const prev = parseFloat(msg.data?.ctx?.prevDayPx);

          const percent = ((price - prev) / prev) * 100;

          setMarket(prevState => ({
            ...prevState,
            [coin]: {
              ...prevState[coin],
              price,
              percent
            }
          }));
        }
      } catch (err) {
        console.error(err);
      }

    };
    ws.onclose = () => console.log("HyperLiquid WS Closed");
    return () => ws.close();
  }, []);
  return render(market);
};

export default HyperLiquidSocket;