import React, { useEffect, useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./ChinaSilverTurnover.css";
import { useTranslation } from "react-i18next";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

/* ================= API CONFIG ================= */
const APIS = {
  turnover: {
    url: "https://api_gold.thinkdiff.us/Volume_Shanghai_Future_Exchange",
    label: "China Silver Turnover (SHFE)",
  },
  warehouse: {
    url: "https://api_gold.thinkdiff.us/Warehouse_Shanghai_Future_Exchange",
    label: "China Silver Warehouse (SHFE)",
  },
};

const ChinaSilverTurnover = () => {
  const { t } = useTranslation();
  const [activeApi, setActiveApi] = useState("warehouse");
  const [rawData, setRawData] = useState([]);
  const [range, setRange] = useState("all")

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(APIS[activeApi].url);
        const json = await res.json();

        // lấy key động từ API
        const key = Object.keys(json)[0];
        const data = json[key] || [];

        setRawData(data);
      } catch (err) {
        console.error("API error:", err);
      }
    };

    fetchData();
  }, [activeApi]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);



  /* ================= SUMMARY ================= */
  const summary = useMemo(() => {
    if (!rawData.length) return null;

    const values = rawData.map(i => Number(i.volume));
    const current = rawData[0];
    const yesterday = rawData.length > 1 ? rawData[1] : null;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const minItem = rawData.find(i => Number(i.volume) === minValue);
    const maxItem = rawData.find(i => Number(i.volume) === maxValue);
    const toDate = rawData[0].trade_date;
    const fromDate = rawData[rawData.length - 1].trade_date;

    return {
      current,
      yesterday,
      minItem,
      maxItem,
      fromDate,
      toDate,
    };
  }, [rawData]);

  /* ================= LAST UPDATED ================= */
  const lastUpdatedDate = useMemo(() => {
    if (!rawData.length) return null;

    const latest = rawData[0].trade_date;
    const d = new Date(latest);

    const days = [
      t("ChinaSilverTurnover.day.sunday"),
      t("ChinaSilverTurnover.day.monday"),
      t("ChinaSilverTurnover.day.tuesday"),
      t("ChinaSilverTurnover.day.wednesday"),
      t("ChinaSilverTurnover.day.thursday"),
      t("ChinaSilverTurnover.day.friday"),
      t("ChinaSilverTurnover.day.saturday"),
    ];
    const dayName = days[d.getDay()];
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");

    return `${dayName}, ${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }, [rawData]);

  const formatValue = (value) => {
    if (value == null || isNaN(value)) return "-";
    return `${Number(value).toLocaleString()} ${unitLabel}`;
  };

  const filteredData = useMemo(() => {
    if (!rawData.length || range === "all") return rawData;

    const now = new Date(rawData[0].trade_date);

    const daysMap = {
      "7d": 7,
      "1m": 30,
    };

    const limitDays = daysMap[range];
    if (!limitDays) return rawData;

    return rawData.filter(item => {
      const d = new Date(item.trade_date);
      const diffDays = (now - d) / (1000 * 60 * 60 * 24);
      return diffDays <= limitDays;
    });
  }, [rawData, range]);


  /* ================= FORMAT DATE ================= */
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);

    const days = [
      t("ChinaSilverTurnover.day.sunday"),
      t("ChinaSilverTurnover.day.monday"),
      t("ChinaSilverTurnover.day.tuesday"),
      t("ChinaSilverTurnover.day.wednesday"),
      t("ChinaSilverTurnover.day.thursday"),
      t("ChinaSilverTurnover.day.friday"),
      t("ChinaSilverTurnover.day.saturday"),
    ];

    const dayName = days[d.getDay()];
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${dayName}, ${day}/${month}/${year} ${hours}:${minutes}`;
  };

  /* ================= CHART DATA ================= */
  const chartData = useMemo(() => {
    const sorted = [...filteredData].sort(
      (a, b) => new Date(a.trade_date) - new Date(b.trade_date)
    );

    return {
      labels: sorted.map(item => formatDate(item.trade_date)),
      datasets: [
        {
          label: APIS[activeApi].label,
          data: sorted.map(item => Number(item.volume)),
          borderColor: "rgba(192,192,192,1)",
          backgroundColor: "rgba(192,192,192,0.4)",
          pointRadius: 2,
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [filteredData, activeApi]);

  /* ================= OPTIONS ================= */
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${formatValue(ctx.raw)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxRotation: 0,
        },
      },
      y: {
        title: {
          display: true,
          text: "Volume",
        },
        ticks: {
          callback: value => (value * 1000).toLocaleString(),
        },
      },
    },
  };

  const renderChangeBox = (label, value) => {
    const safeValue = typeof value === "number" ? value : 0;

    return (
      <div className="percentage-item">
        <div className="percentage-label">{label}</div>
        <div
          className={`percentage-value ${safeValue >= 0 ? "positive" : "negative"
            }`}
        >
          {safeValue > 0 ? "+" : ""}
          {safeValue.toFixed(2)}%
        </div>
      </div>
    );
  };

  const percentageChanges = useMemo(() => {
    if (!rawData.length) return null;

    const getChange = (daysAgo) => {
      if (rawData.length <= daysAgo) return null;

      const current = Number(rawData[0].volume);
      const past = Number(rawData[daysAgo].volume);

      if (!past) return null;

      return ((current - past) / past) * 100;
    };

    return {
      day1: getChange(1),
      day2: getChange(2),
      day3: getChange(3),
      week1: getChange(7),
    };
  }, [rawData]);

  const isTurnover = activeApi === "turnover";

  const unitLabel = isTurnover
    ? t("ChinaSilverTurnover.unit.contract")
    : t("ChinaSilverTurnover.unit.ton");
  const valueLabel = isTurnover
    ? t("ChinaSilverTurnover.value.contract")
    : t("ChinaSilverTurnover.value.volume");

  /* ================= RENDER ================= */
  if (!rawData || !rawData.length) return null;

  return (
    <div className="turnoverchinasilver-container">

      <h2 className="turnoverchinasilver-title">
        {activeApi === "turnover"
          ? t("ChinaSilverTurnover.titleTurnover")
          : t("ChinaSilverTurnover.titleWarehouse")}
      </h2>

      <div className="turnoverchinasilver-card">

        <div className={`turnoverchinasilver-grid ${isMobile ? "mobile" : ""}`}>

          {/* LEFT PANEL */}
          <div className="turnoverchinasilver-left">

            <p className="turnoverchinasilver-subtitle">
              {activeApi === "turnover"
                ? t("ChinaSilverTurnover.subtitleTurnover")
                : t("ChinaSilverTurnover.subtitleWarehouse")}
            </p>

            {/* API SWITCH */}
            <div className="turnoverchinasilver-button-group">
              <button
                onClick={() => setActiveApi("turnover")}
                className={`turnoverchinasilver-btn ${activeApi === "turnover" ? "active" : ""
                  }`}
              >
                {t("ChinaSilverTurnover.turnover")}
              </button>

              <button
                onClick={() => setActiveApi("warehouse")}
                className={`turnoverchinasilver-btn ${activeApi === "warehouse" ? "active" : ""
                  }`}
              >
                {t("ChinaSilverTurnover.warehouse")}
              </button>
            </div>

            {/* LAST UPDATED */}
            {lastUpdatedDate && (
              <div className="turnoverchinasilver-update-box">
                <span>{t("ChinaSilverTurnover.lastUpdated")}</span>
                <strong>{lastUpdatedDate}</strong>
              </div>
            )}

            {/* PERCENTAGE CHANGE */}
            {percentageChanges && (
              <>
                <h3 className="turnoverchinasilver-change-title">
                  {t("ChinaSilverTurnover.changeTitle")} {valueLabel}
                </h3>

                <div className="turnoverchinasilver-change-grid">
                  {[
                    { key: "day1", label: t("ChinaSilverTurnover.day1"), value: percentageChanges.day1 },
                    { key: "day2", label: t("ChinaSilverTurnover.day2"), value: percentageChanges.day2 },
                    { key: "day3", label: t("ChinaSilverTurnover.day3"), value: percentageChanges.day3 },
                    { key: "week1", label: t("ChinaSilverTurnover.week1"), value: percentageChanges.week1 }
                  ].map(item => (
                    <div
                      key={item.key}
                      className="turnoverchinasilver-change-card"
                    >
                      <span>{item.label}: </span>
                      <strong
                        className={
                          item.value != null && item.value >= 0
                            ? "turnoverchinasilver-positive"
                            : "turnoverchinasilver-negative"
                        }
                      >
                        {item.value != null ? (
                          <>
                            {item.value > 0 ? "+" : ""}
                            {item.value.toFixed(2)} %
                          </>
                        ) : (
                          "-"
                        )}
                      </strong>
                    </div>
                  ))}
                </div>

                {/* RANGE FILTER */}
                <div className="turnoverchinasilver-button-group">
                  {[
                    { label: t("ChinaSilverTurnover.range7d"), value: "7d" },
                    { label: t("ChinaSilverTurnover.range1m"), value: "1m" },
                    { label: t("ChinaSilverTurnover.rangeAll"), value: "all" }
                  ].map(btn => (
                    <button
                      key={btn.value}
                      onClick={() => setRange(btn.value)}
                      className={`turnoverchinasilver-btn light ${range === btn.value
                        ? "turnoverchinasilver-active-green"
                        : ""
                        }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="turnoverchinasilver-right">
            {rawData.length ? (
              <Line data={chartData} options={options} />
            ) : (
              <p className="turnoverchinasilver-loading">
                {t("ChinaSilverTurnover.loading")}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* SUMMARY TABLE */}
      {summary && !isMobile && (
        <div className="turnoverchinasilver-summary-table">
          <table>
            <thead>
              <tr>
                <th>{t("ChinaSilverTurnover.table.metric")}</th>
                <th>{t("ChinaSilverTurnover.table.value")} ({unitLabel})</th>
                <th>{t("ChinaSilverTurnover.table.date")}</th>
                <th>{t("ChinaSilverTurnover.table.range")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{valueLabel} {t("ChinaSilverTurnover.table.current")}</td>
                <td>
                  {Number(summary.current.volume).toLocaleString()} {unitLabel}
                </td>
                <td>{formatDate(summary.current.trade_date)}</td>
                <td rowSpan={4}>
                  {formatDate(summary.fromDate)} →{" "}
                  {formatDate(summary.toDate)}
                </td>
              </tr>

              {summary.yesterday && (
                <tr>
                  <td>{valueLabel} {t("ChinaSilverTurnover.table.yesterday")}</td>
                  <td>
                    {Number(summary.yesterday.volume).toLocaleString()}{" "}
                    {unitLabel}
                  </td>
                  <td>
                    {formatDate(summary.yesterday.trade_date)}
                  </td>
                </tr>
              )}

              <tr>
                <td>{valueLabel} {t("ChinaSilverTurnover.table.min")}</td>
                <td>
                  {Number(summary.minItem.volume).toLocaleString()}{" "}
                  {unitLabel}
                </td>
                <td>
                  {formatDate(summary.minItem.trade_date)}
                </td>
              </tr>

              <tr>
                <td>{valueLabel} {t("ChinaSilverTurnover.table.max")}</td>
                <td>
                  {Number(summary.maxItem.volume).toLocaleString()}{" "}
                  {unitLabel}
                </td>
                <td>
                  {formatDate(summary.maxItem.trade_date)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

};

export default ChinaSilverTurnover;