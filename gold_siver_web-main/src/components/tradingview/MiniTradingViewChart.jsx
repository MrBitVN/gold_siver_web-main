import React, { useState, useEffect, useRef, useMemo } from "react";
import { getSymbolName } from "./chartHelpers";
import "./MiniTradingViewChart.css";
import { buildFullScreenEmbedUrl } from "./FullScreenChart";
import { useTranslation } from "react-i18next";
/**
 * Component hiển thị biểu đồ TradingView nhỏ (mini)
 * Sử dụng TradingView widget qua iframe embed với Lazy Loading và tối ưu RAM trên Mobile
 */
const MiniTradingViewChart = ({ symbol, onClick }) => {
  const { t, i18n } = useTranslation();
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isMobile = window.innerWidth < 768;
    // On mobile, use tight rootMargin (50px) to only mount what is immediately visible
    // and immediately unmount when scrolled out to free RAM/WebGL contexts.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else {
          // Unmount iframe on mobile and lower memory footprint
          if (isMobile) {
            setIsInView(false);
          }
        }
      },
      {
        rootMargin: isMobile ? "50px 0px 50px 0px" : "150px 0px 150px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const embedUrl = useMemo(
    () => (isInView ? buildEmbedUrl(symbol, true, i18n.language) : ""),
    [isInView, symbol, i18n.language]
  );

  return (
    <div
      ref={containerRef}
      className={`mini-tradingview-chart chart-symbol-${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`}
      onClick={() => onClick && onClick(symbol)}
    >
      <div className="chart-header">
        <h3 className="chart-title">{getSymbolName(symbol, i18n.language)}</h3>
        <span className="zoom-hint">{t("minitrading.zoomIn")}</span>
      </div>
      <div className="chart-container" style={{ width: '100%', position: 'relative' }}>
        {isInView ? (
          <iframe
            src={embedUrl}
            loading="lazy"
            frameBorder="0"
            allow="transparency; fullscreen"
            allowFullScreen
            className="tradingview-iframe"
            title={getSymbolName(symbol, i18n.language)}
            style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
          />
        ) : (
          <div className="tradingview-placeholder" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(20, 20, 20, 0.8)',
            borderRadius: '6px',
            color: '#94a3b8',
            fontSize: '11px',
            gap: '8px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255, 215, 0, 0.2)',
              borderTopColor: '#ffd700',
              borderRadius: '50%',
              animation: 'spin 1.2s linear infinite'
            }} />
            <span>{getSymbolName(symbol, i18n.language)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Build embed URL cho TradingView widget
 * @param {string} symbol - Symbol cần hiển thị
 * @param {boolean} isMini - true nếu là mini chart (ẩn sidebar), false nếu full
 * @returns {string} Embed URL
 */
const buildEmbedUrl = (symbol, isMini = false, lang = "vi") => {
  const baseUrl = "https://www.tradingview-widget.com/embed-widget/advanced-chart/";

  // Config riêng cho từng symbol
  let interval = "5"; // Mặc định 5 phút cho tất cả
  let hideVolume = false;
  let hideLegend = false;

  // Config đặc biệt cho DXY
  if (symbol === "TICKMILL:DXY") {
    interval = "5"; // DXY: 5 phút
    hideVolume = true; // Ẩn volume cho DXY
    hideLegend = false;
  }

  // Config đặc biệt cho XAUUSD (theo link mới)
  if (symbol === "FX_IDC:XAUUSD") {
    interval = "5"; // XAUUSD: 5 phút
    hideVolume = false;
  }


  // Config đặc biệt cho SSE:000001 (Shanghai Composite)
  if (symbol === "SSE:000001" || symbol === "TVC:SHCOMP") {
    interval = "D"; // Chỉ hỗ trợ khung D, W, M
    hideVolume = false;
  }

  // Config đặc biệt cho KRX:KOSPI200 / KRX:KOSPI (KOSPI Hàn Quốc)
  if (symbol === "KRX:KOSPI200" || symbol === "KRX:KOSPI" || symbol === "TVC:KOSPI") {
    interval = "D"; // Dữ liệu chỉ hỗ trợ khung D, W, M
    hideVolume = false;
  }
  const localeMap = {
    vi: "vi_VN",
    en: "en"
  };
  const config = {
    width: "100%",
    height: "100%",
    symbol: symbol,
    interval: interval,
    timezone: "Asia/Ho_Chi_Minh",
    theme: "dark", // Dark mode (giữ nguyên)
    style: "1", // Candlestick
    backgroundColor: "rgba(26, 26, 26, 1)", // Dark background (giữ nguyên)
    withdateranges: true, // Mini: false, Full: true
    hide_side_toolbar: isMini, // Mini: ẩn sidebar, Full: hiển thị
    hide_top_toolbar: false, // Luôn hiển thị top toolbar
    hide_legend: hideLegend,
    hide_volume: hideVolume,
    allow_symbol_change: !isMini, // Mini: false, Full: true
    details: !isMini, // Mini: false, Full: true
    hotlist: !isMini, // Mini: false, Full: true
    show_popup_button: !isMini, // Mini: false, Full: true
    save_image: true,
    autosize: true,
    support_host: "https://www.tradingview.com",
    utm_source: symbol === "TICKMILL:DXY" ? "vangsaigon.vn" : "giavang.org",
    utm_medium: symbol === "TICKMILL:DXY" ? "widget" : "widget_new",
    utm_campaign: "advanced-chart",
    "page-uri": symbol === "TICKMILL:DXY" ? "vangsaigon.vn/" : "giavang.org/the-gioi/",
    locale: localeMap[lang] || "en",
  };

  // Convert config to URL hash
  const configJson = JSON.stringify(config);
  const encodedConfig = encodeURIComponent(configJson);

  return `${baseUrl}?locale=${localeMap[lang] || "en"}#${encodedConfig}`;
};

export default MiniTradingViewChart;

