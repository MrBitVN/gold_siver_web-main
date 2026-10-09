import React, { useEffect, useState, useRef } from 'react';

const MyRsiChart = () => {
  const chartRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState('XAU');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rawData, setRawData] = useState({ 
    gold_pro: [], 
    silver_pro: [], 
    gold_categories: [], 
    silver_categories: [] 
  });

  useEffect(() => {
    const loadScripts = async () => {
      const scripts = [
        'https://code.highcharts.com/highcharts.js',
        'https://code.highcharts.com/modules/annotations.js',
        'https://code.highcharts.com/modules/mouse-wheel-zoom.js'
      ];
      for (const src of scripts) {
        if (!document.querySelector(`script[src="${src}"]`)) {
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = src;
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
        const [resGold, resSilver] = await Promise.all([
          fetch(`https://api_gold.thinkdiff.us/volume_xau_usd?page=${currentPage}`).then(r => r.json()),
          fetch(`https://api_gold.thinkdiff.us/volume_xag_usd?page=${currentPage}`).then(r => r.json())
        ]);

        if (resGold.data.total_page) setTotalPages(resGold.data.total_page);

        
        const goldList = (resGold.data.list_volume || []).reverse();
        const silverList = (resSilver.data.list_volume || []).reverse();

        setRawData({
          gold_pro: goldList.map(item => item.rsi_pro_trungbinh || 0),
          silver_pro: silverList.map(item => item.rsi_pro_trungbinh || 0),
          gold_categories: goldList.map(item => item.timestamp),
          silver_categories: silverList.map(item => item.timestamp)
        });
      } catch (e) { console.error(e); }
    };
    if (isLoaded) fetchData();
  }, [isLoaded, currentPage]);

  useEffect(() => {
    const isGold = viewMode === 'XAU';
    const activeCategories = isGold ? rawData.gold_categories : rawData.silver_categories;
    const activeData = isGold ? rawData.gold_pro : rawData.silver_pro;

    if (!activeCategories.length) return;

    const activeColor = isGold ? '#FFD700' : '#C0C0C0'; 
    const annotationsList = [];
    const Y_OFFSET = 15; 
    let i = 0;

    while (i < activeData.length) {
      if (activeData[i] === null) { i++; continue; }
      let type = null;
      if (activeData[i] > 70) type = 'SELL';
      else if (activeData[i] < 30) type = 'BUY';

      if (type) {
        let startIdx = i, endIdx = i;
        while (endIdx + 1 < activeData.length) {
          let nextVal = activeData[endIdx + 1];
          if (nextVal === null) break;
          if (type === 'SELL' && nextVal >= 70) endIdx++;
          else if (type === 'BUY' && nextVal <= 30) endIdx++;
          else break;
        }

        if (endIdx - startIdx >= 1) {
          const color = type === 'BUY' ? '#00FF80' : '#FF4B4B';
          let direction = type === 'SELL' ? 1 : -1;
          const segment = activeData.slice(startIdx, endIdx + 1);
          const baseVal = type === 'SELL' ? Math.max(...segment) : Math.min(...segment);
          let peakY = baseVal + (direction * Y_OFFSET);
          let finalVerticalAlign = type === 'SELL' ? 'bottom' : 'top';
          
          if (type === 'SELL' && peakY > 92) {
             peakY = baseVal - Y_OFFSET;
             finalVerticalAlign = 'top'; 
          }
          if (type === 'BUY' && peakY < -5) {
             peakY = baseVal + Y_OFFSET;
             finalVerticalAlign = 'bottom';
          }

          annotationsList.push({
            draggable: '', 
            shapes: [{
              type: 'path',
              points: [
                { x: startIdx, xAxis: 0, y: activeData[startIdx], yAxis: 0 },
                { x: startIdx, xAxis: 0, y: peakY, yAxis: 0 },
                { x: endIdx, xAxis: 0, y: peakY, yAxis: 0 },
                { x: endIdx, xAxis: 0, y: activeData[endIdx], yAxis: 0 }
              ],
              fill: 'none', stroke: color, strokeWidth: 1.5
            }],
            labels: [{
              point: { x: (startIdx + endIdx) / 2, xAxis: 0, y: peakY, yAxis: 0 },
              text: `<b>${type}</b><br/>From: ${activeCategories[startIdx]}<br/>To: ${activeCategories[endIdx]}`,
              useHTML: true,
              verticalAlign: finalVerticalAlign,
              backgroundColor: 'rgba(0,0,0,0.85)',
              padding: 6, borderRadius: 3, borderColor: color,
              style: { color: color, fontWeight: 'normal', fontSize: '9px', textAlign: 'center' }
            }]
          });
        }
        i = endIdx + 1;
      } else { i++; }
    }

    const options = {
      chart: { 
        height: 450, 
        backgroundColor: '#000', 
        zooming: { type: 'x', mouseWheel: { enabled: true } }, 
        panning: { enabled: true, type: 'x' },
        marginTop: 50,    
        marginBottom: 100, 
        animation: false 
      },
      title: { text: `RSI XAU(Gold) và XAG(Silver)`, style: { color: '#FFF', fontSize: '14px' } },
      xAxis: { 
        categories: activeCategories, 
        tickInterval: 120, 
        labels: { 
          rotation: -45,
          style: { color: '#666', fontSize: '9px' }
        },
        crosshair: true
      },
      yAxis: {
        max: 140, min: -40, 
        tickPositions: [0, 30, 70, 100],
        gridLineColor: 'rgba(255, 255, 255, 0.05)',
        labels: { style: { color: '#555', fontSize: '9px' } },
        plotLines: [{ value: 70, color: '#FF4B4B', dashStyle: 'Dash' }, { value: 30, color: '#00FF80', dashStyle: 'Dash' }]
      },
      plotOptions: {
        series: { 
          animation: false,
          dataGrouping: { enabled: false }, 
          lineWidth: 1.5,
          marker: { enabled: false } 
        }
      },
      tooltip: { shared: true, backgroundColor: 'rgba(0, 0, 0, 0.9)', style: { color: '#FFF' } },
      annotations: annotationsList,
      series: [{ 
        name: `RSI ${viewMode}`, 
        data: activeData, 
        color: activeColor, 
        type: 'spline'
      }],
      credits: { enabled: false },
      legend: { enabled: false }
    };
    window.Highcharts.chart(chartRef.current, options);
  }, [viewMode, rawData, currentPage]);

  return (
    <div style={{ backgroundColor: '#000', padding: '10px 0px' }}>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
        {['XAU', 'XAG'].map(mode => (
          <button 
            key={mode} 
            onClick={() => setViewMode(mode)}
            style={{ 
              padding: '6px 16px', borderRadius: '4px', border: '1px solid #333', 
              backgroundColor: viewMode === mode ? (mode === 'XAU' ? '#FFD700' : '#C0C0C0') : '#111', 
              color: viewMode === mode ? '#000' : '#FFF', 
              cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'
            }}
          >
            {mode === 'XAU' ? 'Vàng (XAU)' : 'Bạc (XAG)'}
          </button>
        ))}
      </div>
      <div ref={chartRef} style={{ borderRadius: '4px', border: '1px solid #222' }}></div>
      
      
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '15px' }}>
        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} style={{ padding: '5px 15px', backgroundColor: '#222', color: currentPage >= totalPages ? '#555' : '#FFF', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}> Trước </button>
        <span style={{ color: '#888', fontSize: '12px' }}>Trang {currentPage} / {totalPages}</span>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={{ padding: '5px 15px', backgroundColor: '#222', color: currentPage === 1 ? '#555' : '#FFF', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}> Sau </button>
      </div>

      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px', 
        marginTop: '15px', 
        padding: '10px',
        borderTop: '1px solid #222',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '2px', backgroundColor: viewMode === 'XAU' ? '#FFD700' : '#C0C0C0' }}></div>
          <span style={{ color: '#DDD', fontSize: '11px' }}>RSI Average</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', border: '1px solid #FF4B4B', borderRadius: '2px' }}></div>
          <span style={{ color: '#DDD', fontSize: '11px' }}>Sell Zone</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', border: '1px solid #00FF80', borderRadius: '2px' }}></div>
          <span style={{ color: '#DDD', fontSize: '11px' }}>Buy Zone</span>
        </div>
      </div>
    </div>
  );
};

export default MyRsiChart;