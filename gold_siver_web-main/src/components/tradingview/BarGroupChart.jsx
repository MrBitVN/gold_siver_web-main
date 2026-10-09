import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function BarGroupChart({ chartData }) {
  if (!chartData) return <p>Không có dữ liệu...</p>;

  const data = {
    labels: chartData.labels, 

    datasets: [
      {
        label: "Xuất khẩu",
        data: chartData.xuat_khau,
        backgroundColor: "rgba(54, 162, 235, 0.7)", 
        borderRadius: 4,
      },
      {
        label: "Nhập khẩu",
        data: chartData.nhap_khau,
        backgroundColor: "rgba(255, 99, 132, 0.7)", // đỏ
        borderRadius: 4,
      },
      {
        label: "Nhập siêu",
        data: chartData.nhap_sieu,
        backgroundColor: "rgba(154, 205, 50, 0.7)", // xanh lá
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 10 },
      },
      x: {
        stacked: false, // hiển thị 3 cột cạnh nhau
      },
    },
    plugins: {
      legend: {
        position: "right",
        labels: {
          boxWidth: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}`,
        },
      },
    },
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <Bar data={data} options={options} />
    </div>
  );
}
