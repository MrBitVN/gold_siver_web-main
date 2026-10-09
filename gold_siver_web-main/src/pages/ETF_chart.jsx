import React, { useEffect, useState } from "react";
import axios from "axios";
import { Chart } from "react-chartjs-2";
import "./ETF_chart.css";

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

import ETF_Silver from "./ETF_silver";
import ETF_Gold from "./ETF_gold";
import { useTranslation } from "react-i18next";
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

const ETF_chart = () => {
  const { t } = useTranslation();
  const [silverData, setSilverData] = useState(null);
  const [goldData, setGoldData] = useState(null);
  const [silverGrowth, setSilverGrowth] = useState(null);
  const [goldGrowth, setGoldGrowth] = useState(null);
  const [silverAvgGrowth, setSilverAvgGrowth] = useState(null);
  const [goldAvgGrowth, setGoldAvgGrowth] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(
        "https://api_gold.thinkdiff.us/phantich_etf_dudoan"
      );

      const list = res.data?.data?.etf_list || [];

      const labels = list.map((i) => i.time);

      const b = list.map((i) => i.b);
      const v = list.map((i) => i.v);
      const tb_b = list.map((i) => i.tb_b);
      const tb_v = list.map((i) => i.tb_v);

      setSilverData({
        labels,
        datasets: [
          {
            label: t("ETFChart.silver"),
            data: b,
            borderColor: "#C0C0C0",
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 0,
            yAxisID: "y"
          },
          {
            label: t("ETFChart.silverAvg"),
            data: tb_b,
            borderColor: "#9E9E9E",
            borderDash: [5, 5],
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 0,
            yAxisID: "y1"
          }
        ]
      });

      setGoldData({
        labels,
        datasets: [
          {
            label: t("ETFChart.gold"),
            data: v,
            borderColor: "#FFD700",
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 0
          },
          {
            label: t("ETFChart.goldAvg"),
            data: tb_v,
            borderColor: "#FFB300",
            borderDash: [5, 5],
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 0
          }
        ]
      });

      // --- compute 4-hour interval growth for silver and gold ---
      try {
        const times = list.map((i) => i.time);
        const timesMs = times.map((t) => new Date(t).getTime());

        const computeFor = (valueArray) => {
          const stepMs = 4 * 3600 * 1000;
          const indices = [];
          let cursor = timesMs[timesMs.length - 1];
          for (let i = timesMs.length - 1; i >= 0; i--) {
            if (cursor - timesMs[i] >= 0) {
              indices.push(i);
              cursor = timesMs[i] - stepMs;
            }
          }
          indices.reverse();

          const labels4h = indices.map((i) => times[i]);
          const growth = [];
          const price = [];

          indices.forEach((i) => {
            const now = valueArray[i];
            const target = timesMs[i] - stepMs;
            // find previous index <= target
            let prevIdx = -1;
            for (let j = i - 1; j >= 0; j--) {
              if (timesMs[j] <= target) {
                prevIdx = j;
                break;
              }
            }
            if (prevIdx === -1) {
              growth.push(null);
            } else {
              const prev = valueArray[prevIdx];
              const g = (prev != null && now != null && prev !== 0) ? ((now - prev) / prev) * 100 : null;
              growth.push(g == null ? null : parseFloat(g.toFixed(2)));
            }
            price.push(now);
          });

          return { labels: labels4h, growth, price };
        };

        const silverRes = computeFor(b);
        const goldRes = computeFor(v);

        const silverAvgRes = computeFor(tb_b);
        const goldAvgRes = computeFor(tb_v);

        setSilverGrowth(silverRes);
        setGoldGrowth(goldRes);

        setSilverAvgGrowth(silverAvgRes);
        setGoldAvgGrowth(goldAvgRes);
      } catch (e) {
        console.warn("Error computing 4h growth:", e);
      }
    };

    fetchData();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: "index",
      intersect: false
    },

    plugins: {
      legend: { display: true },

      tooltip: {
        enabled: true,
        backgroundColor: "#111",
        titleColor: "#fff",
        bodyColor: "#ddd"
      },

      zoom: {
        pan: {
          enabled: true,
          mode: "x"
        },
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
          display: true,
          color: "#aaa",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          callback: function (value) {
            const label = this.getLabelForValue(value);
            return label.replace("2026-02-09 ", "");
          }
        },
        grid: {
          color: "#222"
        }
      },

      y: {
        type: "linear",
        position: "left",
        ticks: {
          color: "#C0C0C0"
        },
        grid: {
          color: "#222"
        }
      },

      y1: {
        type: "linear",
        position: "right",
        ticks: {
          color: "#9E9E9E"
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  const visiblePoints = 8;

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false, axis: "x" },
    hover: { mode: "index", intersect: false },

    plugins: {
      legend: { display: true, position: "top" },
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            const perc = context.dataset.data[context.dataIndex];
            const price = context.dataset.prices
              ? context.dataset.prices[context.dataIndex]
              : null;

            const percStr = perc == null ? "-" : `${Number(perc).toFixed(2)}%`;
            const priceStr =
              price == null
                ? ""
                : ` — ${t("ETFChart.price")}: ${Number(price).toLocaleString(undefined, {
                  maximumFractionDigits: 2
                })}`;

            return `${context.dataset.label}: ${percStr}${priceStr}`;
          }
        }
      },

      zoom: {
        pan: { enabled: true, mode: "x" },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" }
      }
    },

    scales: {
      x: {
        ticks: { color: "#aaa" },
        grid: { color: "#222" },

        min: Math.max(
          0,
          (silverGrowth?.labels?.length || 0) - visiblePoints
        ),
        max: (silverGrowth?.labels?.length || 1) - 1
      },

      y: {
        ticks: { color: "#C0C0C0" },
        grid: { color: "#222" }
      }
    }
  };

  const makeGroupedBarData = (mainG, avgG, mainLabel, avgLabel, mainColor = "#4caf50", avgColor = "#42a5f5") => {
    if (!mainG && !avgG) return null;
    const labels = (mainG && mainG.labels.length ? mainG.labels : (avgG ? avgG.labels : [])).map((l) => new Date(l).toLocaleString());

    const mainData = mainG ? mainG.growth.map((v) => (v == null ? null : v)) : labels.map(() => null);
    const avgData = avgG ? avgG.growth.map((v) => (v == null ? null : v)) : labels.map(() => null);

    const mainBg = mainData.map((v) => (v == null ? "#666" : v >= 0 ? mainColor : "#f44336"));
    const avgBg = avgData.map((v) => (v == null ? "#666" : v >= 0 ? avgColor : "#ef6c00"));

    return {
      labels,
      datasets: [
        {
          label: mainLabel,
          data: mainData,
          backgroundColor: mainBg,
          prices: mainG ? mainG.price : undefined,
          categoryPercentage: 0.85,   // khoảng cách giữa nhóm
          barPercentage: 0.9,         // khoảng cách trong nhóm
          barThickness: 18
        },
        {
          label: avgLabel,
          data: avgData,
          backgroundColor: avgBg,
          prices: avgG ? avgG.price : undefined,
          categoryPercentage: 0.85,   // khoảng cách giữa nhóm
          barPercentage: 0.9,         // khoảng cách trong nhóm
          barThickness: 18
        }
      ]
    };
  };

  // use more contrasting colors and tighter grouping
  const silverBarData = makeGroupedBarData(
    silverGrowth,
    silverAvgGrowth,
    t("ETFChart.silverPercent"),
    t("ETFChart.silverAvgPercent"),
    "#00897b",
    "#ffd700"
  );
  const goldBarData = makeGroupedBarData(
    goldGrowth,
    goldAvgGrowth,
    t("ETFChart.goldPercent"),
    t("ETFChart.goldAvgPercent"),
    "#1976d2",
    "#8e24aa"
  );
  return (
    <div className="etf-page">
      <div className="etf-header">
        <div>
          <h2 className="etf-title">{t("ETFChart.title")}</h2>
          <p className="etf-subtitle">{t("ETFChart.subtitle")}</p>
        </div>
      </div>

      <div className="etf-grid">
        <div className="etf-card">
          <ETF_Silver data={silverData} options={options} />
        </div>

        <div className="etf-card">
          <ETF_Gold data={goldData} options={options} />
        </div>
        {/* Only grouped charts: actual + average side-by-side */}
        <div className="etf-card section-full">
          <h4 className="etf-title">{t("ETFChart.silverSection")}</h4>
          <div className="chart-container">
            {silverBarData ? (
              <Chart type="bar" data={silverBarData} options={barOptions} />
            ) : (
              <div className="small-muted">Loading 4h silver data...</div>
            )}
          </div>
        </div>

        <div className="etf-card section-full">
          <h4 className="etf-title">{t("ETFChart.goldSection")}</h4>
          <div className="chart-container">
            {goldBarData ? (
              <Chart type="bar" data={goldBarData} options={barOptions} />
            ) : (
              <div className="small-muted">Loading 4h gold data...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ETF_chart;