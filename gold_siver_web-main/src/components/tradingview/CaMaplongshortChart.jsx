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
import "./CaMaplongshortChart.css";

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
const COINS = ["cash:GOLD", "cash:SILVER"];

const CaMaplongshortChart = () => {
  const { t, i18n } = useTranslation();
  const [goldData, setGoldData] = useState([]);
  const [silverData, setSilverData] = useState([]);
  const [selectedGoldItem, setSelectedGoldItem] = useState(null);
  const [selectedSilverItem, setSelectedSilverItem] = useState(null);
  const [goldUpdateTime, setGoldUpdateTime] = useState(null);
  const [silverUpdateTime, setSilverUpdateTime] = useState(null);
  // const [showGoldDetail, setShowGoldDetail] = useState(false);
  // const [showSilverDetail, setShowSilverDetail] = useState(false);

  // GOLD
  const [goldDate, setGoldDate] = useState("");
  const [goldTimeList, setGoldTimeList] = useState([]);
  const [goldTime, setGoldTime] = useState("");

  // SILVER
  const [silverDate, setSilverDate] = useState("");
  const [silverTimeList, setSilverTimeList] = useState([]);
  const [silverTime, setSilverTime] = useState("");

  const navigate = useNavigate();
  const [dateList, setDateList] = useState([]);

  const [goldSummary, setGoldSummary] = useState(null);
  const [silverSummary, setSilverSummary] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [goldDataCurrent, setGoldDataCurrent] = useState([]);
  const [silverDataCurrent, setSilverDataCurrent] = useState([]);


  const findClosestTime = (targetTime, list, maxDiff = 2) => {
    const toMinutes = (t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const target = toMinutes(targetTime);

    let closest = null;
    let minDiff = Infinity;

    for (const item of list) {
      const diff = Math.abs(toMinutes(item.time) - target);

      if (diff <= maxDiff && diff < minDiff) {
        minDiff = diff;
        closest = item;
      }
    }

    return closest;
  };

  const generateDateList = (days = 30) => {
    const list = [];

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();

      list.push({
        label: `${day}/${month}/${year}`, // hiển thị
        value: `${day}_${month}_${year}`  // dùng cho API
      });
    }

    return list;
  };
  useEffect(() => {
    const dates = generateDateList(30);
    setDateList(dates);

    if (dates.length) {
      setGoldDate(dates[0].value); // mặc định hôm nay
      setSilverDate(dates[0].value);
    }
  }, []);

  const fetchGoldTimeList = async (date) => {
    try {
      const res = await axios.get(
        `https://api_gold.thinkdiff.us/all_ca_map_json_1_day/gold/${date}`
      );

      const list = res.data?.data?.map(item => {
        const [datePart, timePart] = item.modified_time.split(" ");
        const [hour, minute] = timePart.split(":");

        return {
          time: `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`,
          link: item.link
        };
      }) || [];

      setGoldTimeList(list);

      if (list.length) {
        setGoldTime(list[list.length - 1].time);
        fetchGoldOldData(list[list.length - 1]);
      }
    } catch (e) {
      console.warn("fetchGoldTimeList error:", e.message);
    }
  };

  const fetchSilverTimeList = async (date) => {
    try {
      const res = await axios.get(
        `https://api_gold.thinkdiff.us/all_ca_map_json_1_day/silver/${date}`
      );

      const list = res.data?.data?.map(item => {
        const [datePart, timePart] = item.modified_time.split(" ");
        const [hour, minute] = timePart.split(":");

        return {
          time: `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`,
          link: item.link
        };
      }) || [];

      setSilverTimeList(list);

      if (list.length) {
        setSilverTime(list[list.length - 1].time);
        fetchSilverOldData(list[list.length - 1]);
      }
    } catch (e) {
      console.warn("fetchSilverTimeList error:", e.message);
    }
  };


  const fetchGoldOldData = async (item) => {
    const res = await axios.get(item.link);
    const data = res.data?.data || {};

    setGoldData(data.list_data || []);
    setGoldSummary({
      ti_le_long: data.ti_le_long || 0,
      ti_le_short: data.ti_le_short || 0,
      tong_long_camap_tren1m: data.tong_long_camap_tren1m || 0,
      tong_short_camap_tren1m: data.tong_short_camap_tren1m || 0
    });
    setGoldDataCurrent({
      gia_vang_hientai: res.data?.data?.gia_vang_hientai,
    })
  };

  const fetchSilverOldData = async (item) => {
    const res = await axios.get(item.link);
    const data = res.data?.data || {};

    setSilverData(data.list_data || []);
    setSilverSummary({
      ti_le_long: data.ti_le_long || 0,
      ti_le_short: data.ti_le_short || 0,
      tong_long_camap_tren1m: data.tong_long_camap_tren1m || 0,
      tong_short_camap_tren1m: data.tong_short_camap_tren1m || 0
    });
    setSilverDataCurrent({
      gia_bac_hientai: res.data?.data?.gia_bac_hientai
    })
  };

  useEffect(() => {
    if (goldDate) fetchGoldTimeList(goldDate);
  }, [goldDate]);

  useEffect(() => {
    if (silverDate) fetchSilverTimeList(silverDate);
  }, [silverDate]);

  const fetchType = async (type) => {
    try {
      const res = await axios.get(
        `https://api_gold.thinkdiff.us/long_short_ca_map/${type}`
      );

      return {
        list: res.data?.data?.list_data || [],
        time: res.data?.data?.date_time || null,
        summary: {
          ti_le_long: res.data?.data?.ti_le_long,
          ti_le_short: res.data?.data?.ti_le_short,
          tong_long_camap_tren1m: res.data?.data?.tong_long_camap_tren1m,
          tong_short_camap_tren1m: res.data?.data?.tong_short_camap_tren1m
        },
        current: {
          gia_vang_hientai: res.data?.data?.gia_vang_hientai,
          gia_bac_hientai: res.data?.data?.gia_bac_hientai
        }
      };
    } catch (err) {
      console.error(`Fetch ${type} error:`, err?.response?.status || err.message);
      return { list: [], time: null, summary: null }; // fallback
    }
  };

  // Dữ liệu WebSocket
  const [market, setMarket] = useState({
    "cash:GOLD": {},
    "cash:SILVER": {}
  });
  const wsRef = useRef(null);

  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = async () => {
    try {
      setErrorMessage(""); // reset
      const [gold, silver] = await Promise.all([
        fetchType("gold"),
        fetchType("silver")
      ]);

      setGoldDataCurrent(gold.current);
      setSilverDataCurrent(silver.current);
      setGoldData(gold.list);
      setSilverData(silver.list);
      setGoldUpdateTime(gold.time);
      setSilverUpdateTime(silver.time);

      setGoldSummary(gold.summary);
      setSilverSummary(silver.summary);

      if (!gold.list.length || !silver.list.length) {
        setErrorMessage("Không tải được dữ liệu từ server, vui lòng thử lại sau.");
      }
    } catch (err) {
      console.error("API error:", err);
      setErrorMessage("Lỗi khi kết nối API.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // WebSocket connect
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      COINS.forEach((coin) => {
        ws.send(JSON.stringify({
          method: "subscribe",
          subscription: { type: "activeAssetCtx", coin }
        }));
      });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.channel === "activeAssetCtx") {
          const coin = msg.data?.coin;
          const price = parseFloat(msg.data?.ctx?.markPx);
          const prev = parseFloat(msg.data?.ctx?.prevDayPx);
          const percent = ((price - prev) / prev) * 100;

          setMarket(prevState => ({
            ...prevState,
            [coin]: { price, percent }
          }));
        }
      } catch (err) {
        console.error(err);
      }
    };

    ws.onclose = () => console.log("HyperLiquid WS Closed");

    return () => ws.close();
  }, []);

  const buildChartData = (rawData) => {
    if (!Array.isArray(rawData)) return { labels: [], datasets: [], raw: [] };

    const data = [...rawData].sort((a, b) => a.entryPrice - b.entryPrice);

    return {
      labels: data.map((item) => {
        const price = Number(item.entryPrice).toLocaleString("en-US");
        const side = item.side === "long" ? "🟢 Long" : "🔴 Short";

        return `${price} USD (${side})`;
      }),
      raw: data,
      datasets: [
        {
          type: "bar",
          label: "Long",
          data: data.map((item) =>
            item.side === "long" ? item.giatri : 0
          ),
          backgroundColor: "#42f557"
        },
        {
          type: "bar",
          label: "Short",
          data: data.map((item) =>
            item.side === "short" ? item.giatri : 0
          ),
          backgroundColor: "#f22727"
        }
      ]
    };
  };

  const options = (chartRawData, setSelectedTime) => {
    const isMobile = window.innerWidth <= 768; // breakpoint mobile

    return {
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false
      },
      stacked: true,
      onClick: (evt, elements) => {
        if (!elements.length) return;
        const index = elements[0].index;
        const item = chartRawData[index];
        if (item) setSelectedTime(item);
      },
      plugins: {
        legend: { position: "top" },
        zoom: {
          pan: { enabled: true, mode: "x" },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x"
          }
        }
      },
      scales: {
        x: {
          ticks: {
            display: !isMobile // ẩn nhãn trục X trên mobile
          },
          grid: {
            display: true // vẫn hiển thị lưới
          }
        },
        y: {
          ticks: {
            display: !isMobile // ẩn nhãn trục Y trên mobile
          },
          grid: {
            display: true // vẫn hiển thị lưới
          }
        }
      }
    };
  };

  const DetailTable = ({ data }) => {
    if (!data) return null;
    const profileObj = parseProfile(data.profile);

    return (
      <div className="cm-detail-box">
        <div className="cm-detail-header">
          <h4 className="cm-detail-title">📊 Chi tiết lệnh
            <span style={{ color: data.side === "long" ? "green" : "red", fontWeight: "bold" }}>
              {data.side === "long" ? " (Long)" : " (Short)"}
            </span>
          </h4>
          <button
            className="cm-link-btn"
            onClick={() => window.open(data.link_wallet, "_blank")}
          >
            🔗 Xem chi tiết ví
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
            <span>Số Ounce</span>
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

          <div className="cm-item" style={{ gridColumn: "1 / -1" }}>
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

  const centerPricePlugin = (price, color) => ({
    id: "centerPricePlugin",
    afterDraw: (chart) => {
      if (!price) return;

      const { ctx, scales } = chart;

      // Lấy trục x và y
      const xScale = scales.x;
      const yScale = scales.y;

      // Vị trí y theo giá thị trường
      const y = yScale.getPixelForValue(price);

      // Vị trí x: có thể để ở giữa chart, hoặc ở cạnh trái
      const x = xScale.left + 10; // 10px từ trái, có thể điều chỉnh

      ctx.save();
      ctx.fillStyle = color;
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left"; // sát bên trái
      ctx.textBaseline = "middle";
      ctx.fillText(`${price}`, x, y);
      ctx.restore();
    }
  });

  const Top5Table = ({ data }) => {
    // 1. Sắp xếp theo giá tăng dần
    const getValue = (item) => item.value ?? item.giatri ?? 0;
    const sorted = [...data].sort(
      (a, b) => Math.abs(getValue(b)) - Math.abs(getValue(a))
    );

    // 2. Lọc trùng wallet_link

    // 3. Lấy top 5 sau khi lọc trùng
    const top5 = sorted.slice(0, 10);

    const handleRowClick = (item) => {
      setSelectedItem(item); // chọn item để hiển thị chi tiết
    };

    return (
      <div>
        <table className="top5-table">
          <thead>
            <tr>
              <th>{t("CaMaplongshortChart.entryPrice")}</th>
              <th>{t("CaMaplongshortChart.totalValue")}</th>
              <th>{t("CaMaplongshortChart.openTime")}</th>
              <th>{t("CaMaplongshortChart.side")}</th>
              <th>{t("CaMaplongshortChart.size")}</th>
              <th>{t("CaMaplongshortChart.coin")}</th>
            </tr>
          </thead>
          <tbody>
            {top5.map((item, idx) => (
              <tr
                key={idx}
                onClick={() => handleRowClick(item)}
                style={{ cursor: "pointer" }}
              >
                <td>{item.entryPrice}</td>
                <td
                  style={{
                    color: item.side === "long" ? "#00ff9d" : "#ff4d4f",
                  }}
                >
                  {toMillionUSD(item.giatri)} {t("CaMaplongshortChart.usd")}
                </td>
                <td>
                  <strong>
                    {new Date(item.openTime).toLocaleString("vi-VN")} (
                    {Math.floor(
                      (Date.now() - new Date(item.openTime).getTime()) /
                      (1000 * 60 * 60 * 24)
                    )} {t("CaMaplongshortChart.day")})
                  </strong>
                </td>
                <td className={item.side === "long" ? "long" : "short"}>
                  {item.side}
                </td>
                <td>{item.danhsach?.[0]?.size?.toLocaleString("en-US") || "-"}</td>
                <td>{item.danhsach?.[0]?.coin || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {selectedItem && <DetailTable data={selectedItem.danhsach
          ? selectedItem.danhsach[selectedItem.danhsach.length - 1]
          : selectedItem} />}
      </div>
    );
  };

  const SummaryTable = ({ data }) => {
    if (!data) return null;

    return (
      <table className="top5-table" style={{ marginBottom: "20px" }}>
        <thead>
          <tr>
            <th>{t("CaMaplongshortChart.longRatio")}</th>
            <th>{t("CaMaplongshortChart.shortRatio")}</th>
            <th>{t("CaMaplongshortChart.totalLong")}</th>
            <th>{t("CaMaplongshortChart.totalShort")}</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ cursor: "default" }}>
            <td style={{ color: "#00ff9d" }}>{data.ti_le_long.toFixed(2)}</td>
            <td style={{ color: "#ff4d4f" }}>{data.ti_le_short.toFixed(2)}</td>
            <td>{data.tong_long_camap_tren1m.toLocaleString()}</td>
            <td>{data.tong_short_camap_tren1m.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    );
  };

  const goldChartData = useMemo(() => buildChartData(goldData), [goldData]);
  const silverChartData = useMemo(() => buildChartData(silverData), [silverData]);

  if (!goldChartData.raw.length && !silverChartData.raw.length) {
    return null;
  }

  return (
    <div>
      {/* 👉 Tiêu đề */}
      <h2 className="cm-chart-title" onClick={() => navigate("/shark-chart")}>
        {t("CaMaplongshortChart.title")}
      </h2>

      <div className="cm-toolbar">
        {/* GOLD */}
        <div className="cm-toolbar-side gold">
          {/* <span className="cm-label">GOLD</span> */}

          <select
            value={goldDate}
            onChange={(e) => setGoldDate(e.target.value)}
          >
            {dateList.map((item, index) => (
              <option key={index} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={goldTime}
            onChange={(e) => {
              const time = e.target.value;
              setGoldTime(time);

              const found = goldTimeList.find(t => t.time === time);
              if (found) fetchGoldOldData(found);
            }}
          >
            <option value="">Giờ</option>
            {goldTimeList.map((item, index) => (
              <option key={index} value={item.time}>
                {item.time}
              </option>
            ))}
          </select>

          <button onClick={fetchData} className="cm-refresh-btn">
            🔄Refresh
          </button>
        </div>

        {/* SILVER */}
        <div className="cm-toolbar-side silver">
          {/* <span className="cm-label">SILVER</span> */}

          <select
            value={silverDate}
            onChange={(e) => setSilverDate(e.target.value)}
          >
            {dateList.map((item, index) => (
              <option key={index} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={silverTime}
            onChange={(e) => {
              const time = e.target.value;
              setSilverTime(time);

              const found = silverTimeList.find(t => t.time === time);
              if (found) fetchSilverOldData(found);
            }}
          >
            <option value="">Giờ</option>
            {silverTimeList.map((item, index) => (
              <option key={index} value={item.time}>
                {item.time}
              </option>
            ))}
          </select>

          <button onClick={fetchData} className="cm-refresh-btn">
            🔄Refresh
          </button>
        </div>
      </div>

      <div className="top5-container">
        <div className="top5-item">
          <h3 style={{ textAlign: "center" }}> GOLD</h3>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 16px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            gap: "16px", // khoảng cách giữa nút và giá vàng
            maxWidth: "400px",
            margin: "0 auto"
          }}>
            <div>
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
                onClick={() => navigate("/shark-chart/gold")}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#a88a00"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#bfa900"}
              >
                {t("CaMaplongshortChart.viewGold")}
              </button>
            </div>

            <div style={{
              fontWeight: "bold",
              fontSize: "15px",
              color: "#bfa900",
              backgroundColor: "#fff8dc",
              padding: "8px 16px",
              borderRadius: "8px",
              textAlign: "center",
              minWidth: "100px"
            }}>
              {goldDataCurrent?.gia_vang_hientai || 0}
            </div>
          </div>
          <SummaryTable data={goldSummary} />
          <div className="top5-table-wrapper">
            <Top5Table data={goldData} />
          </div>
        </div>

        <div className="top5-item">
          <h3 style={{ textAlign: "center" }}> SILVER</h3>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "12px 16px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}>
            <div>
              <button
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#747272",
                  color: "#fff",
                  fontWeight: "600",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background-color 0.3s"
                }}
                onClick={() => navigate("/shark-chart/silver")}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#a9a9a9"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#c0c0c0"}
              >
                {t("CaMaplongshortChart.viewSilver")}
              </button>
            </div>

            <div style={{
              fontWeight: "bold",
              fontSize: "15px",
              color: "#8d8b8b",
              backgroundColor: "#f9f9fa",
              padding: "8px 16px",
              borderRadius: "8px",
              textAlign: "center",
              minWidth: "100px"
            }}>
              {silverDataCurrent?.gia_bac_hientai || 0}
            </div>
          </div>
          <SummaryTable data={silverSummary} />
          <div className="top5-table-wrapper">
            <Top5Table data={silverData} />
          </div>
        </div>
      </div>

      <div className="cm-container">
        {errorMessage && (
          <div style={{ color: "red", marginBottom: "10px" }}>
            ⚠️ {t("CaMaplongshortChart.error")}
          </div>
        )}

        {/* GOLD */}
        <div className="cm-chart-box">
          <h3 style={{ color: "gold" }}>
            GOLD
            {goldUpdateTime && (
              <span style={{ marginLeft: 10, fontSize: "14px", color: "#d0d61f" }}>
                ({t("CaMaplongshortChart.lastUpdate")} {formatTime(goldUpdateTime)})
              </span>
            )}
            {selectedGoldItem && (
              <span style={{ marginLeft: 10, fontSize: "14px", color: "#ccc" }}>
                ({new Date(selectedGoldItem.openTime).toLocaleString("vi-VN")})
              </span>
            )}
          </h3>

          <Chart
            type="bar"
            data={goldChartData}
            options={options(goldChartData.raw, setSelectedGoldItem)}
            plugins={[centerPricePlugin(market["cash:GOLD"]?.price, "gold")]}
          />

          {selectedGoldItem && (
            <DetailTable
              data={
                selectedGoldItem?.danhsach
                  ? selectedGoldItem.danhsach[selectedGoldItem.danhsach.length - 1]
                  : selectedGoldItem
              }
            />
          )}
        </div>

        {/* SILVER */}
        <div className="cm-chart-box">
          <h3 style={{ color: "silver" }}>
            SILVER
            {silverUpdateTime && (
              <span style={{ marginLeft: 10, fontSize: "14px", color: "#d0d61f" }}>
                ({t("CaMaplongshortChart.lastUpdate")} {formatTime(silverUpdateTime)})
              </span>
            )}
            {selectedSilverItem && (
              <span style={{ marginLeft: 10, fontSize: "14px", color: "#ccc" }}>
                ({t("CaMaplongshortChart.lastUpdate")} {new Date(selectedSilverItem.openTime).toLocaleString("vi-VN")})
              </span>
            )}
          </h3>

          <Chart
            type="bar"
            data={silverChartData}
            options={options(silverChartData.raw, setSelectedSilverItem)}
            plugins={[centerPricePlugin(market["cash:SILVER"]?.price, "silver")]}
          />

          {selectedSilverItem && (
            <DetailTable
              data={
                selectedSilverItem?.danhsach
                  ? selectedSilverItem.danhsach[selectedSilverItem.danhsach.length - 1]
                  : selectedSilverItem
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};


const formatTime = (time) => {
  if (!time) return "";
  return new Date(time).toLocaleString("vi-VN");
};

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

const toMillionUSD = (value) => (value / 1_000_000).toFixed(3);

export default CaMaplongshortChart;