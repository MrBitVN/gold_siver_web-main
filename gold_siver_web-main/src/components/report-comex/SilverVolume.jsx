import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { useMemo, useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import './SilverVolume.css';

ChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
  LineController,
  BarController,
);

function SilverVolume({ type, labels, data }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const lastNotiTime = useRef({});
  const audioRef = useRef(new Audio("/dxy_tang_giam.mp3"));

  const stats = useMemo(() => {
    if (!data || data.length === 0)
      return {
        volAvg: 0,
        volDiff: 0,
        volLabel: "",
        volColor: "#C0C0C0",
        oiAvg: 0,
        oiDiff: 0,
        oiLabel: "",
        oiColor: "#C0C0C0",
      };

    // ===== Volume =====
    const totalVol = data.reduce((sum, item) => sum + Number(item.vol), 0);
    const avgVol = totalVol / data.length;
    const latestVol = Number(data[0].vol);

    const isVolHigher = latestVol >= avgVol;
    const volDiff =
      avgVol !== 0
        ? Math.abs(((latestVol - avgVol) / avgVol) * 100).toFixed(1)
        : 0;

    // ===== Open Interest =====
    const totalOi = data.reduce((sum, item) => sum + Number(item.oi), 0);
    const avgOi = totalOi / data.length;
    const latestOi = Number(data[0].oi);

    const isOiHigher = latestOi >= avgOi;
    const oiDiff =
      avgOi !== 0
        ? Math.abs(((latestOi - avgOi) / avgOi) * 100).toFixed(1)
        : 0;

    return {
      volAvg: Math.round(avgVol),
      volDiff,
      volLabel: isVolHigher ? t("common.increase") : t("common.decrease"),
      volColor: isVolHigher ? "#10b981" : "#ef4444",

      oiAvg: Math.round(avgOi),
      oiDiff,
      oiLabel: isOiHigher ? t("common.increase") : t("common.decrease"),
      oiColor: isOiHigher ? "#10b981" : "#ef4444",
    };
  }, [data, t]);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const now = Date.now();
    const latestVol = Number(data[0].vol);
    let message = null;
    let isStrong = false;
    // ===== Option =====
    if (type === "silverOption") {
      if (latestVol > 20000) {
        message = t("SilverVolume.optionStrong");
        isStrong = true;
      }
      if (latestVol < 4800) {
        message = t("SilverVolume.optionAccumulation");
        isStrong = false;
      }
    }

    // ===== Future =====
    if (type !== "silverOption") {
      if (latestVol > 200000) {
        message = t("SilverVolume.futureStrong");
        isStrong = true;
      }
      if (latestVol < 60000) {
        message = t("SilverVolume.futureWeak");
        isStrong = false;
      }
    }

    if (message) {
      if (!lastNotiTime.current.vol || now - lastNotiTime.current.vol > 60000) {
        setNotification({
          title: message,
          percent: new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US").format(latestVol),
          isUp: isStrong,
          changeText: t("SilverVolume.compareAvg", {
            label: stats.volLabel,
            percent: stats.volDiff
          })
        });

        audioRef.current.play().catch(() => { });
        lastNotiTime.current.vol = now;

        setTimeout(() => setNotification(null), 8000);
      }
    }
  }, [data, type, stats, t, i18n.language]);

  const { volData, oiData } = useMemo(() => {
    return {
      volData: data.map((y) => y.vol).reverse(),
      oiData: data.map((y) => y.oi).reverse(),
    };
  }, [data]);

  const dataChart = {
    labels: [...labels].reverse(),
    datasets: [
      {
        type: "line",
        label: t("SilverVolume.volume"),
        borderColor: type === "silverOption" ? "#fbbf24" : "#3b82f6",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
        data: volData,
        yAxisID: "y",
      },
      {
        type: "bar",
        label: t("SilverVolume.openInterest"),
        backgroundColor: type === "silverOption" ? "rgba(59, 130, 246, 0.4)" : "rgba(37, 99, 235, 0.4)",
        data: oiData,
        yAxisID: "y1",
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#fff',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US").format(context.parsed.y);
            }
            return label;
          },
        },
      },
      legend: {
        display: true,
        labels: { color: "#94a3b8", font: { size: 11, weight: '600' } },
      },
    },
    scales: {
      y: {
        type: "linear",
        position: "left",
        title: { display: true, text: t("SilverVolume.volShort"), color: "#64748b", font: { size: 10, weight: '700' } },
        ticks: { color: "#64748b", font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.03)' }
      },
      y1: {
        type: "linear",
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display: true, text: t("SilverVolume.oiShort"), color: "#64748b", font: { size: 10, weight: '700' } },
        ticks: { color: "#64748b", font: { size: 10 } },
      },
      x: {
        ticks: {
          color: "#64748b",
          font: { size: 10 },
          autoSkip: true,
          maxTicksLimit: 12
        },
        grid: { display: false }
      },
    },
  };

  return (
    <>
      {notification && (
        <div className={`notification-pop ${notification.isUp ? 'up' : 'down'}`} style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 10000,
          padding: "12px 20px", borderRadius: "12px", background: notification.isUp ? "#064e3b" : "#7f1d1d",
          color: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", border: `1px solid ${notification.isUp ? '#10b981' : '#ef4444'}`,
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{ fontWeight: "800", fontSize: '14px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
            {notification.title}
            <span onClick={() => setNotification(null)} style={{ cursor: "pointer", opacity: 0.7 }}>✕</span>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            {t("SilverVolume.volume")}: <span style={{ fontWeight: '800' }}>{notification.percent}</span>
          </div>
          <div style={{ fontSize: "11px", opacity: 0.8, marginTop: '4px' }}>
            {notification.changeText}
          </div>
        </div>
      )}

      <div className="silver-volume-card">
        <div className="chart-header">
          <h2 className="chart-title" onClick={() => navigate("/volume-comex")}>
            {t("SilverVolume.title", {
              type: type === "silverOption" ? t("SilverVolume.option") : t("SilverVolume.future")
            })}
          </h2>

          <div className="stats-container">
            <div className="stat-item">
              <span className="stat-label">{t("SilverVolume.avgVolume")}</span>
              <span className="stat-value">{new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US").format(stats.volAvg)}</span>
              <span className="stat-change" style={{ color: stats.volColor }}>
                {stats.volLabel} {stats.volDiff}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">{t("SilverVolume.avgOI")}</span>
              <span className="stat-value">{new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US").format(stats.oiAvg)}</span>
              <span className="stat-change" style={{ color: stats.oiColor }}>
                {stats.oiLabel} {stats.oiDiff}%
              </span>
            </div>
          </div>
        </div>

        <div className="chart-container-inner">
          <Chart type="bar" data={dataChart} options={options} />
        </div>
      </div>
    </>
  );
}

export default SilverVolume;
