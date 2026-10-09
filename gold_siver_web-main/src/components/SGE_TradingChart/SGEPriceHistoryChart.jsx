import React, { useEffect, useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "./SGEPriceHistoryChart.css";
import { useTranslation } from "react-i18next";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function SGEPriceHistoryChart() {
  const { t } = useTranslation();
  const [rawData, setRawData] = useState(null);
  const [activeTab, setActiveTab] = useState("gold"); // gold | silver
  const [timeRange, setTimeRange] = useState("30");
  const [chartType, setChartType] = useState("line"); // line | column
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedDate, setLastUpdatedDate] = useState(null);

  // Fetch API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          "https://api_gold.thinkdiff.us/SGE_SILVER_GOLD_HISTORY"
        );
        const json = await res.json();
        const list =
          activeTab === "gold"
            ? json.list_item_json_vang
            : json.list_item_json_bac;

        if (Array.isArray(list) && list.length > 0) {
          const latestItem = list.reduce((latest, current) => {
            return new Date(current.ngay_giao_dich) >
              new Date(latest.ngay_giao_dich)
              ? current
              : latest;
          });

          const d = new Date(latestItem.ngay_giao_dich);
          setLastUpdatedDate(d.toLocaleDateString("vi-VN"));
        }
        setRawData(json);
      } catch (err) {
        console.error(err);
        setError("SGE_ERROR");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  // Chọn đúng list theo tab
  const selectedList = useMemo(() => {
    if (!rawData) return [];

    const list =
      activeTab === "gold"
        ? rawData.list_item_json_vang
        : rawData.list_item_json_bac;

    if (!Array.isArray(list)) return [];

    // sort theo ngày tăng dần
    return [...list].sort(
      (a, b) => new Date(a.ngay_giao_dich) - new Date(b.ngay_giao_dich)
    );

  }, [rawData, activeTab]);

  // Filter theo time range
  const filteredData = useMemo(() => {
    if (timeRange === "all") return selectedList;

    const n = parseInt(timeRange, 10);
    return selectedList.slice(-n);
  }, [selectedList, timeRange]);

  const priceChartData = useMemo(() => {
    const labels = filteredData.map(item => {
      const d = new Date(item.ngay_giao_dich);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    });

    const isBar = chartType === "column";

    return {
      labels,
      datasets: [
        {
          label: t("SGEPrice.morningPrice"),
          data: filteredData.map(i => Number(i.gia_sang)),
          borderColor: "#10b981",
          backgroundColor: isBar
            ? "rgba(16, 185, 129, 0.6)"
            : "rgba(16, 185, 129, 0.25)",
          tension: 0.3,
          pointRadius: 0,
          borderWidth: isBar ? 0 : 2,
          fill: !isBar,
        },
        {
          label: t("SGEPrice.afternoonPrice"),
          data: filteredData.map(i => Number(i.gia_chieu)),
          borderColor: "#f59e0b",
          backgroundColor: isBar ? "rgba(245, 158, 11, 0.6)" : "rgba(245, 158, 11, 0.25)",
          tension: 0.3,
          pointRadius: 0,
          borderWidth: isBar ? 0 : 2,
          fill: !isBar,
        },
      ],
    };
  }, [filteredData, chartType]);

  const usdChartData = useMemo(() => {
    const labels = filteredData.map(item => {
      const d = new Date(item.ngay_giao_dich);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    });

    const isBar = chartType === "column";

    return {
      labels,
      datasets: [
        {
          label: t("SGEPrice.usdMorning"),
          data: filteredData.map(i => Number(i.usd_1ounce_sang)),
          borderColor: "#3b82f6",
          backgroundColor: isBar ? "rgba(59, 130, 246, 0.6)" : "rgba(59, 130, 246, 0.25)",
          tension: 0.3,
          pointRadius: 0,
          borderWidth: isBar ? 0 : 2,
          fill: !isBar,
        },
        {
          label: t("SGEPrice.usdAfternoon"),
          data: filteredData.map(i => Number(i.usd_1ounce_chieu)),
          borderColor: "#ef4444",
          backgroundColor: isBar ? "rgba(239, 68, 68, 0.6)" : "rgba(239, 68, 68, 0.25)",
          tension: 0.3,
          pointRadius: 0,
          borderWidth: isBar ? 0 : 2,
          fill: !isBar,
        },
      ],
    };
  }, [filteredData, chartType]);


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
          label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: v => v.toLocaleString(),
        },
        beginAtZero: true,
        min: 0
      },
    },
  };

  const summaryData = useMemo(() => {
    if (!selectedList || selectedList.length === 0) return null;

    const data = selectedList
      .map(i => ({
        date: new Date(i.ngay_giao_dich).getTime(),
        price: Number(i.gia_chieu),
      }))
      .filter(i => Number.isFinite(i.price))
      .sort((a, b) => a.date - b.date);

    if (data.length === 0) return null;

    const current = data[data.length - 1];

    const findPastByDays = days => {
      const target = current.date - days * 24 * 60 * 60 * 1000;

      for (let i = data.length - 2; i >= 0; i--) {
        if (data[i].date <= target) return data[i];
      }
      return null;
    };

    const calcChange = days => {
      const past = findPastByDays(days);
      if (!past || past.price === 0) return 0;
      return ((current.price - past.price) / past.price) * 100;
    };

    return {
      maxValue: Math.max(...data.map(i => i.price)),
      minValue: Math.min(...data.map(i => i.price)),
      currentValue: current.price,
      percentageChanges: {
        day1: calcChange(1),
        day2: calcChange(2),
        day3: calcChange(3),
        day7: calcChange(7),
        month1: calcChange(30),
        month6: calcChange(180),
      },
    };
  }, [selectedList]);

  const TIME_RANGES = [
    { label: "7D", value: "7" },
    { label: "30D", value: "30" },
    { label: "90D", value: "90" },
    { label: "1Y", value: "365" },
    { label: t("SGEPrice.all"), value: "all" },
  ];


  if (loading || error || !rawData || !rawData.length) return null;
  return (
    <div className="comex-inventory-container">
      {/* Header */}
      <div className="comex-inventory-header header-row ">
        <div className="header-left">
          <h2>{t("SGEPrice.title")}</h2>
          <p className="subtitle">{t("SGEPrice.subtitle")}</p>
        </div>

        {lastUpdatedDate && (
          <div className="header-right">
            <label className="last-updated-label">
              {t("SGEPrice.lastUpdated")}
            </label>
            <span className="last-updated">{lastUpdatedDate}</span>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="comex-desktop-layout">
        {/* ================= LEFT COLUMN ================= */}
        <div className="comex-left-column">
          {/* Tabs: Gold / Silver */}
          <div className="comex-tab-navigation">
            <button
              className={`tab-button ${activeTab === "gold" ? "active" : ""}`}
              onClick={() => setActiveTab("gold")}
            >
              <span className="tab-icon gold-icon">🥇</span>
              {t("SGEPrice.gold")}
            </button>
            <button
              className={`tab-button ${activeTab === "silver" ? "active" : ""}`}
              onClick={() => setActiveTab("silver")}
            >
              <span className="tab-icon silver-icon">🥈</span>
              {t("SGEPrice.silver")}
            </button>
          </div>

          {/* Summary */}
          {summaryData && (
            <>
              <div className="comex-summary">
                <div className="summary-item">
                  <span className="summary-label">{t("SGEPrice.max")}:</span>
                  <span className="summary-value">
                    {summaryData.maxValue.toLocaleString()}
                  </span>
                </div>

                <div className="summary-item">
                  <span className="summary-label">{t("SGEPrice.min")}:</span>
                  <span className="summary-value">
                    {summaryData.minValue.toLocaleString()}
                  </span>
                </div>

                <div className="summary-item" style={{ color: '#22c55e' }}>
                  <span className="summary-label">{t("SGEPrice.current")}:</span>
                  <span className="summary-value" style={{ color: '#22c55e' }}>
                    {summaryData.currentValue.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Percentage Change */}
              <div className="percentage-changes-container">
                <h3>{t("SGEPrice.changeTitle")}</h3>
                <div className="percentage-grid">
                  {[
                    { key: "day1", label: t("SGEPrice.day1") },
                    { key: "day2", label: t("SGEPrice.day2") },
                    { key: "day3", label: t("SGEPrice.day3") },
                    { key: "day7", label: t("SGEPrice.week1") },
                    { key: "month1", label: t("SGEPrice.month1") },
                    { key: "month6", label: t("SGEPrice.month6") },
                  ].map(item => {
                    const value = summaryData.percentageChanges[item.key];

                    return (
                      <div key={item.key} className="percentage-item">
                        <span className="percentage-label">{item.label}</span>
                        <span
                          className={`percentage-value ${value >= 0 ? "positive" : "negative"
                            }`}
                        >
                          {value >= 0 ? "+" : "-"}
                          {value.toFixed(2)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="comex-right-column">
          {/* Time range + Chart type */}
          <div className="comex-time-range">
            {TIME_RANGES.map(({ label, value }) => (
              <button
                key={value}
                className={`time-range-btn ${timeRange === value ? "active" : ""}`}
                onClick={() => setTimeRange(value)}
              >
                {label}
              </button>
            ))}

            {/* Chart Type */}
            <div className="comex-chart-type-dropdown">
              <button
                className="chart-type-trigger"
                onClick={() =>
                  setShowChartTypeDropdown(!showChartTypeDropdown)
                }
              >
                <span className="chart-type-icon">
                  {chartType === "line" ? "📈" : "📊"}
                </span>
                <span className="chart-type-label">
                  {chartType === "line" ? "Line Chart" : "Column"}
                </span>
                <span className="dropdown-arrow">▼</span>
              </button>

              {showChartTypeDropdown && (
                <div className="chart-type-menu">
                  <div
                    className={`chart-type-option ${chartType === "line" ? "active" : ""
                      }`}
                    onClick={() => {
                      setChartType("line");
                      setShowChartTypeDropdown(false);
                    }}
                  >
                    📈 Line Chart
                  </div>
                  <div
                    className={`chart-type-option ${chartType === "column" ? "active" : ""
                      }`}
                    onClick={() => {
                      setChartType("column");
                      setShowChartTypeDropdown(false);
                    }}
                  >
                    📊 Column
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chart
            <div className="comex-chart-wrapper">
            {filteredData.length > 0 ? (
              <div className="chart-block">
                <h3>📈 Giá SGE (Sáng / Chiều)</h3>
                <Chart
                  type={chartType === "line" ? "line" : "bar"}
                  data={priceChartData}
                  options={options}
                />
              </div>
            ) : (
              <div className="no-data">Không có dữ liệu</div>
            )}
          </div> */}

          {/* BIỂU ĐỒ USD */}
          <div className="comex-chart-wrapper">
            {filteredData.length > 0 ? (
              <div className="chart-block">
                <h3>💵 {t("SGEPrice.usdChart")}</h3>
                <Chart
                  type={chartType === "line" ? "line" : "bar"}
                  data={usdChartData}
                  options={options}
                />
              </div>
            ) : (
              <div className="no-data">{t("SGEPrice.noData")}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SGEPriceHistoryChart;
