import React, { useEffect, useState, useRef } from 'react';

const MarketWatchSocket = ({ render }) => {
  const [marketData, setMarketData] = useState({});
  const ws = useRef(null);

  const symbols = [
    { id: "209704782", label: "Dầu Brent", type: "delayed" },
    { id: "205619834", label: "Khí Gas", type: "composite" },
    { id: "205615174", label: "Dầu WTI", type: "composite" },
    { id: "210364718", label: "Thép", type: "delayed" },
    { id: "205617300", label: "Đồng", type: "composite" },
    { id: "206001000", label: "Nhôm", type: "composite" },
  ];
    // { id: "225893452", label: "Bitcoin", type: "composite" }


  useEffect(() => {
    // Thay Token mới nếu cần tại đây
    const token = "7d4a65d2-b7e3-42c3-83f5-c1bb32a059fa%3A";
    const url = `wss://mwstream.wsj.net/BG2/signalr/connect?transport=webSockets&clientProtocol=1.5&connectionToken=${token}&connectionData=%5B%7B%22name%22%3A%22mainhub%22%7D%5D&tid=1`;

    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({"H":"mainhub","M":"ping","A":[],"I":0}));
      
      symbols.forEach((item, index) => {
        setTimeout(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({
              "H": "mainhub",
              "M": "subscribe",
              "A": [`/zigman2/quotes/${item.id}/${item.type}`, "", "0"],
              "I": index + 1
            }));
          }
        }, index * 200);
      });
    };

    ws.current.onmessage = (event) => {
      if (event.data === "{}") return;
      try {
        const data = JSON.parse(event.data);
        if (data.M) {
          data.M.forEach(msg => {
            if (msg.M === "newMessage") {
              console.log("Received data:", JSON.parse(msg.A[0]));
              const content = JSON.parse(msg.A[0]);
              const id = content.b.t;
              setMarketData(prev => ({
                ...prev,
                [id]: {
                  price: content.b.l,
                  changePercent: (content.b.c / (content.b.l - content.b.c)) * 100, // Tính toán % nếu sv ko trả trực tiếp
                  id: id
                }
              }));
            }
          });
        }
      } catch (e) { console.error("Parse error", e); }
    };

    const timer = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({"H":"mainhub","M":"ping","A":[],"I":99}));
      }
    }, 25000);

    return () => {
      ws.current?.close();
      clearInterval(timer);
    };
  }, []);

  return render(marketData);
};

export default MarketWatchSocket;