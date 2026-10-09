import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { Chart } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import i18n from "i18next";
import SaveLSCamap from "./SaveLSCamapGold";
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  BarElement,
  Tooltip,
  Legend,
  zoomPlugin
);

const WS_URL = "wss://api-ui.hyperliquid.xyz/ws";
const COIN = "btc"; // fixed BTC only

const BtcLongShortMap = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [dateList, setDateList] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const [timeList, setTimeList] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");

  const [btcData, setBtcData] = useState([]);
  const [updateTime, setUpdateTime] = useState(null);

  const [selectedItemTable, setSelectedItemTable] = useState(null);
  const [selectedItemChart, setSelectedItemChart] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showTable, setShowTable] = useState(false);

  const wsRef = useRef(null);
  const [market, setMarket] = useState({ btc: {} });

  /** fetch danh sách ngày từ API all_day_ca_map */
  const fetchDateList = async () => {
    try {
      const res = await axios.get(
        "https://api_gold.thinkdiff.us/all_day_ca_map"
      );
      const list = res.data?.data || [];
      console.log("list danh sach", list[list.length - 1].dirname)
      const formatted = list
        .map(item => {
          const [day, month, year] = item.dirname.split("_");
          return {
            label: `${day}/${month}/${year}`,
            value: item.dirname,
            datetime: item.datetime
          };
        })
        .sort((a, b) => {
          const parse = (str) => {
            const [d, m, y] = str.split("_");
            return new Date(`${y}-${m}-${d}`);
          };
          return parse(b.value) - parse(a.value);
        });

      setDateList(formatted);
      if (list.length) setSelectedDate(list[list.length - 1].dirname);
    } catch (err) {
      console.error("Fetch date list error:", err);
    }
  };

  /** fetch dữ liệu BTC theo ngày */
  const fetchBtcData = async (date) => {
    try {
      setErrorMessage("");

      let currentDate = date;
      let links = [];
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        console.log("date", currentDate);

        const res = await axios.get(
          `https://api_gold.thinkdiff.us/all_ca_map_json_1_day/btc/${currentDate}`
        );

        links = res.data?.data || [];

        if (links.length > 0) {
          break; // có data thì dừng
        }

        currentDate = getPreviousDate(currentDate);
        attempts++;
      }

      if (!links.length) {
        setErrorMessage("Không có dữ liệu BTC trong 5 ngày gần nhất.");
        setBtcData([]);
      } else {
        setBtcData(links);
        setSelectedDate(currentDate); // 👈 update lại date đã lùi
      }

      // 2️⃣ Chọn link mới nhất
      const latestLink = links[links.length - 1];
      console.log("Link", latestLink.link)

      // 3️⃣ Lấy dữ liệu thực tế từ link mới nhất
      const dataRes = await axios.get(latestLink.link);
      const dataObj = dataRes.data?.data || {};

      // 4️⃣ Cập nhật state với dữ liệu chi tiết
      setBtcData(dataObj.list_data || []);

      setUpdateTime(dataObj.date_time);

      // 5️⃣ Tạo timeList dựa vào tất cả link để chọn giờ (nếu cần dropdown)
      const newTimeList = links.map(item => {
        const filename = item.link.split("/").pop(); // BTC_0_48.json
        const match = filename.match(/BTC_(\d+)_(\d+)\.json$/);

        let label = "00:00"; // default
        if (match) {
          const hour = match[1].padStart(2, "0");
          const minute = match[2].padStart(2, "0");
          label = `${hour}:${minute}`;
        }

        return {
          label,
          value: label, // dùng giờ:phút làm value
          link: item.link
        };
      });

      setTimeList(newTimeList);

      // Chọn giờ mới nhất
      setSelectedTime(newTimeList[newTimeList.length - 1]?.value || "");

    } catch (err) {
      console.error("Fetch BTC data error:", err);
      setErrorMessage("Lỗi khi kết nối API.");
    }
  };

  /** fetch chi tiết theo thời gian đã chọn */
  const fetchBtcOldData = async (item) => {
    try {
      const res = await axios.get(item.link);
      const data = res.data?.data || {};
      setBtcData(data.list_data || []);
    } catch (err) {
      console.error("Fetch BTC old data error:", err);
    }
  };

  useEffect(() => {
    fetchDateList();
  }, []);

  useEffect(() => {
    if (selectedDate) fetchBtcData(selectedDate);
  }, [selectedDate]);

  /** WebSocket BTC */
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        method: "subscribe",
        subscription: { type: "activeAssetCtx", coin: "btc" }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.channel === "activeAssetCtx") {
          const price = parseFloat(msg.data?.ctx?.markPx);
          const prev = parseFloat(msg.data?.ctx?.prevDayPx);
          const percent = ((price - prev) / prev) * 100;

          setMarket({ btc: { price, percent } });
        }
      } catch (err) {
        console.error(err);
      }
    };

    ws.onclose = () => console.log("BTC WS Closed");

    return () => ws.close();
  }, []);

  /** Build chart data */
  const buildChartData = (rawData) => {
    if (!Array.isArray(rawData)) return { labels: [], datasets: [], raw: [] };

    const data = [...rawData].sort((a, b) => a.entryPrice - b.entryPrice);

    return {
      labels: data.map(item => {
        const price = Number(item.entryPrice).toLocaleString("en-US");
        const side = item.side === "long" ? "🟢 Long" : "🔴 Short";
        return `${price} USD (${side})`;
      }),
      raw: data,
      datasets: [
        {
          type: "bar",
          label: "Long",
          data: data.map(item => item.side === "long" ? item.giatri : 0),
          backgroundColor: "#42f557"
        },
        {
          type: "bar",
          label: "Short",
          data: data.map(item => item.side === "short" ? item.giatri : 0),
          backgroundColor: "#f22727"
        }
      ]
    };
  };

  const chartData = useMemo(() => buildChartData(btcData), [btcData]);

  const chartOptions = (chartRawData, setSelectedTime) => {
    const isMobile = window.innerWidth <= 768;

    return {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      stacked: true,
      onClick: (evt, elements) => {
        if (!elements.length) return;
        const index = elements[0].index;
        const item = chartRawData[index];
        if (item) setSelectedItemChart(item);
      },
      plugins: {
        legend: { position: "top" },
        zoom: {
          pan: { enabled: true, mode: "x" },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" }
        }
      },
      scales: {
        x: { ticks: { display: !isMobile }, grid: { display: true } },
        y: { ticks: { display: !isMobile }, grid: { display: true } }
      }
    };
  };

  const centerPricePlugin = (price, color) => ({
    id: "centerPricePlugin",
    afterDraw: (chart) => {
      if (!price) return;
      const { ctx, scales } = chart;
      const y = scales.y.getPixelForValue(price);
      const x = scales.x.left + 10;
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(`${price}`, x, y);
      ctx.restore();
    }
  });

  /** Helper */
  const toMillionUSD = (value) => (value / 1_000_000).toFixed(3);

  const DetailTable = ({ data }) => {
    if (!data) return null;
    const profileObj = parseProfile(data.profile);

    return (
      <div className="cm-detail-box">
        <div className="cm-detail-header">
          <h4 className="cm-detail-title">📊 {t("detail.title")}
            <span style={{ color: data.side === "long" ? "green" : "red", fontWeight: "bold" }}>
              {data.side === "long" ? " (Long)" : " (Short)"}
            </span>
          </h4>
          <button
            className="cm-link-btn"
            onClick={() => window.open(data.link_wallet, "_blank")}
          >
            🔗 {t("detail.viewWallet")}
          </button>
        </div>

        <div className="cm-detail-grid">
          <div className="cm-item">
            <span>{t("CaMaplongshortChart.asset")}</span>
            <strong>{data.coin}</strong>
          </div>

          <div className="cm-item">
            <span>{t("CaMaplongshortChart.entryPrice")}</span>
            <strong>{data.entryPrice}</strong>
          </div>

          <div className="cm-item">
            <span>{t("CaMaplongshortChart.leverage")}</span>
            <strong>{data.isolatedLeverage}x</strong>
          </div>

          <div className="cm-item">
            <span>{t("CaMaplongshortChart.totalValue")}</span>
            <strong>{toMillionUSD(data.value)} {t("CaMaplongshortChart.usd")}</strong>
          </div>

          <div className="cm-item">
            <span>{t("CaMaplongshortChart.pnl")}</span>
            <strong
              style={{ color: data.unrealizedPnl >= 0 ? "#00ff9d" : "#ff4d4f" }}
            >
              <strong>{toMillionUSD(data.unrealizedPnl)} {t("CaMaplongshortChart.usd")}</strong>
            </strong>
          </div>

          <div className="cm-item">
            <span>{t("CaMaplongshortChart.liquidation")}</span>
            <strong>{toMillionUSD(data.liquidationPrice)} {t("CaMaplongshortChart.usd")}</strong>
          </div>
          <div className="cm-item">
            <span>{t("detail.ounce")}</span>
            <strong>{data.size?.toLocaleString("en-US")}</strong>
          </div>
          {/* <div className="cm-item">
            <span>Tiến trình thanh lý</span>
            <strong>{data.liquidationProgress}%</strong>
          </div> */}

          <div className="cm-item">
            <span>{t("CaMaplongshortChart.equity")}</span>
            <strong>{toMillionUSD(profileObj?.totalEquity)} {t("CaMaplongshortChart.usd")}</strong>
          </div>

          <div className="cm-item" >
            <span>{t("CaMaplongshortChart.openTime")}</span>
            <strong>
              {new Date(data.openTime).toLocaleString("vi-VN")} (
              {Math.floor((Date.now() - new Date(data.openTime).getTime()) / (1000 * 60 * 60 * 24))} ngày)
            </strong>
          </div>
        </div>
      </div>
    );
  };

  const Top5Table = ({ data, toMillionUSD }) => {
    if (!data?.length) return null;

    // 1️⃣ Sắp xếp theo giá trị tuyệt đối giảm dần
    const getValue = (item) => item.giatri ?? 0;
    const sorted = [...data].sort((a, b) => Math.abs(getValue(b)) - Math.abs(getValue(a)));

    // 2️⃣ Lọc trùng wallet_link (nếu có danh sách danhsach)
    const uniqueMap = new Map();
    sorted.forEach(item => {
      const wallet = item.wallet_link || (item.danhsach?.[0]?.wallet_link) || Math.random();
      if (!uniqueMap.has(wallet)) uniqueMap.set(wallet, item);
    });
    const uniqueItems = Array.from(uniqueMap.values());

    // 3️⃣ Lấy top 5 sau khi lọc trùng
    const top5 = uniqueItems.slice(0, 10);

    const handleRowClick = (item) => {
      setSelectedItemTable(item);
    };

    return (
      <div>
        <table className="top5-table">
          <thead>
            <tr>
              <th>Entry Price</th>
              <th>Value (USD)</th>
              <th>Open Time</th>
              <th>Side</th>
              <th>Size</th>
              <th>Coin</th>
            </tr>
          </thead>
          <tbody>
            {top5.map((item, idx) => (
              <tr key={idx} onClick={() => handleRowClick(item)} style={{ cursor: "pointer" }}>
                <td>{item.entryPrice}</td>
                <td style={{ color: item.side === "long" ? "#00ff9d" : "#ff4d4f" }}>
                  {toMillionUSD(item.giatri)}
                </td>
                <td>
                  {new Date(item.openTime).toLocaleString("vi-VN")}
                </td>
                <td className={item.side === "long" ? "long" : "short"}>{item.side}</td>
                <td>{item.danhsach?.[0]?.size?.toLocaleString("en-US") || "-"}</td>
                <td>{item.danhsach?.[0]?.coin || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {selectedItemTable && <DetailTable data={selectedItemTable.danhsach
          ? selectedItemTable.danhsach[selectedItemTable.danhsach.length - 1]
          : selectedItemTable} />}
      </div>
    );
  };

  const DataTable = ({ title, data }) => {
    const [sortType, setSortType] = useState("value");
    // "value" | "time"
    if (!data || data.length === 0)
      return <p style={{ color: "white" }}>Không có dữ liệu {title}</p>;

    const handleRowClick = (item) => {
      if (item.wallet_link) {
        window.open(item.wallet_link, "_blank"); // mở link full trong tab mới
      }
    };
    const getValue = (item) => item.value ?? item.giatri ?? 0;
    // 1. Sắp xếp dữ liệu theo giatri tăng dần
    const sortedData = [...data].sort((a, b) => {
      if (sortType === "value") {
        return Math.abs(getValue(b)) - Math.abs(getValue(a)); // lớn → nhỏ
      }

      if (sortType === "time") {
        return new Date(b.openTime).getTime() - new Date(a.openTime).getTime(); // mới → cũ
      }

      return 0;
    });


    return (
      <>
      <div>
        <SaveLSCamap type={'btc'}/>
      </div>
      <div style={{ marginBottom: 32, marginTop: "500px" }}>
        <div style={{ marginBottom: 12, justifyContent: "flex-start", display: "flex" }}>
          <button
            className={`sort-btn ${sortType === "value" ? "active" : ""}`}
            onClick={() => setSortType("value")}
          >
            🔢 {t("BtcLongShortMap.table.sortValue")}
          </button>

          <button
            className={`sort-btn ${sortType === "time" ? "active" : ""}`}
            onClick={() => setSortType("time")}
            style={{ marginLeft: 8 }}
          >
            ⏱ {t("BtcLongShortMap.table.sortTime")}
          </button>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#000",
            color: "white",
          }}
        >
          <thead>
            <tr style={{ background: "#111" }}>
              <th style={{ border: "1px solid #444", padding: 8 }}>{t("BtcLongShortMap.table.entryPrice")}</th>
              <th style={{ border: "1px solid #444", padding: 8 }}>{t("BtcLongShortMap.table.totalValue")}</th>
              <th style={{ border: "1px solid #444", padding: 8 }}>{t("BtcLongShortMap.table.openTime")}</th>
              <th style={{ border: "1px solid #444", padding: 8 }}>{t("BtcLongShortMap.table.side")}</th>
              <th style={{ border: "1px solid #444", padding: 8 }}>{t("BtcLongShortMap.table.size")}</th>
              <th style={{ border: "1px solid #444", padding: 8 }}>{t("BtcLongShortMap.table.wallet")}</th>
              <th style={{ border: "1px solid #444", padding: 8 }}>{t("BtcLongShortMap.table.coin")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, idx) => (
              <tr
                key={idx}
                onClick={() => handleRowClick(item)}
                style={{
                  cursor: "pointer",
                  textAlign: "center",
                  background: idx % 2 === 0 ? "#000" : "#111",
                }}
              >
                <td style={{ border: "1px solid #444", padding: 8 }}>{item.entryPrice}</td>
                <td style={{ border: "1px solid #444", padding: 8 }}>
                  {toMillionUSD(item.value || item.giatri)} triệu USD
                </td>
                <td style={{ border: "1px solid #444", padding: 8 }}>
                  <strong>
                    {new Date(item.openTime).toLocaleString("vi-VN")} (
                    {Math.floor(
                      (Date.now() - new Date(item.openTime).getTime()) /
                      (1000 * 60 * 60 * 24)
                    )}{" "}
                    ngày)
                  </strong>
                </td>
                <td
                  style={{
                    border: "1px solid #444",
                    padding: 8,
                    color: item.side === "long" ? "#0f0" : "#f00",
                    fontWeight: "bold",
                  }}
                >
                  {item.side}
                </td>
                <td
                  style={{
                    border: "1px solid #444",
                    padding: 8,
                    color: item.side === "long" ? "#0f0" : "#f00",
                    fontWeight: "bold",
                  }}
                >
                  {item.danhsach?.[0]?.size || "-"}
                </td>
                <td style={{ border: "1px solid #444", padding: 8 }}>
                  {item.wallet_link ? item.wallet_link.slice(-10) : ""}
                </td>
                <td style={{ border: "1px solid #444", padding: 8 }}>
                  {item.coin || item.danhsach?.[0]?.coin || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>

    );
  };

  if (!chartData.raw.length) {
    return (
      <div>
        <h2>{t("BtcLongShortMap.title")}</h2>
        <p style={{ color: "orange" }}>⚠️ {errorMessage || t("common.noData")}</p>
        <button onClick={() => fetchBtcData(selectedDate)}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="cm-chart-title" >
        {t("btcMap.title")}
      </h2>
      <div className="cm-toolbar">
        <div>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            {dateList.map((item, index) => (
              <option key={index} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={selectedTime}
            onChange={(e) => {
              const time = e.target.value;
              setSelectedTime(time);
              const found = timeList.find(t => t.value === time);
              if (found) fetchBtcOldData(found);
            }}
          >
            {timeList.map((item, index) => (
              <option key={index} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>


        <button onClick={() => fetchBtcData(selectedDate)}>🔄 {t("common.refresh")}</button>
      </div>
      <div style={{ textAlign: "center" }}>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#bfa900",
            color: "#fff",
            fontWeight: "600",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background-color 0.3s"
          }}
          onClick={() => setShowTable(true)}
        >
          {t("btcMap.viewMore")}
        </button>
        {showTable && (
          <div style={{ position: "relative" }}>
            {/* Nút đóng ở góc trên bên phải */}
            <button
              onClick={() => setShowTable(false)}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: 24,
                cursor: "pointer",
              }}
            >
              ❌
            </button>
            {/* Component DataTable */}
            <DataTable title="Bitcoin Data" data={btcData} />
          </div>
        )}
      </div>

      <Top5Table
        data={btcData}
        toMillionUSD={toMillionUSD}
      />

      <div className="cm-chart-box">
        {updateTime && (
          <p>{t("btcMap.lastUpdate")}: {new Date(updateTime).toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US")}</p>
        )}

        <Chart
          type="bar"
          data={chartData}
          options={chartOptions(chartData.raw, setSelectedItemChart)}
          plugins={[centerPricePlugin(market.btc?.price, "gold")]}
        />

        {selectedItemChart && <DetailTable data={
          selectedItemChart?.danhsach
            ? selectedItemChart.danhsach[selectedItemChart.danhsach.length - 1]
            : selectedItemChart} />}
      </div>

    </div>
  );
};

export default BtcLongShortMap;

function getPreviousDate(dateStr) {
  const [day, month, year] = dateStr.split("_").map(Number);
  const d = new Date(year, month - 1, day);

  d.setDate(d.getDate() - 1);

  const newDay = d.getDate(); // không pad
  const newMonth = d.getMonth() + 1; // không pad
  const newYear = d.getFullYear();

  return `${newDay}_${newMonth}_${newYear}`;
}

const parseProfile = (profile) => {
  if (!profile) return null;

  try {
    const fixed = profile
      .replace(/'/g, '"')        // ' → "
      .replace(/\bFalse\b/g, "false")
      .replace(/\bTrue\b/g, "true")
      .replace(/\bNone\b/g, "null");

    return JSON.parse(fixed);
  } catch (err) {
    console.error("Parse profile lỗi:", err);
    return null;
  }
};