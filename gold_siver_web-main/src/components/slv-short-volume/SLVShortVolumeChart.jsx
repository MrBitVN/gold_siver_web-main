import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
    TimeScale,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import './SLVShortVolumeChart.css';
import { useTranslation } from "react-i18next";
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
    TimeScale,
    zoomPlugin
);

const SLVShortVolumeChart = () => {
    const { t } = useTranslation();
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [shortVolumeData, setShortVolumeData] = useState(null);
    const [history, setHistory] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [growthRate, setGrowthRate] = useState(null);
    const [pricePrediction, setpricePrediction] = useState(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch('https://api_gold.thinkdiff.us/chartexchange_slv_short');

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const { data } = await response.json();
                const chartexchange_short = data?.chartexchange_short_volume || [];
                const shortVolume = data?.du_lieu_short_volume || null;
                setPrediction(data?.gia_du_doan?.[0] ?? null);
                setGrowthRate(data?.ti_le_tang_truong ?? null);
                setShortVolumeData(shortVolume);
                setpricePrediction(data);
                setHistory([...chartexchange_short].sort((a, b) =>
                    new Date(b.date_time) - new Date(a.date_time)
                ));

                if (!chartexchange_short || chartexchange_short.length === 0) {
                    setError('No data available');
                    setLoading(false);
                    return;
                }

                // Sort data by date
                const sortedForChart = [...chartexchange_short].sort((a, b) =>
                    new Date(a.date_time) - new Date(b.date_time)
                );

                const sortedForTable = [...sortedForChart].reverse();

                // Extract labels (dates)
                const labels = sortedForChart.map(item => item.date_time);

                // Prepare datasets for Long and Short volumes
                // The bar height is determined by total_volume_reported
                // Long and Short are percentages that stack to make up the total
                const longValues = sortedForChart.map(item => {
                    const totalVolume = item.total_volume_reported || 100;
                    const longPercent = item.TotalLongVolume_Reported || 0;
                    return (longPercent / 100) * totalVolume;
                });

                const shortValues = sortedForChart.map(item => {
                    const totalVolume = item.total_volume_reported || 100;
                    const shortPercent = item.total_short_volume_reported || 0;
                    return (shortPercent / 100) * totalVolume;
                });

                // Store original values for tooltip display
                const originalLongValues = sortedForChart.map(item => item.TotalLongVolume_Reported || 0);
                const originalShortValues = sortedForChart.map(item => item.total_short_volume_reported || 0);
                const totalVolumeValues = sortedForChart.map(item => item.total_volume_reported || 0);

                const datasets = [
                    {
                        label: 'Long Volume',
                        data: longValues,
                        backgroundColor: '#2cfc03',
                        stack: 'stack1',
                        originalValues: originalLongValues,
                        totalVolumes: totalVolumeValues, // ✅ thêm vào đây
                    },
                    {
                        label: 'Short Volume',
                        data: shortValues,
                        backgroundColor: '#FF4444',
                        stack: 'stack1',
                        originalValues: originalShortValues,
                        totalVolumes: totalVolumeValues, // ✅ thêm vào đây
                    },
                ];

                setChartData({
                    labels,
                    datasets,
                });

                setTableData(sortedForTable);

                setError(null);
            } catch (err) {
                console.error('Error fetching chart data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    const format = (num) =>
        typeof num === "number" ? num.toFixed(2) : "--";

    const formatPrice = (num) =>
        typeof num === "number" ? num.toFixed(2) : "--";

    const formatPercent = (num) =>
        typeof num === "number" ? num.toFixed(2) : "--";
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'x',
        scales: {
            x: {
                stacked: true,
                grid: {
                    display: false,
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: {
                        size: 11,
                    },
                },
            },
            y: {
                stacked: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    callback: function (value) {
                        // Format large numbers
                        if (value >= 1000000) {
                            return (value / 1000000).toFixed(0) + 'M';
                        } else if (value >= 1000) {
                            return (value / 1000).toFixed(0) + 'K';
                        }
                        return value;
                    },
                },
            },
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: 'rgba(255, 255, 255, 0.8)',
                    font: {
                        size: 12,
                        weight: 'bold',
                    },
                    padding: 15,
                    usePointStyle: true,
                },
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        const label = context.dataset.label || '';
                        const datasetIndex = context.datasetIndex;
                        const dataIndex = context.dataIndex;
                        const originalValue = context.dataset.originalValues?.[dataIndex] || context.parsed.y;
                        return `${label}: ${originalValue.toLocaleString()}%`;
                    },
                    afterBody: function (context) {
                        if (context.length > 0) {
                            const dataIndex = context[0].dataIndex;

                            const totalVolume =
                                context[0].dataset.totalVolumes?.[dataIndex];

                            if (totalVolume !== undefined) {
                                return `Total volume: ${totalVolume.toLocaleString()}`;
                            }
                        }
                        return '';
                    },
                },
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'xy',
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true,
                    },
                    mode: 'xy',
                },
            },
        },
    };

    const getPercent = (item) => {
        if (!item) return null;
        return item.total_short_volume_reported;
    };

    const prev1 = getPercent(history[1]);
    const prev2 = getPercent(history[2]);
    const prev7 = getPercent(history[6]);
    const Circle = ({ value, label, size = 140 }) => {
        if (value === null || value === undefined || !shortVolumeData) return null;

        const avg = shortVolumeData.trung_binh_30_ngay_phan_tram;
        const isSell = value > avg;

        return (
            <div style={{ textAlign: "center" }}>
                <div style={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    background: `conic-gradient(${isSell ? '#FF4444' : '#2cfc03'} 0deg ${(value / 100) * 360}deg, rgba(255,255,255,0.1) ${(value / 100) * 360}deg 360deg)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <div style={{
                        width: size - 25,
                        height: size - 25,
                        borderRadius: "50%",
                        background: "#1a1a1a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <span style={{
                            fontSize: size / 6,
                            fontWeight: "bold",
                            color: isSell ? "#FF4444" : "#2cfc03"
                        }}>
                            {value.toFixed(1)}%
                        </span>
                    </div>
                </div>

                <p style={{ marginTop: "8px", color: "#ccc" }}>{label}</p>
            </div>
        );
    };
    if (loading) {
        return (
            <div className="slv-short-volume-container">
                <div className="loading">Loading chart data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="slv-short-volume-container">
                <div className="error">Error loading chart: {error}</div>
            </div>
        );
    }

    return (
        <div className="slv-short-volume-container">
            <div className="chart-header">
                <h2>SLV Short Circle</h2>
            </div>

            {/* Gauge Chart */}
            {shortVolumeData && (
                <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '40px',
                        flexWrap: 'wrap'
                    }}>

                        {/* LEFT: 4 circles */}
                        <div style={{
                            display: 'flex',
                            gap: '30px',
                            flexWrap: 'wrap'
                        }}>
                            <Circle value={shortVolumeData.hom_nay_phan_tram} label={shortVolumeData.ngay_gio ?? "--"} />
                            <Circle value={prev1} label={t("time.prev_1d")} />
                            <Circle value={prev2} label={t("time.prev_2d")} />
                            <Circle value={prev7} label={t("time.prev_7d")} />
                        </div>

                        {/* RIGHT: INFO */}
                        <div style={{ display: "flex", gap: "40px", fontSize: "14px", color: "rgba(255,255,255,0.8)" }}>
                            {/* Cột 1: Short Volume + Tăng trưởng */}
                            <div style={{ minWidth: '220px', lineHeight: "1.6" }}>
                                <p><b>{shortVolumeData.ngay_gio ?? "--"}:</b> {shortVolumeData.hom_nay_phan_tram?.toFixed(2) ?? "--"}%</p>
                                <p><b>{t("short.avg_30d")}::</b> {shortVolumeData.trung_binh_30_ngay_phan_tram?.toFixed(2) ?? "--"}%</p>
                                <p><b>Short Vol:</b> {shortVolumeData.short_volume?.toLocaleString() ?? "--"}</p>

                                <p style={{ fontSize: "12px", color: "#aaa", marginTop: "8px" }}>
                                    {t("short.high_meaning")}
                                </p>
                                <p style={{ fontSize: "12px", color: "#aaa", marginTop: "8px" }}>
                                    {t("short.low_meaning")}
                                </p>

                                <p>
                                    <b>{t("short.growth_rate")}:</b>{" "}
                                    <span style={{
                                        color:
                                            growthRate == null
                                                ? "#ccc"
                                                : growthRate >= 0
                                                    ? "#2cfc03"
                                                    : "#FF4444",
                                        fontWeight: "bold"
                                    }}>
                                        {formatPercent(growthRate)}%
                                    </span>
                                </p>

                                <p style={{
                                    marginTop: "10px",
                                    fontWeight: "bold",
                                    color:
                                        shortVolumeData.hom_nay_phan_tram >
                                            shortVolumeData.trung_binh_30_ngay_phan_tram
                                            ? "#FF4444"
                                            : "#2cfc03"
                                }}>
                                    {shortVolumeData.hom_nay_phan_tram >
                                        shortVolumeData.trung_binh_30_ngay_phan_tram
                                        ? t("short.sell_signal")
                                        : t("short.buy_signal")}
                                </p>
                            </div>

                            {/* Cột 2: Giá dự đoán chi tiết */}
                            <div style={{ minWidth: '220px', lineHeight: "1.6" }}>
                                <p>
                                    <b>{t("pricecircle.lowest")}:</b>{" "}
                                    <span style={{ color: "#00ccff" }}>
                                        {formatPrice(pricePrediction?.gia_du_doan?.[0])}
                                    </span>
                                </p>
                                <p><b>{t("pricecircle.highest")}:</b> {formatPrice(pricePrediction?.gia_du_doan_cao_nhat)}</p>
                                <p><b>{t("pricecircle.close")}:</b> {formatPrice(pricePrediction?.gia_du_doan_dong_cua)}</p>
                                <p><b>{t("pricecircle.open")}:</b> {formatPrice(pricePrediction?.gia_du_doan_mo_cua)}</p>
                            </div>
                        </div>

                    </div>
                </div>
            )}


            <div className="chart-wrapper">
                {chartData && (
                    <Chart
                        type="bar"
                        data={chartData}
                        options={options}
                    />
                )}
            </div>

            <div className="table-wrapper" style={{ marginTop: '30px', overflowX: 'auto' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '12px',
                }}>
                    <thead>
                        <tr style={{ backgroundColor: 'rgba(5, 5, 5, 0.8)', borderBottom: '2px solid rgba(255, 255, 255, 0.9)' }}>
                            <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', fontSize: '15px' }}>Date</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>Total Short Volume Reported</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>Total Long Volume Reported</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>Off Exchange Non-Exempt</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>Off Exchange Exempt</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>Cboe EDGX</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>Cboe BZX</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>Cboe EDGA</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>Cboe BYX</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>Nasdaq BX</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>Nasdaq PHLX</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>NYSE</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>NYSE Arca</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>NYSE National</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>NYSE American</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>CHX</th>
                            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>Total Volume Reported</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(5, 5, 5, 0.8)' }}>
                                <td style={{ padding: '8px', textAlign: 'left', fontSize: '17px', whiteSpace: 'nowrap' }}>{new Date(row.date_time).toLocaleDateString('vi-VN')}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.total_short_volume_reported?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.TotalLongVolume_Reported?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.off_exchange?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.off_exchange_exempt?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.Cboe_EDGX?.toFixed(2) || ''}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.Cboe_BZX?.toFixed(2) || ''}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.Cboe_EDGA?.toFixed(2) || ''}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.Cboe_BYX?.toFixed(2) || ''}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.Nasdaq_BX?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.Nasdaq_PHLX?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.NYSE?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.NYSE_Arca?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.NYSE_National?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.NYSE_American?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontSize: '17px' }}>{row.CHX?.toFixed(2)}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', fontSize: '17px' }}>{row.total_volume_reported?.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SLVShortVolumeChart;
