import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom"; // --- THÊM DÒNG NÀY ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import "./MCXHistory.css";
import { saveToNotificationHistory } from "./logger";
import { useTranslation } from "react-i18next";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const RANGE_DAYS = { "1d": 1, "1w": 7, "1m": 30, "3m": 90 };

const MCXHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate(); // --- KHỞI TẠO NAVIGATE ---
  const [rawData, setRawData] = useState({ gold: [], silver: [] });
  const [range, setRange] = useState("1d");
  const [activeMetal, setActiveMetal] = useState("silver");
  const [fxRate, setFxRate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const isMobile = window.innerWidth < 768;

  const lastNotiTimeRef = useRef(0);
  const themeColor = activeMetal === "gold" ? "#FFD700" : "#C0C0C0";

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // --- HÀM XỬ LÝ KHI CLICK VÀO THÔNG BÁO ---
  const handleNotiClick = (id) => {
    navigate("/mcx-fomo");
    removeNotification(id);
  };

  const addNotification = useCallback((message, type) => {
    const now = Date.now();
    if (now - lastNotiTimeRef.current < 60000) return;
    lastNotiTimeRef.current = now;
    const id = now;

    saveToNotificationHistory(message, "MCX_FOMO");

    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 5000);
  }, [removeNotification]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("https://api_gold.thinkdiff.us/groww_mcx_today_price_india");
      const json = await res.json();
      setFxRate(Number(json.tygia_INR_USD) || 1);

      const goldData = (json?.data?.gold || []).filter(i => i.date);
      const silverData = (json?.data?.silver || []).filter(i => i.date);
      setRawData({ gold: goldData, silver: silverData });

      const currentData = activeMetal === "gold" ? goldData : silverData;
      if (currentData.length > 0) {
        const lastGap = Number(currentData[currentData.length - 1].ty_le_chenh);
        const gapFormatted = lastGap.toFixed(2);

        if (lastGap <= 2) {
          addNotification(
            t("MCXHistory.notiBuy", { value: gapFormatted }),
            "buy"
          );
        } else if (lastGap >= 13) {
          addNotification(
            t("MCXHistory.notiSell", { value: gapFormatted }),
            "sell"
          );
        }
      }
    } catch (err) { console.error("Lỗi fetch dữ liệu:", err); }
    finally { setTimeout(() => setLoading(false), 600); }
  }, [activeMetal, addNotification]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sortedActiveData = useMemo(() => {
    const data = rawData[activeMetal] || [];
    const uniqueMap = new Map();
    data.forEach(item => { if (item.date) uniqueMap.set(item.date, item); });
    return Array.from(uniqueMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [rawData, activeMetal]);

  const filteredData = useMemo(() => {
    if (!sortedActiveData.length) return [];
    const lastDate = new Date(sortedActiveData[sortedActiveData.length - 1].date);
    return sortedActiveData.filter((item) => {
      const diff = (lastDate - new Date(item.date)) / (1000 * 60 * 60 * 24);
      return diff <= RANGE_DAYS[range];
    });
  }, [sortedActiveData, range]);

  const latestItem = useMemo(() => sortedActiveData[sortedActiveData.length - 1] || {}, [sortedActiveData]);
  const currentFomo = Number(latestItem.ty_le_chenh) || 0;

  const lastUpdateInfo = useMemo(() => {
    if (!latestItem.date) return null;

    const iso = latestItem.date.replace(" ", "T");
    const d = new Date(iso);

    return {
      date: isNaN(d.getTime()) ? null : d,
      price: (Number(latestItem.close) * fxRate).toLocaleString(undefined, {
        minimumFractionDigits: 2
      })
    };
  }, [latestItem, fxRate]);

  const changeStats = useMemo(() => {
    if (sortedActiveData.length < 2) return null;
    const latest = Number(latestItem.close) * fxRate;
    const calc = (idx) => {
      const prev = Number(sortedActiveData[sortedActiveData.length - (idx + 1)]?.close) * fxRate;
      return prev ? ((latest - prev) / prev) * 100 : 0;
    };
    return { d1: calc(1), d2: calc(2), d3: calc(3), w1: calc(7) };
  }, [sortedActiveData, latestItem, fxRate]);

  const getOptions = (showX = false) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#94a3b8',
        titleFont: { size: 11 },
        bodyFont: { size: 12, weight: 'bold' },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const item = filteredData[index];
            if (!item) return "";
            const d = new Date(item.date);
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
          },
          label: (context) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString(undefined, { minimumFractionDigits: 2 });
              label += context.dataset.type === t('MCXHistory.spread') ? "%" : "$";
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        display: showX,
        ticks: { font: { size: 8 }, color: "#94a3b8", maxRotation: 0 },
        grid: { display: false }
      },
      y: {
        position: "right",
        ticks: { font: { size: 8 }, color: "#94a3b8" },
        grid: { color: "rgba(255,255,255,0.05)" }
      }
    }
  });

  const commonLabels = filteredData.map(i => {
    const d = new Date(i.date);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  if (!filteredData || filteredData.length === 0) return null;

  return (
    <div className="mcx-full-container">
      <div className="mcx-noti-container">
        {notifications.map(noti => (
          <div
            key={noti.id}
            className={`mcx-noti-item ${noti.type}`}
            onClick={() => handleNotiClick(noti.id)} // --- THÊM SỰ KIỆN CLICK VÀO ĐÂY ---
            style={{ cursor: 'pointer' }} // --- THÊM CURSOR ĐỂ NGƯỜI DÙNG BIẾT LÀ CLICK ĐƯỢC ---
          >
            <span>{noti.message}</span>
            <button
              className="noti-close-btn"
              onClick={(e) => {
                e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài làm nhảy route khi chỉ muốn đóng
                removeNotification(noti.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mcx-header-full">
        <div className="mcx-title-box">
          <h2>{t("MCXHistory.title")}</h2>
          <div className="mcx-tabs">
            <button className={activeMetal === "gold" ? "active" : ""} onClick={() => setActiveMetal("gold")}>Gold</button>
            <button className={activeMetal === "silver" ? "active" : ""} onClick={() => setActiveMetal("silver")}>Silver</button>
            {lastUpdateInfo && (
              <span className="header-info">
                {t("MCXHistory.updated")}: <span style={{ color: "#1bb553" }}> {lastUpdateInfo.date.toLocaleString("vi-VN")}</span>
                <span style={{ marginLeft: '10px', color: themeColor, fontWeight: 'bold' }}> {t("MCXHistory.price")}: {lastUpdateInfo.price}$</span>
              </span>
            )}
          </div>
        </div>
        <div className="mcx-range-tabs">
          <button className="mcx-reload-btn" onClick={fetchData} disabled={loading}>{loading ? "..." : t("MCXHistory.reload")}</button>
          {["1d", "1w", "1m", "3m"].map(r => (
            <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>{r.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div className="mcx-main-layout-full">
        <div className="mcx-left-sidebar">
          <p className="grid-label">{t("MCXHistory.change")}</p>
          <div className="stats-2x2">
            {changeStats && [
              { label: t("MCXHistory.day1"), val: changeStats.d1 }, { label: t("MCXHistory.day2"), val: changeStats.d2 },
              { label: t("MCXHistory.day3"), val: changeStats.d3 }, { label: t("MCXHistory.week1"), val: changeStats.w1 },
            ].map((item, i) => (
              <div key={i} className={`stat-card-v2 ${item.val >= 0 ? "positive" : "negative"}`}>
                <span className="s-label">{item.label}</span>
                <span className="s-value">{item.val >= 0 ? "+" : ""}{item.val.toFixed(2)}%</span>
              </div>
            ))}
          </div>

          <div className="fomo-sidebar-box">
            <p className="grid-label">{t("MCXHistory.fomoIndex")}</p>
            <div className="fomo-gauge-wrapper">
              <Doughnut
                data={{
                  datasets: [{
                    data: [Math.min(currentFomo, 15), Math.max(0, 15 - currentFomo)],
                    backgroundColor: [currentFomo >= 13 ? "#ef4444" : "#16a34a", "rgba(255,255,255,0.05)"],
                    borderWidth: 0,
                  }]
                }}
                options={{ cutout: '80%', rotation: -90, circumference: 360, plugins: { tooltip: { enabled: false } } }}
              />
              <div className="fomo-val-display" style={{ color: currentFomo >= 13 ? "#ef4444" : "#16a34a" }}>
                {currentFomo.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>

        <div className="mcx-right-content">
          <div className="main-chart-wrapper combined-chart">
            <p className="chart-label-small">{t("MCXHistory.comparePrice")}</p>
            <div className="chart-canvas-area">
              <Line options={getOptions(false)} data={{
                labels: commonLabels,
                datasets: [
                  {
                    label: t("MCXHistory.mcxPrice"),
                    data: filteredData.map(i => Number(i.close) * fxRate),
                    borderColor: themeColor,
                    backgroundColor: activeMetal === "gold" ? "rgba(255, 215, 0, 0.1)" : "rgba(192, 192, 192, 0.1)",
                    fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
                  },
                  {
                    label: t("MCXHistory.international"),
                    data: filteredData.map(i => Number(i.gia_quoc_te)),
                    borderColor: "#60a5fa",
                    fill: false, tension: 0.4, pointRadius: 0, borderWidth: 2,
                  }
                ]
              }} />
            </div>
          </div>

          <div className="sub-charts-container single-row">
            <div className="sub-chart-item full-width-chart">
              <p className="chart-label-small">{t("MCXHistory.fomoChart")}</p>
              <div className="chart-canvas-area">
                <Line options={getOptions(true)} data={{
                  labels: commonLabels,
                  datasets: [{
                    label: t("MCXHistory.spread"),
                    data: filteredData.map(i => Number(i.ty_le_chenh)),
                    borderColor: "#f87171", backgroundColor: "rgba(248, 113, 113, 0.1)", fill: true, tension: 0.4, pointRadius: 0, borderWidth: 2,
                  }]
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCXHistory;