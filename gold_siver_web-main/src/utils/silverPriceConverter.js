/**
 * Quy đổi giá bạc về đơn vị chuẩn
 * Mặc định: VND / lượng
 */

// 1 oz bạc ≈ 0.829 lượng
const OZ_TO_LUONG = 0.829;

// Tỷ giá tiền tệ (có thể thay bằng API sau)
const CURRENCY_RATE_TO_VND = {
  USD: 25000,
  GBP: 32000,
  CHF: 28000,
  INR: 300,
  JPY: 170,
  KRW: 19,
  RUB: 270,
  AED: 6800,
  VND: 1,
};

/**
 * Quy đổi giá bạc sang VND / lượng
 * @param {number} price
 * @param {string} unit ví dụ: "USD/Oz"
 */
export function convertSilverPriceToVND(price, unit) {
  if (typeof price !== "number" || !unit) return null;

  const [currency, measure] = unit.split("/");
  const rate = CURRENCY_RATE_TO_VND[currency] || 1;

  let vndPrice = price * rate;

  if (measure?.toLowerCase() === "oz") {
    vndPrice = vndPrice * OZ_TO_LUONG;
  }

  return Math.round(vndPrice);
}
