import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
const MovingAveragesChart = () => {
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

    const closePriceData = [], sma20Data = [], ema20Data = [], dema20Data = [],
      tema20Data = [], wma20Data = [], sma50Data = [], ema50Data = [], vwapData = [],
      bbRangeData = [], rsiData = [], volumeData = [], pctReturnData = [];

    displayList.forEach((item, index) => {
      const price = item.close_price;

      // Close Price
      closePriceData.push({
        x: index,
        y: price,
        timestamp: item.timestamp
      });

      // SMA 20
      if (item.sma_20 !== null && item.sma_20 !== undefined) {
        sma20Data.push({ x: index, y: item.sma_20, timestamp: item.timestamp });
      }

      // SMA 50
      if (item.sma_50 !== null && item.sma_50 !== undefined) {
        sma50Data.push({ x: index, y: item.sma_50, timestamp: item.timestamp });
      }

      // EMA 20
      if (item.ema_20 !== null && item.ema_20 !== undefined) {
        ema20Data.push({ x: index, y: item.ema_20, timestamp: item.timestamp });
      }

      // DEMA 20
      if (item.dema_20 !== null && item.dema_20 !== undefined) {
        dema20Data.push({ x: index, y: item.dema_20, timestamp: item.timestamp });
      }

      // TEMA 20
      if (item.tema_20 !== null && item.tema_20 !== undefined) {
        tema20Data.push({ x: index, y: item.tema_20, timestamp: item.timestamp });
      }

      // WMA 20
      if (item.wma_20 !== null && item.wma_20 !== undefined) {
        wma20Data.push({ x: index, y: item.wma_20, timestamp: item.timestamp });
      }

      // EMA 50
      if (item.ema_50 !== null && item.ema_50 !== undefined) {
        ema50Data.push({ x: index, y: item.ema_50, timestamp: item.timestamp });
      }

      // Bollinger Bands Range
      if (item.bb_upper !== null && item.bb_lower !== null && item.bb_upper !== undefined && item.bb_lower !== undefined) {
        bbRangeData.push({ x: index, low: item.bb_lower, high: item.bb_upper, timestamp: item.timestamp });
      }

      // RSI (using rsi_14 or rsi_pro_trungbinh)
      const rsiValue = item.rsi_14 !== null && item.rsi_14 !== undefined ? item.rsi_14 : (item.rsi_pro_trungbinh || 0);
      rsiData.push({ x: index, y: rsiValue, timestamp: item.timestamp });


      // VWAP (Volume Weighted Average Price)
      if (item.vwap !== null && item.vwap !== undefined) {
        vwapData.push({ x: index, y: item.vwap, timestamp: item.timestamp });
      }

      // Percent Return (%)
      if (item.pct_return !== null && item.pct_return !== undefined) {
        pctReturnData.push({
          x: index,
          y: item.pct_return * 100,
          timestamp: item.timestamp
        });
      }
    });

    const options = {
      chart: { height: isMobile ? 1000 : 1200, backgroundColor: '#000', animation: false, zooming: { type: 'x', mouseWheel: { enabled: true } } },
      title: { text: null },
      xAxis: { categories: displayCategories, crosshair: true, lineColor: '#333', labels: { useHTML: true, style: { color: '#999', fontSize: '10px' }, autoRotation: [-45] } },
      yAxis: [
        { title: { text: 'Price & Moving Averages', style: { color: '#00FF80' } }, height: '60%', gridLineWidth: 1, gridLineColor: '#111', labels: { style: { color: '#00FF80', fontSize: '10px' } } },
        { title: { text: 'VWAP', style: { color: '#9B59B6' } }, top: '62%', height: '25%', gridLineWidth: 1, gridLineColor: '#111', labels: { style: { color: '#9B59B6', fontSize: '10px' } } },
      ],
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderWidth: 1,
        borderColor: '#333',
        shadow: false,
        padding: 8,
        headerFormat: '<div style="color: #FFD700; font-weight: bold; margin-bottom: 8px;">{point.key}</div>',
        pointFormat: '<div style="color: {series.color}; font-size: 12px;">{series.name}: <b>{point.y:.3f}</b></div>'
      },
      plotOptions: { series: { animation: false, dataGrouping: { enabled: false }, states: { inactive: { opacity: 1 } } } },
      series: [
        {
          name: 'Bollinger Bands',
          data: bbRangeData,
          yAxis: 0,
          type: 'arearange',
          color: 'rgba(0, 255, 128, 0.1)',
          fillColor: 'rgba(0, 255, 128, 0.1)',
          lineWidth: isMobile ? 0.5 : 1,
          lineColor: '#00FF80',
          zIndex: -1,
          enableMouseTracking: false,
          marker: { enabled: false },
          states: { hover: { enabled: false } }
        },
        {
          name: 'Close Price',
          data: closePriceData,
          yAxis: 0,
          type: 'line',
          color: '#FFD700',
          lineWidth: isMobile ? 2 : 3,
          zIndex: 5,
          marker: { enabled: false },
          tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#FFD700; font-size:13px;">Close Price:</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}</b></div>`; } }
        },
        {
          name: 'SMA (20)',
          data: sma20Data,
          yAxis: 0,
          type: 'line',
          color: '#00FF80',
          lineWidth: isMobile ? 1 : 2,
          marker: { enabled: false },
          tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#00FF80; font-size:13px;">SMA (20):</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}</b></div>`; } }
        },
        {
          name: 'SMA (50)',
          data: sma50Data,
          yAxis: 0,
          type: 'line',
          color: '#FF6B6B',
          lineWidth: isMobile ? 1 : 2,
          marker: { enabled: false },
          tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#FF6B6B; font-size:13px;">SMA (50):</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}</b></div>`; } }
        },
        {
          name: 'EMA (20)',
          data: ema20Data,
          yAxis: 0,
          type: 'line',
          color: '#00E5FF',
          lineWidth: isMobile ? 1 : 2,
          marker: { enabled: false },
          tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#00E5FF; font-size:13px;">EMA (20):</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}</b></div>`; } }
        },
        {
          name: 'DEMA (20)',
          data: dema20Data,
          yAxis: 0,
          type: 'line',
          color: '#FF69B4',
          lineWidth: isMobile ? 1 : 1,
          marker: { enabled: false },
          dashStyle: 'ShortDash',
          tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#FF69B4; font-size:13px;">DEMA (20):</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}</b></div>`; } }
        },
        {
          name: 'TEMA (20)',
          data: tema20Data,
          yAxis: 0,
          type: 'line',
          color: '#9B59B6',
          lineWidth: isMobile ? 1 : 1,
          marker: { enabled: false },
          dashStyle: 'ShortDash',
          tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#9B59B6; font-size:13px;">TEMA (20):</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}</b></div>`; } }
        },
        {
          name: 'WMA (20)',
          data: wma20Data,
          yAxis: 0,
          type: 'line',
          color: '#FFA500',
          lineWidth: isMobile ? 1 : 1,
          marker: { enabled: false },
          dashStyle: 'Dot',
          tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#FFA500; font-size:13px;">WMA (20):</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}</b></div>`; } }
        },
        {
          name: 'EMA (50)',
          data: ema50Data,
          yAxis: 0,
          type: 'line',
          color: '#4ECDC4',
          lineWidth: isMobile ? 1 : 2,
          marker: { enabled: false },
          tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#4ECDC4; font-size:13px;">EMA (50):</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}</b></div>`; } }
        },
        {
          name: 'VWAP',
          data: vwapData,
          yAxis: 1,
          type: 'line',
          color: '#9B59B6',
          lineWidth: isMobile ? 1 : 2,
          marker: { enabled: false },
          tooltip: {
            shared: false,
            pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#9B59B6; font-size:13px;">VWAP:</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}</b></div>`; }
          }
        },
        {
          name: 'Return %',
          data: pctReturnData,
          yAxis: 1,
          type: 'column',
          color: function () {
            const value = this.y;
            return value >= 0 ? '#00FF80' : '#FF4648';
          },
          borderWidth: 0,
          enableMouseTracking: false
        }
      ],
      credits: { enabled: false },
      legend: { enabled: true, itemStyle: { color: '#999', fontSize: '12px' } }
    };

    window.Highcharts.chart(chartRef.current, options);
  }, [viewMode, rawData, currentPage, activeTab, isLoaded, isGold, isMobile, numSegments]);

  return (
    <div style={{ backgroundColor: '#000', padding: '10px 5px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <span style={{ color: '#666', fontSize: '11px' }}>{t('charts.lastUpdate')}:</span>
        <a href="/#/moving-averages" style={{ textDecoration: 'none' }}>
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
        <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage >= totalPages} style={navBtnStyle(currentPage >= totalPages)}>{t('charts.previous')}</button>
        <span style={{ color: '#555', fontSize: '12px' }}>{t('charts.page')} {currentPage} / {totalPages}</span>
        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} style={navBtnStyle(currentPage === 1)}>{t('charts.next')}</button>
      </div>
    </div>
  );
};

const navBtnStyle = (disabled) => ({
  padding: '6px 20px', backgroundColor: '#111', color: disabled ? '#333' : '#999',
  border: '1px solid #222', borderRadius: '4px', fontSize: '12px', cursor: disabled ? 'default' : 'pointer'
});

export default MovingAveragesChart;
