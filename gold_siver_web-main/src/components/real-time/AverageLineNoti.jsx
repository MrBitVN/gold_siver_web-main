import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Hàm tính MA cho những MA chưa có (MA100, MA150)
const calculateMA = (data, key, periods) => {
  return data.map((item, index) => {
    let newItem = { ...item };
    periods.forEach((days) => {
      const maKey = `ma${days}`;
      if (!newItem[maKey]) {
        if (index + 1 < days) newItem[maKey] = null;
        else {
          let sum = 0;
          for (let i = index - days + 1; i <= index; i++) sum += data[i][key];
          newItem[maKey] = sum / days;
        }
      }
    });
    return newItem;
  });
};

// Component hiển thị Silver
const SilverComponent = ({ data, realTime }) => (
  <div style={{ marginBottom: 20 }}>
    <h3>Silver (Bạc) - Giá hiện tại: {realTime.toFixed(2)}</h3>
    <table
      border="1"
      cellPadding="5"
      style={{ borderCollapse: "collapse", width: "100%" }}
    >
      <thead>
        <tr>
          <th>Date</th>
          <th>Close</th>
          <th>MA50</th>
          <th>MA100</th>
          <th>MA150</th>
          <th>MA200</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr key={idx}>
            <td>{item.date}</td>
            <td>{item.close.toFixed(2)}</td>
            <td>{item.ma50?.toFixed(2) ?? "-"}</td>
            <td>{item.ma100?.toFixed(2) ?? "-"}</td>
            <td>{item.ma150?.toFixed(2) ?? "-"}</td>
            <td>{item.ma200?.toFixed(2) ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Component hiển thị Gold
const GoldComponent = ({ data, realTime }) => (
  <div style={{ marginBottom: 20 }}>
    <h3>Gold (Vàng) - Giá hiện tại: {realTime.toFixed(2)}</h3>
    <table
      border="1"
      cellPadding="5"
      style={{ borderCollapse: "collapse", width: "100%" }}
    >
      <thead>
        <tr>
          <th>Date</th>
          <th>Close</th>
          <th>MA50</th>
          <th>MA100</th>
          <th>MA150</th>
          <th>MA200</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr key={idx}>
            <td>{item.date}</td>
            <td>{item.close.toFixed(2)}</td>
            <td>{item.ma50?.toFixed(2) ?? "-"}</td>
            <td>{item.ma100?.toFixed(2) ?? "-"}</td>
            <td>{item.ma150?.toFixed(2) ?? "-"}</td>
            <td>{item.ma200?.toFixed(2) ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AverageLineNoti = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dataBac, setDataBac] = useState([]);
  const [dataVang, setDataVang] = useState([]);
  const [notification, setNotification] = useState(null);
  const [realTime, setRealTime] = useState({ XAU: 0, XAG: 0 });
  const audioRef = useRef(
    new Audio("https://metalinvest.cloud/co_du_lieu_moi.mp3"),
  );
  const lastNotiTime = useRef({ XAU: 0, XAG: 0 });

  // Fetch dữ liệu lịch sử
  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://api_gold.thinkdiff.us/notify_duong_trungbinh",
      );
      const result = await response.json();

      setDataBac(calculateMA(result.data_bac, "close", [100, 150]));
      setDataVang(calculateMA(result.data_vang, "close", [100, 150]));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket realtime
  useEffect(() => {
    const ws = new WebSocket("wss://api-ui.hyperliquid.xyz/ws");

    ws.onopen = () => {
      ["cash:GOLD", "cash:SILVER"].forEach((coin) => {
        ws.send(
          JSON.stringify({
            method: "subscribe",
            subscription: { type: "activeAssetCtx", coin },
          }),
        );
      });
    };

    // Trong useEffect WS
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.channel !== "activeAssetCtx") return;

        const coin = msg.data?.coin;
        const price = parseFloat(msg.data?.ctx?.markPx);

        setRealTime((prev) => {
          const newState = {
            XAU: coin === "cash:GOLD" ? price : prev.XAU,
            XAG: coin === "cash:SILVER" ? price : prev.XAG,
          };

          const now = Date.now();

          // Notification Gold
          if (coin === "cash:GOLD" && now - lastNotiTime.current.XAU > 15000) {
            const lastGold = dataVang[0];
            if (
              lastGold &&
              newState.XAU < lastGold.ma150 &&
              newState.XAU < lastGold.ma200
            ) {
              setNotification({
                title: t("AverageLineNoti.alertTitle", {
                  asset: t("AverageLineNoti.gold"),
                }),
                note: t("AverageLineNoti.alertNote", {
                  asset: t("AverageLineNoti.gold"),
                  price: newState.XAU.toFixed(2),
                  ma200: lastGold.ma200?.toFixed(2) ?? "-",
                }),
                value: "⚠️",
                coin: "XAU",
              });
              audioRef.current
                .play()
                .catch(() => console.log("Yêu cầu tương tác để phát nhạc"));
              lastNotiTime.current.XAU = now;

              setTimeout(() => setNotification(null), 10000); // tự tắt
            }
          }

          // Notification Silver
          if (
            coin === "cash:SILVER" &&
            now - lastNotiTime.current.XAG > 15000
          ) {
            const lastSilver = dataBac[0];
            if (
              lastSilver &&
              newState.XAG < lastSilver.ma150 &&
              newState.XAG < lastSilver.ma200
            ) {
              setNotification({
                title: t("AverageLineNoti.alertTitle", {
                  asset: t("AverageLineNoti.silver"),
                }),
                note: t("AverageLineNoti.alertNote", {
                  asset: t("AverageLineNoti.silver"),
                  price: newState.XAG.toFixed(2),
                  ma200: lastSilver.ma200?.toFixed(2) ?? "-",
                }),
                value: "⚠️",
                coin: "XAG",
              });
              audioRef.current
                .play()
                .catch(() => console.log("Yêu cầu tương tác để phát nhạc"));
              lastNotiTime.current.XAG = now;

              setTimeout(() => setNotification(null), 10000); // tự tắt
            }
          }

          return newState;
        });
      } catch (err) {
        console.error(err);
      }
    };

    return () => ws.close();
  }, [dataBac, dataVang]);

  const handleCloseNoti = () => setNotification(null);

  const handleNotiClick = () => {
    navigate("/thong-bao-duong-tb");
    setNotification(null);
  };

  return (
    <div>
      {notification && (
        <div
          style={{
            position: "fixed",
            top: 100,
            right: 12,
            padding: 12,
            backgroundColor: "#ff4d4d",
            borderRadius: 8,
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            minWidth: 220,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span onClick={handleNotiClick}>
              {notification.value} {notification.title}
            </span>
            <button
              onClick={handleCloseNoti}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✖
            </button>
          </div>
          <div style={{ fontSize: 12 }}>{notification.note}</div>
        </div>
      )}

      {/* <SilverComponent data={dataBac} realTime={realTime.XAG} />
      <GoldComponent data={dataVang} realTime={realTime.XAU} /> */}
    </div>
  );
};

export default AverageLineNoti;
