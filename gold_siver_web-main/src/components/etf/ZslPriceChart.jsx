import React, { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import "./ZslPriceChart.css";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = "https://api_gold.thinkdiff.us/ZSL_proshare_ultrashort_silver";

const verticalLinePlugin = {
  id: "verticalLine",
  afterDraw(chart) {
    const tooltip = chart.tooltip;
    if (!tooltip || !tooltip.getActiveElements().length) return;
    const ctx = chart.ctx;
    const x = tooltip.getActiveElements()[0].element.x;
    const topY = chart.chartArea.top;
    const bottomY = chart.chartArea.bottom;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, topY);
    ctx.lineTo(x, bottomY);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    ctx.stroke();
    ctx.restore();
  },
};

// Drop nulls by default for simplicity
const buildPoints = (timestamps = [], values = [], scale = 1) => {
  if (!Array.isArray(timestamps) || !Array.isArray(values)) return [];
  return timestamps
    .map((t, i) => {
      const v = values[i];
      if (v === null || v === undefined) return null;
      return { x: new Date(t * 1000), y: Number(v) / scale };
    })
    .filter(Boolean);
};

const buildVolumePoints = (timestamps = [], volumes = []) => {
  if (!Array.isArray(timestamps) || !Array.isArray(volumes)) return [];
  return timestamps
    .map((t, i) => {
      const v = volumes[i];
      if (v === null || v === undefined) return null;
      return { x: new Date(t * 1000), y: Number(v) };
    })
    .filter(Boolean);
};

const ZslPriceChart = () => {
  const { t } = useTranslation();
  const [dataRaw, setDataRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Timeframe state: '1W' | '1M' | '6M' | 'ALL'
  // Mặc định: 6 tháng
  const [timeframe, setTimeframe] = useState('6M');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(API_URL);
        const json = await res.json();
        if (!cancelled) setDataRaw(json);
      } catch (err) {
        if (!cancelled) setError(err.message || t("ZSLChart.fetchError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => (cancelled = true);
  }, []);

  const { pricePoints, volPoints, latest, allPricePoints } = useMemo(() => {
    if (!dataRaw) return { pricePoints: [], volPoints: [], latest: null };

    const r = dataRaw.ZSL_co_phieu?.chart?.result?.[0];
    const timestamps = r?.timestamp || [];
    const quote = r?.indicators?.quote?.[0] || {};
    const close = quote.close || [];
    const volume = quote.volume || [];

    // Use priceHint to scale (10^priceHint)
    const priceHint = r?.meta?.priceHint ?? 4;

    const scale = Math.pow(10, priceHint);

    const allPricePoints = buildPoints(timestamps, close, scale);
    const volPoints = buildVolumePoints(timestamps, volume);

    // Filter by timeframe relative to latest point
    const latestTime = allPricePoints.length ? allPricePoints[allPricePoints.length - 1].x.getTime() : Date.now();
    const msInDay = 24 * 60 * 60 * 1000;
    let cutoff = 0;
    switch (timeframe) {
      case '1W':
        cutoff = latestTime - 7 * msInDay;
        break;
      case '1M':
        cutoff = latestTime - 30 * msInDay;
        break;
      case '6M':
        cutoff = latestTime - 180 * msInDay;
        break;
      default:
        cutoff = -Infinity;
    }

    const pricePoints = timeframe === 'ALL' ? allPricePoints : allPricePoints.filter(p => p.x.getTime() >= cutoff);
    const filteredVolPoints = timeframe === 'ALL' ? volPoints : volPoints.filter(p => p.x.getTime() >= cutoff);

    const last = pricePoints.length ? pricePoints[pricePoints.length - 1] : null;
    let prev = null;
    if (pricePoints.length >= 2) prev = pricePoints[pricePoints.length - 2];

    const latest = last
      ? {
        price: last.y,
        prev: prev ? prev.y : null,
        date: last.x,
      }
      : null;

    return {
      pricePoints,
      volPoints: filteredVolPoints,
      latest,
      allPricePoints, // 👈 THÊM
    };

  }, [dataRaw, timeframe]);

  const data = {
    datasets: [
      {
        type: "line",
        label: t("ZSLChart.price"),
        data: pricePoints,
        borderColor: "#e25555",
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const grd = ctx.createLinearGradient(0, 0, 0, 200);
          grd.addColorStop(0, "rgba(226,85,85,0.16)");
          grd.addColorStop(1, "rgba(226,85,85,0.02)");
          return grd;
        },
        pointRadius: 0,
        tension: 0.25,
        yAxisID: "y",
        fill: true,
      },
      {
        type: "bar",
        label: t("ZSLChart.volume"),
        data: volPoints,
        backgroundColor: "rgba(200,200,200,0.6)",
        yAxisID: "yVolume",
        barThickness: "flex",
      },
    ],
  };

  const allDates = [...pricePoints, ...volPoints].map((p) => +p.x);
  const minDate = allDates.length ? Math.min(...allDates) : undefined;
  const maxDate = allDates.length ? Math.max(...allDates) : undefined;

  // Helper: interpolate price at given ms timestamp using pricePoints
  const interpolatePriceAt = (ms) => {
    const points = allPricePoints; // 👈 DÙNG FULL DATA
    if (!points || points.length === 0) return null;
    if (points.length === 1) return points[0].y;

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const ax = a.x.getTime();
      const bx = b.x.getTime();
      if (ms >= ax && ms <= bx) {
        const t = (ms - ax) / (bx - ax);
        return a.y + (b.y - a.y) * t;
      }
    }

    if (ms < points[0].x.getTime()) return points[0].y;
    if (ms > points[points.length - 1].x.getTime()) return points[points.length - 1].y;
    return null;
  };


  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "x", intersect: false },
    plugins: {
      legend: { position: "top" },
      tooltip: {
        filter: (item) => item.raw && item.raw.y !== null && item.raw.y !== undefined,
        callbacks: {
          title: (items) => (items && items.length ? new Date(items[0].parsed.x).toLocaleDateString(i18n.language) : ""),
          label: (ctx) => {
            if (ctx.dataset.type === "bar") return `${t("ZSLChart.volume")}: ${Number(ctx.parsed.y).toLocaleString(i18n.language)}`;
            return `${t("ZSLChart.price")}: ${Number(ctx.parsed.y).toFixed(4)}`;
          },
          // Footer: always show interpolated price at hovered X (useful when line point not active)
          footer: (items) => {
            if (!items || !items.length) return "";
            const ms = items[0].parsed ? items[0].parsed.x : (items[0].raw && items[0].raw.x ? new Date(items[0].raw.x).getTime() : null);
            if (!ms) return "";
            const price = interpolatePriceAt(ms);
            if (price === null || price === undefined) return "";
            return `Price (interp): ${Number(price).toFixed(4)}`;
          }
        },
      },
    },
    scales: {
      x: {
        type: "time",
        min: minDate,
        max: maxDate,
        time: { unit: "day", displayFormats: { day: "MMM d" } },
        grid: { color: "rgba(148,163,184,0.06)" },
      },
      y: {
        position: "left",
        ticks: { color: "#e6eef6" },
        grid: { color: "rgba(148,163,184,0.06)" },
      },
      yVolume: {
        position: "right",
        grid: { display: false },
        ticks: { display: false },
      },
    },
  };

  return (
    <div className="zsl-price-wrapper">
      <div className="zsl-price-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="zsl-price-title">{t("ZSLChart.title")}</div>

          {/* Timeframe buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['1W', '1M', '6M', 'ALL'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: timeframe === tf ? '1px solid #e25555' : '1px solid rgba(255,255,255,0.06)',
                  background: timeframe === tf ? 'rgba(226,85,85,0.12)' : 'transparent',
                  color: '#e6eef6',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}
              >
                {tf === '1W'
                  ? t("ZSLChart.timeframe.1W")
                  : tf === '1M'
                    ? t("ZSLChart.timeframe.1M")
                    : tf === '6M'
                      ? t("ZSLChart.timeframe.6M")
                      : t("ZSLChart.timeframe.ALL")}
              </button>
            ))}
          </div>
        </div>

        <div className="zsl-price-stats">
          {loading && <span>{t("ZSLChart.loading")}</span>}
          {!loading && !latest && <span>{t("ZSLChart.noData")}</span>}
          {!loading && latest && (
            <>
              <div className="price">{latest.price.toFixed(4)}</div>
              <div className={`change ${latest.prev !== null && latest.prev > latest.price ? 'down' : 'up'}`}>
                {latest.prev !== null ? `${(latest.price - latest.prev).toFixed(4)} (${(((latest.price - latest.prev) / latest.prev) * 100).toFixed(2)}%)` : ""}
              </div>
            </>
          )}
        </div>
      </div>

      {error && <div className="zsl-error">{t("ZSLChart.error")}: {error}</div>}

      <div className="zsl-price-chart">
        <Chart type="bar" data={data} options={options} plugins={[verticalLinePlugin]} />
      </div>
    </div>
  );
};

export default ZslPriceChart;
