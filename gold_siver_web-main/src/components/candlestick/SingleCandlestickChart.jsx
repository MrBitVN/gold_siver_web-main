import React, { useState } from "react";
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  CandlestickController,
  CandlestickElement,
} from "chartjs-chart-financial";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import "./SingleCandlestickChart.css";
import TimeRangeFilter from "./TimeRangeFilter";

ChartJS.register(
  TimeScale,
  LinearScale,
  CandlestickController,
  CandlestickElement,
  Title,
  Tooltip,
  Legend
);

const SingleCandlestickChart = ({ data, title, timeRange, setTimeRange }) => {
  const [showPopup, setShowPopup] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="chart-wrapper">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-empty">
          <p>Không có dữ liệu</p>
        </div>
      </div>
    );
  }

  const chartData = {
    datasets: [
      {
        label: title,
        data: data,
        borderColor: "#64748B",
        backgroundColor: "rgba(100, 116, 139, 0.1)",
        color: {
          up: "#22C55E",
          down: "#EF4444",
          unchanged: "#64748B",
        },
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1E293B",
        titleColor: "#FACC15",
        bodyColor: "#F1F5F9",
        borderColor: "#FACC15",
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const point = context.raw;
            if (!point) return [];
            const { o, h, l, c } = point;
            return [
              `Open: ${o?.toLocaleString() || 0}`,
              `High: ${h?.toLocaleString() || 0}`,
              `Low: ${l?.toLocaleString() || 0}`,
              `Close: ${c?.toLocaleString() || 0}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: { unit: "day", displayFormats: { day: "dd/MM" } },
        grid: { color: "rgba(148, 163, 184, 0.1)", drawBorder: false },
        ticks: { color: "#64748B", font: { size: 11, family: "Inter, sans-serif" } },
      },
      y: {
        grid: { color: "rgba(148, 163, 184, 0.1)", drawBorder: false },
        ticks: {
          color: "#64748B",
          font: { size: 11, family: "Inter, sans-serif" },
          callback: (value) => value.toLocaleString(),
        },
      },
    },
    onClick: () => setShowPopup(true), // click chart mở popup
  };

  return (
    <div className="chart-wrapper">
      <h3 className="chart-title" style={{ cursor: 'pointer' }} onClick={() => { setShowPopup(true) }}>{title}</h3>
      <div className="chart-container">
        <Chart type="candlestick" data={chartData} options={chartOptions} />
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="contain-popup-candle">
          <div className="chart-popup">
            <TimeRangeFilter activeRange={timeRange} onRangeChange={setTimeRange} />
            <h3 className="chart-title-popup">{title}</h3>
            <div className="chart-popup-content" style={{ pointerEvents: 'initial' }}>
              <Chart type="candlestick" data={chartData} options={chartOptions} />
            </div>
            <button className="close-btn-candle" onClick={() => setShowPopup(false)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleCandlestickChart;
