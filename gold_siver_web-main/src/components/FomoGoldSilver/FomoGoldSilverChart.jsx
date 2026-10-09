import "./FomoGoldSilverChart.css"
import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
// 1. Thêm import plugin annotation
import annotationPlugin from 'chartjs-plugin-annotation';
import { Chart } from 'react-chartjs-2';
import axios from 'axios';
import { format, subDays, isAfter } from 'date-fns';
import { Link } from "react-router-dom";

// Đăng ký các thành phần của Chart.js bao gồm annotation
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin,
    annotationPlugin
);

const FomoGoldSilverChart = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('silver');
    const [timeRange, setTimeRange] = useState('30d');
    const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false);
    const [chartType, setChartType] = useState("line");

    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [priceChartData, setPriceChartData] = useState({ labels: [], datasets: [] });

    const [stats, setStats] = useState({ high: 0, low: 0, current: 0 });
    const [changes, setChanges] = useState({
        day1: 0, day2: 0, day3: 0, week1: 0, month1: 0, month6: 0
    });
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState({ gold: [], silver: [] });
    const fomoChartRef = useRef(null);
    const priceChartRef = useRef(null);

    const formatDate = (dateStr) => {
        try { return format(new Date(dateStr), 'dd/MM'); } catch (e) { return dateStr; }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axios.get('https://api_gold.thinkdiff.us/FOMO_history_vang_bac');
                const data = response.data;
                setRawData({
                    silver: data.chi_so_fomo_bac || [],
                    gold: data.chi_so_fomo_vang || []
                });
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const currentList = activeTab === 'silver' ? rawData.silver : rawData.gold;
        if (!currentList || currentList.length === 0) {
            setChartData({ labels: [], datasets: [] });
            setPriceChartData({ labels: [], datasets: [] });
            return;
        };

        const sortedData = [...currentList].sort((a, b) => new Date(a.datatime) - new Date(b.datatime));
        const fomoKey = activeTab === 'silver' ? 'fomo_bac' : 'fomo_vang';
        const priceKey = activeTab === 'silver' ? 'gia_bac_kitco' : 'gia_vang_kitco';

        const fullFomoValues = sortedData.map(item => (typeof item[fomoKey] === 'number' ? item[fomoKey] : 0));
        const latestItem = sortedData[sortedData.length - 1];
        const latestTime = new Date(latestItem.datatime).getTime();
        const currentVal = (latestItem[fomoKey] || 0);

        setStats({
            high: Math.max(...fullFomoValues),
            low: Math.min(...fullFomoValues),
            current: currentVal
        });

        const findValueDaysAgo = (daysAgo) => {
            const targetTime = latestTime - (daysAgo * 24 * 60 * 60 * 1000);
            const bestMatch = sortedData.reduce((prev, curr) => {
                const prevTime = new Date(prev.datatime).getTime();
                const currTime = new Date(curr.datatime).getTime();
                return (Math.abs(currTime - targetTime) < Math.abs(prevTime - targetTime) ? curr : prev);
            });
            return (bestMatch[fomoKey] || 0);
        };

        const calcChangeRealTime = (days) => {
            const oldVal = findValueDaysAgo(days);
            if (!oldVal || oldVal === 0) return 0;
            return ((currentVal - oldVal) / oldVal) * 100;
        };

        setChanges({
            day1: calcChangeRealTime(1), day2: calcChangeRealTime(2), day3: calcChangeRealTime(3),
            week1: calcChangeRealTime(7), month1: calcChangeRealTime(30), month6: calcChangeRealTime(180)
        });

        const now = new Date();
        let filterDate;
        switch (timeRange) {
            case '7d': filterDate = subDays(now, 7); break;
            case '30d': filterDate = subDays(now, 30); break;
            case '90d': filterDate = subDays(now, 90); break;
            case '1y': filterDate = subDays(now, 365); break;
            default: filterDate = null;
        }

        const filteredData = filterDate ? sortedData.filter(item => isAfter(new Date(item.datatime), filterDate)) : sortedData;
        const labels = filteredData.map(item => formatDate(item.datatime));
        const fomoValuesForChart = filteredData.map(item => (item[fomoKey] || 0));
        const priceValuesForChart = filteredData.map(item => item[priceKey]*31.1035/1000 || 0);

        const canvas = fomoChartRef.current?.canvas;
        let fomoGradient = null;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            fomoGradient = ctx.createLinearGradient(0, 0, 0, 400);
            fomoGradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
            fomoGradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
        }

        setChartData({
            labels,
            datasets: [
                {
                    type: chartType,
                    label: activeTab === 'silver' ? 'Chỉ số FOMO Bạc' : 'Chỉ số FOMO Vàng',
                    data: fomoValuesForChart,
                    // ✅ TỰ ĐỘNG ĐỔI MÀU CHO CẢ LINE VÀ COLUMN (BAR) KHI > 80
                    borderColor: (context) => {
                        const value = context.parsed ? context.parsed.y : null;
                        if (chartType === 'line') {
                            const chart = context.chart;
                            const { ctx, chartArea } = chart;
                            if (!chartArea) return '#3b82f6';
                            const yScale = chart.scales.y;
                            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                            const stop = yScale.getPixelForValue(80);
                            const percentage = (chartArea.bottom - stop) / (chartArea.bottom - chartArea.top);
                            if (percentage <= 0) return '#3b82f6';
                            if (percentage >= 1) return '#ef4444';
                            gradient.addColorStop(0, '#3b82f6');
                            gradient.addColorStop(percentage, '#3b82f6');
                            gradient.addColorStop(percentage, '#ef4444');
                            gradient.addColorStop(1, '#ef4444');
                            return gradient;
                        }
                        return value >= 80 ? '#ef4444' : '#3b82f6';
                    },
                    backgroundColor: (context) => {
                        const value = context.parsed ? context.parsed.y : null;
                        if (chartType === 'bar') {
                            return value >= 80 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(59, 130, 246, 0.7)';
                        }
                        return fomoGradient || 'rgba(59,130,246,0.2)';
                    },
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHitRadius: 10,
                }
            ],
        });

        setPriceChartData({
            labels,
            datasets: [
                {
                    type: chartType,
                    label: activeTab === 'silver' ? `${t('FomoGoldSilver.priceChart')} ${t('FomoGoldSilver.silver')} (${t('FomoGoldSilver.usdPerOz')})` : `${t('FomoGoldSilver.priceChart')} ${t('FomoGoldSilver.gold')} (${t('FomoGoldSilver.usdPerOz')})`,
                    data: priceValuesForChart,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.2)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4,
                },
            ],
        });
    }, [activeTab, timeRange, rawData, chartType]);

    useEffect(() => {
        const t = setTimeout(() => {
            fomoChartRef.current?.resetZoom();
            priceChartRef.current?.resetZoom();
        }, 0);
        return () => clearTimeout(t);
    }, [chartData, priceChartData]);

    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index', intersect: false,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#e0e7ff', bodyColor: '#cbd5e1',
                borderColor: 'rgba(59, 130, 246, 0.3)', borderWidth: 1,
            },
            zoom: timeRange !== '7d' ? {
                zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
                pan: { enabled: true, mode: 'xy' },
                limits: { x: { min: 'original', max: 'original' }, y: { min: 'original', max: 'original' } }
            } : undefined,
        },
        scales: {
            x: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#9ca3af', maxTicksLimit: 8 } },
            y: {
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                ticks: { color: '#9ca3af' },
                position: 'right',
                beginAtZero: true,
                min: 0
            },
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
    };

    const commonChartOptionsFomo = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            // ✅ 2. THÊM ĐƯỜNG KẺ ĐỎ TẠI 80
            annotation: {
                annotations: {
                    line80: {
                        type: 'line',
                        yMin: 80,
                        yMax: 80,
                        borderColor: 'rgba(239, 68, 68, 0.8)',
                        borderWidth: 2,
                        borderDash: [6, 6],
                        label: {
                            display: true,
                            content: t('FomoGoldSilver.overBought'),
                            position: 'end',
                            backgroundColor: 'rgba(239, 68, 68, 0.8)',
                            font: { size: 10 }
                        }
                    }
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#e0e7ff',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                borderWidth: 1,
                callbacks: {
                    labelTextColor: (ctx) => {
                        const value = ctx.parsed.y;
                        if (value >= 80) return '#ef4444';
                        if (value <= 20) return '#22c55e';
                        return '#e5e7eb';
                    },
                    label: (ctx) => {
                        const value = ctx.parsed.y;
                        let text = value >= 80 ? `(${t('FomoGoldSilver.buySignal')})` : value <= 20 ? `(${t('FomoGoldSilver.sellSignal')})` : "";
                        return `${t('FomoGoldSilver.indexLabel')} ${value.toFixed(1)}% ${text}`;
                    },
                },
            },
            zoom: timeRange !== '7d' ? {
                zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' },
                pan: { enabled: true, mode: 'xy' },
                limits: { x: { min: 'original', max: 'original' }, y: { min: 'original', max: 'original' } }
            } : undefined,
        },
        scales: {
            x: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#9ca3af', maxTicksLimit: 8 } },
            y: {
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                ticks: { color: '#9ca3af' },
                position: 'right',
                // ✅ 3. ĐẨY BIỂU ĐỒ XUỐNG DƯỚI (DÙNG MAX 110)
                min: 0,
                max: 130,
                grace: '5%'
            },
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: true }
    };

    const handleChartTypeChange = (type) => { setChartType(type); };

    const renderChangeBox = (label, value) => {
        const safeValue = typeof value === 'number' ? value : 0;
        return (
            <div className="percentage-item">
                <div className="percentage-label">{label}</div>
                <div className={`percentage-value ${safeValue >= 0 ? 'positive' : 'negative'}`}>
                    {safeValue > 0 ? '+' : ''}{safeValue.toFixed(2)}%
                </div>
            </div>
        );
    };

    if (!rawData?.gold?.length && !rawData?.silver?.length && !loading) return null;

    return (
        <div className="fomo-inventory-container" >
            <Link to="/fomo-vang-bac" >
                <div className="fomo-inventory-header">
                    <h2>{t('FomoGoldSilver.title')}</h2>
                    <p className="subtitle">{t('FomoGoldSilver.subtitle')}</p>
                </div>
            </Link>

            <div className="fomo-tab-navigation" >
                <button className={`tab-button ${activeTab === 'gold' ? 'active' : ''}`} onClick={() => setActiveTab('gold')}><span className="tab-icon">🥇</span> {t('FomoGoldSilver.gold')}</button>
                <button className={`tab-button ${activeTab === 'silver' ? 'active' : ''}`} onClick={() => setActiveTab('silver')}><span className="tab-icon">🥈</span> {t('FomoGoldSilver.silver')}</button>
            </div>

            <div className="fomo-desktop-layout">
                <div className="fomo-left-column">
                    <div className="fomo-summary">
                        <div className="summary-item"><span className="summary-label">{t('FomoGoldSilver.highestFomo')}</span><span className="summary-value">{stats.high.toFixed(2)} <span className="unit-badge">{t('FomoGoldSilver.unit')}</span></span></div>
                        <div className="summary-item"><span className="summary-label">{t('FomoGoldSilver.lowestFomo')}</span><span className="summary-value">{stats.low.toFixed(2)} <span className="unit-badge">{t('FomoGoldSilver.unit')}</span></span></div>
                        <div className="summary-item" style={{ borderLeftColor: '#22c55e' }}><span className="summary-label">{t('FomoGoldSilver.currentFomo')}</span><span className="summary-value" style={{ color: stats.current >= 80 ? '#ef4444' : '#22c55e' }}>{stats.current.toFixed(2)} <span className="unit-badge">{t('FomoGoldSilver.unit')}</span></span></div>
                        <h3>{activeTab === 'silver' ? t('FomoGoldSilver.silver') : t('FomoGoldSilver.gold')} {t('FomoGoldSilver.materialSpread')} {(stats?.current / 10).toFixed(2)} {t('FomoGoldSilver.million')}</h3>
                    </div>

                    <div className="percentage-changes-container">
                        <h3>{t('FomoGoldSilver.changeRatioLabel')}</h3>
                        <div className="percentage-grid">
                            {renderChangeBox(t('FomoGoldSilver.oneDay'), changes.day1)}
                            {renderChangeBox(t('FomoGoldSilver.twoDay'), changes.day2)}
                            {renderChangeBox(t('FomoGoldSilver.threeDay'), changes.day3)}
                            {renderChangeBox(t('FomoGoldSilver.oneWeek'), changes.week1)}
                            {renderChangeBox(t('FomoGoldSilver.oneMonth'), changes.month1)}
                            {renderChangeBox(t('FomoGoldSilver.sixMonth'), changes.month6)}
                        </div>
                    </div>
                </div>

                <div className="fomo-right-column">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <div className="latest-update-date" style={{ margin: 0, left: 0, fontSize: '14px' }}>{t('FomoGoldSilver.updated')} {chartData && chartData?.labels.at(-1)}/{new Date().getFullYear()}</div>
                        <div className="fomo-time-range">
                            {['7d', '30d', '90d', '1y', 'all'].map(range => (
                                <button key={range} className={`time-range-btn ${timeRange === range ? 'active' : ''}`} onClick={() => setTimeRange(range)}>{range === 'all' ? t('FomoGoldSilver.allData') : range.toUpperCase()}</button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 style={{ color: '#e0e7ff', fontSize: '18px', marginBottom: '10px' }}>{t('FomoGoldSilver.chartFomoTitle')} <br /><small style={{ fontSize: "10px", color: "lightcoral" }}>{t('FomoGoldSilver.zoomHint')}</small></h3>
                        <div className="fomo-chart-type-dropdown">
                            <button className="chart-type-trigger" onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}>
                                <span className="chart-type-icon">{chartType === "line" ? "📈" : "📊"}</span>
                                <span className="chart-type-label">{chartType === "line" ? "Line Chart" : "Column"}</span>
                                <span className="dropdown-arrow">▼</span>
                            </button>
                            {showChartTypeDropdown && (
                                <div className="chart-type-menu">
                                    <div className={`chart-type-option ${chartType === "line" ? "active" : ""}`} onClick={() => { handleChartTypeChange("line"); setShowChartTypeDropdown(false); }}><span className="chart-type-icon">📈</span> Line Chart</div>
                                    <div className={`chart-type-option ${chartType === "bar" ? "active" : ""}`} onClick={() => { handleChartTypeChange("bar"); setShowChartTypeDropdown(false); }}><span className="chart-type-icon">📊</span> Column</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="fomo-chart-wrapper" style={{ minHeight: '450px' }}>
                        {loading ? <div>{t('FomoGoldSilver.loading')}</div> : chartData.datasets.length > 0 ? (
                            <Chart ref={fomoChartRef} type={chartType} data={chartData} options={commonChartOptionsFomo} />
                        ) : <div className="no-data">{t('FomoGoldSilver.noFomoData')}</div>}
                    </div>

                    <h3 style={{ color: '#e0e7ff', fontSize: '18px', marginBottom: '10px' }}>
                        {t('FomoGoldSilver.priceChart')} {activeTab === 'silver' ? t('FomoGoldSilver.silver') : t('FomoGoldSilver.gold')} ({t('FomoGoldSilver.usdPerOz')})
                    </h3>
                    <div className="price-chart-wrapper" style={{ minHeight: '450px' }}>
                        {loading ? <div>{t('FomoGoldSilver.loading')}</div> : priceChartData.datasets.length > 0 ? (
                            <Chart ref={priceChartRef} type="line" data={priceChartData} options={commonChartOptions} />
                        ) : <div className="no-data">{t('FomoGoldSilver.noPriceData')}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FomoGoldSilverChart;