import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
const SLVTradingChart = () => {
  const { t } = useTranslation();
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candleSeriesRef = useRef();
  const volumeSeriesRef = useRef();

  const [rawData, setRawData] = useState([]);
  const [activeTab, setActiveTab] = useState('market');
  // Mặc định hiển thị 1 tuần
  const [timeFilter, setTimeFilter] = useState('1M');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://api_gold.thinkdiff.us/SLV_von_vao');
        const market = response.data.slv_market_data_daily || [];
        const sortedMarket = market
          .filter(d => d.trade_date && d.close_price != null)
          .sort((a, b) => new Date(a.trade_date) - new Date(b.trade_date))
          .map(d => ({
            time: d.trade_date,
            open: Number(d.open_price),
            high: Number(d.high_price),
            low: Number(d.low_price),
            close: Number(d.close_price),
            volume: Number(d.volume),
            color: Number(d.close_price) >= Number(d.open_price) ? '#26a69a' : '#ef5350'
          }));
        setRawData(sortedMarket);
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!rawData.length) return [];
    if (timeFilter === 'ALL') return rawData;

    const lastDate = new Date(rawData[rawData.length - 1].time);
    let startDate = new Date(lastDate);

    if (timeFilter === '1W') startDate.setDate(lastDate.getDate() - 7);
    else if (timeFilter === '1M') startDate.setMonth(lastDate.getMonth() - 1);
    else if (timeFilter === '3M') startDate.setMonth(lastDate.getMonth() - 3);
    else if (timeFilter === '1Y') startDate.setFullYear(lastDate.getFullYear() - 1);

    return rawData.filter(d => new Date(d.time) >= startDate);
  }, [rawData, timeFilter]);

  useEffect(() => {
    if (!chartContainerRef.current || filteredData.length === 0 || activeTab !== 'market') return;

    const isMobile = window.innerWidth <= 768;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: { background: { color: '#131722' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: '#2a2e39' }, horzLines: { color: '#2a2e39' } },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        barSpacing: isMobile ? 8 : 12,
        minBarSpacing: 5,
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: isMobile ? 0.3 : 0.25
        }
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
      wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: {
        top: isMobile ? 0.94 : 0.9,
        bottom: 0
      },
    });

    candleSeries.setData(filteredData);
    volumeSeries.setData(filteredData.map(d => ({ time: d.time, value: d.volume, color: d.color })));

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const newIsMobile = window.innerWidth <= 768;
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
          rightPriceScale: {
            scaleMargins: { top: 0.1, bottom: newIsMobile ? 0.3 : 0.25 }
          }
        });
        volumeSeries.applyOptions({
          scaleMargins: { top: newIsMobile ? 0.94 : 0.9, bottom: 0 }
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [filteredData, activeTab]);

  if (loading) return <div style={{ height: '100vh', background: '#131722' }} />;

  if (!loading && (!rawData || rawData.length === 0)) return null;

  return (
    <div style={{ background: '#131722', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#d1d4dc' }}>
      <style>{`
        .slv-header { display: flex; justify-content: space-between; padding: 10px 15px; background: #1c202b; border-bottom: 1px solid #2a2e39; flex-shrink: 0; }
        .tab-item { color: #787b86; cursor: pointer; font-weight: bold; font-size: 13px; padding-bottom: 5px; border-bottom: 2px solid transparent; margin-right: 20px; }
        .tab-item.active { color: #fff; border-bottom: 2px solid #2962ff; }
        .slv-btns { display: flex; gap: 5px; flex-wrap: wrap; justify-content: flex-end; max-width: 70%; }
        .slv-btns button { background: #2a2e39; color: #b2b5be; border: none; padding: 5px 10px; cursor: pointer; font-weight: bold; font-size: 10px; border-radius: 2px; white-space: nowrap; }
        .slv-btns button.active { background: #2962ff; color: white; }
        .data-table-container { height: 100%; overflow-y: auto; background: #131722; padding: 0 10px; overflow-x: auto; }
        .slv-table { width: 100%; border-collapse: collapse; font-size: 13px; text-align: right; min-width: 600px; }
        .slv-table th { position: sticky; top: 0; background: #1c202b; color: #787b86; padding: 12px; font-weight: normal; border-bottom: 1px solid #2a2e39; z-index: 10; }
        .slv-table td { padding: 10px; border-bottom: 1px solid #1e222d; }
        .text-up { color: #26a69a; }
        .text-down { color: #ef5350; }

        @media (max-width: 768px) {
          .slv-table { font-size: 11px; min-width: 500px; }
          .slv-table td, .slv-table th { padding: 8px 5px; }
          .slv-header { flex-direction: column; gap: 8px; align-items: flex-start; padding: 8px 12px; }
          .slv-btns { max-width: 100%; justify-content: flex-start; }
          .tab-item { margin-right: 15px; font-size: 12px; }
        }
      `}</style>

      <div className="slv-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className={`tab-item ${activeTab === 'market' ? 'active' : ''}`} onClick={() => setActiveTab('market')}>MARKET CHART</div>
          <div className={`tab-item ${activeTab === 'darkpool' ? 'active' : ''}`} onClick={() => setActiveTab('darkpool')}>PRICE & VOLUME</div>
        </div>

        {activeTab === 'market' && (
          <div className="slv-btns">
            <button className={timeFilter === '1W' ? 'active' : ''} onClick={() => setTimeFilter('1W')}>{t('SLVTradingChart.week')}</button>
            <button className={timeFilter === '1M' ? 'active' : ''} onClick={() => setTimeFilter('1M')}>{t('SLVTradingChart.month')}</button>
            <button className={timeFilter === '3M' ? 'active' : ''} onClick={() => setTimeFilter('3M')}>{t('SLVTradingChart.month3')}</button>
            <button className={timeFilter === '1Y' ? 'active' : ''} onClick={() => setTimeFilter('1Y')}>{t('SLVTradingChart.year1')}</button>
            <button className={timeFilter === 'ALL' ? 'active' : ''} onClick={() => setTimeFilter('ALL')}>{t('SLVTradingChart.all')}</button>
          </div>
        )}
      </div>

      <div className="chart-box-container" style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        {activeTab === 'market' ? (
          <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
        ) : (
          <div className="data-table-container">
            <table className="slv-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Date (EST)</th>
                  <th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Change</th><th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {[...rawData].reverse().map((day, idx) => {
                  const isUp = day.close >= day.open;
                  const change = (day.close - day.open).toFixed(2);
                  return (
                    <tr key={idx}>
                      <td style={{ textAlign: 'left' }}>{day.time}</td>
                      <td>{day.open.toFixed(2)}</td>
                      <td>{day.high.toFixed(2)}</td>
                      <td>{day.low.toFixed(2)}</td>
                      <td className={isUp ? 'text-up' : 'text-down'}>{day.close.toFixed(2)}</td>
                      <td className={isUp ? 'text-up' : 'text-down'}>{isUp ? `+${change}` : change}</td>
                      <td>{day.volume.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SLVTradingChart;