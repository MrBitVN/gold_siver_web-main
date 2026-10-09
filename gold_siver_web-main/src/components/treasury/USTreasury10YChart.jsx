// USTreasury10YChart.jsx
import React, { useState, useMemo, useEffect } from 'react';
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
import { Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import treasuryData from '../../data/treasury10yData.json';
import { fetchLiveTreasuryRates, TV_TREASURY_SYMBOLS, TV_TREASURY_LINKS } from '../../services/treasuryService';
import './USTreasury10YChart.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const TV_SYMBOLS = TV_TREASURY_SYMBOLS;
const TV_LINKS = TV_TREASURY_LINKS;

const TERMS_LIST = [
  { key: 'US1Y', label: 'US 1Y (1 Năm)', tvSymbol: 'US01Y', tvc: 'TVC:US01Y', color: '#38bdf8' },
  { key: 'US2Y', label: 'US 2Y (2 Năm)', tvSymbol: 'US02Y', tvc: 'TVC:US02Y', color: '#a855f7' },
  { key: 'US5Y', label: 'US 5Y (5 Năm)', tvSymbol: 'US05Y', tvc: 'TVC:US05Y', color: '#10b981' },
  { key: 'US10Y', label: '⭐ US 10Y (10 Năm)', tvSymbol: 'US10Y', tvc: 'TVC:US10Y', color: '#ffd700', isStar: true },
  { key: 'US30Y', label: 'US 30Y (30 Năm)', tvSymbol: 'US30Y', tvc: 'TVC:US30Y', color: '#ef4444' },
];

const RANGES = [
  { key: '1D', label: '1D', days: 1 },
  { key: '1W', label: '1W', days: 7 },
  { key: '1M', label: '1M', days: 30 },
  { key: '1Y', label: '1Y', days: 365 },
  { key: '5Y', label: '5Y', days: 365 * 5 },
  { key: '10Y', label: '10Y', days: 365 * 10 },
  { key: 'ALL', label: 'ALL', days: 99999 },
];

const buildMiniEmbedUrl = (symbol, locale = 'vi_VN') => {
  const baseUrl = 'https://www.tradingview-widget.com/embed-widget/advanced-chart/';
  const config = {
    width: '100%',
    height: '100%',
    symbol: symbol,
    interval: '5',
    timezone: 'Asia/Ho_Chi_Minh',
    theme: 'dark',
    style: '1',
    backgroundColor: 'rgba(15, 23, 42, 1)',
    withdateranges: true,
    hide_side_toolbar: true,
    hide_top_toolbar: false,
    allow_symbol_change: true,
    details: false,
    hotlist: false,
    calendar: false,
    support_host: 'https://www.tradingview.com',
    locale: locale,
  };
  return `${baseUrl}?locale=${locale}#${encodeURIComponent(JSON.stringify(config))}`;
};

const TreasuryMiniCard = ({ item, liveVal, isSelected, onClick, localeStr }) => {
  const [isInView, setIsInView] = useState(false);
  const cardRef = React.useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else if (window.innerWidth < 768) {
          setIsInView(false);
        }
      },
      { rootMargin: "250px 0px 250px 0px", threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`treasury-mini-card ${isSelected ? 'active-term' : ''} ${item.isStar ? 'star-term' : ''}`}
      onClick={onClick}
    >
      <div className="mini-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span className="mini-card-title" style={{ color: item.color }}>
            {item.label}
          </span>
          {liveVal && (
            <span className={`mini-card-live-chip ${liveVal.change >= 0 ? 'pos' : 'neg'}`}>
              {liveVal.cur.toFixed(3)}% ({liveVal.change >= 0 ? '+' : ''}{liveVal.changePct.toFixed(2)}%)
            </span>
          )}
        </div>
        <a
          href={TV_LINKS[item.key]}
          target="_blank"
          rel="noopener noreferrer"
          className="mini-card-link"
          onClick={(e) => e.stopPropagation()}
        >
          {item.tvc} ↗
        </a>
      </div>
      <div className="mini-card-iframe-wrapper">
        {isInView ? (
          <iframe
            key={item.key}
            src={buildMiniEmbedUrl(item.tvSymbol, localeStr)}
            loading="lazy"
            frameBorder="0"
            allowFullScreen
            className="treasury-mini-iframe"
            title={`TradingView Live ${item.label}`}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.6)',
            color: '#64748b',
            fontSize: '11px'
          }}>
            <span>Đang tải biểu đồ {item.label}...</span>
          </div>
        )}
      </div>
    </div>
  );
};

const USTreasury10YChart = () => {
  const { t, i18n } = useTranslation();
  const [activeMode, setActiveMode] = useState('none'); // 'none' | 'single' | 'comparison'
  const [selectedRange, setSelectedRange] = useState('1W');
  const [selectedTerm, setSelectedTerm] = useState('US10Y');
  const [liveRates, setLiveRates] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  
  // Series visibility toggle states for comparison mode
  const [visibleSeries, setVisibleSeries] = useState({
    US1Y: true,
    US2Y: true,
    US5Y: true,
    US10Y: true,
    US30Y: true,
  });

  // Fetch live Treasury rates continuously
  useEffect(() => {
    let isMounted = true;
    const loadLive = async () => {
      const data = await fetchLiveTreasuryRates();
      if (isMounted && data) {
        setLiveRates(data);
        setLastFetchTime(new Date().toLocaleTimeString('vi-VN'));
      }
    };

    loadLive();
    const interval = setInterval(loadLive, 15000); // Poll every 15 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const localeStr = i18n.language && i18n.language.startsWith('vi') ? 'vi_VN' : 'en';

  // Filter history based on selected time range and inject live point
  const filteredHistory = useMemo(() => {
    const history = treasuryData.history || [];
    if (!history.length) return [];

    let combined = [...history];
    if (liveRates) {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastEntry = combined[combined.length - 1];
      const liveItem = {
        date: todayStr,
        US1Y: liveRates.US1Y?.cur ?? lastEntry.US1Y,
        US2Y: liveRates.US2Y?.cur ?? lastEntry.US2Y,
        US5Y: liveRates.US5Y?.cur ?? lastEntry.US5Y,
        US10Y: liveRates.US10Y?.cur ?? lastEntry.US10Y,
        US30Y: liveRates.US30Y?.cur ?? lastEntry.US30Y,
      };
      if (lastEntry.date === todayStr) {
        combined[combined.length - 1] = liveItem;
      } else {
        combined.push(liveItem);
      }
    }

    if (selectedRange === 'ALL') return combined;

    const rangeObj = RANGES.find((r) => r.key === selectedRange);
    const days = rangeObj ? rangeObj.days : 5;
    
    const latestDate = new Date(combined[combined.length - 1].date);
    const cutoffDate = new Date(latestDate);
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = combined.filter((item) => new Date(item.date) >= cutoffDate);
    return result.length > 0 ? result : combined.slice(-5);
  }, [selectedRange, liveRates]);

  // Single Term Area Chart Data
  const singleChartData = useMemo(() => {
    const labels = filteredHistory.map((item) => {
      const d = new Date(item.date);
      if (['1D', '1W', '1M'].includes(selectedRange)) {
        return d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
      }
      return d.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
    });

    const termColors = {
      US1Y: { stroke: '#38bdf8', bgTop: 'rgba(56, 189, 248, 0.35)', bgBottom: 'rgba(56, 189, 248, 0.01)' },
      US2Y: { stroke: '#a855f7', bgTop: 'rgba(168, 85, 247, 0.35)', bgBottom: 'rgba(168, 85, 247, 0.01)' },
      US5Y: { stroke: '#10b981', bgTop: 'rgba(16, 185, 129, 0.35)', bgBottom: 'rgba(16, 185, 129, 0.01)' },
      US10Y: { stroke: '#f59e0b', bgTop: 'rgba(245, 158, 11, 0.35)', bgBottom: 'rgba(245, 158, 11, 0.01)' },
      US30Y: { stroke: '#ef4444', bgTop: 'rgba(239, 68, 68, 0.35)', bgBottom: 'rgba(239, 68, 68, 0.01)' },
    };

    const color = termColors[selectedTerm] || termColors.US10Y;

    return {
      labels,
      datasets: [
        {
          label: selectedTerm,
          data: filteredHistory.map((h) => h[selectedTerm]),
          borderColor: color.stroke,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (
              !chartArea ||
              typeof chartArea.top !== 'number' ||
              typeof chartArea.bottom !== 'number' ||
              isNaN(chartArea.top) ||
              isNaN(chartArea.bottom) ||
              chartArea.bottom === chartArea.top
            ) {
              return color.bgTop;
            }
            try {
              const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              gradient.addColorStop(0, color.bgTop);
              gradient.addColorStop(1, color.bgBottom);
              return gradient;
            } catch (e) {
              return color.bgTop;
            }
          },
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          pointRadius: filteredHistory.length < 30 ? 3 : 0,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [filteredHistory, selectedTerm, selectedRange]);

  const singleChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#ffd700',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(255, 215, 0, 0.3)',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          callbacks: {
            label: (context) => `${selectedTerm}: ${(context.parsed.y ?? 0).toFixed(3)}%`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#94a3b8', font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
        },
        y: {
          position: 'right',
          grid: { color: 'rgba(255, 255, 255, 0.06)' },
          ticks: {
            color: '#94a3b8',
            font: { size: 11 },
            callback: (val) => typeof val === 'number' ? `${val.toFixed(3)}%` : `${val}%`,
          },
        },
      },
    }),
    [selectedTerm]
  );

  // Multi-Term Comparison Chart Data
  const multiChartData = useMemo(() => {
    const labels = filteredHistory.map((item) => {
      const d = new Date(item.date);
      return d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    });

    const datasets = [];

    if (visibleSeries.US1Y) {
      datasets.push({
        label: 'US 1Y (1 Năm)',
        data: filteredHistory.map((h) => h.US1Y),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.05)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.2,
      });
    }

    if (visibleSeries.US2Y) {
      datasets.push({
        label: 'US 2Y (2 Năm)',
        data: filteredHistory.map((h) => h.US2Y),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.05)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.2,
      });
    }

    if (visibleSeries.US5Y) {
      datasets.push({
        label: 'US 5Y (5 Năm)',
        data: filteredHistory.map((h) => h.US5Y),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.2,
      });
    }

    if (visibleSeries.US10Y) {
      datasets.push({
        label: 'US 10Y (10 Năm)',
        data: filteredHistory.map((h) => h.US10Y),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        tension: 0.2,
      });
    }

    if (visibleSeries.US30Y) {
      datasets.push({
        label: 'US 30Y (30 Năm)',
        data: filteredHistory.map((h) => h.US30Y),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.2,
      });
    }

    return { labels, datasets };
  }, [filteredHistory, visibleSeries]);

  const toggleSeries = (key) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCardClick = (termKey) => {
    setSelectedTerm(termKey);
  };

  return (
    <div className="treasury-chart-card">
      {/* Title Header */}
      <div className="treasury-header">
        <div className="treasury-title-area">
          <h2 className="treasury-title">
            <span>📊</span>
            {t('treasury.sectionTitle', 'BIỂU ĐỒ LỢI SUẤT TRÁI PHIẾU CHÍNH PHỦ MỸ')}
          </h2>
          {lastFetchTime && (
            <span style={{
              fontSize: '0.75rem',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#4ade80',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              padding: '2px 8px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: '600'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></span>
              LIVE TradingView ({lastFetchTime})
            </span>
          )}
        </div>
        
        {/* Direct Links to TradingView Quotes */}
        <div className="cnbc-badges">
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>TradingView Links:</span>
          <a href={TV_LINKS.US1Y} target="_blank" rel="noopener noreferrer" className={`tv-badge-link ${selectedTerm === 'US1Y' ? 'active' : ''}`}>
            📊 TVC:US01Y ↗
          </a>
          <a href={TV_LINKS.US2Y} target="_blank" rel="noopener noreferrer" className={`tv-badge-link ${selectedTerm === 'US2Y' ? 'active' : ''}`}>
            📊 TVC:US02Y ↗
          </a>
          <a href={TV_LINKS.US5Y} target="_blank" rel="noopener noreferrer" className={`tv-badge-link ${selectedTerm === 'US5Y' ? 'active' : ''}`}>
            📊 TVC:US05Y ↗
          </a>
          <a href={TV_LINKS.US10Y} target="_blank" rel="noopener noreferrer" className={`tv-badge-link us10y ${selectedTerm === 'US10Y' ? 'active' : ''}`}>
            ⭐ TVC:US10Y ↗
          </a>
          <a href={TV_LINKS.US30Y} target="_blank" rel="noopener noreferrer" className={`tv-badge-link ${selectedTerm === 'US30Y' ? 'active' : ''}`}>
            📊 TVC:US30Y ↗
          </a>
        </div>
      </div>


      {/* Embedded TradingView Live Charts Grid (Matching User Screenshot 2) */}
      <div className="treasury-mini-grid">
        {TERMS_LIST.map((item) => {
          const liveVal = liveRates ? liveRates[item.key] : null;
          const isSelected = selectedTerm === item.key;
          return (
            <TreasuryMiniCard
              key={item.key}
              item={item}
              liveVal={liveVal}
              isSelected={isSelected}
              onClick={() => handleCardClick(item.key)}
              localeStr={localeStr}
            />
          );
        })}
      </div>

      {/* Controls for Historical & Comparison Area Charts */}
      <div className="treasury-controls">
        <div className="mode-tabs">
          <button
            className={`mode-tab-btn ${activeMode === 'single' ? 'active' : ''}`}
            onClick={() => setActiveMode(activeMode === 'single' ? 'none' : 'single')}
          >
            📈 {activeMode === 'single' ? 'Ẩn' : 'Hiện'} Biểu đồ Vùng Lịch Sử ({selectedTerm})
          </button>
          <button
            className={`mode-tab-btn ${activeMode === 'comparison' ? 'active' : ''}`}
            onClick={() => setActiveMode(activeMode === 'comparison' ? 'none' : 'comparison')}
          >
            📊 {activeMode === 'comparison' ? 'Ẩn' : 'Hiện'} So Sánh Các Kỳ Hạn
          </button>
        </div>

        {activeMode === 'single' && (
          <div className="time-range-group hero-time-selector">
            {RANGES.map((r) => (
              <button
                key={r.key}
                className={`time-btn ${selectedRange === r.key ? 'active' : ''}`}
                onClick={() => setSelectedRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mode 1: Single Term Area Chart */}
      {activeMode === 'single' && (
        <div className="chart-container-wrapper">
          <Line data={singleChartData} options={singleChartOptions} />
        </div>
      )}

      {/* Mode 2: Multi-Term Comparison View */}
      {activeMode === 'comparison' && (
        <>
          <div className="series-toggles">
            <span className="toggle-label">Hiển thị kỳ hạn:</span>
            
            <div
              className={`series-chip ${!visibleSeries.US1Y ? 'inactive' : ''}`}
              onClick={() => toggleSeries('US1Y')}
            >
              <span className="chip-color-dot us1y"></span>
              <span>US 1Y</span>
            </div>

            <div
              className={`series-chip ${!visibleSeries.US2Y ? 'inactive' : ''}`}
              onClick={() => toggleSeries('US2Y')}
            >
              <span className="chip-color-dot us2y"></span>
              <span>US 2Y</span>
            </div>

            <div
              className={`series-chip ${!visibleSeries.US5Y ? 'inactive' : ''}`}
              onClick={() => toggleSeries('US5Y')}
            >
              <span className="chip-color-dot us5y"></span>
              <span>US 5Y</span>
            </div>

            <div
              className={`series-chip ${!visibleSeries.US10Y ? 'inactive' : ''}`}
              onClick={() => toggleSeries('US10Y')}
            >
              <span className="chip-color-dot us10y"></span>
              <span>US 10Y</span>
            </div>

            <div
              className={`series-chip ${!visibleSeries.US30Y ? 'inactive' : ''}`}
              onClick={() => toggleSeries('US30Y')}
            >
              <span className="chip-color-dot us30y"></span>
              <span>US 30Y</span>
            </div>
          </div>

          <div className="chart-container-wrapper">
            <Line data={multiChartData} options={singleChartOptions} />
          </div>
        </>
      )}

      {/* Footer Disclaimer & Links */}
      <div className="treasury-footer-note">
        <span>
          💡 Dữ liệu các biểu đồ trái phiếu được nhúng trực tiếp theo thời gian thực từ TradingView (TVC:US01Y, TVC:US02Y, TVC:US05Y, TVC:US10Y, TVC:US30Y).
        </span>
        <span>
          Link TradingView gốc:{' '}
          <a href={TV_LINKS[selectedTerm] || TV_LINKS.US10Y} target="_blank" rel="noopener noreferrer">
            {TV_LINKS[selectedTerm] || TV_LINKS.US10Y}
          </a>
        </span>
      </div>
    </div>
  );
};

export default USTreasury10YChart;
