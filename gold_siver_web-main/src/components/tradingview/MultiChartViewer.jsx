import React, { useState, useEffect, useRef, useCallback } from "react";
import MiniTradingViewChart from "./MiniTradingViewChart";
import FullScreenChart from "./FullScreenChart";
import { getSymbolName } from "./chartHelpers";
import "./MultiChartViewer.css";
import GrowBarChart from "./BarViewChart";
import GaugeChart from "../fear-chart/GaugeChart";
import RsiChart from "../fear-chart/RsiChart";
import TableData from "./TableData";
import { useNavigate } from "react-router-dom";
import TooltipPortal from "./TooltipPortal";
import { fetchXauXagVolumeDataMultiplePages, fetchXauXagVolumeData } from "../../services/volumeChartDataService";
import { formatCandlestickForApex } from "../../utils/convertDataXauXagHelper";
import CombinedXauXagChart from "./CombinedXauXagChart";
import XAGVolumeOnlyChart from "./XAGVolumeOnlyChart"
import GrowthChart from "./GrowthChart"
import { zoom } from "chartjs-plugin-zoom";
import VolumeComparisonChart from "./VolumeComparisonChart"
import MyRsiChart from "./RsiChartXauAndXAG";
import TradingDashboardBollingerBand from "./TradingDashboardBollingerBand";
import IGSentiment from "../ig-sentiment/IGSentiment";
import GiaSLVGLDPSLV from "./GiaSLVGLDPSLV";
import MultiTimeframeGrowthChart from "./MultiTimeframeGrowthChart";
import MetalStatusBars from "../real-time/MetalStatusBars";
import PredictionGauge from "./PredictionGauge";
import PredictionChart from "../FomoGoldSilver/PredictionChart";
import GoldSignalNoti from "../real-time/GoldSignalNoti";
import AverageLineNoti from "../real-time/AverageLineNoti";
import GoldSilverDashBoard from "./GoldSilverDashBoard";
import CaMaplongshortChart from "./CaMaplongshortChart";
import WhaleIntelPanel from "../whale-intel/WhaleIntelPanel";
import WhaleSignal from "../WhaleSignal/WhaleSignal";
import SLVShortCircle from "../slv-short-volume/SLVShortCircle";
import ListApi from "../listapi/listapi";
import ComexInventoryChart from "../comex-inventory/ComexInventoryChart";
import USTreasury10YChart from "../treasury/USTreasury10YChart";
import { useTranslation } from "react-i18next";
import { translateText } from "../../services/translationService";

/* mapping URL → symbol tradingview */
const getChartSlug = (symbol) => {
  switch (symbol) {
    case "FX_IDC:XAUUSD": return "chart/gold";
    case "FX_IDC:XAGUSD": return "chart/silver";
    case "OANDA:XAUXAG": return "chart/xau_xag";
    case "TICKMILL:DXY": return "chart/dxy";
    case "TVC:UKOIL": return "chart/oil";
    case "OANDA:XCUUSD": return "chart/copper";
    case "FOREXCOM:SPX500": return "chart/spx";
    case "BITSTAMP:BTCUSD": return "chart/btc";
    case "FOREXCOM:JP225": return "chart/nikkei";
    case "FX_IDC:USDJPY": return "chart/usdjpy";
    case "TVC:KOSPI":
    case "KRX:KOSPI200":
    case "KRX:KOSPI":
    case "CAPITALCOM:KOR200":
    case "AMEX:EWY": return "chart/kospi";
    case "NSE:NIFTY":
    case "CAPITALCOM:INDIA50":
    case "AMEX:INDY":
    case "NASDAQ:INDY": return "chart/nifty";
    case "SSE:000001": return "chart/shanghai";
    default: return "";
  }
};

const SYMBOL_MAP = {
  gold: "FX_IDC:XAUUSD",
  xau_xag: "OANDA:XAUXAG",
  silver: "FX_IDC:XAGUSD",
  dxy: "TICKMILL:DXY",
  oil: "TVC:UKOIL",
  copper: "OANDA:XCUUSD",
  spx: "FOREXCOM:SPX500",
  btc: "BITSTAMP:BTCUSD",
  nikkei: "FOREXCOM:JP225",
  usdjpy: "FX_IDC:USDJPY",
  kospi: "AMEX:EWY",
  nifty: "NASDAQ:INDY",
  shanghai: "SSE:000001",
};




const highlightNumber = (text) => {
  if (!text) return "";
  return text.replace(
    /(-?\d+(\.\d+)?)/g,
    '<span style="color:red;font-weight:bold;">$1</span>'
  );
};


// ---------------------------------------------------------------------
// Component Modal Volume XAU/XAG
// ---------------------------------------------------------------------
const VolumeDualChartModal = ({
  isOpen,
  onClose,
  dataXauVolume,
  dataXagVolume,
  avgVolumeXau,
  avgVolumeXag,
  volumeZoomState,
  handleVolumeZoom,
  modalRef,
  hasMoreData,
  loadNextPages,
  isLoadingMore,
  loadAllPages,
  resetToInitialPages,
  sliderPage,
  accumulatedXauRawRef,
  pageSize,
  handleVolumeSliderChange
}) => {
  const { t } = useTranslation();
  if (!isOpen || !dataXauVolume) return null;

  return (
    <div className="fullscreen-modal" ref={modalRef} >
      <div className="modal-header">
        <h3 className="modal-title">{t("multichart.volumeTitle")}</h3>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
      </div><div className="dual-chart-container" style={{ width: '100%', display: 'flex', flexDirection: 'row', gap: '20px' }}>
        <div style={{ width: '100%' }}>
          <h1>{t('multichart.volumeAnalysisHeader', 'Biểu đồ Phân Tích Volume Giao Dịch XAU (Vàng) và XAG (Bạc)')}</h1>
          <CombinedXauXagChart
            dataXau={dataXauVolume} dataXag={dataXagVolume}
            externalZoom={volumeZoomState}
            onZoom={handleVolumeZoom}
            enableZoom={true}
          />
          <ListApi />
          <div style={{ margin: "20px 0", display: "none" }}>
            <label>
              Số trang hiển thị: <b>{sliderPage}</b>
            </label>

            <input
              type="range"
              min={1}
              max={Math.max(1, Math.ceil(accumulatedXauRawRef.current.length / pageSize))}
              step={1}
              value={sliderPage}
              onChange={handleVolumeSliderChange}
              style={{ width: "100%" }}
            />
          </div>

          {/* Nút Load tiếp & Load tất cả */}
          {hasMoreData && (

            <div className="pagination-actions">
              <button
                className="action-button"
                onClick={loadNextPages}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? t('common.loading', 'Đang tải...') : t("multichart.loadMore")}
              </button>
              <button
                className="action-button"
                onClick={loadAllPages}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? t('common.loading', 'Đang tải...') : t("multichart.loadAll")}
              </button>
            </div>
          )}
          <button
            className="action-button single"
            onClick={resetToInitialPages}
            disabled={isLoadingMore}
          >
            {t("multichart.current")}
          </button>

          <VolumeComparisonChart
            dataXau={dataXauVolume} dataXag={dataXagVolume}
            avgVolumeXau={avgVolumeXau}
            avgVolumeXag={avgVolumeXag}
            externalZoom={volumeZoomState}
            onZoom={handleVolumeZoom}
            enableZoom={true}
          />

          <GrowthChart />

          <XAGVolumeOnlyChart data={dataXagVolume} />
        </div>
      </div>
    </div>

  );
};

// ---------------------------------------------------------------------
// Component chính
// ---------------------------------------------------------------------
const MultiChartViewer = ({ symbol, showPopUpCompare = false }) => {
  const [zoomedSymbol, setZoomedSymbol] = useState(null);
  const [dataAnalysis, setDataAnalysis] = useState(null);
  const [translatedAdvice, setTranslatedAdvice] = useState([]);
  const scrollPositionRef = useRef(0);
  const { t, i18n } = useTranslation();
  const modalRef = useRef(null);
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(showPopUpCompare);
  const volumeModalRef = useRef(null);

  const navigate = useNavigate();
  const [dataXagVolume, setDataXagVolume] = useState(null);
  const [dataXauVolume, setDataXauVolume] = useState(null);
  const [avgVolumeXau, setAvgVolumeXau] = useState(0);
  const [avgVolumeXag, setAvgVolumeXag] = useState(0);
  const [sliderPage, setSliderPage] = useState(1);
  const [loadingVolume, setLoadingVolume] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  const [volumeZoomState, setVolumeZoomState] = useState(null);
  const accumulatedXauRawRef = useRef([]);
  const accumulatedXagRawRef = useRef([]);
  const [dataTimeRange, setDataTimeRange] = useState({ min: null, max: null });

  const [showRsiVangList, setShowRsiVangList] = useState(false);
  const [showRsiBacList, setShowRsiBacList] = useState(false);


  const pageSize = 100; // Giả sử 1 page server trả 100 record
  const defaultVisiblePages = 3; // Mặc định load 3 page đầu

  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
  const symbols = [
    "FX_IDC:XAUUSD",
    "OANDA:XAUXAG",
    "FX_IDC:XAGUSD",
    "TICKMILL:DXY",
    "TVC:UKOIL",
    "OANDA:XCUUSD",
    "FOREXCOM:SPX500",
    "BITSTAMP:BTCUSD",
    "FOREXCOM:JP225",
    "FX_IDC:USDJPY",
    "AMEX:EWY",
    "NASDAQ:INDY",
    "SSE:000001",
  ];



  const handleVolumeZoom = useCallback((newZoomState) => {
    setVolumeZoomState(newZoomState);
  }, []);
  // Khi mở chart theo symbol
  useEffect(() => {
    if (symbol) {
      setZoomedSymbol(SYMBOL_MAP[symbol]);
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    }
  }, [symbol]);

  useEffect(() => {
    if (showPopUpCompare) {
      scrollPositionRef.current =
        window.pageYOffset || document.documentElement.scrollTop;

      document.body.style.overflow = "hidden";
      document.body.style.paddingRight =
        `${window.innerWidth - document.documentElement.clientWidth}px`;

      setIsVolumeModalOpen(true);
    }
  }, [showPopUpCompare]);

  // fetch 3 page đầu 
  useEffect(() => {
    let cancelled = false;

    const fetchInitialVolume = async () => {
      try {
        setLoadingVolume(true);

        // Fetch 3 page đầu tiên
        const [page1, page2, page3] = await Promise.all([
          fetchXauXagVolumeData(1),
          fetchXauXagVolumeData(2),
          fetchXauXagVolumeData(3),
        ]);

        if (cancelled) return;

        accumulatedXauRawRef.current = [
          ...(page1.volumeXauRaw || []),
          ...(page2.volumeXauRaw || []),
          ...(page3.volumeXauRaw || [])
        ];

        accumulatedXagRawRef.current = [
          ...(page1.volumeXagRaw || []),
          ...(page2.volumeXagRaw || []),
          ...(page3.volumeXagRaw || [])
        ];

        const totalPagesCount = page1?.totalPages || 0;
        setTotalPages(totalPagesCount);
        setCurrentPage(3);
        setHasMoreData(totalPagesCount > 3);

        console.log("lòa page ", page1);
        setAvgVolumeXau(page1.volume_trungbinh.xau || 0);
        setAvgVolumeXag(page1.volume_trungbinh.xag || 0);

        const allTimestamps = [
          ...accumulatedXauRawRef.current.map(i => i.timestamp),
          ...accumulatedXagRawRef.current.map(i => i.timestamp)
        ];
        const minTimestamp = Math.min(...allTimestamps);
        const maxTimestamp = Math.max(...allTimestamps);
        setDataTimeRange({ min: minTimestamp, max: maxTimestamp });


        // Chỉ hiển thị 3 page đầu
        const initialDataXau = accumulatedXauRawRef.current.slice(0, defaultVisiblePages * pageSize);
        const initialDataXag = accumulatedXagRawRef.current.slice(0, defaultVisiblePages * pageSize);

        setDataXauVolume(formatCandlestickForApex(initialDataXau));
        setDataXagVolume(formatCandlestickForApex(initialDataXag));

        const sortedXau = [...accumulatedXauRawRef.current].sort((a, b) => b.timestamp - a.timestamp);
        const initialMinTimeIndex = Math.max(0, sortedXau.length - 30);
        const initialMinTime = sortedXau[initialMinTimeIndex]?.timestamp || minTimestamp;

        setTimeout(() => setVolumeZoomState({ min: initialMinTime, max: maxTimestamp }), 300);
      } catch (error) {
        console.error("Error fetching volume data:", error);
        if (!cancelled) {
          setDataXauVolume([]);
          setDataXagVolume([]);
          setAvgVolumeXau(0);
          setAvgVolumeXag(0);
        }
      } finally {
        if (!cancelled) setLoadingVolume(false);
      }
    };

    fetchInitialVolume();

    return () => { cancelled = true; };
  }, []);

  // ---------------------------------------------------------------------
  // Hàm Load tiếp 3 page
  // ---------------------------------------------------------------------
  const loadNextPages = async () => {
    if (isLoadingMore || !hasMoreData) return;

    const nextStart = currentPage + 1;
    const nextEnd = Math.min(currentPage + 3, totalPages);

    setIsLoadingMore(true);

    try {
      await fetchXauXagVolumeDataMultiplePages(nextStart, nextEnd, (page, data) => {
        accumulatedXauRawRef.current = [...accumulatedXauRawRef.current, ...data.volumeXauRaw];
        accumulatedXagRawRef.current = [...accumulatedXagRawRef.current, ...data.volumeXagRaw];

        const uniqueXau = Array.from(new Map(accumulatedXauRawRef.current.map(item => [item.timestamp, item])).values());
        const uniqueXag = Array.from(new Map(accumulatedXagRawRef.current.map(item => [item.timestamp, item])).values());

        setDataXauVolume(formatCandlestickForApex(uniqueXau));
        setDataXagVolume(formatCandlestickForApex(uniqueXag));

        setCurrentPage(page);
        setHasMoreData(page < totalPages);
      });
    } catch (error) {
      console.error("Error loading more pages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };


  // ---------------------------------------------------------------------
  // Hàm Load tất cả page còn lại
  // ---------------------------------------------------------------------
  const loadAllPages = async () => {
    if (isLoadingMore || !hasMoreData) return;

    setIsLoadingMore(true);

    try {
      await fetchXauXagVolumeDataMultiplePages(currentPage + 1, totalPages, (page, data) => {
        accumulatedXauRawRef.current = [...accumulatedXauRawRef.current, ...data.volumeXauRaw];
        accumulatedXagRawRef.current = [...accumulatedXagRawRef.current, ...data.volumeXagRaw];

        const uniqueXau = Array.from(new Map(accumulatedXauRawRef.current.map(item => [item.timestamp, item])).values());
        const uniqueXag = Array.from(new Map(accumulatedXagRawRef.current.map(item => [item.timestamp, item])).values());

        setDataXauVolume(formatCandlestickForApex(uniqueXau));
        setDataXagVolume(formatCandlestickForApex(uniqueXag));

        setCurrentPage(page);
        setHasMoreData(false);
      });
    } catch (error) {
      console.error("Error loading all pages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // fetch hiện tại 
  const resetToInitialPages = useCallback(async () => {
    try {
      setIsLoadingMore(true);
      const firstPage = await fetchXauXagVolumeData(1);
      const secondPage = await fetchXauXagVolumeData(2);
      const thirdPage = await fetchXauXagVolumeData(3);

      accumulatedXauRawRef.current = [
        ...(firstPage.volumeXauRaw || []),
        ...(secondPage.volumeXauRaw || []),
        ...(thirdPage.volumeXauRaw || [])
      ];
      accumulatedXagRawRef.current = [
        ...(firstPage.volumeXagRaw || []),
        ...(secondPage.volumeXagRaw || []),
        ...(thirdPage.volumeXagRaw || [])
      ];

      const allTimestamps = [
        ...accumulatedXauRawRef.current.map(d => d.timestamp),
        ...accumulatedXagRawRef.current.map(d => d.timestamp)
      ];

      const minTimestamp = Math.min(...allTimestamps);
      const maxTimestamp = Math.max(...allTimestamps);

      setDataXauVolume(formatCandlestickForApex(accumulatedXauRawRef.current));
      setDataXagVolume(formatCandlestickForApex(accumulatedXagRawRef.current));
      setCurrentPage(3);
      setHasMoreData(totalPages > 3);
      setDataTimeRange({ min: minTimestamp, max: maxTimestamp });

      // Reset zoom về mặc định 3 page đầu
      const sortedXau = accumulatedXauRawRef.current.slice().sort((a, b) => b.timestamp - a.timestamp);
      const initialMinTime = sortedXau[Math.max(0, sortedXau.length - 30)]?.timestamp || minTimestamp;
      setVolumeZoomState({ min: initialMinTime, max: maxTimestamp });
    } catch (error) {
      console.error("Error resetting to initial pages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [totalPages]);

  const handleSliderChange = (e) => {
    const page = parseInt(e.target.value, 10);
    setSliderPage(page);

    // Tính dữ liệu hiển thị dựa trên slider
    const startIdx = (page - 1) * pageSize; // pageSize là số item trên 1 page
    const endIdx = startIdx + pageSize;

    const slicedXau = accumulatedXauRawRef.current.slice(0, endIdx);
    const slicedXag = accumulatedXagRawRef.current.slice(0, endIdx);

    setDataXauVolume(formatCandlestickForApex(slicedXau));
    setDataXagVolume(formatCandlestickForApex(slicedXag));

    // Cập nhật zoom chart nếu cần
    const allTimestamps = [
      ...slicedXau.map(i => i.timestamp),
      ...slicedXag.map(i => i.timestamp)
    ];
    const minTimestamp = Math.min(...allTimestamps);
    const maxTimestamp = Math.max(...allTimestamps);

    setVolumeZoomState({ min: minTimestamp, max: maxTimestamp });
  };


  const showTooltip = useCallback((e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY - 15 }), []);
  const hideTooltip = useCallback(() => setTooltip(old => ({ ...old, visible: false })), []);

  const handleCloseModal = useCallback(() => {
    setZoomedSymbol(null);
    const lang = i18n.language?.startsWith('vi') ? 'vietnam' : (i18n.language?.split('-')[0] || 'en');
    window.location.hash = `#/${lang}/gold`;
    requestAnimationFrame(() => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      setTimeout(() => { window.scrollTo({ top: scrollPositionRef.current, behavior: "auto" }); }, 20);
    });
  }, [i18n.language]);

  const handleChartClick = useCallback((symbol) => {
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    const slug = getChartSlug(symbol);
    const lang = i18n.language?.startsWith('vi') ? 'vietnam' : (i18n.language?.split('-')[0] || 'en');
    window.location.hash = `#/${lang}/${slug}`;
    setZoomedSymbol(symbol);
  }, [i18n.language]);

  const handleOpenVolumeModal = useCallback(() => {
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    setIsVolumeModalOpen(true);
    navigate('/so-sanh-XAU-XAG');
  }, []);

  const handleCloseVolumeModal = useCallback(() => {
    setIsVolumeModalOpen(false);
    requestAnimationFrame(() => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      setTimeout(() => { window.scrollTo({ top: scrollPositionRef.current, behavior: "auto" }); }, 20);
    });
    navigate('/');
  }, []);

  useEffect(() => {
    const listener = (event) => { if (modalRef.current && !modalRef.current.contains(event.target)) handleCloseModal(); };
    if (zoomedSymbol) document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [zoomedSymbol, handleCloseModal]);

  useEffect(() => {
    const listener = (event) => { if (volumeModalRef.current && !volumeModalRef.current.contains(event.target)) handleCloseVolumeModal(); };
    if (isVolumeModalOpen) document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [isVolumeModalOpen, handleCloseVolumeModal]);

  useEffect(() => {
    const listener = (event) => {
      if (event.key === "Escape") {
        if (zoomedSymbol) handleCloseModal();
        else if (isVolumeModalOpen) handleCloseVolumeModal();
      }
    };
    if (zoomedSymbol || isVolumeModalOpen) document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [zoomedSymbol, isVolumeModalOpen, handleCloseModal, handleCloseVolumeModal]);

  useEffect(() => () => { document.body.style.overflow = ""; }, []);
  //
  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        const response = await fetch("https://api_gold.thinkdiff.us/phantich_xau_xag_fomo_rsi");
        const result = await response.json();
        const data = result.data || {};
        setDataAnalysis(data);
      } catch (error) {
        console.error("Lỗi fetch phân tích:", error);
        setDataAnalysis(null);
      }
    };

    fetchAnalysisData();
  }, []);

  // Dịch lời khuyên khi ngôn ngữ thay đổi
  useEffect(() => {
    if (!dataAnalysis) return;
    const lang = i18n.language;
    const texts = [
      dataAnalysis.loi_khuyen_mua_ban_xau_xag_quoc_te,
      dataAnalysis.loi_khuyen_chenh_bac_nguyen_lieu_trong_nuoc,
      dataAnalysis.loi_khuyen_chenh_nguyen_lieu_trong_nuoc,
    ];
    if (lang === "vi") {
      setTranslatedAdvice(texts);
      return;
    }
    Promise.all(texts.map(text => text ? translateText(text, lang) : Promise.resolve(text)))
      .then(setTranslatedAdvice)
      .catch(() => setTranslatedAdvice(texts));
  }, [dataAnalysis, i18n.language]);

  return (
    <div className="multi-chart-viewer">
      {/* 1. Biểu đồ phân tích kỹ thuật (Technical Analysis Charts) */}
      {!showPopUpCompare && (
        <div className="chart-grid" style={{ marginBottom: '30px' }}>
          {symbols.map((symbol) => (
            <MiniTradingViewChart
              key={symbol}
              symbol={symbol}
              onClick={handleChartClick}
            />
          ))}
        </div>
      )}

      <GoldSignalNoti />
      <AverageLineNoti />

      {/* Biểu đồ Lợi Suất Trái Phiếu Chính Phủ Mỹ (10 Năm) */}
      <div style={{ marginBottom: '30px' }}>
        <USTreasury10YChart />
      </div>

      <div className="premium-intelligence-grid" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* 2-4. Phân tích Thị trường & Hệ thống Whale Intelligence (ListApi) */}
        <ListApi />

        {/* 5. Dữ liệu Kho COMEX Bạc (Silver) */}
        <ComexInventoryChart />

        {/* 6. 🐋 Phân tích Cá Mập — Whale Intelligence (WhaleIntelPanel) */}
        <WhaleIntelPanel />

        {/* 7. 🐋 Danh Sách 4 Ví Cá Mập Lớn Nhất (WhaleSignal) */}
        <WhaleSignal />

        {/* 8. Giá SLV - GLD - PSLV */}
        <GiaSLVGLDPSLV />
      </div>


      <CaMaplongshortChart />
      <GoldSilverDashBoard />

      <PredictionChart />
      <PredictionGauge />
      {dataXauVolume && (
        <div
          onClick={handleOpenVolumeModal}
          className={`dual-chart-container ${isVolumeModalOpen ? 'hidden' : ''}`}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
            marginTop: '40px',
            cursor: 'pointer'
          }}
        >

          <div
            style={{ width: '100%', marginTop: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* <IGSentiment /> */}
          </div>

          <div
            style={{ width: '100%', marginTop: '30px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <MyRsiChart />
          </div>
        </div>
      )}
      <MultiTimeframeGrowthChart />

      {/* <TableComparisonDataWeek fomo={fomo} /> */}

      <VolumeDualChartModal
        isOpen={isVolumeModalOpen}
        onClose={handleCloseVolumeModal}
        dataXauVolume={dataXauVolume}
        dataXagVolume={dataXagVolume}
        volumeZoomState={volumeZoomState}
        handleVolumeZoom={handleVolumeZoom}
        modalRef={volumeModalRef}
        hasMoreData={hasMoreData}
        isLoadingMore={isLoadingMore}
        loadNextPages={loadNextPages}
        loadAllPages={loadAllPages}
        resetToInitialPages={resetToInitialPages}
        avgVolumeXau={avgVolumeXau}
        avgVolumeXag={avgVolumeXag}
        sliderPage={sliderPage}
        accumulatedXauRawRef={accumulatedXagRawRef}
        pageSize={pageSize}
        handleVolumeSliderChange={handleSliderChange}
      />

      {zoomedSymbol && (
        <div className="fullscreen-modal" ref={modalRef}>
          <div className="modal-header">
            <h3 className="modal-title">{getSymbolName(zoomedSymbol)}</h3>
            <button className="modal-close-btn" onClick={handleCloseModal}>✕</button>
          </div>
          <div className="modal-content" style={{ width: '100%', height: '100%' }}>
            <FullScreenChart symbol={zoomedSymbol} />
          </div>
        </div>
      )}

      {dataAnalysis && (
        <div className="contain-bar-chart-xau-xag">
          <div className="div-first">
            <div className="contain-two-chart">
              <GrowBarChart
                p1={dataAnalysis.chiso_xau_xag_ancarat}
                p2={dataAnalysis.chiso_xau_xag_kim_ngan_phuc}
                p3={dataAnalysis.chiso_xau_xag_nguyen_lieu}
                p4={dataAnalysis.chiso_xau_xag_phuquy}
                p5={dataAnalysis.chiso_xau_xag_quocte}
                p6={dataAnalysis.chiso_xau_xag_SACOMBANK}
              />
              <div className="distance-title chart-container" onMouseMove={showTooltip} onMouseLeave={hideTooltip} style={{ marginRight: "20px" }}>
                <h2>{t("multichart.fomoGold")}</h2>
                <GaugeChart value={(dataAnalysis.chiso_fomo_vang_trong_nuoc * 10).toFixed(1)} size="large" showLabel={false} colors={["#ffffff"]} />
              </div>
              <div className="distance-title chart-container" style={{ marginRight: "20px" }}>
                <h2>{t("multichart.fomoSilver")}</h2>
                <GaugeChart value={(dataAnalysis.gia_chenh_lech_nguyenlieu_bac / 100000).toFixed(1)} size="large" showLabel={false} colors={["#ffffff"]} />
              </div>
            </div>
            <div className="table-circle-container">
              {/* LEFT: Table */}
              <div className="table-box">
                <TableData
                  dataAnalysis={{
                    [`${t("multichart.silver1TaelRate")} ${t("multichart.silver1TaelRateUnit")}`]: dataAnalysis.gia_bac_1_luong_nhan_ty_gia / 1000000,
                    [`${t("multichart.silver1KgRate")} ${t("multichart.silver1KgRateUnit")}`]: dataAnalysis.gia_bac_1kg_nhan_ty_gia / 1000000,
                    [`${t("multichart.silverSpread")} ${t("multichart.silverSpreadUnit")}`]: dataAnalysis.gia_chenh_lech_nguyenlieu_bac / 1000000,
                    [`${t("multichart.goldSpread")} ${t("multichart.goldSpreadUnit")}`]: dataAnalysis.gia_chenh_lech_vang_nguyen_lieu / 1000000,
                    [`${t("multichart.goldKitcoUsd")} ${t("multichart.goldKitcoUsdUnit")}`]: dataAnalysis.gia_vang_kitco_usd,
                    [`${t("multichart.goldRate")} ${t("multichart.goldRateUnit")}`]: dataAnalysis.gia_vang_nhan_ty_gia / 1000000,
                    [`${t("multichart.goldRawMaterial")} ${t("multichart.goldRawMaterialUnit")}`]: dataAnalysis.gia_vang_nguyenlieu / 1000000,
                    [`${t("multichart.silver1TaelRawMaterial")} ${t("multichart.silver1TaelRawMaterialUnit")}`]: dataAnalysis.gia_bac_nguyenlieu_1_luong / 1000000,
                    [`${t("multichart.silver1KgRawMaterial")} ${t("multichart.silver1KgRawMaterialUnit")}`]: dataAnalysis.gia_bac_nguyenlieu_1_kg / 1000000,
                    [`${t("multichart.silverKitcoUsd")} ${t("multichart.silverKitcoUsdUnit")}`]: dataAnalysis.gia_silver_kitco_usd,
                    [`${t("multichart.exchangeRate")} ${t("multichart.exchangeRateUnit")}`]: dataAnalysis.ty_gia_usd,
                  }}
                />
              </div>

              {/* RIGHT: SLV Circle */}
              <div
                className="circle-box"
                onClick={() => navigate('/slv-short-volume')}
                style={{ cursor: 'pointer' }}
              >
                <SLVShortCircle />
              </div>
            </div>

            <div style={{ justifyItems: "center", marginTop: "10px" }}>
              {translatedAdvice.map((text, index) => (
                <span
                  style={{ display: "block" }}
                  key={index}
                  dangerouslySetInnerHTML={{ __html: highlightNum(text) }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {tooltip.visible && <TooltipPortal x={tooltip.x} y={tooltip.y} />}


    </div>
  );
};

export default MultiChartViewer;



const highlightNum = (text) =>
  text.replace(
    /(\d+(\.\d+)?)/,
    '<span style="color:red;font-weight:bold;">$1</span>'
  );
