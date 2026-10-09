import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MyRsiChart from './RsiChartXauAndXAG';
import TechnicalIndicatorsChart from './TechnicalIndicatorsChart';
import VolumeMomentumChart from './VolumeMomentumChart';
import MovingAveragesChart from './MovingAveragesChart';
import CandlestickChart from './CandlestickChart';
import { logUserInfo } from '../../utils/logUserInfo';
import { useTranslation } from 'react-i18next';
const AllChartsPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const chartParam = searchParams.get('charts') || 'rsi';
  const [activeChart, setActiveChart] = useState(chartParam);

  useEffect(() => {
    logUserInfo("Trang All Charts");
  }, []);

  useEffect(() => {
    setActiveChart(chartParam);
  }, [chartParam]);

  const chartTabs = [
    { id: 'rsi', label: 'RSI & Bollinger', icon: '📊', route: '/volumexagxau?charts=rsi' },
    { id: 'technical', label: 'Technical Indicators', icon: '📈', route: '/volumexagxau?charts=technical' },
    { id: 'volume', label: 'Volume & Momentum', icon: '📉', route: '/volumexagxau?charts=volume' },
    { id: 'moving', label: 'Moving Averages', icon: '📋', route: '/volumexagxau?charts=moving' }
  ];

  const handleChartChange = (chartId) => {
    setActiveChart(chartId);
    setSearchParams({ charts: chartId });
  };

  const renderChart = () => {
    switch (activeChart) {
      case 'rsi':
        return <MyRsiChart />;
      case 'technical':
        return <TechnicalIndicatorsChart />;
      case 'volume':
        return <VolumeMomentumChart />;
      case 'moving':
        return <MovingAveragesChart />;
      default:
        return <MyRsiChart />;
    }
  };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Candlestick Chart - Always Visible at Top */}
      <div style={{ borderBottom: '3px solid #FFD700', paddingBottom: '10px' }}>
        <h3 style={{ textAlign: 'center', color: '#FFD700', margin: '10px 0', fontSize: '16px' }}>{t('charts.title')}</h3>
        <CandlestickChart />
      </div>

      {/* Chart Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        padding: '15px',
        backgroundColor: '#0a0a0a',
        borderBottom: '2px solid #222',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {chartTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleChartChange(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: activeChart === tab.id ? '2px solid #FFD700' : '2px solid #333',
              backgroundColor: activeChart === tab.id ? 'rgba(255, 215, 0, 0.1)' : '#111',
              color: activeChart === tab.id ? '#FFD700' : '#999',
              fontWeight: activeChart === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (activeChart !== tab.id) {
                e.target.style.borderColor = '#FFD700';
                e.target.style.color = '#FFD700';
              }
            }}
            onMouseLeave={(e) => {
              if (activeChart !== tab.id) {
                e.target.style.borderColor = '#333';
                e.target.style.color = '#999';
              }
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Chart */}
      <div style={{ padding: '0' }}>
        {renderChart()}
      </div>
    </div>
  );
};

export default AllChartsPage;
