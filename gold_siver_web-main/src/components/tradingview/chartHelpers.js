/**
 * Helper functions cho TradingView charts
 */

/**
 * Lấy tên hiển thị từ symbol
 * @param {string} symbol - Symbol cần hiển thị
 * @returns {string} Tên hiển thị
 */
export const getSymbolName = (symbol, lang = "vi") => {
  const symbolMap = {
    "FX_IDC:XAUUSD": {
      vi: "Vàng Thế giới (XAU/USD)",
      en: "Gold (XAU/USD)"
    },
    "OANDA:XAUXAG": {
      vi: "Tỷ lệ Vàng/Bạc (XAU/XAG)",
      en: "Gold/Silver Ratio (XAU/XAG)"
    },
    "FX_IDC:XAGUSD": {
      vi: "Bạc Thế giới (XAG/USD)",
      en: "Silver (XAG/USD)"
    },
    "TICKMILL:DXY": {
      vi: "Dollar Index (DXY)",
      en: "US Dollar Index (DXY)"
    },
    "FRED:WM2NS": {
      vi: "Cung Tiền M2 Mỹ (WM2NS)",
      en: "US M2 Money Supply (WM2NS)"
    },
    "TVC:UKOIL": {
      vi: "Dầu Thô Brent (UKOIL)",
      en: "Brent Crude Oil (UKOIL)"
    },
    "OANDA:XCUUSD": {
      vi: "Đồng Thế giới (XCU/USD)",
      en: "Copper (XCU/USD)"
    },
    "FOREXCOM:SPX500": {
      vi: "S&P 500 (SPX)",
      en: "S&P 500 Index (SPX)"
    },
    "BITSTAMP:BTCUSD": {
      vi: "Bitcoin (BTC/USD)",
      en: "Bitcoin (BTC/USD)"
    },
    "FOREXCOM:JP225": {
      vi: "Chứng Khoán Nhật Bản (Nikkei 225)",
      en: "Japan Stocks (Nikkei 225)"
    },
    "FX_IDC:USDJPY": {
      vi: "Đô la Mỹ / Yên Nhật (USD/JPY)",
      en: "US Dollar / Japanese Yen (USD/JPY)"
    },
    "TVC:KOSPI": {
      vi: "Chứng Khoán Hàn Quốc (KOSPI)",
      en: "Korea Stocks (KOSPI)"
    },
    "KRX:KOSPI200": {
      vi: "Chứng Khoán Hàn Quốc (KOSPI 200)",
      en: "Korea Stocks (KOSPI 200)"
    },
    "KRX:KOSPI": {
      vi: "Chứng Khoán Hàn Quốc (KOSPI)",
      en: "Korea Stocks (KOSPI)"
    },
    "CAPITALCOM:KOR200": {
      vi: "Chứng Khoán Hàn Quốc (KOSPI 200)",
      en: "Korea Stocks (KOSPI 200)"
    },
    "AMEX:EWY": {
      vi: "Chứng Khoán Hàn Quốc (KOSPI 200)",
      en: "Korea Stocks (KOSPI 200)"
    },
    "AMEX:INDY": {
      vi: "Chứng Khoán Ấn Độ (Nifty 50)",
      en: "India Stocks (Nifty 50)"
    },
    "NASDAQ:INDY": {
      vi: "Chứng Khoán Ấn Độ (Nifty 50)",
      en: "India Stocks (Nifty 50)"
    },
    "SSE:000001": {
      vi: "Chứng Khoán Thượng Hải (Shanghai Composite)",
      en: "Shanghai Composite Index"
    }
  };
  return symbolMap[symbol]?.[lang] || symbol;
};
