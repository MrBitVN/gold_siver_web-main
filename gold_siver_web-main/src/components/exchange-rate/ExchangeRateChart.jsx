import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { formatCurrency, getCurrencyName, filterDataByDateRange } from "../../utils/exchangeRateHelper";
import "./ExchangeRateChart.css";

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
 * Component biểu đồ lịch sử tỷ giá
 * @param {Object} props
 * @param {Object} props.data - Dữ liệu đã xử lý { "YYYY-MM-DD": { "USD": { buy, sell }, ... } }
 * @param {string} props.selectedCurrency - Mã ngoại tệ được chọn (mặc định USD)
 */
const ExchangeRateChart = ({ data, selectedCurrency = "USD" }) => {
  const { t } = useTranslation();
  const [currency, setCurrency] = useState(selectedCurrency);
  const [timeRange, setTimeRange] = useState(30); // 30 ngày mặc định

  // Lọc dữ liệu theo timeRange, nếu không có thì lấy toàn bộ dữ liệu
  const filteredData = useMemo(() => {
    const filtered = filterDataByDateRange(data, timeRange);
    // Nếu không có dữ liệu sau khi filter, lấy toàn bộ dữ liệu
    if (!filtered || Object.keys(filtered).length === 0) {
      return data || {};
    }
    return filtered;
  }, [data, timeRange]);

  // Chuẩn bị dữ liệu cho biểu đồ
  const chartData = useMemo(() => {
    if (!filteredData || Object.keys(filteredData).length === 0) {
      // Nếu vẫn không có dữ liệu, thử lấy từ data gốc
      if (!data || Object.keys(data).length === 0) {
        return null;
      }
      // Sử dụng data gốc
      const dates = Object.keys(data).sort();
      const labels = dates.map((date) => {
        const [year, month, day] = date.split("-");
        return `${day}/${month}/${year}`;
      });

      const buyData = dates.map((date) => {
        const rate = data[date]?.[currency];
        return rate?.buy !== null && rate?.buy !== undefined ? rate.buy : null;
      });

      const sellData = dates.map((date) => {
        const rate = data[date]?.[currency];
        return rate?.sell !== null && rate?.sell !== undefined ? rate.sell : null;
      });

      return {
        labels,
        datasets: [
          {
            label: t('exchangeRateChart.buy'),
            data: buyData,
            borderColor: "#22c55e",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            fill: true,
            tension: 0.4,
          },
          {
            label: t('exchangeRateChart.sell'),
            data: sellData,
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      };
    }

    const dates = Object.keys(filteredData).sort();
    const labels = dates.map((date) => {
      const [year, month, day] = date.split("-");
      return `${day}/${month}/${year}`;
    });

    const buyData = dates.map((date) => {
      const rate = filteredData[date]?.[currency];
      return rate?.buy !== null && rate?.buy !== undefined ? rate.buy : null;
    });

    const sellData = dates.map((date) => {
      const rate = filteredData[date]?.[currency];
      return rate?.sell !== null && rate?.sell !== undefined ? rate.sell : null;
    });

    return {
      labels,
      datasets: [
        {
          label: t('exchangeRateChart.buy'),
          data: buyData,
          borderColor: "#00C26F",
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, "rgba(0, 194, 111, 0.3)");
            gradient.addColorStop(1, "rgba(0, 194, 111, 0)");
            return gradient;
          },
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#00C26F",
          pointBorderColor: "#1E293B",
          pointBorderWidth: 2,
        },
        {
          label: t('exchangeRateChart.sell'),
          data: sellData,
          borderColor: "#FF4D4D",
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, "rgba(255, 77, 77, 0.3)");
            gradient.addColorStop(1, "rgba(255, 77, 77, 0)");
            return gradient;
          },
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: "#FF4D4D",
          pointBorderColor: "#1E293B",
          pointBorderWidth: 2,
        },
      ],
    };
  }, [filteredData, currency]);

  // Lấy danh sách currencies có sẵn
  const availableCurrencies = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return [];
    const currencies = new Set();
    Object.values(data).forEach((dayData) => {
      Object.keys(dayData).forEach((curr) => currencies.add(curr));
    });
    return Array.from(currencies).sort();
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#f8fafc",
          font: {
            size: 12,
            weight: 600,
          },
          padding: 15,
          usePointStyle: true,
        },
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
            const dates = Object.keys(filteredData).sort();
            const date = dates[index];
            const [year, month, day] = date.split("-");
            return `${t('exchangeRateChart.date')} ${day}/${month}/${year}`;
          },
          label: (context) => {
            const value = context.parsed.y;
            if (value === null) return null;
            return `${context.dataset.label}: ${formatCurrency(value)} ${t('exchangeRateChart.currency')}`;
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

  // Không hiển thị "Không có dữ liệu", luôn hiển thị biểu đồ với dữ liệu có sẵn
  if (!chartData) {
    // Nếu hoàn toàn không có dữ liệu, hiển thị biểu đồ trống
    return (
      <div className="exchange-rate-chart-card">
        <div className="chart-header">
          <h3 className="chart-title">{t('exchangeRateChart.title')}</h3>
        </div>
        <div className="chart-container">
          <p style={{ textAlign: "center", color: "var(--text-secondary)", padding: "2rem" }}>
            {t('exchangeRateChart.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="exchange-rate-chart-card">
      <div className="chart-header">
        <h3 className="chart-title">{t('exchangeRateChart.title')}</h3>
        <div className="chart-controls">
          <select
            className="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {availableCurrencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr} - {getCurrencyName(curr)}
              </option>
            ))}
          </select>
          <div className="time-range-buttons">
            <button
              className={`time-range-btn ${timeRange === 7 ? "active" : ""}`}
              onClick={() => setTimeRange(7)}
            >
              {t('exchangeRateChart.timeRange7d')}
            </button>
            <button
              className={`time-range-btn ${timeRange === 30 ? "active" : ""}`}
              onClick={() => setTimeRange(30)}
            >
              {t('exchangeRateChart.timeRange30d')}
            </button>
            <button
              className={`time-range-btn ${timeRange === 90 ? "active" : ""}`}
              onClick={() => setTimeRange(90)}
            >
              {t('exchangeRateChart.timeRange3m')}
            </button>
            <button
              className={`time-range-btn ${timeRange === 365 ? "active" : ""}`}
              onClick={() => setTimeRange(365)}
            >
              {t('exchangeRateChart.timeRange1y')}
            </button>
            <button
              className={`time-range-btn ${timeRange === 365*2 ? "active" : ""}`}
              onClick={() => setTimeRange(365*2)}
            >
              {t('exchangeRateChart.timeRange2y')}
            </button>
            <button
              className={`time-range-btn ${timeRange === 365*3 ? "active" : ""}`}
              onClick={() => setTimeRange(365*3)}
            >
              {t('exchangeRateChart.timeRange3y')}
            </button>
            <button
              className={`time-range-btn ${timeRange === 365*4 ? "active" : ""}`}
              onClick={() => setTimeRange(365*4)}
            >
              {t('exchangeRateChart.timeRange4y')}
            </button>
            <button
              className={`time-range-btn ${timeRange === 365*5 ? "active" : ""}`}
              onClick={() => setTimeRange(365*5)}
            >
              {t('exchangeRateChart.timeRange5y')}
            </button>
            <button
              className={`time-range-btn ${timeRange === 365*10 ? "active" : ""}`}
              onClick={() => setTimeRange(365*10)}
            >
              {t('exchangeRateChart.timeRange10y')}
            </button>
            <button
              className={`time-range-btn ${timeRange === 365*100 ? "active" : ""}`}
              onClick={() => setTimeRange(365*100)}
            >
              {t('exchangeRateChart.timeRangeAll')}
            </button>
          </div>
        </div>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ExchangeRateChart;

