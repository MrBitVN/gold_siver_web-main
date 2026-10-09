import React from "react";
import { getSymbolName } from "./chartHelpers";

/**
 * Component hiển thị biểu đồ fullscreen trong modal
 * Sử dụng iframe embed với đầy đủ tính năng
 */
const FullScreenChart = ({ symbol }) => {
  // Build embed URL cho fullscreen chart (hiển thị đầy đủ sidebar, details, etc.)
  const embedUrl = buildFullScreenEmbedUrl(symbol);

  return (
    <div className="fullscreen-chart-container"
      style={{ height: '100%',width:'100%' }}
    >
      <iframe
        src={embedUrl}
        frameBorder="0"
        allow="transparency; fullscreen"
        allowFullScreen
        className="tradingview-fullscreen-iframe"
        title={getSymbolName(symbol)}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

/**
 * Build embed URL cho fullscreen chart (đầy đủ tính năng)
 */
export const buildFullScreenEmbedUrl = (symbol) => {
  const baseUrl = "https://www.tradingview-widget.com/embed-widget/advanced-chart/";

  // Config riêng cho từng symbol
  let interval = "5";
  let hideVolume = false;
  let hideLegend = false;

  // Config đặc biệt cho DXY
  if (symbol === "TICKMILL:DXY") {
    interval = "60"; // DXY: 60 phút
    hideVolume = true; // Ẩn volume cho DXY
    hideLegend = false;
  }

  // Config đặc biệt cho XAUUSD (theo link mới)
  if (symbol === "FX_IDC:XAUUSD") {
    interval = "5"; // XAUUSD: 5 phút
    hideVolume = false;
  }

  // Config đặc biệt cho FRED:WM2NS (M2 Money Supply)
  if (symbol === "FRED:WM2NS") {
    interval = "W"; // M2 chỉ hỗ trợ khung tuần/tháng (>= 1W)
    hideVolume = true;
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

  const config = {
    width: "100%",
    height: "100%",
    symbol: symbol,
    interval: interval,
    timezone: "Asia/Ho_Chi_Minh",
    theme: "dark", // Dark mode (giữ nguyên)
    style: "1", // Candlestick
    backgroundColor: "rgba(26, 26, 26, 1)", // Dark background (giữ nguyên)
    withdateranges: true, // Cho phép chọn khoảng thời gian
    hide_side_toolbar: false, // Hiển thị sidebar đầy đủ (QUAN TRỌNG: phải false để hiện sidebar)
    hide_top_toolbar: false, // Hiển thị top toolbar
    hide_legend: hideLegend,
    hide_volume: hideVolume,
    allow_symbol_change: true, // Cho phép đổi symbol
    details: true, // QUAN TRỌNG: phải true để hiển thị performance metrics, seasonal indicators, technical analysis
    hotlist: symbol === "TICKMILL:DXY" ? false : true, // DXY: false, khác: true
    show_popup_button: true, // Hiển thị nút popup
    save_image: true,
    autosize: true,
    support_host: "https://www.tradingview.com",
    utm_source: symbol === "TICKMILL:DXY" ? "vangsaigon.vn" : "giavang.org",
    utm_medium: symbol === "TICKMILL:DXY" ? "widget" : "widget_new",
    utm_campaign: "advanced-chart",
    "page-uri": symbol === "TICKMILL:DXY" ? "vangsaigon.vn/" : "giavang.org/the-gioi/",
    locale: "vi_VN",
  };

  // Convert config to URL hash
  const configJson = JSON.stringify(config);
  const encodedConfig = encodeURIComponent(configJson);

  return `${baseUrl}?locale=vi_VN#${encodedConfig}`;
};

export default FullScreenChart;

