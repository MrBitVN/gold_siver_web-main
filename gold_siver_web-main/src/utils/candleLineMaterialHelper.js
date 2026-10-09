/**
 * Helper functions để xử lý dữ liệu Candlestick Chart
 */

/**

 * @param {Array} rawData - Mảng dữ liệu thô từ API [{ id_time, open, high, low, close }]
 * @returns {Array} Mảng đã format [{ x: timestamp, o, h, l, c }]
 */
export const formatLineMaterialData = (rawData, type = "buy") => {
  if (!rawData || rawData.length === 0) return [];

  // Sắp xếp theo id_time tăng dần
  const sortedData = [...rawData].sort((a, b) => a.id_time - b.id_time);

  return sortedData.map((item) => ({
    x: new Date(Number(item.id_time)), // chuyển timestamp → Date object
    y: type === "buy" ? item.buy || 0 : item.sell || 0,
  }));
};
export const formatLineMaterialDataXY = (rawData) => {
  if (!rawData || rawData.length === 0) return [];

  // Sắp xếp theo id_time tăng dần
  const sortedData = [...rawData].sort((a, b) => parseDateToTimestamp(a.x) - parseDateToTimestamp(b.x));

  const result = sortedData.map((item) => ({
    x: parseDateToTimestamp(item.x),
    y: item.y
  }));
  
  console.log('formatLineMaterialDataXY result:', result.slice(0, 2));
  return result;
};
export const formatLineMaterialDateData = (rawData, type = "buy") => {
  if (!rawData || rawData.length === 0) return [];

  // Helper function để parse date từ format DD/MM/YYYY
  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    
    // Nếu là format DD/MM/YYYY
    if (typeof dateString === 'string' && dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    
    // Fallback về parse thông thường
    return new Date(dateString);
  };

  const sortedData = rawData
    .filter(item => item && item.id_time) // tránh null
    .sort((a, b) => parseDate(a.id_time) - parseDate(b.id_time));

  const formatted = sortedData.map(item => {
    const yValue = item[type] ?? 0;
    
    // Debug: Log nếu giá trị cao (Vàng Sac hoặc Vàng Hàn Quốc)
    // if (yValue > 5000000) {
    //   console.log(`formatLineMaterialDateData [${type}]:`, {
    //     id_time: item.id_time,
    //     buy: item.buy,
    //     sell: item.sell,
    //     type: type,
    //     yValue: yValue,
    //     item: item
    //   });
    // }
    
    return {
      x: parseDate(item.id_time).getTime(),
      y: yValue,
    };
  });

  return formatted;
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



/**
 * Chuyển ngày sang timestamp hợp lệ cho chart
 * Hỗ trợ cả "dd/mm/yyyy" và "yyyy-mm-dd"
 * @param {string} dateStr
 * @returns {number} timestamp (ms) hoặc NaN nếu không hợp lệ
 */
function parseDateToTimestamp(dateStr) {
  if (!dateStr) return NaN;

  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;

  let match;
  if ((match = dateStr.match(ddmmyyyy))) {
    const [, day, month, year] = match.map(Number);
    return Date.UTC(year, month - 1, day); // Dùng UTC để thống nhất
  } else if ((match = dateStr.match(yyyymmdd))) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  } else {
    return NaN;
  }
}

