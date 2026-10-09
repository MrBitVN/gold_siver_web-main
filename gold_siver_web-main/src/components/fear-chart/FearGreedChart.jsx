import React from "react";
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
import { formatDate } from "../../utils/fearLevelHelper";
import "./FearGreedChart.css";
import { useTranslation } from "react-i18next";
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
 * Component biểu đồ đường Fear & Greed Index
 * @param {Array} data - Mảng dữ liệu đã sắp xếp [{ chiso, id_time }]
 */
const FearGreedChart = ({ data }) => {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>{t("FearGreedChart.noData")}</p>
      </div>
    );
  }

  // Chuẩn bị dữ liệu cho Chart.js
  const labels = data.map((item) => formatDate(item.id_time));
  const values = data.map((item) => item.chiso);

  const chartData = {
    labels,
    datasets: [
      {
        label: t("FearGreedChart.label"),
        data: values,
        borderColor: "#FACC15", // Vàng
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(250, 204, 21, 0.3)");
          gradient.addColorStop(1, "rgba(250, 204, 21, 0)");
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4, // Đường cong mượt
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#FACC15",
        pointBorderColor: "#1E293B",
        pointBorderWidth: 2,
      },
    ],
  };

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
        displayColors: false,
        callbacks: {
          title: (context) => {
            return `${t("FearGreedChart.date")}: ${data[context[0].dataIndex].id_time}`;
          },
          label: (context) => {
            return `${t("FearGreedChart.index")}: ${context.parsed.y}`;
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
        min: 0,
        max: 100,
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "#94A3B8",
          stepSize: 20,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  return (
    <div className="fear-greed-chart">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default FearGreedChart;
