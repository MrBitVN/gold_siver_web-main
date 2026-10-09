import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  Filler,
  LogarithmicScale
} from "chart.js";
import { Chart } from "react-chartjs-2";
import { Link } from "react-router-dom";
import "./PSLVInventoryChart.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  LogarithmicScale
);

function PSLVInventoryChart() {
  const { t } = useTranslation();
  const [apiData, setApiData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("30"); 
  const [chartType, setChartType] = useState("line"); 
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false);
  const [unit, setUnit] = useState("oz");

  // Logic tính toán phần trăm và chuyển đổi đơn vị
  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const calculateAbsoluteChange = (current, previous) => {
    if (previous === null || previous === undefined) return null;
    return convertUnit(current - previous);
  };

  const convertUnit = (valueOz) => {
    if (unit === "moz") return valueOz / 1000000;
    if (unit === "ton") return valueOz / 32150.75;
    return valueOz;
  };

  const formatByUnit = (valueOz) => {
    const converted = convertUnit(valueOz);
    if (unit === "moz") return converted.toFixed(2) + ` ${t('PSLVSilver.millionOZ')}`;
    if (unit === "ton") return converted.toFixed(2) + ` ${t('PSLVSilver.ton')}`;
    return converted.toLocaleString() + " OZ";
  };

  // Fetch dữ liệu từ API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("https://api_gold.thinkdiff.us/pslv_so_luong_bac");
        const json = await response.json();
        
        if (json.status === "success" && json.pslv_so_luong_bac) {
          setApiData(json.pslv_so_luong_bac);
        } else {
          setError(t('PSLVSilver.apiStructureError'));
        }
      } catch (err) {
        setError(t('PSLVSilver.apiError') + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Xử lý dữ liệu biểu đồ
  const processedData = useMemo(() => {
    if (!apiData || !apiData.data_all) return null;

    // data_all format: [[id, "YYYY-MM-DD", value], ...]
    const sortedData = [...apiData.data_all].sort((a, b) => new Date(a[1]) - new Date(b[1]));
    
    let filteredData = sortedData;
    if (timeRange !== "all") {
      const count = parseInt(timeRange);
      filteredData = sortedData.slice(-count);
    }

    const labels = filteredData.map(item => {
      const date = new Date(item[1]);
      return timeRange === "all" || timeRange === "365" 
        ? `${date.getMonth() + 1}/${date.getFullYear()}` 
        : `${date.getDate()}/${date.getMonth() + 1}`;
    });

    const values = filteredData.map(item => item[2]);
    const currentVal = values[values.length - 1];

    // Tính toán thay đổi
    const getChange = (indexFromEnd) => {
      if (sortedData.length < indexFromEnd) return null;
      const prevVal = sortedData[sortedData.length - indexFromEnd][2];
      return unit === "ton" 
        ? calculateAbsoluteChange(currentVal, prevVal)
        : calculatePercentageChange(currentVal, prevVal);
    };

    const changes = {
      day1: getChange(2),
      day3: getChange(4),
      week1: getChange(8),
      month1: getChange(31),
    };

    return {
      labels,
      datasets: [{
        label: t('PSLVSilver.currentPrice'),
        data: values,
        borderColor: "#3b82f6",
        backgroundColor: chartType === "line" ? "transparent" : "#94a3b8",
        borderWidth: 2,
        pointRadius: timeRange === "all" ? 0 : 2,
        tension: 0.1,
        fill: chartType === "stackedBar",
      }],
      changes,
      currentVal,
      maxVal: Math.max(...values),
      minVal: Math.min(...values),
      latestDate: apiData.data_sample_end[1]
    };
  }, [apiData, timeRange, chartType, unit]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        callbacks: {
          label: (ctx) => `${t('PSLVSilver.quantityLabel')} ${ctx.parsed.y.toLocaleString()} OZ`
        }
      }
    },
    scales: {
      y: {
        type: "logarithmic",
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#9ca3af" }
      },
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af", maxRotation: 0 }
      }
    }
  };

  if (isLoading || error || !processedData) return null;

  return (
    <div className="comex-inventory-container">
      <div className="comex-inventory-header">
        <Link to="/pslv_silver" className="comex-header-link">
          <h2>{t('PSLVSilver.title')}</h2>
          <p className="subtitle">{t('PSLVSilver.subtitle')}</p>
        </Link>
      </div>

      <div className="comex-tab-navigation">
      
        <div className="latest-update-date">{t('PSLVSilver.lastUpdate')} {processedData.latestDate}</div>
      </div>

      <div className="comex-unit-converter">
        <span className="unit-label">{t('PSLVSilver.unit')}</span>
        {["oz", "moz", "ton"].map(u => (
          <button key={u} className={`unit-btn ${unit === u ? "active" : ""}`} onClick={() => setUnit(u)}>
            {u.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="comex-desktop-layout">
        <div className="comex-left-column">
          <div className="comex-summary">
            <div className="summary-item">
              <span className="summary-label">{t('PSLVSilver.current')}</span>
              <span className="summary-value">{formatByUnit(processedData.currentVal)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">{t('PSLVSilver.highest')}</span>
              <span className="summary-value">{formatByUnit(processedData.maxVal)}</span>
            </div>
          </div>

          <div className="percentage-changes-container">
            <h3>{t('PSLVSilver.changeRatio')}</h3>
            <div className="percentage-grid">
              {Object.entries(processedData.changes).map(([key, val]) => {
                const labelMap = {
                  'day1': t('PSLVSilver.oneDay'),
                  'day3': t('PSLVSilver.threeDay'),
                  'week1': t('PSLVSilver.oneWeek'),
                  'month1': t('PSLVSilver.oneMonth')
                };
                return (
                  <div key={key} className="percentage-item">
                    <span className="percentage-label">{labelMap[key] || key}</span>
                    <span className={`percentage-value ${val >= 0 ? "positive" : "negative"}`}>
                      {val >= 0 ? "+" : ""}{val?.toFixed(2)}{unit === "ton" ? " T" : "%"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="comex-right-column">
          <div className="comex-time-range">
            {["30", "90", "365", "all"].map(r => (
              <button key={r} className={`time-range-btn ${timeRange === r ? "active" : ""}`} onClick={() => setTimeRange(r)}>
                {r === "30" && t('PSLVSilver.thirtyDays')}
                {r === "90" && t('PSLVSilver.ninetyDays')}
                {r === "365" && t('PSLVSilver.oneYear')}
                {r === "all" && t('PSLVSilver.allData')}
              </button>
            ))}
            
            <div className="comex-chart-type-dropdown">
              <button className="chart-type-trigger" onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}>
                {chartType.toUpperCase()} ▼
              </button>
              {showChartTypeDropdown && (
                <div className="chart-type-menu">
                  {["line", "column", "stackedBar"].map(t => (
                    <div key={t} className="chart-type-option" onClick={() => { setChartType(t); setShowChartTypeDropdown(false); }}>
                      {t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="comex-chart-wrapper">
             <Chart type={chartType === "column" ? "bar" : "line"} data={processedData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PSLVInventoryChart;