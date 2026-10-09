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

const SingleLineChart = ({ buyData, title, color, isZoom }) => {
    const chartData = {
        datasets: [
            {
                label: "Tỉ lệ",
                data: buyData.map(item => {
                    const [d, m, y] = item.x.split("/");
                    return {
                        x: new Date(y, m - 1, d), // Lưu ý: tháng trong JS bắt đầu từ 0
                        y: item.y
                    };
                }),
                borderColor: color,
                backgroundColor: color,
                fill: false,
                tension: 0.3,
            }
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top" },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`,
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
                    callback: (value) => value.toLocaleString(),
                },
                grid: { color: "rgba(148, 163, 184, 0.1)" },
            },
        },
    };

    return (
        <div className="chart-wrapper" style={{ height: "94%", width: '100%' }}>
            <h3 style={{ cursor: 'pointer' }}>{title}</h3>
            <div style={{ width: '100%', height: '100%' }}>
                <Chart type="line" data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default SingleLineChart;
