import React, { useMemo, useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatCurrency } from "../../utils/exchangeRateHelper";
import "./USDHistoryChart.css";

// Đăng ký các components của Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Component biểu đồ lịch sử USD_TUDO với thanh trượt năm và bộ lọc
 * @param {Object} props
 * @param {Object} props.data - Dữ liệu đã xử lý { "YYYY-MM-DD": { "USD_TUDO": { buy, sell }, ... } }
 */
const USDHistoryChart = ({ data }) => {
  // State quản lý toàn bộ dữ liệu lịch sử
  const [fullHistoryData, setFullHistoryData] = useState({});
  
  // State quản lý dữ liệu đang hiển thị trên biểu đồ
  const [chartDisplayData, setChartDisplayData] = useState({});
  
  // State quản lý bộ lọc đang hoạt động ('1W', '1M', 'ALL', hoặc một năm cụ thể như '2015')
  const [activeFilter, setActiveFilter] = useState("ALL");
  
  // State quản lý năm được chọn trên thanh trượt
  const [selectedYear, setSelectedYear] = useState(null);
  
  // State quản lý thông tin hiển thị ở header
  const [displayStats, setDisplayStats] = useState({
    title: "",
    price: null,
    change: null,
    percent: null,
  });

  // Lấy năm min và max từ dữ liệu
  const { minYear, maxYear, availableYears } = useMemo(() => {
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      return { minYear: null, maxYear: null, availableYears: [] };
    }

    const dates = Object.keys(data).sort();
    if (dates.length === 0) {
      return { minYear: null, maxYear: null, availableYears: [] };
    }

    const years = dates.map((dateStr) => {
      const [year] = dateStr.split("-").map(Number);
      return year;
    });

    const uniqueYears = [...new Set(years)].sort((a, b) => a - b);
    const min = uniqueYears[0];
    const max = uniqueYears[uniqueYears.length - 1];

    return {
      minYear: min,
      maxYear: max,
      availableYears: uniqueYears,
    };
  }, [data]);

  // Khởi tạo dữ liệu khi component mount hoặc data thay đổi
  useEffect(() => {
    if (data && typeof data === "object" && Object.keys(data).length > 0) {
      setFullHistoryData(data);
      // Khởi tạo với chế độ "Tất Cả" - sử dụng data trực tiếp
      const allDates = Object.keys(data).sort();
      if (allDates.length > 0) {
        const latestDate = allDates[allDates.length - 1];
        const latestPrice = data[latestDate]?.USD_TUDO?.sell;
        const firstDate = allDates[0];
        const firstPrice = data[firstDate]?.USD_TUDO?.sell;

        let stats = {
          title: "",
          price: null,
          change: null,
          percent: null,
        };

        if (latestPrice !== null && latestPrice !== undefined) {
          const [year, month, day] = latestDate.split("-");
          stats.title = `Giá hiện tại (${day}/${month}/${year})`;
          stats.price = latestPrice;

          if (firstPrice !== null && firstPrice !== undefined && firstPrice !== 0) {
            const change = latestPrice - firstPrice;
            const percent = ((change / firstPrice) * 100).toFixed(1);
            stats.change = change;
            stats.percent = percent;
          }
        }

        setChartDisplayData(data);
        setDisplayStats(stats);
        setActiveFilter("ALL");
      }
    }
  }, [data]);

  // Hàm cập nhật biểu đồ dựa trên filter
  const updateChart = (filter) => {
    if (!fullHistoryData || Object.keys(fullHistoryData).length === 0) {
      return;
    }

    let filtered = {};
    let stats = {
      title: "",
      price: null,
      change: null,
      percent: null,
    };

    const allDates = Object.keys(fullHistoryData).sort();

    if (filter === "ALL") {
      // Hiển thị toàn bộ lịch sử
      filtered = { ...fullHistoryData };
      
      if (allDates.length > 0) {
        const latestDate = allDates[allDates.length - 1];
        const latestPrice = fullHistoryData[latestDate]?.USD_TUDO?.sell;
        const firstDate = allDates[0];
        const firstPrice = fullHistoryData[firstDate]?.USD_TUDO?.sell;

        if (latestPrice !== null && latestPrice !== undefined) {
          const [year, month, day] = latestDate.split("-");
          stats.title = `Giá hiện tại (${day}/${month}/${year})`;
          stats.price = latestPrice;

          if (firstPrice !== null && firstPrice !== undefined && firstPrice !== 0) {
            const change = latestPrice - firstPrice;
            const percent = ((change / firstPrice) * 100).toFixed(1);
            stats.change = change;
            stats.percent = percent;
          }
        }
      }
    } else if (filter === "1W") {
      // Lấy 7 ngày gần nhất
      const latestDateStr = allDates[allDates.length - 1];
      const [latestYear, latestMonth, latestDay] = latestDateStr.split("-").map(Number);
      const latestDate = new Date(latestYear, latestMonth - 1, latestDay);
      const startDate = new Date(latestDate);
      startDate.setDate(latestDate.getDate() - 7);

      allDates.forEach((dateStr) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        if (date >= startDate && date <= latestDate) {
          filtered[dateStr] = fullHistoryData[dateStr];
        }
      });

      if (allDates.length > 0) {
        const latestDate = allDates[allDates.length - 1];
        const latestPrice = fullHistoryData[latestDate]?.USD_TUDO?.sell;
        const dates = Object.keys(filtered).sort();
        const firstDate = dates[0];
        const firstPrice = fullHistoryData[firstDate]?.USD_TUDO?.sell;

        if (latestPrice !== null && latestPrice !== undefined) {
          const [year, month, day] = latestDate.split("-");
          stats.title = `Giá hiện tại (${day}/${month}/${year})`;
          stats.price = latestPrice;

          if (firstPrice !== null && firstPrice !== undefined && firstPrice !== 0) {
            const change = latestPrice - firstPrice;
            const percent = ((change / firstPrice) * 100).toFixed(1);
            stats.change = change;
            stats.percent = percent;
          }
        }
      }
    } else if (filter === "1M") {
      // Lấy 30 ngày gần nhất
      const latestDateStr = allDates[allDates.length - 1];
      const [latestYear, latestMonth, latestDay] = latestDateStr.split("-").map(Number);
      const latestDate = new Date(latestYear, latestMonth - 1, latestDay);
      const startDate = new Date(latestDate);
      startDate.setDate(latestDate.getDate() - 30);

      allDates.forEach((dateStr) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        const date = new Date(year, month - 1, day);
        if (date >= startDate && date <= latestDate) {
          filtered[dateStr] = fullHistoryData[dateStr];
        }
      });

      if (allDates.length > 0) {
        const latestDate = allDates[allDates.length - 1];
        const latestPrice = fullHistoryData[latestDate]?.USD_TUDO?.sell;
        const dates = Object.keys(filtered).sort();
        const firstDate = dates[0];
        const firstPrice = fullHistoryData[firstDate]?.USD_TUDO?.sell;

        if (latestPrice !== null && latestPrice !== undefined) {
          const [year, month, day] = latestDate.split("-");
          stats.title = `Giá hiện tại (${day}/${month}/${year})`;
          stats.price = latestPrice;

          if (firstPrice !== null && firstPrice !== undefined && firstPrice !== 0) {
            const change = latestPrice - firstPrice;
            const percent = ((change / firstPrice) * 100).toFixed(1);
            stats.change = change;
            stats.percent = percent;
          }
        }
      }
    } else if (typeof filter === "number" || (typeof filter === "string" && /^\d{4}$/.test(filter))) {
      // Lọc theo năm cụ thể
      const year = typeof filter === "number" ? filter : parseInt(filter, 10);
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);

      allDates.forEach((dateStr) => {
        const [y, month, day] = dateStr.split("-").map(Number);
        const date = new Date(y, month - 1, day);
        if (date >= yearStart && date <= yearEnd) {
          filtered[dateStr] = fullHistoryData[dateStr];
        }
      });

      // Tính giá cuối năm và % thay đổi trong năm
      const dates = Object.keys(filtered).sort();
      if (dates.length > 0) {
        const lastDate = dates[dates.length - 1];
        const lastPrice = fullHistoryData[lastDate]?.USD_TUDO?.sell;
        const firstDate = dates[0];
        const firstPrice = fullHistoryData[firstDate]?.USD_TUDO?.sell;

        if (lastPrice !== null && lastPrice !== undefined) {
          stats.title = `Giá cuối năm ${year}`;
          stats.price = lastPrice;

          if (firstPrice !== null && firstPrice !== undefined && firstPrice !== 0) {
            const change = lastPrice - firstPrice;
            const percent = ((change / firstPrice) * 100).toFixed(1);
            stats.change = change;
            stats.percent = percent;
          }
        }
      }
    }

    setChartDisplayData(filtered);
    setDisplayStats(stats);
  };

  // Xử lý khi thay đổi thanh trượt năm
  const handleYearSliderChange = (e) => {
    const year = parseInt(e.target.value, 10);
    setSelectedYear(year);
    setActiveFilter(year);
    // Sử dụng fullHistoryData trực tiếp
    if (fullHistoryData && Object.keys(fullHistoryData).length > 0) {
      updateChart(year);
    }
  };

  // Xử lý khi click vào nút lọc nhanh
  const handleQuickFilterClick = (filter) => {
    setSelectedYear(null);
    setActiveFilter(filter);
    // Sử dụng fullHistoryData trực tiếp
    if (fullHistoryData && Object.keys(fullHistoryData).length > 0) {
      updateChart(filter);
    }
  };

  // Tính toán giá trị hiển thị cho thanh trượt
  const sliderValue = useMemo(() => {
    if (selectedYear !== null) {
      return selectedYear;
    }
    if (typeof activeFilter === "number") {
      return activeFilter;
    }
    if (typeof activeFilter === "string" && /^\d{4}$/.test(activeFilter)) {
      return parseInt(activeFilter, 10);
    }
    return maxYear || new Date().getFullYear();
  }, [selectedYear, activeFilter, maxYear]);

  // Tính toán label hiển thị
  const sliderLabel = useMemo(() => {
    if (activeFilter === "ALL") {
      return "Tất cả";
    }
    if (activeFilter === "1W" || activeFilter === "1M") {
      return activeFilter === "1W" ? "1 tuần" : "1 tháng";
    }
    if (selectedYear !== null) {
      return selectedYear.toString();
    }
    if (typeof activeFilter === "number") {
      return activeFilter.toString();
    }
    if (typeof activeFilter === "string" && /^\d{4}$/.test(activeFilter)) {
      return activeFilter;
    }
    return "Tất cả";
  }, [selectedYear, activeFilter]);

  // Chuẩn bị dữ liệu cho biểu đồ
  const chartData = useMemo(() => {
    if (!chartDisplayData || Object.keys(chartDisplayData).length === 0) {
      return null;
    }

    const dates = Object.keys(chartDisplayData).sort();
    
    // Xác định format label dựa trên activeFilter
    let labels = [];
    if (typeof activeFilter === "number" || (typeof activeFilter === "string" && /^\d{4}$/.test(activeFilter))) {
      // Khi xem một năm cụ thể, hiển thị tháng
      labels = dates.map((date) => {
        const [, month] = date.split("-");
        const monthNames = ["Thg 1", "Thg 2", "Thg 3", "Thg 4", "Thg 5", "Thg 6", "Thg 7", "Thg 8", "Thg 9", "Thg 10", "Thg 11", "Thg 12"];
        return monthNames[parseInt(month, 10) - 1] || month;
      });
    } else {
      // Khi xem tổng quan hoặc bộ lọc ngắn hạn, hiển thị năm
      labels = dates.map((date) => {
        const [year] = date.split("-");
        return year;
      });
    }

    const sellData = dates.map((date) => {
      const rate = chartDisplayData[date]?.USD_TUDO;
      return rate?.sell !== null && rate?.sell !== undefined ? rate.sell : null;
    });

    return {
      labels,
      datasets: [
        {
          label: "Giá Bán USD Tự Do",
          data: sellData,
          borderColor: "#22c55e",
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, "rgba(34, 197, 94, 0.3)");
            gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
            return gradient;
          },
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointBackgroundColor: "#22c55e",
          pointBorderColor: "#1E293B",
          pointBorderWidth: 2,
        },
      ],
    };
  }, [chartDisplayData, activeFilter]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1E293B",
        titleColor: "#FACC15",
        bodyColor: "#FFF",
        padding: 12,
        displayColors: true,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const dates = Object.keys(chartDisplayData).sort();
            const date = dates[index];
            const [year, month, day] = date.split("-");
            return `Ngày: ${day}/${month}/${year}`;
          },
          label: (context) => {
            const value = context.parsed.y;
            if (value === null) return "N/A";
            return `Giá bán: ${formatCurrency(value)} VNĐ`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "#94A3B8",
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "#94A3B8",
          callback: (value) => formatCurrency(value),
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  if (!chartData) {
    return null;
  }

  return (
    <div className="usd-history-chart-card">
      <div className="usd-chart-header">
        <div className="usd-chart-title-section">
          <h3 className="usd-chart-title">{displayStats.title || "Giá USD Tự Do"}</h3>
          {displayStats.price !== null && (
            <div className="usd-chart-price">
              <span className="usd-price-value">{formatCurrency(displayStats.price)}</span>
              {displayStats.percent !== null && (
                <span className={`usd-price-change ${displayStats.change >= 0 ? "up" : "down"}`}>
                  {displayStats.change >= 0 ? "↑" : "↓"} {Math.abs(displayStats.percent)}%
                  {typeof activeFilter === "number" || (typeof activeFilter === "string" && /^\d{4}$/.test(activeFilter)) 
                    ? `(trong năm ${activeFilter})` 
                    : ""}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="usd-chart-container">
        <Line data={chartData} options={options} />
      </div>
      <div className="usd-controls">
        {/* Thanh trượt năm */}
        <div className="usd-year-slider-container">
          <label className="usd-slider-label">
            Chọn năm: {sliderLabel}
          </label>
          <input
            type="range"
            min={minYear || 2000}
            max={maxYear || new Date().getFullYear()}
            value={sliderValue}
            onChange={handleYearSliderChange}
            className="usd-year-slider"
            disabled={activeFilter === "1W" || activeFilter === "1M"}
          />
          <div className="usd-slider-years">
            <span>{minYear || 2000}</span>
            <span>{maxYear || new Date().getFullYear()}</span>
          </div>
        </div>

        {/* Nhóm nút lọc nhanh */}
        <div className="usd-time-filter">
          {["1W", "1M", "Tất Cả"].map((filter) => (
            <button
              key={filter}
              className={`usd-filter-btn ${activeFilter === filter ? "active" : ""}`}
              onClick={() => handleQuickFilterClick(filter === "Tất Cả" ? "ALL" : filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default USDHistoryChart;
