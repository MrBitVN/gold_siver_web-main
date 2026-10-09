import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import ZslPage from "./pages/ZslPage";

import Header from "./layout/Header";
import Footer from "./layout/Footer";
import RealTimeTicker from "./components/real-time/RealTimeTicker";
// Components pages
import EconomicCalendar from "./pages/EconomicCalendar";
import HomePage from "./pages/HomePage";
import ExchangeRatePage from "./pages/ExchangeRatePage";
import SilverReportPage from "./pages/SilverReportPage";

// Hooks
import { useGoldPrices } from "./hooks/useGoldPrices";
import { useRequireLocation } from "./hooks/useRequireLocation";
import useRealTimeData from "./hooks/useRealTimeData";
import useMAAlerts from "./hooks/useMAAlerts";
import "./App.css";
import XauxagDetail from "./pages/XauxagDetail";
import SPDRGold from "./pages/SPDRGold";
import TradingEconomicsWidgets from "./pages/TradingEconomicsWidgets";
import GoldDetail from "./pages/GoldDetail";
import LastestNews from "./pages/LastestNews";
import IGSentimentPage from "./pages/IGSentimentPage";
import { SharkGlobalChart } from "./pages/SharkGlobalChart";

import { DetailSharkGlobal } from "./pages/DetailSharkGlobal";
import UsersAccess from "./pages/UsersAccess";
import MultiChartViewer from "./components/tradingview/MultiChartViewer";
import MapView from "./pages/Map-view";
import ComparisonHouseGold from "./pages/ComparisonHouseGold";
import ComparisonSellChart from "./components/GoldPriceDashboard/ComparisonSellChart";
import ChartDetailPage from "./pages/ChartDetailPage";
import EtfSharkDetail from "./components/spdr-gold/EtfSharkDetail";
import CandlestickCharts from "./components/candlestick/CandlestickCharts";
import AccountRegistration from "./pages/WalletRegistration";
import WalletRegistration from "./pages/WalletRegistration";
import Wallet from "./pages/Wallet";
import SellGold from "./pages/SellGold";
import ProfitLossDetail from "./pages/ProfitLossDetail";
import EditWallet from "./pages/EditWallet";
import WalletAccountsList from "./pages/WalletAccountsList";
import WalletLogin from "./pages/WalletLogin";
import ReportComex from "./pages/ReportComex";
import ReportTable from "./pages/ReportTable";
import SHFEReport from "./pages/SHFEReport";
import SHFEChart from "./pages/SHFEChart";
import ComexInventoryPage from "./pages/ComexInventoryPage";
import ShareChartMetalPage from "./pages/ShareChartMetalPage";
import LBMAReserves from "./pages/LBMAReserves";
import WeeklyProfitPage from "./pages/WeeklyReportPage";
import FOMOGoldSilver from "./pages/FOMOGoldSilver";
import GlobalComparisonPage from "./pages/GlobalComparisonPage";
import OrderBookPage from "./pages/OrderBookPage";
import AllChartsPage from "./components/tradingview/AllChartsPage";
import CombinedXauXagChartPage from "./pages/CombinedXauXagChartPage";
import SLVTradingChart from "./pages/SLVTradingChart";
import CompareShanghaiComex from "./components/tradingview/CompareShanghaiComex";
import TradeFlowPage from "./pages/TradeFlowPage";
import SilverFutures from "./components/tradingview/SilverFutures";
import ZslComparisonChart from "./components/etf/ZslComparisonChart";
import ZslPricePage from "./pages/ZslPricePage";
import CFTCandCOMEXChart from "./pages/CFTCandCOMEXChart";
import OrderFlowAnalysisPage from "./pages/OrderFlowAnalysisPage";
import NewsSidebar from "./components/notification/NewsSidebar";
import ArticleDetail from "./components/notification/ArticleDetail";
import LiveNewsPage from "./pages/LiveNewsPage";
import TableComparisonDataweek from "./components/tradingview/TableComparisonDataWeek";
import PSLVInventoryChart from "./components/comex-inventory/PSLVSilver";
import PredictionPage from "./pages/PredictionPage";
import PredictionGauge from "./components/tradingview/PredictionGauge";
import ZaloNotification from "./components/tradingview/ZaloNotification";
import VolumeComexPage from "./pages/VolumeComexPage";
import SharkGlobalSection from "./pages/SharkGlobalSection";
import TradingDashboardBollingerBand from "./components/tradingview/TradingDashboardBollingerBand";
import ComexChartVolume from "./components/tradingview/ComexChartVolume";
import ETFChartPage from "./pages/EtfChartPage";
import ETF_chart from "./pages/ETF_chart";
import EtfMiningChartPage from "./pages/EtfMiningChartPage";
import MetalPriceChart from "./pages/MetalPriceChart";
import ComexSilverInventoryPage from "./pages/ComexSilverInventoryPage";
import MCXHistory from "./components/tradingview/MCXHistory";
import SilverCVOLStatus from "./components/CVOL_chart/SilverOptionStatus";
import MyRsiChart from "./components/tradingview/RsiChartXauAndXAG";
import DownloadApp from "./pages/DownloadApp";
import DownloadAppNotification from "./pages/DownloadAppNotification";
import DXYChartPage from "./pages/DXYChartPage";
import CaMaplongshortChart from "./components/tradingview/CaMaplongshortChart";
import SLVShortVolumePage from "./pages/SLVShortVolumePage";
import i18n from "./config/i18n";
import FullLongShortCamap from "./components/tradingview/FullLongShortCamap";
import BtcLongShortMap from "./components/tradingview/BtcLongShortMap";
import OilLongShortMap from "./components/tradingview/OilLongShortMap";
import SaveLSCamapGold from "./components/tradingview/SaveLSCamapGold";
import AverageLineNoti from "./components/real-time/AverageLineNoti";
import HyperLiquidExplorer from "./pages/HyperLiquidExplorer";
import ForexNews from "./pages/ForexNews";
import MoneyFlowHeatmapPage from "./pages/MoneyFlowHeatmapPage";
import EconomicCalendarTicker from "./components/notification/EconomicCalendarTicker";
import MoneyFlowNotification from "./components/notification/MoneyFlowNotification";
import { useTranslation } from "react-i18next";
import PolymarketPage from "./pages/PolymarketPage";
import StockDetailPanel from "./components/money-flow-heatmap/StockDetailPanel";


function App() {
  const { t } = useTranslation();
  const allowed = useRequireLocation();
  const [globalStockSymbol, setGlobalStockSymbol] = useState(null);

  useEffect(() => {
    const handleOpenDetail = (e) => {
      if (e.detail) {
        setGlobalStockSymbol(e.detail);
      }
    };
    window.addEventListener("show-stock-detail", handleOpenDetail);
    return () => {
      window.removeEventListener("show-stock-detail", handleOpenDetail);
    };
  }, []);

  // Bộ lọc/sắp xếp nâng cao (dùng cho hook useGoldPrices - giá realtime)
  const [filterOptions] = useState({
    region: "vietnam",
    type: "gold",
    sortBy: null,
    sortOrder: "desc",
    country: "all",
  });
  const [newsInAPI, setNewsInAPI] = useState(null);
  const { lastUpdated } = useGoldPrices(filterOptions);
  const { liveData, isConnected } = useRealTimeData();

  useMAAlerts(allowed === true);

  if (allowed === null) return <div>{t('app.checkingLocation')}</div>;
  if (allowed === false)
    return (
      <div style={{ textAlign: "center", padding: 30 }}>
        <h2>
          {t('app.locationRequiredTitle')}
        </h2>
        <p>{t('app.locationRequiredNote')}</p>
        <img
          src="https://vang247.xyz/vang_247_maps.png"
          alt={t('app.enableLocationBtn')}
          className="location-permission-image"
        />
        <DownloadApp />
      </div>
    );

  return (
    <Router>
      <div className="app">
        <Header
          lastUpdated={lastUpdated}
          newsInAPI={newsInAPI}
          liveData={liveData}
        />

        <RealTimeTicker liveData={liveData} />

        {/* <DownloadAppNotification /> */}
        <ZaloNotification />
        <EconomicCalendarTicker />
        <MoneyFlowNotification />

        <main className="main-content">
          <div className="container">
            <Routes>
              {/* Trang chủ mặc định */}
              <Route
                path="/"
                element={<Navigate to="/vietnam/gold" replace />}
              />

              {/* ────────────────────────────────────────────────
                  TẤT CẢ ROUTE TĨNH / CỐ ĐỊNH (không có :param)
              ──────────────────────────────────────────────── */}
              <Route path="/polymarket" element={<PolymarketPage />} />
              <Route path="/lich_kinh_te" element={<EconomicCalendar />} />
              <Route path="/comex_chart" element={<ComexChartVolume />} />

              <Route path="/calendar" element={<EconomicCalendar />} />

              <Route path="/ty-gia" element={<ExchangeRatePage />} />
              <Route path="/money-flow-heatmap" element={<MoneyFlowHeatmapPage />} />
              <Route path="/xauxagdetail" element={<XauxagDetail />} />

              <Route
                path="/TradingEconomicsWidgets"
                element={<TradingEconomicsWidgets />}
              />

              <Route path="/SharkGlobalChart" element={<SharkGlobalChart />} />

              <Route
                path="/DetailSharkGlobal"
                element={<DetailSharkGlobal />}
              />

              <Route path="/tin-tuc-moi-nhat" element={<LastestNews />} />

              <Route path="/live-news" element={<LiveNewsPage />} />

              <Route
                path="/so-sanh-nha-vang"
                element={<ComparisonHouseGold />}
              />

              <Route path="/tong-hop" element={<GlobalComparisonPage />} />
              <Route path="/tong-hop/:type/:day/:month/:year/:hour/:minute" element={<GlobalComparisonPage />} />
              <Route path="/tong-hop/:type/*" element={<GlobalComparisonPage />} />

              <Route path="/dang-ky-vi" element={<WalletRegistration />} />

              <Route path="/danh-sach-vi" element={<WalletAccountsList />} />

              <Route path="/wallet-buy" element={<Wallet />} />

              <Route path="/wallet-sell/:username/bcl" element={<SellGold />} />

              <Route
                path="/dang-ky-tai-khoan"
                element={<AccountRegistration />}
              />

              <Route
                path="/so-sanh-XAU-XAG"
                element={<MultiChartViewer showPopUpCompare={true} />}
              />

              <Route path="/shanghaichart" element={<CompareShanghaiComex />} />

              <Route path="/lich-su-gia" element={<CandlestickCharts />} />

              <Route path="/cftc_comexchart" element={<CFTCandCOMEXChart />} />

              <Route path="/lbma-reserves" element={<LBMAReserves />} />

              <Route path="/spdr-shares" element={<ShareChartMetalPage />} />

              <Route path="/loi-nhuan-tuan" element={<WeeklyProfitPage />} />

              <Route path="/zsl" element={<ZslPage />} />

              <Route
                path="/zsl-comparison"
                element={<Navigate to="/zsl" replace />}
              />

              <Route
                path="/zsl-price"
                element={<Navigate to="/zsl" replace />}
              />

              <Route path="/fomo-vang-bac" element={<FOMOGoldSilver />} />

              <Route path="/du-doan-30-ngay" element={<PredictionPage />} />

              <Route path="/ig-sentiment" element={<IGSentimentPage />} />

              <Route path="/order-book" element={<OrderBookPage />} />

              <Route path="/bao-cao-comex" element={<ReportComex />} />

              <Route
                path="/bao-cao-san-thuong-hai-tuong-lai"
                element={<ReportTable />}
              />

              <Route path="/bao-cao-luong-luu-tru" element={<SHFEReport />} />

              <Route path="/chart/XOJ26" element={<SHFEChart />} />

              <Route path="/comex-inventory" element={<ComexInventoryPage />} />

              <Route path="/luu-tru-comex" element={<ComexInventoryPage />} />

              <Route path="/volumexagxau" element={<AllChartsPage />} />

              <Route
                path="/xau-xag-chart"
                element={<CombinedXauXagChartPage />}
              />

              <Route path="/slvchart" element={<SLVTradingChart />} />

              <Route
                path="/compareshanghaicomex"
                element={<CompareShanghaiComex />}
              />

              <Route path="/futures-chain" element={<SilverFutures />} />

              <Route path="/trade-flow" element={<TradeFlowPage />} />

              <Route path="/pslv_silver" element={<PSLVInventoryChart />} />

              <Route
                path="/vangtheotuan"
                element={<TableComparisonDataweek />}
              />

              <Route path="/du-doan" element={<PredictionGauge />} />

              <Route path="/volume-comex" element={<VolumeComexPage />} />

              <Route path="/shark-global" element={<SharkGlobalSection />} />

              <Route
                path="/rsi-dashboard"
                element={<TradingDashboardBollingerBand />}
              />

              <Route path="/etf-chart" element={<ETF_chart />} />
              <Route path="/dxy-chart" element={<DXYChartPage />} />
              <Route path="/mcx-fomo" element={<MCXHistory />} />
              <Route path="/cvol-silver-index" element={<SilverCVOLStatus />} />
              <Route path="/rsi-chart" element={<MyRsiChart />} />
              <Route
                path="/slv-short-volume"
                element={<SLVShortVolumePage />}
              />

              <Route path="/btc-ca-map" element={<BtcLongShortMap />} />

              <Route path="/oil-ca-map" element={<OilLongShortMap />} />
              <Route path="/long-short-ca-map" element={<SaveLSCamapGold />} />
              <Route path="/thong-bao-duong-tb" element={<AverageLineNoti />} />
              <Route path="/hyperliquid" element={<HyperLiquidExplorer />} />
              <Route path="/forex-news" element={<ForexNews />} />

              <Route path="/money-flow-heatmap" element={<MoneyFlowHeatmapPage />} />

              {/* ────────────────────────────────────────────────
                  ROUTE CÓ PATTERN DÀI / CỤ THỂ HƠN
              ──────────────────────────────────────────────── */}
              <Route
                path="/:region/chart/:symbol"
                element={<HomePage setNewsInAPI={setNewsInAPI} />}
              />
              <Route path="/ty-gia/:date" element={<ExchangeRatePage />} />

              <Route
                path="/quy-dau-tu/:day/:month/:year/:hour/:minute"
                element={<SPDRGold />}
              />

              <Route
                path="/vang247/:day/:month/:year/:hour/:minute"
                element={<GlobalComparisonPage />}
              />

              <Route
                path="/:region/:type/:day/:month/:year/:hour/:minute"
                element={<HomePage setNewsInAPI={setNewsInAPI} />}
              />

              <Route
                path="/map-view/:region/:type/:day/:month/:year/:hour/:minute/:z/:lat/:lng"
                element={<MapView />}
              />

              <Route
                path="/orderflowanalysis/:type/:day/:month/:year"
                element={<OrderFlowAnalysisPage />}
              />
              <Route
                path="/EtfSharkDetail/:etfSlug"
                element={<EtfSharkDetail />}
              />

              <Route
                path="/chart-detail/:chartKey"
                element={<ChartDetailPage />}
              />

              <Route
                path="/chart/:symbol"
                element={<HomePage setNewsInAPI={setNewsInAPI} />}
              />

              <Route path="/live-news/:date" element={<LiveNewsPage />} />

              <Route path="/bai-viet/:day?" element={<NewsSidebar />} />

              <Route path="/bai-viet/*" element={<ArticleDetail />} />
              {/* // Cách 1: Thêm route mặc định */}
              <Route path="/luong-truy-cap" element={<UsersAccess />} />

              <Route path="/luong-truy-cap/:date" element={<UsersAccess />} />

              <Route
                path="/danh-sach-vi/:username"
                element={<WalletAccountsList />}
              />

              <Route path="/vi/:username" element={<ProfitLossDetail />} />

              <Route path="/vi/:username/sua" element={<EditWallet />} />

              <Route path="/etf/:symbol" element={<ETFChartPage />} />

              <Route
                path="/etf-mining/:symbol"
                element={<EtfMiningChartPage />}
              />

              <Route
                path="/duong-trung-binh"
                element={<Navigate to="/duong-trung-binh/silver" replace />}
              />
              <Route
                path="/duong-trung-binh/:metal"
                element={<MetalPriceChart />}
              />

              <Route
                path="/comex-silver-inventory"
                element={<ComexSilverInventoryPage />}
              />

              <Route path="/tai-ung-dung" element={<DownloadApp />} />
              <Route
                path="/shark-chart"
                element={
                  <>
                    <CaMaplongshortChart />
                  </>
                }
              />
              <Route
                path="/shark-chart/:gold"
                element={<FullLongShortCamap />}
              />
              <Route
                path="/shark-chart/:silver"
                element={<FullLongShortCamap />}
              />
              {/* ────────────────────────────────────────────────
                  ROUTE DYNAMIC NGẮN NHẤT (đặt SAU CÙNG)
              ──────────────────────────────────────────────── */}
              <Route
                path="/:region/:type"
                element={<HomePage setNewsInAPI={setNewsInAPI} />}
              />
              <Route path="/:vendorName" element={<GoldDetail />} />
              <Route
                path="/orderflowanalysis"
                element={<OrderFlowAnalysisPage />}
              />

              {/* ────────────────────────────────────────────────
                  404 - LUÔN CUỐI CÙNG
              ──────────────────────────────────────────────── */}
              <Route
                path="*"
                element={
                  <div className="p-10 text-center">
                    {t('app.pageNotFound')}
                  </div>
                }
              />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
      <StockDetailPanel
        symbol={globalStockSymbol}
        onClose={() => setGlobalStockSymbol(null)}
      />
    </Router>
  );
}

export default App;
