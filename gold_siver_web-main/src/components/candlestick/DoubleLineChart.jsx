import React from "react";
import {
    Chart as ChartJS,
    TimeScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import "./SingleCandlestickChart.css";


ChartJS.register(
    TimeScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    zoomPlugin
);

const DoubleLineChart = ({ buyData, sellData, title, isZoom }) => {
    // Debug: Log dữ liệu đầu vào
    if (title && (title.includes("Vàng Sac") || title.includes("Hàn Quốc"))) {
        console.log(`DoubleLineChart [${title}]:`, {
            buyData_first3: buyData?.slice(0, 3),
            sellData_first3: sellData?.slice(0, 3),
            buyData_length: buyData?.length,
            sellData_length: sellData?.length,
            buyData_max: buyData?.length > 0 ? Math.max(...buyData.map(d => d.y)) : 0,
            sellData_max: sellData?.length > 0 ? Math.max(...sellData.map(d => d.y)) : 0,
        });
    }

    const chartData = {
        datasets: [
            {
                label: "Buy",
                data: buyData,
                borderColor: "#22C55E",
                fill: false,
                tension: 0.3,
            },
            {
                label: "Sell",
                data: sellData,
                borderColor: "#EF4444",
                fill: false,
                tension: 0.3,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top" },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = context.parsed.y;
                        // Debug tooltip value
                        if (title && (title.includes("Vàng Sac") || title.includes("Hàn Quốc"))) {
                            console.log(`Tooltip [${title}]:`, {
                                label: context.dataset.label,
                                parsed_y: value,
                                raw_data: context.raw,
                            });
                        }
                        return `${context.dataset.label}: ${value.toLocaleString()}`;
                    },
                },
            },
            zoom: {
                zoom: {
                    wheel: {
                        enabled: isZoom,
                    },
                    pinch: {
                        enabled: isZoom,
                    },
                    mode: "x",
                },
                pan: {
                    enabled: isZoom,
                    mode: "x",
                },
            },
        },
        scales: {
            x: {
                type: "time",
                time: { unit: "day", displayFormats: { day: "dd/MM" } },
                ticks: { color: "#64748B" },
                grid: { color: "rgba(148, 163, 184, 0.1)" },
            },
            y: {
                ticks: {
                    color: "#64748B",
                    callback: (value) => {
                        // Debug y-axis ticks
                        if (title && (title.includes("Vàng Sac") || title.includes("Hàn Quốc"))) {
                            console.log(`Y-axis tick [${title}]:`, value);
                        }
                        return value.toLocaleString();
                    },
                },
                grid: { color: "rgba(148, 163, 184, 0.1)" },
                // Đảm bảo Chart.js không tự động scale sai
                beginAtZero: false,
            },
        },
    };

    return (
        <div className="chart-wrapper" style={{ height: "400px" }}>
            <h3>{title}</h3>
            <div style={{ width: '100%', height: '100%' }}>
                <Chart type="line" data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default DoubleLineChart;
