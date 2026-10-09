// TradingViewChart.jsx
import React, { useEffect, useState, useRef } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    TimeScale,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import {
    CandlestickController,
    CandlestickElement
} from "chartjs-chart-financial";
import zoomPlugin from 'chartjs-plugin-zoom';
// ✨ IMPORT DATALABELS PLUGIN (KHÔNG register globally)
import ChartDataLabels from 'chartjs-plugin-datalabels';


// Đăng ký các thành phần của Chart.js (KHÔNG bao gồm ChartDataLabels)
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    CandlestickController,
    CandlestickElement,
    TimeScale,
    Tooltip,
    zoomPlugin
    // ❌ KHÔNG register ChartDataLabels ở đây
);

// 💡 Thêm props onZoom, externalZoom và enableZoom
const TradingViewChart = ({ 
    data, 
    onZoom, 
    externalZoom, 
    enableZoom = true, 
    chartLabel = "Candlestick", 
    volumeLabel = "Volume",
    volumeColor = "rgba(0, 150, 136, 0.5)",
    volumeBorderColor = "rgba(0, 150, 136, 1)"
}) => {
    const chartRef = useRef(null);
    const [chartData, setChartData] = useState({ datasets: [] });
    // Ref để quản lý cờ (flag) cho việc zoom từ bên ngoài
    const isExternalZoomingRef = useRef(false);
    // State để quản lý hiển thị datalabels
    const { t } = useTranslation();
    const [showVolumeLabels, setShowVolumeLabels] = useState(false);

    const initialDataPointsToZoom = 30;

    useEffect(() => {
        if (!data || data.length === 0) return;

        // Candlestick
        const candlestickDataset = {
            label: chartLabel,
            data: data.map(d => ({
                x: d.time,
                o: d.o,
                h: d.h,
                l: d.l,
                c: d.c,
            })),
            type: "candlestick",
            yAxisID: "yPrice",
            parsing: false,
            // 💡 Vô hiệu hóa datalabels cho nến
            datalabels: {
                display: false
            }
        };

        // Volume
        const volumeDataset = {
            label: volumeLabel,
            data: data.map(d => ({ x: d.time, y: d.volume })),
            type: "bar",
            backgroundColor: volumeColor,
            yAxisID: "yVolume",
            // 💡 Cấu hình datalabels cho Volume
            datalabels: {
                display: showVolumeLabels, // Sử dụng state để bật/tắt
                align: 'end', // Hiển thị ở cuối cột (trên đỉnh)
                anchor: 'end', // Neo ở cuối
                color: volumeBorderColor, // Màu chữ
                font: {
                    weight: 'bold',
                    size: 8
                },
                formatter: function (value, context) {
                    // Định dạng giá trị Volume (làm tròn hoặc thêm dấu phẩy)
                    return value.y.toLocaleString();
                }
            }
        };

        setChartData({ datasets: [candlestickDataset, volumeDataset] });
    }, [data, showVolumeLabels, chartLabel, volumeLabel, volumeColor, volumeBorderColor]);

    // 1. ✨ Tự động zoom ban đầu (chỉ chạy khi externalZoom LÀ null)
    useEffect(() => {
        const chart = chartRef.current;
        if (chart && data && data.length > 0 && !externalZoom) {
            isExternalZoomingRef.current = true; // Bật cờ để ngăn onZoomComplete chạy
            const startIndex = Math.max(0, data.length - initialDataPointsToZoom);
            const minTime = data[startIndex].time;
            const maxTime = data[data.length - 1].time;

            chart.zoom({ x: { min: minTime, max: maxTime } }, 'none');

            // Vô hiệu hóa cờ sau một độ trễ đủ dài
            setTimeout(() => { isExternalZoomingRef.current = false; }, 100);
        }
    }, [chartData]);

    // 2. 🚀 Đồng bộ hóa zoom khi trạng thái zoom ngoài thay đổi
    useEffect(() => {
        const chart = chartRef.current;
        if (chart && externalZoom) {
            isExternalZoomingRef.current = true; // BẬT CỜ
            const scale = chart.scales.x;

            if (scale && (scale.min !== externalZoom.min || scale.max !== externalZoom.max)) {
                chart.zoom({
                    x: {
                        min: externalZoom.min,
                        max: externalZoom.max,
                    }
                }, 'none');
            }
            // Vô hiệu hóa cờ sau một độ trễ đủ dài
            setTimeout(() => { isExternalZoomingRef.current = false; }, 100);
        }
    }, [externalZoom]);


    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
            x: {
                type: "time",
                time: {
                    unit: "day"
                },
                offset: true,
                grid: {
                    drawOnChartArea: false,
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.5)',
                    font: { size: 10 }
                }
            },
            yPrice: {
                type: 'linear',
                position: 'right',
                beginAtZero: false,
                grace: '5%',
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: { size: 10 }
                }
            },
            yVolume: {
                type: 'linear',
                position: 'left',
                beginAtZero: true,
                grace: '20%',
                display: 'auto',
                grid: {
                    drawOnChartArea: false
                },
                ticks: {
                    maxTicksLimit: 5,
                    color: volumeBorderColor,
                    font: { size: 9 }
                }
            }
        },
        plugins: {
            datalabels: {
                display: true
            },
            legend: {
                display: false // Hide legend to match image
            },
            tooltip: {
                enabled: true,
                mode: "index",
                intersect: false,
                backgroundColor: 'rgba(20, 20, 20, 0.9)',
                titleColor: '#fff',
                bodyColor: '#ccc',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                callbacks: {
                    title: function (ctx) {
                        return ctx[0].label;
                    },
                    label: function (ctx) {
                        if (ctx.dataset.type === "candlestick") {
                            const { o, h, l, c } = ctx.raw;
                            return `O:${o.toFixed(2)} H:${h.toFixed(2)} L:${l.toFixed(2)} C:${c.toFixed(2)}`;
                        } else if (ctx.dataset.type === "bar") {
                            return `Volume: ${ctx.raw.y.toLocaleString()}`;
                        }
                        return "";
                    },
                },
            },
            zoom: {
                pan: {
                    enabled: enableZoom,
                    mode: 'x',
                },
                zoom: {
                    wheel: { enabled: enableZoom },
                    pinch: { enabled: enableZoom },
                    mode: 'x',
                },
                onZoomComplete: ({ chart }) => {
                    if (isExternalZoomingRef.current) return;
                    const scale = chart.scales.x;
                    if (onZoom && scale) {
                        onZoom({ min: scale.min, max: scale.max });
                    }
                },
                onPanComplete: ({ chart }) => {
                    if (isExternalZoomingRef.current) return;
                    const scale = chart.scales.x;
                    if (onZoom && scale) {
                        onZoom({ min: scale.min, max: scale.max });
                    }
                }
            },
        },
        elements: {
            candlestick: {
                color: {
                    up: '#26a69a',
                    down: '#ef5350'
                },
                borderWidth: 1
            }
        }
    };

    return (
        <div style={{ height: '500px', width: '100%', position: 'relative', background: '#1a1d26', padding: '15px', borderRadius: '8px' }}>
            {/* Nút bật/tắt datalabels */}
            {enableZoom && (
                <div style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 10 }}>
                    <button
                        onClick={() => setShowVolumeLabels(!showVolumeLabels)}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: 'rgba(255, 215, 0, 0.15)',
                            color: '#FFD700',
                            border: '1px solid #FFD700',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span className="icon">📊</span>
                        {showVolumeLabels ? t('TradingViewChart.hideVolume') : t('TradingViewChart.showVolume')}
                    </button>
                </div>
            )}
            <div style={{ height: 'calc(100% - 10px)', marginTop: '10px' }}>
                <Chart
                    ref={chartRef}
                    type="bar"
                    data={chartData}
                    options={options}
                    plugins={[ChartDataLabels]}
                />
            </div>
        </div>
    );
};


export default TradingViewChart;