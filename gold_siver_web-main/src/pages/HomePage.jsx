import React, {
  useMemo,
  useCallback,
  useEffect,
  useState,
  useRef,
} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import NewsNotification from '../components/real-time/NewsNotification';
import GoldNotification from '../components/real-time/GoldNotification';
import SilverNotification from '../components/real-time/SilverNotification';
import ETFMiningNotification from '../components/spdr-gold/ETFMiningNotification';
import { useETFMiningNotification } from '../components/MiningStock';
import GoldPriceDashboard from '../components/GoldPriceDashboard';
import AnalysisGoldSilverTable from '../components/tradingview/AnalysisGoldSilverTable';
import FilterBar from '../components/filter-bar/FilterBar';
import MultiChartViewer from '../components/tradingview/MultiChartViewer';
import EconomicCalendar from '../components/calendar/economic-calendar';
import BlackMarketExchangeRateSection from '../components/exchange-rate/BlackMarketExchangeRateSection';
import UpdateDataModal from '../components/Modal/UpdateDataModal';
import { UseGoldOneDayPrices } from '../hooks/UseGoldOneDayPrices';
import GoldChart from '../components/spdr-gold/GoldChart';
import SilverChart from '../components/spdr-gold/SilverChart';
import FearGreedIndex from '../components/fear-chart/FearGreedIndex';
import GlobalShark from '../components/spdr-gold/GlobalShark';
import GlobalShark1Day from '../components/spdr-gold/GlobalShark1Day';
import DataEUR from '../components/spdr-gold/DataEUR';
import OpinionComponent from '../components/BarchartOpinion/OpinionComponent';
import SGE_Chart from '../components/SGE_TradingChart/SGE_Chart';
import { fetchSharkData } from '../services/sharkGlobalService';
import { logUserInfo } from '../utils/logUserInfo';
import GlobalComparisonPage from './GlobalComparisonPage';
import WhaleIntelPanel from '../components/whale-intel/WhaleIntelPanel';
import WhaleSignal from '../components/WhaleSignal/WhaleSignal';
import SLVStats from './SLVStatsCard';
import SLVDarkPoolTable from './SLVDarkPoolTable';
import './HomePage.css';
import ReportComexChart from '../components/report-comex/ReportComexChart';
import LBMAPrice from '../components/lbma-reserves/LBMAPrice';
import ComexInventoryChart from '../components/comex-inventory/ComexInventoryChart';
import CFTC_Chart from '../components/cftc-chart/CFTC_Chart';
import SHFEChart from './SHFEChart';
import ReservesComexChart from '../components/report-comex/ReservesComexChart';
import FomoGoldSilverChart from '../components/FomoGoldSilver/FomoGoldSilverChart';
import ChinaSilverTurnover from '../components/tradingview/ChinaSilverTurnover';
import MCXHistory from '../components/tradingview/MCXHistory';
import SGEPriceHistoryChart from '../components/SGE_TradingChart/SGEPriceHistoryChart';
import SLVTradingChart from './SLVTradingChart';
import CompareShanghaiComex from '../components/tradingview/CompareShanghaiComex';
import OrderFlowAnalysis from '../components/tradingview/OrderFlowAnalysis';
import PSLVInventoryChart from '../components/comex-inventory/PSLVSilver';
import SilverOptionStatus from '../components/CVOL_chart/SilverOptionStatus';
import VolumeComexPage from './VolumeComexPage';
import TradingDashboardBollingerBand from '../components/tradingview/TradingDashboardBollingerBand';
import USTreasury10YChart from '../components/treasury/USTreasury10YChart';

const HomePage = ({ setNewsInAPI }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const isChartPage = !!params.symbol;

  // ETF Mining Notification Hook
  const etfNotificationHook = useETFMiningNotification();

  const [allSeries, setAllSeries] = useState([]);
  const [allSeries1DAY, setAllSeries1DAY] = useState([]);
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [latestDateData, setLatestDateData] = useState(null);
  const [userToggledAnalysis, setUserToggledAnalysis] = useState(false);

  // --- PHẦN ÂM THANH CẬP NHẬT ---
  const audioUpdateRef = useRef(new Audio('/co_du_lieu_moi.mp3'));
  const lastPlayedTimeRef = useRef(''); // Lưu chuỗi thời gian đã phát nhạc để chống lặp

  const [uiFilter, setUiFilter] = useState({
    sortBy: 'reputation',
    sortOrder: 'desc',
    distanceKm: '20',
  });
  const [isSyncingFromUrl, setIsSyncingFromUrl] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsSyncingFromUrl(false), 0);
    return () => clearTimeout(timer);
  }, []);

  const buildSkipKey = (dateData) => {
    const region = (filterOptions.region || '').toString();
    const type = (filterOptions.type || '').toString();
    if (dateData) {
      return `skipUpdate:${region}:${type}:${dateData.day}:${dateData.month}:${dateData.year}:${dateData.hour}:${dateData.minute}`;
    }
    return `skipUpdate:${region}:${type}`;
  };

  const filterOptions = useMemo(
    () => ({
      day: params.day,
      month: params.month,
      year: params.year,
      hour: params.hour,
      minute: params.minute,
      region: params.region || 'Vietnam',
      type: params.type || (params.symbol === 'silver' ? 'silver' : 'gold'),
    }),
    [params],
  );

  const chartType = useMemo(() => filterOptions.type, [filterOptions.type]);

  const {
    loading,
    error,
    displayedPrices,
    loadingProgress,
    availableCountries,
    fomo,
    news,
    charts,
  } = UseGoldOneDayPrices(filterOptions);

  /* ======================================================
     🔥 CHECK DỮ LIỆU MỚI VÀ PHÁT ÂM THANH (FIXED CHỐNG KÊU 2 LẦN)
  ======================================================= */
  useEffect(() => {
    if (!params.day || !params.month || !params.year) return;

    const checkLatestUpdate = async () => {
      try {
        let foundData = null;
        const today = new Date();

        for (let daysBack = 0; daysBack < 10; daysBack++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - daysBack);
          const checkDay = String(checkDate.getDate()).padStart(2, '0');
          const checkMonth = String(checkDate.getMonth() + 1).padStart(2, '0');
          const checkYear = checkDate.getFullYear();

          try {
            const res = await fetch(
              `https://api_gold.thinkdiff.us/all_json_1_day/${checkDay}_${checkMonth}_${checkYear}`,
            );
            if (!res.ok) continue;
            const json = await res.json();
            if (json.status === 'success' && json.data?.length) {
              foundData = json.data;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        if (!foundData) return;

        const latestItem = foundData[foundData.length - 1];
        const [datePart, timePart] = latestItem.modified_time.split(' ');
        const [sDay, sMonth, sYear] = datePart.split('/').map(Number);
        const [sHour, sMinute] = timePart.split(':').map(Number);

        const serverTime = new Date(
          sYear,
          sMonth - 1,
          sDay,
          sHour,
          sMinute,
        ).getTime();
        const cHour = params.hour ? Number(params.hour) : 0;
        const cMinute = params.minute ? Number(params.minute) : 0;

        const userViewTime = new Date(
          Number(params.year),
          Number(params.month) - 1,
          Number(params.day),
          cHour,
          cMinute,
        ).getTime();

        if (serverTime > userViewTime) {
          // Tạo chuỗi định danh cho mốc thời gian server
          const serverTimeStr = `${sDay}-${sMonth}-${sYear}-${sHour}-${sMinute}`;

          setLatestDateData({
            day: sDay,
            month: sMonth,
            year: sYear,
            hour: sHour,
            minute: sMinute,
          });

          const skipKey = buildSkipKey({
            day: Number(params.day),
            month: Number(params.month),
            year: Number(params.year),
            hour: cHour,
            minute: cMinute,
          });
          const skippedUntil = Number(localStorage.getItem(skipKey) || 0);

          if (!(skippedUntil && skippedUntil > 0)) {
            // 🔥 CHỈ PHÁT ÂM THANH NẾU MỐC THỜI GIAN NÀY CHƯA ĐƯỢC PHÁT
            if (lastPlayedTimeRef.current !== serverTimeStr) {
              audioUpdateRef.current
                .play()
                .catch((e) => console.log('Yêu cầu tương tác người dùng'));
              lastPlayedTimeRef.current = serverTimeStr; // Đánh dấu mốc này đã kêu xong
            }
            setHasNewUpdate(true);
          }
        } else {
          setHasNewUpdate(false);
          // Nếu server không còn mới hơn (user đã cập nhật xong), reset ref để sẵn sàng kêu cho mốc tiếp theo
          lastPlayedTimeRef.current = '';
        }
      } catch (e) {
        console.log('Lỗi check update:', e);
      }
    };

    checkLatestUpdate();
    const timer = setInterval(checkLatestUpdate, 20000);

    return () => clearInterval(timer);
  }, [params.day, params.month, params.year, params.hour, params.minute]); // Đã xóa hasNewUpdate khỏi deps

  const handleUpdateToLatest = () => {
    setHasNewUpdate(false);
    navigate(
      `/vietnam/gold/${latestDateData?.day}/${latestDateData?.month}/${latestDateData?.year}/${latestDateData?.hour}/${latestDateData?.minute}`,
    );
  };

  const handleSkipUpdate = () => {
    try {
      const cHour = params.hour ? Number(params.hour) : 0;
      const cMinute = params.minute ? Number(params.minute) : 0;
      const skipKey = buildSkipKey({
        day: Number(params.day),
        month: Number(params.month),
        year: Number(params.year),
        hour: cHour,
        minute: cMinute,
      });
      const sTime = new Date(
        Number(params.year),
        Number(params.month) - 1,
        Number(params.day),
        cHour,
        cMinute,
      ).getTime();
      localStorage.setItem(skipKey, String(sTime));
    } catch (e) {
      console.warn('Could not persist skipUpdate:', e);
    }
    setHasNewUpdate(false);
  };

  const VIEW_MODES = {
    PRICE: 'price',
    ANALYSIS: 'analysis',
    GLOBAL: 'global',
  };

  const [viewMode, setViewMode] = useState(VIEW_MODES.PRICE);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const viewFromUrl = sp.get('view');

    if (viewFromUrl && Object.values(VIEW_MODES).includes(viewFromUrl)) {
      setViewMode(viewFromUrl);
      return;
    }

    const views = [VIEW_MODES.PRICE, VIEW_MODES.ANALYSIS, VIEW_MODES.GLOBAL];
    const lastView = localStorage.getItem('home:lastView');
    const candidates = lastView ? views.filter((v) => v !== lastView) : views;
    const nextView = candidates[Math.floor(Math.random() * candidates.length)];

    setViewMode(nextView);
    localStorage.setItem('home:lastView', nextView);
  }, [location.search]);

  // Removed automatic navigation to date-based routes so Home stays at /:region/:type

  useEffect(() => {
    if (!isChartPage && news) setNewsInAPI(news);
  }, [news, isChartPage, setNewsInAPI]);

  const handleFilterChange = useCallback(
    (next) => {
      if (isChartPage) return;
      // Navigate to region/type only (date-time handled on GlobalComparisonPage)
      navigate(`/${next.region}/${next.type}`, { replace: true });
    },
    [navigate, isChartPage],
  );

  useEffect(() => {
    fetchSharkData('ALL')
      .then(setAllSeries)
      .catch(() => { });
    fetchSharkData('DAY')
      .then(setAllSeries1DAY)
      .catch(() => { });
    logUserInfo('HomePage');
  }, []);

  useEffect(() => {
    if (isSyncingFromUrl) return;
    localStorage.setItem('home:lastView', viewMode);
  }, [viewMode, isSyncingFromUrl]);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const vendor = sp.get('vendor');
    if (!vendor) return;
    const t = setTimeout(() => {
      const els = document.querySelectorAll('[data-vendor]');
      for (const el of els) {
        if (el.dataset.vendor === vendor) {
          try {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch (e) {
            el.scrollIntoView();
          }
          break;
        }
      }
    }, 150);
    return () => clearTimeout(t);
  }, [location.search]);

  return (
    <>
      <UpdateDataModal
        isVisible={hasNewUpdate}
        latestData={latestDateData}
        onConfirm={handleUpdateToLatest}
        onCancel={handleSkipUpdate}
      />

      {/* Hidden DataEUR to feed ETF notification hook (opens sockets) */}
      <div style={{ display: 'none' }}>
        <DataEUR notificationHook={etfNotificationHook} />
      </div>

      {/* ETF Mining Notification (uses hook above) */}
      <ETFMiningNotification
        gainNotification={etfNotificationHook.gainNotification}
        lossNotification={etfNotificationHook.lossNotification}
        onGainClose={() => etfNotificationHook.setGainNotification(null)}
        onLossClose={() => etfNotificationHook.setLossNotification(null)}
      />

      <main className="main-content">
        <div className="container">
          <GoldNotification />
          <SilverNotification />
          
          {/* 1. Market Charts Section */}
          <section className="dashboard-section">
            <div className="section-title-premium" style={{ textAlign: 'center', justifyContent: 'center', color: '#ffd700', fontSize: '26px', fontWeight: 'bold' }}>
              <span className="dot gold-dot"></span>
              {t('multichart.title', '📊 BIỂU ĐỒ PHÂN TÍCH KỸ THUẬT')}
            </div>
            <MultiChartViewer symbol={params.symbol} />
          </section>

          {/* 2. Order Flow & Sentiment */}
          <section className="dashboard-section">
            <div className="section-title-premium">
              <span className="dot blue-dot"></span>
              {t('home.orderFlowSentiment', 'PHÂN TÍCH DÒNG TIỀN & TÂM LÝ')}
            </div>
            <div className="sentiment-grid">
              <OrderFlowAnalysis />
              <BlackMarketExchangeRateSection />
            </div>
          </section>

          {/* Whale Intelligence components are now handled within MultiChartViewer to ensure correct layout and avoid duplication */}

          {/* 4. Analysis Indicators (RSI / BB / WR) */}
          <section className="dashboard-section">
            <div className="section-title-premium">
              <span className="dot blue-dot"></span>
              {t('home.analysisIndicators', 'ANALYSIS INDICATORS (RSI / BB / WR)')}
            </div>
            <TradingDashboardBollingerBand />
          </section>

          {/* 5. Gold Price Dashboard (Conditional) */}
          {viewMode === VIEW_MODES.PRICE && (
            <section className="dashboard-section">
              <div className="section-title-premium">
                <span className="dot gold-dot"></span>
                {t('home.priceDashboard', 'PRICE DASHBOARD')}
              </div>
              <GoldPriceDashboard
                loading={loading}
                error={error}
                displayedPrices={displayedPrices}
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
                loadingProgress={loadingProgress}
                availableCountries={availableCountries}
                showAnalysis={viewMode === VIEW_MODES.ANALYSIS}
                onToggleAnalysis={() => setViewMode(VIEW_MODES.ANALYSIS)}
                exchangeRateUSD={fomo?.ty_gia_usd}
                uiFilter={uiFilter}
                setUiFilter={setUiFilter}
              />
            </section>
          )}

          {/* 6. Comparison & Analysis Views */}
          {viewMode === VIEW_MODES.ANALYSIS && (
            <section className="dashboard-section">
              <FilterBar
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
                uiFilter={uiFilter}
                setUiFilter={setUiFilter}
                availableCountries={availableCountries}
                showAnalysis={true}
                onToggleAnalysis={() => setViewMode(VIEW_MODES.PRICE)}
              />
              <AnalysisGoldSilverTable />
            </section>
          )}
          {viewMode === VIEW_MODES.GLOBAL && (
            <section className="dashboard-section">
              <GlobalComparisonPage />
            </section>
          )}

          {/* 7. Market Psychology & Opinions */}
          <section className="dashboard-section">
            <div className="section-title-premium">
              <span className="dot blue-dot"></span>
              MARKET PSYCHOLOGY
            </div>
            <div className="sentiment-grid">
              <FearGreedIndex />
              <OpinionComponent />
            </div>
          </section>

          {/* 8. Premium ETF Analysis (Image Match) */}
          <section className="dashboard-section">
            <div className="section-title-premium">
              <span className="dot gold-dot"></span>
              {t('home.slvAnalysis', 'ISHARES SILVER TRUST (SLV) ANALYSIS')}
            </div>
            <div className="etf-grid-container">
              <div className="etf-stats-panel">
                <SLVStats />
              </div>
              <div className="etf-chart-panel">
                <SLVTradingChart />
              </div>
            </div>
          </section>

          {/* 9. Inventory & Exchanges Section */}
          <section className="dashboard-section">
            <div className="section-title-premium">
              <span className="dot blue-dot"></span>
              {t('home.globalExchangeInventory', 'GLOBAL EXCHANGE INVENTORY')}
            </div>
            <div className="exchanges-scroll-area">
              <VolumeComexPage />
              <SGE_Chart />
              <SHFEChart />
              <PSLVInventoryChart />
              <LBMAPrice />
            </div>
          </section>

          {/* 10. Secondary Charts & History */}
          <section className="dashboard-section">
            <div className="section-title-premium">
              <span className="dot gold-dot"></span>
              {t('home.historicalAuxData', 'HISTORICAL & AUXILIARY DATA')}
            </div>
            <div className="inventory-grid">
              <FomoGoldSilverChart />
              <SGEPriceHistoryChart />
              <ChinaSilverTurnover />
              <MCXHistory />
              <SilverOptionStatus />
              <GoldChart />
              <SilverChart />
            </div>
          </section>

          {/* 11. Economic Calendar */}
          <section className="dashboard-section">
            <div className="section-title-premium">
              <span className="dot blue-dot"></span>
              {t('home.economicCalendar', 'ECONOMIC CALENDAR')}
            </div>
            <EconomicCalendar />
          </section>

          {/* 12. Footer Section */}
          <footer className="premium-footer">
            <div className="footer-content">
              <div className="footer-left">
                <h3>{t('footer.tagline', 'AI ANALYSIS')}</h3>
                <p>{t('footer.disclaimer', 'Hệ thống tự động phân tích dữ liệu thị trường thời gian thực...')}</p>
              </div>
              <div className="footer-center">
                <p>{t('footer.contact', 'Contact')}</p>
              </div>
              <div className="footer-right">
                <div className="disclaimer-box">
                  <h4>⚠ {t('footer.disclaimerTitle', 'Disclaimer')}</h4>
                  <p>{t('footer.disclaimerBody', 'Information for reference only, please consider carefully before making investment decisions.')}</p>
                </div>
              </div>
            </div>
            <div className="footer-bottom">
              <p>{t('footer.copyright', '© 2026 Whale Intelligence. All rights reserved.')}</p>
            </div>
          </footer>
        </div>
      </main>

      <NewsNotification newsInAPI={news} />
    </>
  );
};

export default HomePage;
