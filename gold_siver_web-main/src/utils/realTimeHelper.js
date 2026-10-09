/**
 * Helper functions để trích xuất dữ liệu real-time từ WebSocket
 * Chỉ lấy các chỉ số quan trọng
 */

/**
 * Helper: Tìm item theo name
 */
const findItem = (array, name, location = "hanoi") => {
  if (!array || !Array.isArray(array)) return null;
  const item = array.find((i) => i.name === name);
  if (!item) return null;
  return item[location] || item;
};

/**
 * 1. XAU/USD - Giá vàng quốc tế (oz)
 */
export const getXauUsd = (data) => {
  // Tìm trong nhiều sources có thể
  if (data?.currencyNationWide) {
    const xau = findItem(data.currencyNationWide, "XAUUSD", "hanoi");
    if (xau) return xau;
  }
  
  // Fallback: tìm trong goldNationWide
  if (data?.goldNationWide) {
    const xau = findItem(data.goldNationWide, "XAUUSD", "hanoi");
    if (xau) return xau;
  }
  
  return null;
};

/**
 * 2. Vàng nguyên liệu 9999 - Hà Nội
 */
export const getGold9999Hanoi = (data) => {
  if (!data?.goldNationWide) return null;
  return findItem(data.goldNationWide, "999,9 TD", "hanoi");
};

/**
 * 3. Vàng nguyên liệu 9999 - Sài Gòn
 */
export const getGold9999Saigon = (data) => {
  if (!data?.goldNationWide) return null;
  return findItem(data.goldNationWide, "999,9 TD", "saigon");
};

/**
 * 4. Tỷ giá USD/VND
 */
export const getUsdVnd = (data) => {
  if (!data?.currencyNationWide) return null;
  return findItem(data.currencyNationWide, "USD", "hanoi");
};

/**
 * 5. Giá vàng quy đổi = XAU/USD x Tỷ giá x 1.20565303
 * Công thức: 1 oz = 31.1035g, 1 lượng = 37.5g → 37.5/31.1035 = 1.20565303
 */
export const getGoldConversion = (data) => {
  const xauUsd = getXauUsd(data);
  const usdVnd = getUsdVnd(data);
  
  if (!xauUsd?.buy || !usdVnd?.buy) return null;
  
  const buyConverted = xauUsd.buy * usdVnd.buy * 1.20565303;
  const sellConverted = xauUsd.sell * usdVnd.sell * 1.20565303;
  
  return {
    buy: Math.round(buyConverted),
    sell: Math.round(sellConverted),
  };
};

/**
 * 6. Giá SJC tự do (SJC TD)
 */
export const getSjcFree = (data) => {
  if (!data?.sjcNationWide) return null;
  return findItem(data.sjcNationWide, "SJC TD", "hanoi");
};

/**
 * 7. XAG/USD - Giá bạc quốc tế (oz)
 */
export const getXagUsd = (data) => {
  // Tìm trong silver_price trước
  if (data?.silver_price) {
    const xag = findItem(data.silver_price, "XAGUSD", "hanoi");
    if (xag) return xag;
  }
  
  // Fallback: tìm trong currencyNationWide
  if (data?.currencyNationWide) {
    const xag = findItem(data.currencyNationWide, "XAGUSD", "hanoi");
    if (xag) return xag;
  }
  
  return null;
};

/**
 * 8. Giá bạc 1 cân Hà Nội = (XAG/USD x Tỷ giá) / 0.02835
 * Công thức: 1 oz = 31.1035g, 1 cân = 604.79g → 31.1035/604.79 ≈ 0.02835
 */
export const getSilverPerCanHanoi = (data) => {
  // Lấy XAG/USD từ silver_price
  const xagUsd = data?.silver_price 
    ? findItem(data.silver_price, "XAGUSD", "hanoi")
    : null;
    
  // Lấy USD/VND từ currencyNationWide
  const usdVnd = data?.currencyNationWide
    ? findItem(data.currencyNationWide, "USD", "hanoi")
    : null;
  
  if (xagUsd?.buy && usdVnd?.buy) {
    const buyPrice = (xagUsd.buy * usdVnd.buy * 26.6666 * 1.20565303);
    const sellPrice = (xagUsd.sell * usdVnd.sell * 26.6666 * 1.20565303);
    
    return {
      buy: Math.round(buyPrice),
      sell: Math.round(sellPrice),
    };
  }
  
  return null;
};

/**
 * 9. Giá bạc 1 cân Sài Gòn = (XAG/USD x Tỷ giá) / 0.02835
 */
export const getSilverPerCanSaigon = (data) => {
  // Lấy XAG/USD từ silver_price
  const xagUsd = (data?.silver_price 
    ? findItem(data.silver_price, "GOLDENFUND_1L", "saigon")
    : null) ;
    
  // Lấy USD/VND từ currencyNationWide
  const usdVnd = data?.currencyNationWide
    ? findItem(data.currencyNationWide, "USD", "saigon")
    : null;
  
  if (xagUsd?.buy && usdVnd?.buy) {
    const buyPrice = (xagUsd.buy - 80 ) *   26.6666 * 1000 ;
    const sellPrice = (xagUsd.sell -  180 ) *   26.6666 * 1000;
    
    return {
      buy: Math.round(buyPrice),
      sell: Math.round(sellPrice),
    };
  }
  
  return null;
};

/**
 * Format giá tiền
 */
export const formatTickerPrice = (price) => {
  if (!price && price !== 0) return "N/A";
  return new Intl.NumberFormat("vi-VN").format(Math.round(price));
};
