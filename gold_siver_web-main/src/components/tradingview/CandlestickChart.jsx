import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const CandlestickChart = () => {
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
  const [latestPrice, setLatestPrice] = useState({ open: 0, high: 0, low: 0, close: 0 });
  const isGold = viewMode === 'XAU';
  const themeColor = isGold ? '#FFD700' : '#ffffff';
  const candleUpColor = '#00b060';
  const candleDownColor = '#ff4648';

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
            script.src = src;
            script.async = false;
            script.onload = resolve;
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
      } catch (e) {
        console.error(e);
      }
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

    const candleData = [], volumeData = [];

    displayList.forEach((item, index) => {
      // Candlestick data
      if (item.open_price !== null && item.high_price !== null && item.low_price !== null && item.close_price !== null) {
        candleData.push({
          x: index,
          open: item.open_price,
          high: item.high_price,
          low: item.low_price,
          close: item.close_price,
          timestamp: item.timestamp
        });
      }
    });

    // Update latest price from the last candle
    if (candleData.length > 0) {
      const lastCandle = candleData[candleData.length - 1];
      setLatestPrice({
        open: lastCandle.open,
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close
      });
    }

    const options = {
      chart: {
        height: isMobile ? 600 : 500,
        backgroundColor: '#000',
        animation: false,
        zooming: { type: 'x', mouseWheel: { enabled: true } }
      },
      title: { text: null },
      xAxis: {
        categories: displayCategories,
        crosshair: true,
        lineColor: '#333',
        labels: {
          useHTML: true,
          style: { color: '#999', fontSize: '10px' },
          autoRotation: [-45]
        }
      },
      yAxis: [
        {
          title: { text: 'Giá', style: { color: '#00FF80' } },
          height: '70%',
          gridLineWidth: 1,
          gridLineColor: '#111',
          labels: { style: { color: '#00FF80', fontSize: '10px' } }
        },
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
          color: '#ffd700',
          fontSize: '12px'
        }
      },
      plotOptions: {
        candlestick: {
          color: candleDownColor,
          upColor: candleUpColor,
          lineColor: candleDownColor,
          upLineColor: candleUpColor,
          wickColor: '#888',
          groupPadding: isMobile ? 0.05 : 0.02,
          pointPadding: isMobile ? 0.02 : 0.01,
          lineWidth: isMobile ? 1 : 2
        },
        series: { animation: false, dataGrouping: { enabled: false }, states: { inactive: { opacity: 1 } } }
      },
      series: [
        {
          type: 'candlestick',
          name: 'Giá (OHLC)',
          data: candleData,
          yAxis: 0,
          tooltip: {
            pointFormatter: function () {
              return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;">
                <b style="color:#FFD700; font-size:13px;">Giá:</b><br/>
                <b style="color:#00FF80; font-size:11px;">Open: ${this.open.toFixed(2)}</b><br/>
                <b style="color:#00E5FF; font-size:11px;">High: <b style="color:#fffff; font-size:11px;">${this.high.toFixed(2)}</b></b><br/>
                <b style="color:#FF69B4; font-size:11px;">Low: ${this.low.toFixed(2)}</b><br/>
                <b style="color:#FFD700; font-size:11px;">Close: ${this.close.toFixed(2)}</b>
              </div>`;
            }
          }
        },
      ],
      credits: { enabled: false },
      legend: { enabled: true, itemStyle: { color: '#999', fontSize: '12px' } }
    };

    window.Highcharts.chart(chartRef.current, options);
  }, [viewMode, rawData, currentPage, activeTab, isLoaded, isGold, isMobile, numSegments]);

  return (
    <div style={{ backgroundColor: '#000', padding: '10px 5px', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <span style={{ color: '#666', fontSize: '11px' }}>{t('charts.lastUpdate')}: </span>
        <span style={{ color: themeColor, fontSize: '11px', fontWeight: 'bold' }}>{lastUpdate || "..."}</span>
      </div>

      {/* Latest Price Display */}
      <div style={{
        backgroundColor: '#0a0a0a',
        border: '1px solid #FFD700',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '10px',
        textAlign: 'center'
      }}>
        <div style={{ color: '#FFD700', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
          {t('charts.latestPriceTitle')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: '#00FF80', fontSize: '12px' }}>{t('charts.open')}: </span>
            <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold' }}>{latestPrice.open.toFixed(2)}</span>
          </div>
          <div>
            <span style={{ color: '#00E5FF', fontSize: '12px' }}>{t('charts.high')}: </span>
            <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold' }}>{latestPrice.high.toFixed(2)}</span>
          </div>
          <div>
            <span style={{ color: '#FF69B4', fontSize: '12px' }}>{t('charts.low')}: </span>
            <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold' }}>{latestPrice.low.toFixed(2)}</span>
          </div>
          <div>
            <span style={{ color: '#FFD700', fontSize: '12px' }}>{t('charts.close')}: </span>
            <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold' }}>{latestPrice.close.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '10px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
        {['XAU', 'XAG'].map(mode => (
          <button key={mode} onClick={() => setViewMode(mode)} style={{
            padding: '6px 12px', borderRadius: '4px', border: '1px solid #333',
            backgroundColor: viewMode === mode ? (mode === 'XAU' ? '#FFD700' : '#ffffff') : '#111',
            color: viewMode === mode ? '#000' : '#FFF', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px'
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

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
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

export default CandlestickChart;
