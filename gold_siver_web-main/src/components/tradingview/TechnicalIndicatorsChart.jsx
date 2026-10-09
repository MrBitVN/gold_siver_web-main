import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
const TechnicalIndicatorsChart = () => {
    const { t } = useTranslation();
    const chartRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [viewMode, setViewMode] = useState('XAG');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [lastUpdate, setLastUpdate] = useState("");
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [rawData, setRawData] = useState({
        gold_full: [],
        silver_full: [],
        gold_categories: [],
        silver_categories: []
    });

    const numSegments = isMobile ? 15 : 10;
    const [activeTab, setActiveTab] = useState(numSegments);
    const isGold = viewMode === 'XAU';
    const themeColor = isGold ? '#FFD700' : '#ffffff';

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const formatOnlyTime = (dateTimeStr) => {
        if (!dateTimeStr) return "";
        const parts = dateTimeStr.split(' ');
        return parts.length > 1 ? parts[1].substring(0, 5) : dateTimeStr;
    };

    const getTabLabel = (index, categories) => {
        if (index === 0) return 'Tất cả';
        if (!categories || categories.length === 0) return `K${index}`;
        const segmentSize = Math.ceil(categories.length / numSegments);
        const startIdx = (index - 1) * segmentSize;
        let endIdx = startIdx + segmentSize - 1;
        if (endIdx >= categories.length) endIdx = categories.length - 1;
        if (startIdx >= categories.length) return "-";
        return `${formatOnlyTime(categories[startIdx])}-${formatOnlyTime(categories[endIdx])}`;
    };

    useEffect(() => {
        const loadScripts = async () => {
            const scripts = [
                'https://code.highcharts.com/stock/highstock.js',
                'https://code.highcharts.com/stock/highcharts-more.js',
                'https://code.highcharts.com/modules/annotations.js',
                'https://code.highcharts.com/modules/mouse-wheel-zoom.js'
            ];
            for (const src of scripts) {
                if (!document.querySelector(`script[src="${src}"]`)) {
                    await new Promise((resolve) => {
                        const script = document.createElement('script');
                        script.src = src; script.async = false; script.onload = resolve;
                        document.head.appendChild(script);
                    });
                }
            }
            setIsLoaded(true);
        };
        loadScripts();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const symbol = viewMode === 'XAU' ? 'xau_usd' : 'xag_usd';
                const res = await fetch(`https://api_gold.thinkdiff.us/volume_${symbol}?page=${currentPage}`).then(r => r.json());
                if (res.data && res.data.total_page) setTotalPages(res.data.total_page);
                const list = (res.data.list_volume || []).reverse();
                if (list.length > 0) setLastUpdate(list[list.length - 1].timestamp);

                setRawData(prev => ({
                    ...prev,
                    [isGold ? 'gold_full' : 'silver_full']: list,
                    [isGold ? 'gold_categories' : 'silver_categories']: list.map(item => item.timestamp)
                }));
                setActiveTab(numSegments);
            } catch (e) { console.error(e); }
        };
        if (isLoaded) fetchData();
    }, [isLoaded, currentPage, viewMode, isGold, numSegments]);

    useEffect(() => {
        if (!isLoaded || !window.Highcharts || !chartRef.current) return;

        const fullList = isGold ? rawData.gold_full : rawData.silver_full;
        const fullCategories = isGold ? rawData.gold_categories : rawData.silver_categories;
        if (!fullList.length) return;

        let displayList = [...fullList];
        let displayCategories = [...fullCategories];

        if (activeTab !== 0) {
            const segmentSize = Math.ceil(fullList.length / numSegments);
            const start = (activeTab - 1) * segmentSize;
            const end = start + segmentSize;
            displayList = fullList.slice(start, end);
            displayCategories = fullCategories.slice(start, end);
        }

        const atrData = [], rsiData = [];
        const momentumData = [], rocData = [];

        const cciData = [];
        const bbBandwidthData = [];
        const bbPercentBData = [];
        const logReturnData = [];


        displayList.forEach((item, index) => {
            // ATR (Average True Range) - nếu có dữ liệu atr_14
            if (item.atr_14 !== null && item.atr_14 !== undefined) {
                atrData.push({ x: index, y: item.atr_14, timestamp: item.timestamp });
            }

            // RSI (nếu có rsi_14 khác, lấy từ rsi nếu không có)
            const rsiValue = item.rsi_14 || item.rsi || 0;
            rsiData.push({ x: index, y: rsiValue, timestamp: item.timestamp });

            // Momentum (nếu có momentum_10)
            if (item.momentum_10 !== null && item.momentum_10 !== undefined) {
                momentumData.push({ x: index, y: item.momentum_10, timestamp: item.timestamp });
            }

            // ROC - Rate of Change (nếu có roc_10)
            if (item.roc_10 !== null && item.roc_10 !== undefined) {
                rocData.push({ x: index, y: item.roc_10, timestamp: item.timestamp });
            }
            if (item.cci_20 !== null && item.cci_20 !== undefined) {
                cciData.push({
                    x: index,
                    y: item.cci_20,
                    timestamp: item.timestamp
                });
            }
            if (item.bb_bandwidth !== null && item.bb_bandwidth !== undefined) {
                bbBandwidthData.push({
                    x: index,
                    y: item.bb_bandwidth,
                    timestamp: item.timestamp
                });
            }
            if (item.bb_percent_b !== null && item.bb_percent_b !== undefined) {
                bbPercentBData.push({
                    x: index,
                    y: item.bb_percent_b,
                    timestamp: item.timestamp
                });
            }
            if (item.log_return !== null && item.log_return !== undefined) {
                logReturnData.push({
                    x: index,
                    y: item.log_return * 100, // scale cho dễ nhìn
                    timestamp: item.timestamp
                });
            }

        });

        const options = {
            chart: { height: isMobile ? 1000 : 1200, backgroundColor: '#000', animation: false, zooming: { type: 'x', mouseWheel: { enabled: true } } },
            title: { text: null },
            xAxis: { categories: displayCategories, crosshair: true, lineColor: '#333', labels: { useHTML: true, style: { color: '#999', fontSize: '10px' }, autoRotation: [-45] } },
            yAxis: [
                {
                    title: { text: 'ATR 14', style: { color: '#00FF80' } },
                    top: '0%',
                    height: '15%',
                    gridLineWidth: 1,
                    gridLineColor: '#111',
                    labels: { style: { color: '#00FF80', fontSize: '10px' } }
                },
                {
                    title: { text: 'RSI 14', style: { color: '#FFD700' } },
                    top: '16%',
                    height: '15%',
                    gridLineWidth: 1,
                    gridLineColor: '#111',
                    labels: { style: { color: '#FFD700', fontSize: '10px' } },
                    min: 0,
                    max: 100,
                    plotLines: [
                        { value: 70, color: '#FF4B4B', width: 1, dashStyle: 'Dash' },
                        { value: 30, color: '#00FF80', width: 1, dashStyle: 'Dash' }
                    ]
                },
                {
                    title: { text: 'Momentum and CCI', style: { color: '#FF69B4' } },
                    top: '32%',
                    height: '15%',
                    gridLineWidth: 1,
                    gridLineColor: '#111',
                    labels: { style: { color: '#FF69B4', fontSize: '10px' } }
                },
                {
                    title: { text: 'ROC (10) and Log Return (%)', style: { color: '#9B59B6' } },
                    top: '48%',
                    height: '15%',
                    gridLineWidth: 1,
                    gridLineColor: '#111',
                    labels: { style: { color: '#9B59B6', fontSize: '10px' } },
                    plotLines: [{
                        value: 0,
                        color: '#666',
                        width: 1,
                        dashStyle: 'Dash'
                    }]
                },
                {
                    title: { text: 'Volatility (BB)', style: { color: '#03A9F4' } },
                    top: '64%',          // ✅ ĐÂY LÀ CHỖ QUAN TRỌNG
                    height: '15%',
                    gridLineWidth: 1,
                    gridLineColor: '#111',
                    labels: { style: { color: '#03A9F4', fontSize: '10px' } },
                    min: 0
                }
            ],

            tooltip: {
                shared: false,
                useHTML: true,
                backgroundColor: 'rgba(0,0,0,0.85)',
                borderWidth: 1,
                borderColor: '#333',
                shadow: false,
                padding: 8,
                style: {
                    color: '#ffd700',      // ✅ ÉP TRẮNG TOÀN BỘ
                    fontSize: '12px'
                }
            },

            plotOptions: { series: { animation: false, dataGrouping: { enabled: false }, states: { inactive: { opacity: 1 } } } },
            series: [
                {
                    name: 'ATR (14)',
                    data: atrData,
                    yAxis: 0,
                    type: 'line',
                    color: '#00FF80',
                    lineWidth: isMobile ? 1 : 2,
                    marker: { enabled: false },
                    tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#00FF80; font-size:13px;">ATR 14:</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}</b></div>`; } }
                },
                {
                    name: 'RSI (14)',
                    data: rsiData,
                    yAxis: 1,
                    type: 'line',
                    color: '#FFD700',
                    lineWidth: isMobile ? 1 : 2,
                    marker: { enabled: false },
                    tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#FFD700; font-size:13px;">RSI 14:</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(2)}</b></div>`; } }
                },
                {
                    name: 'Momentum (10)',
                    data: momentumData,
                    yAxis: 3,
                    type: 'line',
                    color: '#FF69B4',
                    lineWidth: isMobile ? 1 : 2,
                    marker: { enabled: false },
                    tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#FF69B4; font-size:13px;">Momentum</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}</b></div>`; } }
                },
                {
                    name: 'ROC (10) %',
                    data: rocData,
                    yAxis: 4,
                    type: 'line',
                    color: '#9B59B6',
                    lineWidth: isMobile ? 1 : 2,
                    marker: { enabled: false },
                    tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#9B59B6; font-size:13px;">ROC:</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}%</b></div>`; } }
                },
                // === CCI (20) – dùng chung Momentum panel ===
                {
                    name: 'CCI (20)',
                    data: cciData,
                    yAxis: 3,
                    type: 'line',
                    color: '#FFA500',
                    lineWidth: 1,
                    marker: { enabled: false },
                    tooltip: {
                        pointFormatter: function () {
                            return `<div style="text-align:center">
        <b style="color:#FFA500">CCI</b><br/>
        <b>${this.y.toFixed(2)}</b>
      </div>`;
                        }
                    }
                },

                // === Bollinger Band Width – Volatility panel ===
                {
                    name: 'BB Bandwidth',
                    data: bbBandwidthData,
                    yAxis: 5,
                    type: 'line',
                    color: '#FF9800',
                    dashStyle: 'ShortDot',
                    lineWidth: 1,
                    marker: { enabled: false }
                },

                // === Bollinger %B – Volatility panel ===
                {
                    name: 'BB %B',
                    data: bbPercentBData,
                    yAxis: 5,
                    type: 'line',
                    color: '#03A9F4',
                    dashStyle: 'Dot',
                    lineWidth: 1,
                    marker: { enabled: false }
                },

                // === Log Return – ROC panel ===
                {
                    name: 'Log Return (%)',
                    data: logReturnData,
                    yAxis: 4,
                    type: 'line',
                    color: '#E91E63',
                    lineWidth: 1,
                    marker: { enabled: false }
                },

            ],
            credits: { enabled: false },
            legend: { enabled: true, itemStyle: { color: '#999', fontSize: '12px' } }
        };

        window.Highcharts.chart(chartRef.current, options);
    }, [viewMode, rawData, currentPage, activeTab, isLoaded, isGold, isMobile, numSegments]);

    return (
        <div style={{ backgroundColor: '#000', padding: '10px 5px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#666', fontSize: '11px' }}>{t('charts.lastUpdate')}:  </span>
                <a href="/#/technical-indicators" style={{ textDecoration: 'none' }}>
                    <span style={{ color: themeColor, fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>{lastUpdate || "..."}</span>
                </a>
            </div>

            <div style={{ marginBottom: '15px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {['XAU', 'XAG'].map(mode => (
                    <button key={mode} onClick={() => setViewMode(mode)} style={{
                        padding: '8px 16px', borderRadius: '4px', border: '1px solid #333',
                        backgroundColor: viewMode === mode ? (mode === 'XAU' ? '#FFD700' : '#ffffff') : '#111',
                        color: viewMode === mode ? '#000' : '#FFF', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px'
                    }}>
                        {mode === 'XAU' ? t('charts.goldMode') : t('charts.silverMode')}
                    </button>
                ))}
            </div>

            <div style={{ marginBottom: '10px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px', maxWidth: '100%' }}>
                {[...Array(numSegments + 1).keys()].map((index) => (
                    <button key={index} onClick={() => setActiveTab(index)} style={{
                        padding: isMobile ? '4px 2px' : '5px 8px', borderRadius: '3px', border: '1px solid #222',
                        backgroundColor: activeTab === index ? '#333' : '#111', color: activeTab === index ? '#FFF' : '#777',
                        fontSize: isMobile ? '8px' : '10px', cursor: 'pointer', flex: isMobile ? '1 1 5.5%' : 'none', textAlign: 'center'
                    }}>
                        {getTabLabel(index, isGold ? rawData.gold_categories : rawData.silver_categories)}
                    </button>
                ))}
            </div>

            <div ref={chartRef} style={{ width: '100%', borderRadius: '8px', overflow: 'hidden' }}></div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '15px' }}>
                <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage >= totalPages} style={navBtnStyle(currentPage >= totalPages)}> {t('charts.previous')} </button>
                <span style={{ color: '#555', fontSize: '12px' }}>{t('charts.page')} {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} style={navBtnStyle(currentPage === 1)}> {t('charts.next')} </button>
            </div>
        </div>
    );
};

const navBtnStyle = (disabled) => ({
    padding: '6px 20px', backgroundColor: '#111', color: disabled ? '#333' : '#999',
    border: '1px solid #222', borderRadius: '4px', fontSize: '12px', cursor: disabled ? 'default' : 'pointer'
});

export default TechnicalIndicatorsChart;
