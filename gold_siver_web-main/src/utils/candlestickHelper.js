/**
 * Helper functions để xử lý dữ liệu Candlestick Chart
 */

/**

 * @param {Array} rawData - Mảng dữ liệu thô từ API [{ id_time, open, high, low, close }]
 * @returns {Array} Mảng đã format [{ x: timestamp, o, h, l, c }]
 */
export const formatCandlestickData = (rawData) => {
  if (!rawData || rawData.length === 0) return [];

  // Sắp xếp theo id_time TĂNG DẦN (cũ nhất → mới nhất)
  const sortedData = [...rawData].sort((a, b) => {
    return new Date(a.id_time) - new Date(b.id_time);
  });

  // format chartjs-chart-financial
  // Format: { x: timestamp, o: open, h: high, l: low, c: close }
  const formattedData = sortedData.map((item) => ({
    x: new Date(item.id_time).getTime(),
    o: item.open || 0, // Open
    h: item.high || 0, // High
    l: item.low || 0, // Low
    c: item.close || 0, // Close
  }));

  return formattedData;
};

/**
 * Format số tiền hiển thị (VND)
 * @param {number} amount - Số tiền
 * @returns {string} Số tiền đã format
 */
export const formatCurrency = (amount) => {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("vi-VN").format(amount);
};

//hq
// ...existing code...

/**
 * Format dữ liệu vàng Hàn Quốc cho Candlestick Chart
 * @param {Array} rawData - Mảng records từ API
 * @returns {Array} [{ x, o, h, l, c }]
 */
// export const formatVangHanQuocCandlestick = (rawData) => {
//   if (!rawData || rawData.length === 0) return [];
//   return rawData.map((item) => ({
//     x: new Date(item.date_key).getTime(),
//     o: item.gold_pure.buy_vnd || 0, // Open: giá mua VND
//     h: item.gold_pure.sell_vnd || 0, // High: giá bán VND
//     l: item.gold_pure.buy_krw || 0, // Low: giá mua KRW
//     c: item.gold_pure.sell_krw || 0, // Close: giá bán KRW
//   }));
// };
// ...existing code...



export function sortByField(arr, key, asc = true) {
  return arr.sort((a, b) => {
    const v1 = a[key];
    const v2 = b[key];

    // Nếu là ngày
    if (typeof v1 === "string" && /\d{4}-\d{2}-\d{2}/.test(v1)) {
      return asc ? new Date(v1) - new Date(v2) : new Date(v2) - new Date(v1);
    }

    // Nếu là số
    return asc ? v1 - v2 : v2 - v1;
  });
}
