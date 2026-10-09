import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import "./LBMAReservesChart.css";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

const LBMAReservesChart = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language && i18n.language.startsWith("en") ? "en-US" : "vi-VN";

  const [monthsRange, setMonthsRange] = useState(24); // months: 24 | 36 | 48
  const [rawData, setRawData] = useState([]);
  const [unit, setUnit] = useState("oz");
  const [activeMetal, setActiveMetal] = useState("gold"); // "gold" | "silver"
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("https://api_gold.thinkdiff.us/lbma_vault_all");
      const arr = await res.json();
      const data = arr.data;

      data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setRawData(data);
    };

    fetchData();
  }, []);
  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };
  const filteredData = React.useMemo(() => {
    if (!rawData || rawData.length === 0) return [];

    const sorted = [...rawData].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // 👉 Nếu chọn ALL thì trả về toàn bộ data
    if (monthsRange === "all") return sorted;

    const latest = new Date(sorted[sorted.length - 1].date);
    const cutoff = new Date(latest);
    cutoff.setMonth(cutoff.getMonth() - Number(monthsRange));

    return sorted.filter((item) => new Date(item.date) >= cutoff);
  }, [rawData, monthsRange]);


  const percentageChanges = React.useMemo(() => {
    if (!rawData || rawData.length < 2) return {};

    const getValue = (item) =>
      activeMetal === "gold"
        ? item.gold_oz_000
        : item.silver_oz_000;

    const sorted = [...rawData].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    const lastIndex = sorted.length - 1;
    const current = getValue(sorted[lastIndex]);

    const getChange = (daysAgo) => {
      const idx = lastIndex - daysAgo;
      if (idx < 0) return null;
      return calculatePercentageChange(current, getValue(sorted[idx]));
    };

    return {
      day1: getChange(1),
      day2: getChange(2),
      day3: getChange(3),
      week1: getChange(7),
      month1: getChange(30),
      month6: getChange(180),
    };
  }, [rawData, activeMetal]);
  const lastUpdatedDate = React.useMemo(() => {
    if (!rawData || rawData.length === 0) return null;

    const latest = rawData[rawData.length - 1].date;
    const d = new Date(latest);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  }, [rawData]);

  const labels = filteredData.map((item) => item.date);

  const convertGold = (value) => {
    if (unit === "tonnes") {
      return (value / 31.1035);
    }
    return value;
  };

  const convertSilver = (value) => {
    if (unit === "tonnes") {
      return (value / 31.1035);
    }
    return value;
  };

  const getValueByMetal = (item) =>
    activeMetal === "gold"
      ? convertGold(item.gold_oz_000)
      : convertSilver(item.silver_oz_000);

  const summaryValues = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { max: null, min: null, current: null };
    }

    const values = filteredData.map(getValueByMetal);

    return {
      max: Math.max(...values),
      min: Math.min(...values),
      current: values[values.length - 1], // bản ghi mới nhất
    };
  }, [filteredData, activeMetal, unit]);

  const formatValue = (value) => {
    if (value == null) return "--";

    if (unit === "tonnes") {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " " +t('lbmaReserves.unitTonnes');
    }

    return value.toLocaleString() + " " +t('lbmaReserves.unitOz');
  };


  const goldData = {
    labels,
    datasets: [
      {
        label: unit === "tonnes" ? t('lbmaReserves.goldLabelTonnes') : t('lbmaReserves.goldLabelOz'),
        data: filteredData.map((item) =>
          convertGold(item.gold_oz_000)
        ),
        backgroundColor: "rgba(212, 175, 55, 0.7)",
      },
    ],
  };

  const silverData = {
    labels,
    datasets: [
      {
        label: unit === "tonnes" ? t('lbmaReserves.silverLabelTonnes') : t('lbmaReserves.silverLabelOz'),
        data: filteredData.map((item) =>
          convertSilver(item.silver_oz_000)
        ),
        backgroundColor: "rgba(191, 193, 194, 0.7)",
      },
    ],
  };


  if (!goldData || !silverData) return <div>{t('lbmaReserves.loading')}</div>;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: Math.min(filteredData.length || 0, 31),
        },
      },
      y: {
        title: {
          display: true,
          text: unit === "tonnes" ? t('lbmaReserves.unitTonnes') : t('lbmaReserves.unitOz'),
        },
      },
    },
  };


  return (
    <div className="comex-inventory-container">
      {/* Header */}
      <div className="comex-inventory-header header-row">
        <div className="header-left">
          <h2>{t('lbmaReserves.title')}</h2>
          <p className="subtitle">
            {t('lbmaReserves.subtitle')}
          </p>
        </div>

        {lastUpdatedDate && (
          <div className="header-right">
            <label className="last-updated-label">{t('lbmaReserves.lastUpdated')} </label>
            <span className="last-updated">
              {new Date(lastUpdatedDate.split('/').reverse().join('-')).toLocaleDateString(locale)}
            </span>
          </div>
        )}
      </div>
      {/* Tab Navigation */}
      <div className="comex-tab-navigation">
        <button
          className={`tab-button ${activeMetal === "gold" ? "active" : ""}`}
          onClick={() => setActiveMetal("gold")}
        >
          {t('lbmaReserves.goldTab')}
        </button>

        <button
          className={`tab-button ${activeMetal === "silver" ? "active" : ""}`}
          onClick={() => setActiveMetal("silver")}
        >
          {t('lbmaReserves.silverTab')}
        </button>
      </div>

      {/* Unit Converter */}
      <div className="comex-unit-converter">
        <span className="unit-label">{t('lbmaReserves.unitLabel')}</span>
        <button
          className={`unit-btn ${unit === "oz" ? "active" : ""}`}
          onClick={() => setUnit("oz")}
        >
          {t('lbmaReserves.unitOz')}
        </button>
        <button
          className={`unit-btn ${unit === "tonnes" ? "active" : ""}`}
          onClick={() => setUnit("tonnes")}
        >
          {t('lbmaReserves.unitTonnes')}
        </button>
      </div>

      {/* Layout */}
      <div className="comex-desktop-layout">
        {/* Left Column */}
        <div className="comex-left-column">
          <div className="percentage-changes-container">
            <h3>{t('lbmaReserves.percentageChangesTitle')}</h3>

            <div className="percentage-grid">
              {[
                [t('lbmaReserves.day1'), percentageChanges.day1],
                [t('lbmaReserves.day2'), percentageChanges.day2],
                [t('lbmaReserves.day3'), percentageChanges.day3],
                [t('lbmaReserves.week1'), percentageChanges.week1],
                [t('lbmaReserves.month1'), percentageChanges.month1],
                [t('lbmaReserves.month6'), percentageChanges.month6],
              ].map(
                ([label, value]) =>
                  typeof value === "number" && (
                    <div key={label} className="percentage-item">
                      <span className="percentage-label">{label}</span>
                      <span
                        className={`percentage-value ${value >= 0 ? "positive" : "negative"}`}
                      >
                        {value >= 0 ? "+" : ""}
                        {value.toFixed(2)}%
                      </span>
                    </div>
                  )
              )}
            </div>
          </div>


          {/* Bộ lọc năm giữ nguyên */}
          <div className="percentage-changes-container">
            <div className="percentage-grid">
              {/* Giá trị cao nhất */}
              <div className="percentage-item">
                <span className="percentage-label">{t('lbmaReserves.maxValue')}</span>
                <span className="percentage-value3">
                  {formatValue(summaryValues.max)}
                </span>
              </div>

              {/* Giá trị thấp nhất */}
              <div className="percentage-item">
                <span className="percentage-label">{t('lbmaReserves.minValue')}</span>
                <span className="percentage-value3">
                  {formatValue(summaryValues.min)}
                </span>
              </div>

              {/* Giá trị hiện tại */}
              <div className="percentage-item">
                <span className="percentage-label">{t('lbmaReserves.currentValue')}</span>
                <span className="percentage-value3">
                  {formatValue(summaryValues.current)}
                </span>
              </div>
              <div className="percentage-item">
                <span className="percentage-label">{t('lbmaReserves.timeRange')}</span>
                <div className="lbma-range-buttons">
                  <button
                    className={`range-btn ${monthsRange === "all" ? "active" : ""}`}
                    onClick={() => setMonthsRange("all")}
                  >
                    {t('lbmaReserves.all')}
                  </button>

                  <button
                    className={`range-btn ${monthsRange === 24 ? "active" : ""}`}
                    onClick={() => setMonthsRange(24)}
                  >
                    {t('lbmaReserves.month24')}
                  </button>

                  <button
                    className={`range-btn ${monthsRange === 36 ? "active" : ""}`}
                    onClick={() => setMonthsRange(36)}
                  >
                    {t('lbmaReserves.month36')}
                  </button>

                  <button
                    className={`range-btn ${monthsRange === 48 ? "active" : ""}`}
                    onClick={() => setMonthsRange(48)}
                  >
                    {t('lbmaReserves.month48')}
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>


        {/* Right Column */}
        <div className="comex-right-column">
          <div className="comex-chart-wrapper">
            {activeMetal === "gold" ? (
              <Bar data={goldData} options={options} />
            ) : (
              <Bar data={silverData} options={options} />
            )}
          </div>
        </div>
      </div>
    </div>
  );

};

export default LBMAReservesChart;
