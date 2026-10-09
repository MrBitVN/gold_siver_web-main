import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom"; // --- THÊM DÒNG NÀY ---
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { saveToNotificationHistory } from "../tradingview/logger";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend);

const API = "https://api_gold.thinkdiff.us/CVOL_SIVL_COMEX";

const SilverCVOLStatus = () => {
  const navigate = useNavigate(); // --- KHỞI TẠO NAVIGATE ---
  const { t } = useTranslation(); // --- KHỞI TẠO TRANSLATION ---
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [filter, setFilter] = useState("day");

  const audioRef = useRef(new Audio("audio_tingting_CVOL.mp3"));
  const lastNotiTime = useRef(0);

  // --- HÀM XỬ LÝ KHI CLICK VÀO THÔNG BÁO ---
  const handleNotiClick = () => {
    navigate("/cvol-silver-index");
    setNotification(null);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      const json = await res.json();
      const data = json.data || [];

      data.sort((a, b) => new Date(a.transactTime) - new Date(b.transactTime));
      setRawData(data);

      if (data.length > 0) {
        const lastItem = data[data.length - 1];
        const currentCVOL = parseFloat(lastItem.cvolPrice || 0);
        const marketTimeMs = new Date(lastItem.transactTime).getTime();
        const nowReal = Date.now();

        if (currentCVOL > 100) {
          let waveStart = localStorage.getItem("cvol_wave_start_time");

          if (!waveStart) {
            waveStart = marketTimeMs;
            localStorage.setItem("cvol_wave_start_time", waveStart);
          }

          const diffFromStartWave = (nowReal - Number(waveStart)) / 60000;
          const diffFromLatestData = (nowReal - marketTimeMs) / 60000;

          if (diffFromStartWave <= 30 && diffFromLatestData <= 30) {
            const minutesSinceLastNoti = (nowReal - lastNotiTime.current) / 60000;

            if (lastNotiTime.current === 0 || minutesSinceLastNoti >= 5) {
              const logMessage = `Sắp có biến động mạnh: CVOL Silver đạt ${currentCVOL.toFixed(1)} (Vượt ngưỡng 100)`;
              setNotification({
                value: currentCVOL.toFixed(1),
                title: t("silverCVOL.alert"),
                note: t("silverCVOL.alertNote"),
                startTime: formatMarketDate(Number(waveStart)),
                marketTime: formatMarketDate(lastItem.transactTime)
              });
              
              saveToNotificationHistory(logMessage, "CVOL_ALERT");
              
              audioRef.current.play().catch(() => console.log("Yêu cầu tương tác để phát nhạc"));
              lastNotiTime.current = nowReal;
              setTimeout(() => setNotification(null), 10000);
            }
          }
        } else {
          localStorage.removeItem("cvol_wave_start_time");
          lastNotiTime.current = 0;
        }
      }
    } catch (error) {
      console.error("Lỗi fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = useMemo(() => {
    if (!rawData.length) return [];
    if (filter === "all") return rawData;

    const latestItem = rawData[rawData.length - 1];
    const latestTime = new Date(latestItem.transactTime);
    const startTime = new Date(latestTime);

    if (filter === "day") startTime.setDate(latestTime.getDate() - 1);
    if (filter === "week") startTime.setDate(latestTime.getDate() - 7);
    if (filter === "month") startTime.setMonth(latestTime.getMonth() - 1);

    return rawData.filter((item) => new Date(item.transactTime) >= startTime);
  }, [rawData, filter]);

  const formatMarketDate = (time) => {
    const d = new Date(time);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const summary = useMemo(() => {
    if (!filteredData.length) return {};
    const lastItem = filteredData[filteredData.length - 1];
    const prevItem = filteredData[filteredData.length - 2];
    const prices = filteredData.map((i) => Number(i.gia_bac_hien_tai)).filter((v) => v > 0);
    const cvols = filteredData.map((i) => parseFloat(i.cvolPrice)).filter((v) => !isNaN(v));

    return {
      maxPrice: prices.length ? Math.max(...prices) : 0,
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxCVOL: cvols.length ? Math.max(...cvols) : 0,
      minCVOL: cvols.length ? Math.min(...cvols) : 0,
      currentPrice: lastItem?.gia_bac_hien_tai || 0,
      currentCVOL: parseFloat(lastItem?.cvolPrice || 0),
      currentVol: lastItem?.volume_gia || 0,
      lastUpdated: lastItem ? formatMarketDate(lastItem.transactTime) : "",
      priceColor: lastItem?.gia_bac_hien_tai >= prevItem?.gia_bac_hien_tai ? "#1bb553" : "#ef4444",
      cvolColor: parseFloat(lastItem?.cvolPrice) > 100 ? "#ef4444" : "#1bb553",
    };
  }, [filteredData]);

  if (!rawData || !rawData.length) {
    if (!notification) return null;
    return (
      <>
        <style>{`
          .cvol-noti {
            position: fixed; top: 100px; right: 12px; padding: 12px 16px;
            border-radius: 8px; color: white; font-weight: bold;
            font-family: sans-serif; z-index: 9999;
            box-shadow: 0 5px 15px rgba(0,0,0,0.6);
            animation: slideIn 0.3s ease-out;
            display: flex; flex-direction: column; gap: 4px; min-width: 300px;
            background: linear-gradient(135deg, #800000, #ff4d4d); border-left: 4px solid #ffffff;
            cursor: pointer;
          }
          .noti-title { font-size: 18px; line-height: 1.2; }
          .noti-note { font-size: 13px; font-weight: normal; opacity: 0.9; }
          .noti-footer { font-size: 11px; font-weight: normal; color: #ffd700; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 5px; margin-top: 5px; display: flex; justify-content: space-between; }
          .noti-close { position: absolute; top: 8px; right: 8px; cursor: pointer; font-size: 16px; }
          @keyframes slideIn { from { transform: translateX(110%); } to { transform: translateX(0); } }
        `}</style>
        <div className="cvol-noti" onClick={handleNotiClick}>
          <div className="noti-title">{notification.value} - {notification.title}</div>
          <div className="noti-note">{notification.note}</div>
          <div className="noti-footer">
            <span>{t("silverCVOL.startTime")}: {notification.startTime}</span>
          </div>
          <div className="noti-close" onClick={(e) => {
            e.stopPropagation();
            setNotification(null);
          }}>✕</div>
        </div>
      </>
    );
  }

  return (
    <div className="comex-inventory-container" style={{ backgroundColor: "#0f172a", color: "#fff", padding: "20px" }}>
      <style>{`
        .cvol-noti {
          position: fixed; top: 100px; right: 12px; padding: 12px 16px;
          border-radius: 8px; color: white; font-weight: bold;
          font-family: sans-serif; z-index: 9999;
          box-shadow: 0 5px 15px rgba(0,0,0,0.6);
          animation: slideIn 0.3s ease-out;
          display: flex; flex-direction: column; gap: 4px; min-width: 300px;
          background: linear-gradient(135deg, #800000, #ff4d4d); border-left: 4px solid #ffffff;
          cursor: pointer;
        }
        .noti-title { font-size: 18px; line-height: 1.2; }
        .noti-note { font-size: 13px; font-weight: normal; opacity: 0.9; }
        .noti-footer { font-size: 11px; font-weight: normal; color: #ffd700; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 5px; margin-top: 5px; display: flex; justify-content: space-between; }
        .noti-close { position: absolute; top: 8px; right: 8px; cursor: pointer; font-size: 16px; }
        @keyframes slideIn { from { transform: translateX(110%); } to { transform: translateX(0); } }
      `}</style>

      {notification && (
        <div className="cvol-noti" onClick={handleNotiClick}>
          <div className="noti-title">{notification.value} - {notification.title}</div>
          <div className="noti-note">{notification.note}</div>
          <div className="noti-footer">
            <span>{t("silverCVOL.startTime")}: {notification.startTime}</span>
          </div>
          <div className="noti-close" onClick={(e) => {
            e.stopPropagation(); // Ngăn chuyển route khi chỉ muốn đóng
            setNotification(null);
          }}>✕</div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0 }}>{t("silverCVOL.title")}</h2>
          <p style={{ color: "#fff", fontSize: "14px", marginTop: "5px" }}>
            {t("silverCVOL.updated")}: <span style={{ color: "#1bb553" }}>{summary.lastUpdated}</span>
          </p>
        </div>
        <div className="controls" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="filter-buttons">
            {["day", "week", "month", "all"].map((t_filter) => (
              <button key={t_filter} onClick={() => setFilter(t_filter)} style={{ padding: "5px 12px", marginRight: "5px", backgroundColor: filter === t_filter ? "#1bb553" : "#334155", border: "none", color: "white", cursor: "pointer", borderRadius: "4px" }}>
                {t(`silverCVOL.${t_filter}`)}
              </button>
            ))}
          </div>
          <button onClick={fetchData} style={{ padding: "5px 15px", cursor: "pointer", borderRadius: "4px", backgroundColor: "#ef4444", color: "#fff", border: "none" }}>{t("silverCVOL.reload")}</button>
        </div>
      </div>

      <div className="comex-desktop-layout" style={{ display: "flex", gap: "20px" }}>
        <div className="comex-left-column" style={{ flex: "1" }}>
          <div style={{ backgroundColor: "#1e293b", padding: "20px", borderRadius: "12px", textAlign: "center" }}>
            <h3 style={{ borderBottom: "1px solid #334155", paddingBottom: "10px", marginTop: 0 }}>{t("silverCVOL.summary")}</h3>
            <div style={{ margin: "25px 0", position: "relative", display: "inline-block" }}>
              <div style={{ width: "110px", height: "110px", borderRadius: "50%", border: `6px solid ${summary.cvolColor}`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", boxShadow: `0 0 10px ${summary.cvolColor}44` }}>
                <span style={{ fontSize: "12px", color: "#888" }}>CVOL</span>
                <span style={{ fontSize: "24px", fontWeight: "bold", color: summary.cvolColor }}>{summary.currentCVOL?.toFixed(1)}</span>
              </div>
              {summary.currentCVOL > 100 && (
                <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "10px", fontWeight: "bold" }}>{t("silverCVOL.alert")}</div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", textAlign: "left", marginTop: "10px", padding: "0 5px" }}>
              <div><span style={{ color: "#888", fontSize: "12px" }}>{t("silverCVOL.currentPrice")}</span><div style={{ fontSize: "18px", color: summary.priceColor, fontWeight: "bold" }}>{Number(summary.currentPrice).toFixed(2)}</div></div>
              <div style={{ textAlign: "right" }}><span style={{ color: "#888", fontSize: "12px" }}>{t("silverCVOL.volume")}</span><div style={{ fontSize: "18px", fontWeight: "bold" }}>{Number(summary.currentVol).toLocaleString()}</div></div>
            </div>

            <hr style={{ border: "0.5px solid #334155", margin: "15px 0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px", color: "#ccc", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{t("silverCVOL.maxPrice")}:<br /><b style={{ color: "#fff" }}>{summary.maxPrice?.toFixed(2)}</b></span>
                <span style={{ textAlign: "right" }}>{t("silverCVOL.minPrice")}:<br /><b style={{ color: "#fff" }}>{summary.minPrice?.toFixed(2)}</b></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #334155", paddingTop: "8px" }}>
                <span>{t("silverCVOL.maxCVOL")}:<br /><b style={{ color: "#3498db" }}>{summary.maxCVOL?.toFixed(2)}</b></span>
                <span style={{ textAlign: "right" }}>{t("silverCVOL.minCVOL")}:<br /><b style={{ color: "#3498db" }}>{summary.minCVOL?.toFixed(2)}</b></span>
              </div>
            </div>
          </div>
        </div>
        <div className="comex-right-column" style={{ flex: "3", backgroundColor: "#1e293b", padding: "15px", borderRadius: "12px" }}>
          <div style={{ height: "450px" }}>
            <Bar
              data={{
                labels: filteredData.map((i) => formatMarketDate(i.transactTime)),
                datasets: [
                  { type: "bar", label: t("silverCVOL.cvolLabel"), data: filteredData.map((i) => parseFloat(i.cvolPrice)), backgroundColor: "rgba(31, 119, 180, 0.7)", yAxisID: "y" },
                  { type: "bar", label: t("silverCVOL.volume"), data: filteredData.map((i) => i.volume_gia), backgroundColor: "rgba(255, 0, 0, 0.5)", yAxisID: "y1", hidden: true },
                  { type: "line", label: t("silverCVOL.silverPrice"), data: filteredData.map((i) => i.gia_bac_hien_tai), borderColor: "#1bb553", borderWidth: 2, tension: 0.3, pointRadius: 0, yAxisID: "y2" },
                ]
              }}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: {
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                      label: function (context) {
                        const label = context.dataset && context.dataset.label ? context.dataset.label : '';
                        const parsed = context.parsed;
                        const value = parsed && typeof parsed === 'object' ? parsed.y : parsed;
                        if (label === t("silverCVOL.silverPrice")) return `${label}: ${Number(value ?? 0).toFixed(2)}`;
                        if (label === t("silverCVOL.cvolLabel")) return `${label}: ${Number(value ?? 0).toFixed(1)}`;
                        return `${label}: ${value}`;
                      }
                    }
                  }
                },
                scales: {
                  y: { position: "left" },
                  y1: { position: "right", grid: { display: false } },
                  y2: { display: false }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SilverCVOLStatus;