import "./PredictionChart.css"
import React, { useEffect, useState, useRef } from 'react';
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
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Chart } from 'react-chartjs-2';
import axios from 'axios';
import { format } from 'date-fns';
import { Link, useNavigate } from "react-router-dom";
import { saveToNotificationHistory } from "../tradingview/logger";
import { useTranslation } from "react-i18next";
import useRealTimeData from "../../hooks/useRealTimeData";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin
);

const PredictionChart = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('silver');
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [stats, setStats] = useState({ high: 0, low: 0, current: 0, latestPredictionTime: null, latestTargetDate: null });
    const [predictionsList, setPredictionsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState({ gold: [], silver: [] });

    // --- Logic Lịch sử Dự đoán ---
    const [availableTimes, setAvailableTimes] = useState([]);
    const [selectedTime, setSelectedTime] = useState('');

    const chartRef = useRef(null);

    // --- Logic Socket & Noti ---
    const [realtimeSilverPrice, setRealtimeSilverPrice] = useState(null);
    const [showNoti, setShowNoti] = useState(false);
    const [isFading, setIsFading] = useState(false);
    const lastNotiTime = useRef(0);
    const audioRef = useRef(new Audio('/du_doan_gia_vang_bac_trong_30Ngay.wav'));


    // --- THÊM ĐOẠN LOGIC NÀY ĐỂ LƯU LỊCH SỬ ---
    useEffect(() => {
        if (showNoti && stats.current && realtimeSilverPrice) {
            const diffPercent = (((realtimeSilverPrice - stats.current) / stats.current) * 100).toFixed(1);
            const type = activeTab === 'gold' ? t('predictionGauge.gold') : t('predictionGauge.silver');
            const status = realtimeSilverPrice > stats.current ? t('common.increase') : t('common.decrease');

            const message = t("PredictionChart.predictionAlert", {
              type,
              status,
              diffPercent: Math.abs(diffPercent),
              predictedPrice: stats.current.toFixed(2)
            });

            // Lưu vào logger
            saveToNotificationHistory(message, "PREDICTION_ALERT");
        }
    }, [showNoti]); // Chạy mỗi khi showNoti chuyển từ false sang true
    // ------------------------------------------

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return format(date, 'dd/MM');
        } catch (e) { return dateStr; }
    };

    const formatPredictionTime = (timeStr) => {
        try {
            if (!timeStr) return 'N/A';
            const date = new Date(timeStr);
            return format(date, 'dd/MM/yyyy HH:mm:ss');
        } catch (e) { return timeStr || 'N/A'; }
    };

    const handleNotiClick = () => {
        setIsFading(true);
        setTimeout(() => {
            setShowNoti(false);
            navigate("/du-doan-30-ngay");
        }, 400);
    };

    const triggerNotification = () => {
        setIsFading(false);
        setShowNoti(true);
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio play blocked"));

        setTimeout(() => setIsFading(true), 6500);
        setTimeout(() => setShowNoti(false), 7000);
    };

    // Fetch dữ liệu ban đầu
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axios.get('https://api_gold.thinkdiff.us/get_all_predict_30day');
                const data = response.data;
                setRawData({
                    gold: data.list_data_pro_gold || [],
                    silver: data.list_data_pro_silver || []
                });
                setLoading(false);
            } catch (error) {
                console.error("Error fetching prediction data:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const { liveData } = useRealTimeData();

    useEffect(() => {
        if (liveData) {
            // Lấy giá bạc hoặc vàng theo USD từ API mới (vang_bac_noitieng)
            // Lưu ý: stats.current thường là giá USD (ô dự báo) nên ta lấy USD để so sánh
            const currentPrice = activeTab === 'gold' 
                ? liveData.vnGold?.usd 
                : liveData.vnSilver?.usd;
            
            if (currentPrice) {
                // Ta dùng chung biến realtimeSilverPrice cho cả 2 để không phải sửa quá nhiều logic hiển thị Noti bên dưới
                setRealtimeSilverPrice(currentPrice); 
            }
        }
    }, [liveData, activeTab]);



    // Logic thông báo chênh lệch giá
    useEffect(() => {
        const currentPrice = realtimeSilverPrice;
        if (activeTab === 'silver' && currentPrice && stats.current) {
            const diffPercent = ((currentPrice - stats.current) / stats.current) * 100;
            const now = Date.now();

            if (Math.abs(diffPercent) > 3 && (now - lastNotiTime.current > 120000)) {
                triggerNotification();
                lastNotiTime.current = now;
            }
        }
    }, [realtimeSilverPrice, stats.current, activeTab]);

    // Xử lý logic hiển thị dữ liệu (Filter theo Tab và Time)
    useEffect(() => {
        const currentList = activeTab === 'gold' ? rawData.gold : rawData.silver;
        if (!currentList || currentList.length === 0) {
            setChartData({ labels: [], datasets: [] });
            setAvailableTimes([]);
            return;
        }

        // 1. Lấy danh sách các đợt AI dự đoán - Sửa logic sort để mốc 05/03 lên đầu
        const times = [...new Set(currentList.map(item => item.time_make_ai_predict))]
            .sort((a, b) => new Date(b) - new Date(a));

        setAvailableTimes(times);

        // 2. Xác định mốc thời gian hiển thị (Ưu tiên đợt mới nhất vừa sort)
        const timeToFilter = (selectedTime && times.includes(selectedTime)) ? selectedTime : times[0];

        // 3. Lọc dữ liệu theo mốc thời gian đó
        const filteredData = currentList.filter(item => item.time_make_ai_predict === timeToFilter);
        const sortedData = [...filteredData].sort((a, b) => new Date(a.target_date) - new Date(b.target_date));

        if (sortedData.length === 0) return;

        const labels = sortedData.map(item => formatDate(item.target_date));
        const prices = sortedData.map(item => item.price);

        // 4. Cập nhật Stats & PredictionsList - Lọc lấy từ ngày hiện tại
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        // Lọc danh sách chỉ hiện từ hôm nay trở đi cho gọn UI
        const displayList = sortedData.filter(item => item.target_date >= todayStr);
        const todayEntry = displayList[0] || sortedData[0];

        setStats({
            high: Math.max(...prices),
            low: Math.min(...prices),
            current: todayEntry.price,
            latestPredictionTime: timeToFilter,
            latestTargetDate: todayEntry.target_date
        });

        // Đổ dữ liệu vào list bên trái
        const predictionListData = (displayList.length > 0 ? displayList : sortedData).map(item => ({
            date: item.target_date,
            price: item.price,
            time_make_ai_predict: item.time_make_ai_predict,
            displayDate: formatDate(item.target_date)
        }));

        setPredictionsList(predictionListData);

        // 5. Cấu hình biểu đồ
        const canvas = chartRef.current?.canvas;
        let gradientFill = null;
        const isGold = activeTab === 'gold';
        const lineColor = isGold ? '#FFD700' : '#C0C0C0';

        if (canvas) {
            const ctx = canvas.getContext('2d');
            gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
            gradientFill.addColorStop(0, isGold ? 'rgba(255, 215, 0, 0.3)' : 'rgba(192, 192, 192, 0.3)');
            gradientFill.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }

        setChartData({
            labels,
            datasets: [{
                type: 'line',
                label: `${t("PredictionChart.forecastLabel")} (${formatPredictionTime(timeToFilter)})`,
                data: prices,
                borderColor: lineColor,
                backgroundColor: gradientFill || (isGold ? 'rgba(255, 215, 0, 0.1)' : 'rgba(192, 192, 192, 0.1)'),
                borderWidth: 3,
                borderDash: [5, 5],
                pointRadius: 4,
                pointHoverRadius: 8,
                fill: true,
                tension: 0.4,
            }],
        });
    }, [activeTab, rawData, selectedTime]);

    useEffect(() => {
        const t = setTimeout(() => chartRef.current?.resetZoom(), 0);
        return () => clearTimeout(t);
    }, [chartData]);

    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, labels: { color: '#9ca3af', font: { size: 12 }, usePointStyle: true } },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} USD` }
            },
            zoom: {
                zoom: { wheel: { enabled: false }, pinch: { enabled: true }, mode: 'xy' },
                pan: { enabled: true, mode: 'xy' }
            }
        },
        scales: {
            x: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#9ca3af', maxTicksLimit: 10 } },
            y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#9ca3af' }, position: 'right', beginAtZero: false },
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
    };

    if (!rawData.gold.length && !rawData.silver.length) {
        return null;
    }

    return (
        <div className="prediction-container">
            {showNoti && (
                <div className={`mini-noti-v2 ${isFading ? 'hide' : ''} ${realtimeSilverPrice > stats.current ? 'up' : 'down'}`} onClick={handleNotiClick}>
                    <button onClick={(e) => { e.stopPropagation(); setShowNoti(false); }} className="close-noti">×</button>
                    <div className="noti-body">
                        <div className="noti-row-main">
                            <span className="noti-label">
                                {activeTab === 'gold'
                                    ? t("PredictionChart.gold")
                                    : t("PredictionChart.silver")
                                } {t("PredictionChart.diff")}:
                                <span className="price-status">
                                    {realtimeSilverPrice > stats.current ? ' +' : ' '}
                                    {(((realtimeSilverPrice - stats.current) / stats.current) * 100).toFixed(1)}%
                                </span>
                            </span>
                        </div>
                        <div className="noti-price-line">
                            {t("PredictionChart.forecast")}: {stats.current?.toFixed(2)}
                        </div>
                        <div className="noti-time">
                            {t("PredictionChart.atTime")}: {stats.latestPredictionTime ? format(new Date(stats.latestPredictionTime), 'HH:mm dd/MM') : 'N/A'}
                        </div>
                    </div>
                </div>
            )}

            <Link to="/du-doan-30-ngay">
                <div className="prediction-header">
                    <h2>{t("PredictionChart.title")}</h2>
                    <p className="subtitle">{t("PredictionChart.subtitle")}</p>
                </div>
            </Link>

            <div className="prediction-tab-navigation" style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                marginBottom: '35px'
            }}>
                <button
                    className={`tab-button ${activeTab === 'gold' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('gold'); setSelectedTime(''); }}
                >
                    <span className="tab-icon">🥇</span> {t("PredictionChart.gold")}
                </button>

                <button
                    className={`tab-button ${activeTab === 'silver' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('silver'); setSelectedTime(''); }}
                >
                    <span className="tab-icon">🥈</span> {t("PredictionChart.silver")}
                </button>

                {/* Dropdown sát cạnh nút Bạc */}
                <div className="history-selector-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <select
                        className="select-prediction-time"
                        value={selectedTime || (availableTimes[0] || '')}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        style={{
                            padding: '0 35px 0 12px',
                            height: '40px',
                            borderRadius: '8px',
                            background: '#1e293b',
                            color: '#e2e8f0',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            fontSize: '13px',
                            cursor: 'pointer',
                            outline: 'none',
                            minWidth: '220px',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            lineHeight: '40px',
                            display: 'block'
                        }}
                    >
                        {availableTimes.map((time, index) => (
                            <option key={time} value={time}>
                                {index === 0 ? `✨ ${t("PredictionChart.latestBatch")}` : `📅 ${t("PredictionChart.batch")}: ${formatPredictionTime(time)}`}
                            </option>
                        ))}
                    </select>
                    <div style={{
                        position: 'absolute',
                        right: '12px',
                        pointerEvents: 'none',
                        color: '#9ca3af',
                        fontSize: '10px'
                    }}>
                        ▼
                    </div>
                </div>
            </div>
            <div className="prediction-layout">
                <div className="prediction-left-column">
                    <div className="prediction-summary">
                        <h3 style={{ color: '#e0e7ff', fontSize: '16px', fontWeight: '600', marginBottom: '12px', marginTop: 0 }}>
                            📋 {t("PredictionChart.upcomingList")}
                        </h3>
                        <div className="prediction-list-scroll">
                            {predictionsList.length > 0 ? (
                                predictionsList.map((item, idx) => (
                                    <div key={idx} className="prediction-item" style={{
                                        padding: '12px',
                                        background: 'rgba(15, 23, 42, 0.4)',
                                        borderRadius: '8px',
                                        border: `1px solid ${activeTab === 'gold' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(192, 192, 192, 0.2)'}`,
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{ color: '#9ca3af', fontSize: '13px' }}>{item.displayDate}</div>
                                        <div style={{ color: activeTab === 'gold' ? '#FFD700' : '#C0C0C0', fontSize: '15px', fontWeight: '600' }}>
                                            {item.price.toFixed(2)} USD
                                        </div>
                                        <div style={{ color: '#ffd700', fontSize: '11px', marginTop: '4px' }}>
                                            {t("PredictionChart.predictedAt")}: {formatPredictionTime(item.time_make_ai_predict)}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', color: '#9ca3af' }}>{t("PredictionChart.noData")}</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="prediction-right-column">
                    <h3 style={{ color: '#e0e7ff', fontSize: '18px', marginBottom: '10px' }}>
                        {t("PredictionChart.chartTitle")} {activeTab === 'gold' ? t("PredictionChart.gold") : t("PredictionChart.silver")}
                    </h3>

                    <div className="prediction-chart-wrapper" style={{ minHeight: '500px' }}>
                        {loading ? (
                            <div className="loading-state">{t("PredictionChart.loading")}</div>
                        ) : chartData.datasets?.length > 0 ? (
                            <Chart ref={chartRef} type="line" data={chartData} options={commonChartOptions} />
                        ) : (
                            <div className="no-data">{t("PredictionChart.noChartData")}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PredictionChart;