import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
const VolumeMomentumChart = () => {
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

    const volumeData = [], obvData = [], mfiData = [], elderForceData = [], volumeChangeData = [];

    displayList.forEach((item, index) => {
      // Volume
      if (item.volume !== null && item.volume !== undefined) {
        const volumeColor = item.close_price > item.open_price ? '#00b060' : '#ff4648';
        volumeData.push({
          x: index,
          y: item.volume,
          timestamp: item.timestamp,
          color: volumeColor
        });
      }

      // OBV (On-Balance Volume)
      if (item.obv !== null && item.obv !== undefined) {
        obvData.push({
          x: index,
          y: item.obv,
          timestamp: item.timestamp
        });
      }

      // MFI (Money Flow Index)
      if (item.mfi_14 !== null && item.mfi_14 !== undefined) {
        mfiData.push({
          x: index,
          y: item.mfi_14,
          timestamp: item.timestamp
        });
      }

      // Elder Force
      if (item.elder_force !== null && item.elder_force !== undefined) {
        elderForceData.push({
          x: index,
          y: item.elder_force,
          timestamp: item.timestamp
        });
      }

      // Volume Change (%)
      if (item.volume_change !== null && item.volume_change !== undefined) {
        volumeChangeData.push({
          x: index,
          y: item.volume_change,
          timestamp: item.timestamp
        });
      }
    });

    const options = {
      chart: { height: isMobile ? 1000 : 1200, backgroundColor: '#000', animation: false, zooming: { type: 'x', mouseWheel: { enabled: true } } },
      title: { text: null },
      xAxis: { categories: displayCategories, crosshair: true, lineColor: '#333', labels: { useHTML: true, style: { color: '#999', fontSize: '10px' }, autoRotation: [-45] } },
      yAxis: [
        { title: { text: 'Volume', style: { color: '#00FF80' } }, height: '18%', gridLineWidth: 1, gridLineColor: '#111', labels: { style: { color: '#00FF80', fontSize: '10px' } } },
        { title: { text: 'OBV', style: { color: '#FF69B4' } }, top: '20%', height: '18%', gridLineWidth: 1, gridLineColor: '#111', labels: { style: { color: '#FF69B4', fontSize: '10px' } } },
        { title: { text: 'MFI (0-100)', style: { color: '#00E5FF' } }, top: '40%', height: '18%', gridLineWidth: 1, gridLineColor: '#111', labels: { style: { color: '#00E5FF', fontSize: '10px' } }, min: 0, max: 100, plotLines: [{ value: 80, color: '#FF4B4B', width: 1, dashStyle: 'Dash' }, { value: 20, color: '#00FF80', width: 1, dashStyle: 'Dash' }] },
        { title: { text: 'Elder Force', style: { color: '#FFD700' } }, top: '60%', height: '18%', gridLineWidth: 1, gridLineColor: '#111', labels: { style: { color: '#FFD700', fontSize: '10px' } } },
        { title: { text: 'Volume Change (%)', style: { color: '#9B59B6' } }, top: '80%', height: '18%', gridLineWidth: 1, gridLineColor: '#111', labels: { style: { color: '#9B59B6', fontSize: '10px' } } }
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
      plotOptions: { series: { animation: false, dataGrouping: { enabled: false }, states: { inactive: { opacity: 1 } } } },
      series: [
        {
          name: 'Volume',
          data: volumeData,
          yAxis: 0,
          type: 'column',
          borderWidth: 0,
          tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:${this.color}; font-size:13px;">Volume:</b><br/><b style="color:${this.color}; font-size:12px;">${this.y.toLocaleString()}</b></div>`; } }
        },
        {
          name: 'OBV',
          data: obvData,
          yAxis: 1,
          type: 'line',
          color: '#FF69B4',
          lineWidth: isMobile ? 1 : 2,
          marker: { enabled: false },
          tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#FF69B4; font-size:13px;">OBV:</b><br/><b style="color:#ffffff; font-size:12px;">${Math.round(this.y).toLocaleString()}</b></div>`; } }
        },
        {
          name: 'MFI (14)',
          data: mfiData,
          yAxis: 2,
          type: 'line',
          color: '#00E5FF',
          lineWidth: isMobile ? 1 : 2,
          marker: { enabled: false },
          tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#00E5FF; font-size:13px;">MFI:</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(2)}</b></div>`; } }
        },
        {
          name: 'Elder Force',
          data: elderForceData,
          yAxis: 3,
          type: 'line',
          color: '#FFD700',
          lineWidth: isMobile ? 1 : 2,
          marker: { enabled: false },
          tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#FFD700; font-size:13px;">Elder Force:</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}</b></div>`; } }
        },
        {
          name: 'Volume Change %',
          data: volumeChangeData,
          yAxis: 4,
          type: 'line',
          color: '#9B59B6',
          lineWidth: isMobile ? 1 : 2,
          marker: { enabled: false },
          tooltip: { pointFormatter: function () { return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;"><b style="color:#9B59B6; font-size:13px;">Vol Change:</b><br/><b style="color:#ffffff; font-size:12px;">${this.y.toFixed(3)}%</b></div>`; } }
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
        <span style={{ color: '#666', fontSize: '11px' }}>{t('charts.lastUpdate')}:  </span>
        <a href="/#/volume-momentum" style={{ textDecoration: 'none' }}>
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
        <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage >= totalPages} style={navBtnStyle(currentPage >= totalPages)}>{t('charts.previous')} </button>
        <span style={{ color: '#555', fontSize: '12px' }}>{t('charts.page')} {currentPage} / {totalPages}</span>
        <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} style={navBtnStyle(currentPage === 1)}>{t('charts.next')} </button>
      </div>
    </div>
  );
};

const navBtnStyle = (disabled) => ({
  padding: '6px 20px', backgroundColor: '#111', color: disabled ? '#333' : '#999',
  border: '1px solid #222', borderRadius: '4px', fontSize: '12px', cursor: disabled ? 'default' : 'pointer'
});

export default VolumeMomentumChart;
