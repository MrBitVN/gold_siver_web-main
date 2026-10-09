import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const MyRsiChart = () => {
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

  const formatFullDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    const t = dateTimeStr.split(' ');
    if (t.length < 2) return dateTimeStr;
    const dateParts = t[0].split('-');
    const timeParts = t[1].split(':');
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0].substring(2)} ${timeParts[0]}:${timeParts[1]}`;
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

    const ohlc = [], bbRange = [], rsiData = [], acc_dist = [], williamsRData = [], annotationsList = [];
    const ratio = (activeTab === 0 && !isMobile) ? 1 : (isMobile ? 10 : 1);


    displayList.forEach((item, index) => {
      ohlc.push({
        x: index,
        open: item.open_price / ratio, high: item.high_price / ratio,
        low: item.low_price / ratio, close: item.close_price / ratio,
        timestamp: item.timestamp,
        bb_u: item.bb_upper_trungbinh !== null ? item.bb_upper_trungbinh / ratio : null,
        bb_l: item.bb_lower_trungbinh !== null ? item.bb_lower_trungbinh / ratio : null,
        rsi_val: item.rsi_pro_trungbinh || 0
      });
      if (item.bb_upper_trungbinh !== null && item.bb_lower_trungbinh !== null) {
        bbRange.push([index, item.bb_lower_trungbinh / ratio, item.bb_upper_trungbinh / ratio]);
      }
      rsiData.push({ x: index, y: item.rsi_pro_trungbinh || 0, price: item.close_price, timestamp: item.timestamp });
      acc_dist.push({
        x: index,
        y: item.acc_dist != null ? Number(item.acc_dist) : null,
        timestamp: item.timestamp
      });
      williamsRData.push({
        x: index,
        y: item.williams_r != null ? item.williams_r : null,
        price: item.close_price,
        timestamp: item.timestamp
      });
    });

    const addZoneAnnotation = (startIdx, endIdx, type, yAxisIdx, targetData, color, isBuy) => {
      const segment = targetData.slice(startIdx, endIdx + 1);
      const currentRatio = (activeTab === 0 && !isMobile) ? 1 : (isMobile ? 10 : 1);

      const firstPoint = segment[0];
      const lastPoint = segment[segment.length - 1];

      const firstVal = (yAxisIdx === 0 ? firstPoint.close : firstPoint.y);
      const lastVal = (yAxisIdx === 0 ? lastPoint.close : lastPoint.y);

      const vals = segment.map(p => (yAxisIdx === 0 ? p.close : p.y));
      const baseVal = isBuy ? Math.min(...vals) : Math.max(...vals);

      let offset;
      if (yAxisIdx === 0) {
        offset = isMobile ? (isBuy ? -0.1 : 0.1) : (isBuy ? -0.8 : 0.8);
      } else {
        offset = isBuy ? -15 : 15;
      }

      const peakY = baseVal + offset;

      // CHỈNH SỬA LOGIC HIỂN THỊ TEXT TẠI ĐÂY
      let timeStr, priceStr;
      if (startIdx === endIdx) {
        // Nến đơn lẻ
        timeStr = formatFullDateTime(displayCategories[startIdx]);
        priceStr = yAxisIdx === 0
          ? (firstVal * currentRatio).toFixed(3)
          : firstVal.toFixed(2);
      } else {
        // Gom nhiều nến
        timeStr = `${formatFullDateTime(displayCategories[startIdx])} → ${formatFullDateTime(displayCategories[endIdx])}`;
        priceStr = yAxisIdx === 0
          ? `${(firstVal * currentRatio).toFixed(3)} → ${(lastVal * currentRatio).toFixed(3)}`
          : `${firstVal.toFixed(2)} → ${lastVal.toFixed(2)}`;
      }

      annotationsList.push({
        draggable: '',
        labelOptions: {
          allowOverlap: false,
          crop: true,
          overflow: 'justify',
          backgroundColor: 'rgba(0,0,0,0.85)',
          borderColor: color,
          borderRadius: 4,
          padding: isMobile ? 4 : 8,
          style: { pointerEvents: 'none', zIndex: 10 }
        },
        shapes: [{
          type: 'path',
          points: [
            { x: startIdx, xAxis: 0, y: (yAxisIdx === 0 ? firstPoint.close : firstPoint.y), yAxis: yAxisIdx },
            { x: startIdx, xAxis: 0, y: peakY, yAxis: yAxisIdx },
            { x: endIdx, xAxis: 0, y: peakY, yAxis: yAxisIdx },
            { x: endIdx, xAxis: 0, y: (yAxisIdx === 0 ? lastPoint.close : lastPoint.y), yAxis: yAxisIdx }
          ],
          fill: 'none', stroke: color, strokeWidth: isMobile ? 1 : 2, dashStyle: 'Solid'
        }],
        labels: [{
          point: { x: (startIdx + endIdx) / 2, xAxis: 0, y: peakY, yAxis: yAxisIdx },
          useHTML: true,
          text: `<div style="text-align: center; white-space: nowrap;">
                    <div style="color: ${color}; font-weight: 900; font-size: ${isMobile ? '10px' : '14px'}; margin-bottom: 2px;">
                      ${type}
                    </div>
                    <div style="color: #FFFFFF; font-weight: bold; font-size: ${isMobile ? '8px' : '11px'}; margin-bottom: 2px;">
                      ${timeStr}
                    </div>
                    <div style="color: #00FF80; font-weight: bold; font-size: ${isMobile ? '9px' : '12px'};">
                      ${priceStr}
                    </div>
                  </div>`,
          verticalAlign: isBuy ? 'bottom' : 'top'
        }]
      });
    };

    // Logic gom nến cho RSI (YAxis 1)
    let j = 0;
    while (j < rsiData.length) {
      let type = rsiData[j].y > 70 ? 'BÁN' : (rsiData[j].y < 30 ? 'MUA' : null);
      if (type) {
        let start = j, end = j;
        while (end + 1 < rsiData.length) {
          let nextVal = rsiData[end + 1].y;
          if ((type === 'BÁN' && nextVal >= 70) || (type === 'MUA' && nextVal <= 30)) end++; else break;
        }
        addZoneAnnotation(start, end, type, 1, rsiData, type === 'MUA' ? '#00FF80' : '#FF4B4B', type === 'MUA');
        j = end + 1;
      } else j++;
    }

    // 🔥 Logic annotation cho Williams %R (YAxis 1)
    // Không gom vùng – hiển thị theo từng điểm riêng lẻ

    williamsRData.forEach((point, index) => {
      if (point.y == null) return;

      let type = null;

      if (point.y >= -20) type = 'BÁN';
      if (point.y <= -80) type = 'MUA';

      if (!type) return;

      const isBuy = type === 'MUA';
      const color = isBuy ? '#00FF80' : '#FF4B4B';

      annotationsList.push({
        draggable: '',
        labelOptions: {
          backgroundColor: 'rgba(0,0,0,0.9)',
          borderColor: color,
          borderRadius: 4,
          borderWidth: 1,
          padding: isMobile ? 3 : 4,
          style: {
            color: '#fff',
            fontSize: isMobile ? '8px' : '10px',
            fontWeight: 'bold'
          }
        },
        labels: [{
          point: {
            x: index,
            xAxis: 0,
            y: point.y,
            yAxis: 1   // ⚠ Williams nằm ở yAxis 1
          },
          useHTML: true,
          verticalAlign: isBuy ? 'bottom' : 'top',
          y: isBuy ? -10 : 10,
          text: `
              <div style="text-align:center; white-space:nowrap;">
                <div style="color:${color}; font-weight:900; font-size: ${isMobile ? '10px' : '12px'};">
                  ${type}
                </div>

                <div style="font-size:${isMobile ? '7px' : '9px'}; color:#FFFFFF;">
                  ${formatFullDateTime(point.timestamp)}
                </div>

                <div style="color:#00FF80; font-weight:bold; font-size: ${isMobile ? '8px' : '10px'};">
                  Giá: ${point.price.toFixed(3)}
                </div>

                <div style="color:#FF6B35; font-weight:bold; font-size: ${isMobile ? '8px' : '10px'};">
                  W%R: ${point.y.toFixed(2)}
                </div>
              </div>
            `

        }]
      });

    });


    // Logic gom nến cho Bollinger Bands (YAxis 0)
    let k = 0;
    while (k < ohlc.length) {
      const p = ohlc[k];
      if (p.bb_u === null || p.bb_l === null) { k++; continue; }

      let type = p.close > p.bb_u ? 'BÁN' : (p.close < p.bb_l ? 'MUA' : null);
      if (type) {
        let start = k, end = k;
        while (end + 1 < ohlc.length) {
          let nextP = ohlc[end + 1];
          if (nextP.bb_u === null || nextP.bb_l === null) break;
          let nextType = nextP.close > nextP.bb_u ? 'BÁN' : (nextP.close < nextP.bb_l ? 'MUA' : null);
          if (nextType === type) end++; else break;
        }
        addZoneAnnotation(start, end, type, 0, ohlc, type === 'MUA' ? '#00FF80' : '#FF4B4B', type === 'MUA');
        k = end + 1;
      } else k++;
    }

   const options = {
      chart: { 
        height: isMobile ? 1200 : 1300, 
        backgroundColor: '#000', 
        animation: false, 
        zooming: { type: 'x', mouseWheel: { enabled: true } },
        marginLeft: isMobile ? 2 : undefined,
        marginRight: isMobile ? 2 : undefined,
        spacingLeft: isMobile ? 0 : 10,
        spacingRight: isMobile ? 0 : 10
      },
      title: { text: null },
      annotations: annotationsList,
      xAxis: { 
        categories: displayCategories, 
        crosshair: true, 
        lineColor: '#333', 
        labels: { 
          useHTML: true, 
          // FIX: Giảm size chữ và khoảng cách padding để không bị tràn trên mobile
          style: { 
            color: '#999', 
            fontSize: isMobile ? '8px' : '10px',
            whiteSpace: 'nowrap'
          }, 
          padding: isMobile ? 2 : 5,
          autoRotation: [-45],
          // Giảm số lượng nhãn hiển thị trên mobile để tránh chồng chéo/tràn
          tickPixelInterval: isMobile ? 100 : 72 
        } 
      },
      yAxis: isMobile
        ? [
          // 0 - Giá (Mobile)
          { 
            title: { text: null }, 
            height: '70%', 
            gridLineWidth: 0, 
            labels: { enabled: false }, 
            minPadding: 0, 
            maxPadding: 0 
          },
          // 1 - Williams %R (Mobile)
          {
            top: '75%',
            height: '7%',
            max: 0,
            min: -100,
            gridLineWidth: 0,
            labels: { enabled: false },
            plotLines: [
              { value: -20, color: '#FF4B4B', width: 1, dashStyle: 'Dash' },
              { value: -80, color: '#00FF80', width: 1, dashStyle: 'Dash' }
            ],
            plotBands: [
              { from: -20, to: 0, color: 'rgba(255,75,75,0.08)' },
              { from: -100, to: -80, color: 'rgba(0,255,128,0.08)' }
            ]
          },
          // 2 - RSI (Mobile)
          {
            top: '83%',
            height: '8%',
            max: 100,
            min: 0,
            gridLineWidth: 0,
            labels: { enabled: false },
            plotLines: [
              { value: 70, color: '#FF4B4B', width: 1, dashStyle: 'Dash' },
              { value: 30, color: '#00FF80', width: 1, dashStyle: 'Dash' }
            ]
          },
          // 3 - AccumDist (Mobile)
          {
            top: '91%',
            height: '9%',
            gridLineWidth: 0,
            labels: { enabled: false }
          }
        ]
        : [
          // 0 - Giá (Desktop)
          {
            title: { text: null },
            height: '55%',
            gridLineWidth: 1,
            gridLineColor: '#111',
            labels: { enabled: false },
            minPadding: 0.1,
            maxPadding: 0.1
          },
          // 1 - Williams %R (Desktop)
          {
            title: { text: null },
            top: '60%',
            height: '15%',
            offset: 0,
            gridLineWidth: 1,
            gridLineColor: '#111',
            labels: { enabled: false },
            max: 0,
            min: -100,
            plotLines: [
              { value: -20, color: '#FF4B4B', width: 1, dashStyle: 'Dash' },
              { value: -80, color: '#00FF80', width: 1, dashStyle: 'Dash' }
            ],
            plotBands: [
              { from: -20, to: 0, color: 'rgba(255,75,75,0.08)' },
              { from: -100, to: -80, color: 'rgba(0,255,128,0.08)' }
            ]
          },
          // 2 - RSI (Desktop)
          {
            title: { text: null },
            top: '76%',
            height: '15%',
            offset: 0,
            gridLineWidth: 1,
            gridLineColor: '#111',
            labels: { enabled: false },
            max: 100,
            min: 0,
            plotLines: [
              { value: 70, color: '#FF4B4B', width: 1, dashStyle: 'Dash' },
              { value: 30, color: '#00FF80', width: 1, dashStyle: 'Dash' }
            ]
          },
          // 3 - Accum/Dist (Desktop)
          {
            title: { text: null },
            top: '91%',
            height: '9%',
            offset: 0,
            gridLineWidth: 1,
            gridLineColor: '#111',
            labels: { enabled: false }
          }
        ],
      tooltip: { 
        shared: false, 
        useHTML: true, 
        backgroundColor: 'none', 
        borderWidth: 0, 
        shadow: false, 
        padding: 0 
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
        series: { 
          animation: false, 
          dataGrouping: { enabled: false }, 
          states: { inactive: { opacity: 1 } } 
        }
      },
      series: [
        {
          type: 'candlestick', 
          name: 'Giá', 
          data: ohlc, 
          yAxis: 0, 
          zIndex: 2,
          tooltip: {
            pointFormatter: function () {
              const currentRatio = (activeTab === 0 && !isMobile) ? 1 : (isMobile ? 10 : 1);
              return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;">
                          <b style="color:#ffd700; font-size:13px;">
                          <b style="color:#ffffff; font-size:14px;">${this.timestamp}</b><br/>
                            Open-price: ${(this.open * currentRatio).toFixed(3)}<br/>
                            High-price: ${(this.high * currentRatio).toFixed(3)}<br/>
                            Low-price: ${(this.low * currentRatio).toFixed(3)}<br/>
                            Close-price: ${(this.close * currentRatio).toFixed(3)}
                          </b>
                        </div>`;
            }
          }
        },
        { 
          type: 'areasplinerange', 
          name: 'BB', 
          data: bbRange, 
          yAxis: 0, 
          color: '#9b59b6', 
          fillColor: 'rgba(155, 89, 182, 0.2)', 
          lineWidth: isMobile ? 0.1 : 2, 
          zIndex: 0, 
          enableMouseTracking: false 
        },
        {
          type: 'spline', 
          name: 'RSI', 
          data: rsiData, 
          yAxis: 2, 
          color: themeColor, 
          lineWidth: isMobile ? 1 : 3,
          marker: { enabled: false },
          tooltip: {
            pointFormatter: function () {
              return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;">
                          <b style="color:#ffd700; font-size:11px;">${this.timestamp}</b><br/>
                          <b style="color:#00ff00; font-size:13px;">Giá: ${this.price.toFixed(3)}</b><br/>
                          <b style="color:${themeColor}; font-size:13px;">RSI: ${this.y.toFixed(2)}</b>
                        </div>`;
            }
          }
        },
        {
          type: 'spline', 
          name: 'Williams %R', 
          data: williamsRData, 
          yAxis: 1, 
          color: '#FF6B35', 
          lineWidth: isMobile ? 1 : 2,
          marker: { enabled: false },
          tooltip: {
            pointFormatter: function () {
              return `<div style="text-align:center; text-shadow: 1px 1px 3px #000;">
                          <b style="color:#ffd700; font-size:11px;">${this.timestamp}</b><br/>
                          <b style="color:#00ff00; font-size:13px;">Giá: ${this.price.toFixed(3)}</b><br/>
                          <b style="color:#FF6B35; font-size:13px;">Williams R: ${this.y.toFixed(2)}</b>
                        </div>`;
            }
          }
        },
        {
          type: 'spline',
          name: 'Accumulation–Distribution',
          data: acc_dist,
          yAxis: 3,
          color: '#00e5ff',
          lineWidth: isMobile ? 1 : 2,
          marker: { enabled: false },
          tooltip: {
            pointFormatter: function () {
              if (this.y === null) {
                return `
                    <div style="text-align:center; text-shadow: 1px 1px 3px #000;">
                      <b style="color:${themeColor}; font-size:13px;">Accum/Dist</b><br/>
                      <b style="color:#ff6464; font-size:12px;">Không có dữ liệu Accum/Dist</b>
                    </div>
                  `;
              }
              return `
                  <div style="text-align:center; text-shadow: 1px 1px 3px #000;">
                  <b style="color:#ffd700; font-size:11px;">${this.timestamp}</b><br/>
                    <b style="color:${themeColor}; font-size:13px;">Accum/Dist:</b><br/>
                    <b style="color:${themeColor}; font-size:13px;">
                      ${Math.round(this.y).toLocaleString()}
                    </b>
                  </div>
                `;
            }
          }
        }
      ],
      credits: { enabled: false }, 
      legend: { enabled: false }
    };
    window.Highcharts.chart(chartRef.current, options);
  }, [viewMode, rawData, currentPage, activeTab, isLoaded, isGold, themeColor, isMobile, numSegments]);

  return (
    <div style={{ backgroundColor: '#000', padding: '10px 5px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <span style={{ color: '#666', fontSize: '11px' }}>{t('charts.lastUpdate')}: </span>
        <a href="/#/rsi-chart" style={{ textDecoration: 'none' }}>
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

export default MyRsiChart;