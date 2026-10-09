import React, { useEffect, useState } from "react";
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
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import "./ZslComparisonChart.css";

ChartJS.register(
    TimeScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const API_URL = "https://api_gold.thinkdiff.us/ZSL_proshare_ultrashort_silver";

const parseSeries = (raw, keyCandidate) => {
    // Try to find series by a key or common shapes
    if (!raw) return [];

    // If object with named series
    if (typeof raw === "object" && !Array.isArray(raw)) {
        // If keys are present
        if (raw[keyCandidate]) return raw[keyCandidate];

        // Try to find arrays containing date/value items
        for (const k of Object.keys(raw)) {
            if (Array.isArray(raw[k])) return raw[k];
        }
        return [];
    }

    // If already an array
    if (Array.isArray(raw)) return raw;

    return [];
};

const toChartPoints = (arr) => {
    if (!Array.isArray(arr)) return [];

    return arr
        .map((item) => {
            if (!item || typeof item !== "object") return null;

            // 👇 FORMAT API CỦA BẠN
            if (item.date && Array.isArray(item.data) && item.data.length > 0) {
                return {
                    x: new Date(item.date),
                    y: Number(item.data[0]),
                };
            }

            // fallback cũ (giữ lại cho an toàn)
            if (item.x !== undefined && item.y !== undefined) {
                return { x: new Date(item.x), y: Number(item.y) };
            }

            return null;
        })
        .filter(Boolean)
        .sort((a, b) => a.x - b.x);
};


const pctFormat = (v) => {
    if (v === null || v === undefined || isNaN(v)) return "N/A";
    return `${Number(v).toFixed(2)}%`;
};
const verticalLinePlugin = {
    id: "verticalLine",

    afterDraw(chart) {
        const tooltip = chart.tooltip;

        if (!tooltip || !tooltip.getActiveElements().length) return;

        const ctx = chart.ctx;
        const x = tooltip.getActiveElements()[0].element.x;
        const topY = chart.chartArea.top;
        const bottomY = chart.chartArea.bottom;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "gray"; // màu xám nhạt
        ctx.stroke();
        ctx.restore();
    },
};

const ZslComparisonChart = () => {
    const [seriesA, setSeriesA] = useState([]); // ZSL_performance (blue)
    const [seriesB, setSeriesB] = useState([]); // ZSL_proshare_ultrashort_silver (black)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(API_URL);
                const json = await res.json();

                // Try multiple key names
                const sA = parseSeries(json, "ZSL_performance") || [];
                const sB = parseSeries(json, "ZSL_proshare_ultrashort_silver") || [];

                // If top-level contains these keys
                const a = toChartPoints(sA).slice(-15);
                const b = toChartPoints(sB).slice(-16);

                if (!cancelled) {
                    setSeriesA(a);
                    setSeriesB(b);
                }

            } catch (err) {
                if (!cancelled) setError(err.message || "Lỗi khi fetch dữ liệu");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => (cancelled = true);
    }, []);

    const data = {
        datasets: [
            {
                label: "ZSL Performance",
                data: seriesA,
                borderColor: "#4DA6FF", // light blue
                backgroundColor: "rgba(77,166,255,0.08)",
                tension: 0.25,
                pointRadius: 3,
                pointHoverRadius: 6,
                fill: false,
            },
            {
                label: "ZSL Proshare UltraShort Silver",
                data: seriesB,
                borderColor: "#0B2B2B", // dark black
                backgroundColor: "rgba(11,43,43,0.04)",
                tension: 0.25,
                pointRadius: 3,
                pointHoverRadius: 6,
                fill: false,
            },
        ],
    };
    const allDates = [...seriesA, ...seriesB].map(p => +p.x);

    const minDate = allDates.length ? Math.min(...allDates) : undefined;
    const maxDate = allDates.length ? Math.max(...allDates) : undefined;


    const options = {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
            mode: "x",
            intersect: false,
        },

        plugins: {
            legend: { position: "top" },

            tooltip: {
                filter: (item) =>
                    item.raw && item.raw.y !== null && item.raw.y !== undefined,

                callbacks: {
                    title: (items) => {
                        if (!items.length) return "";
                        return new Date(items[0].parsed.x).toLocaleDateString();
                    },

                    label: (context) =>
                        `${context.dataset.label}: ${pctFormat(context.parsed.y)}`,
                },
            },
        },

        scales: {
            x: {
                type: "time",
                offset: false,
                min: minDate,
                max: maxDate,
                time: {
                    unit: "day",
                    displayFormats: { day: "MMM d" },
                },
                grid: { color: "rgba(148,163,184,0.06)" },
            },

            y: {
                ticks: {
                    callback: (value) => `${value}%`,
                    color: "#64748B",
                },
                grid: { color: "rgba(148,163,184,0.06)" },
            },
        },
    };


    return (
        <div className="zsl-chart-wrapper">
            <h3>ZSL Comparison</h3>
            {loading && <div className="zsl-loading">Đang tải dữ liệu...</div>}
            {error && <div className="zsl-error">Lỗi: {error}</div>}
            {!loading && !error && (
                <div className="zsl-chart-container">
                    <Chart
                        type="line"
                        data={data}
                        options={options}
                        plugins={[verticalLinePlugin]}
                    />

                </div>
            )}
        </div>
    );
};

export default ZslComparisonChart;
