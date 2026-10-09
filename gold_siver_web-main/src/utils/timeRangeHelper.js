/**
 * Tính toán ngày bắt đầu dựa trên khoảng thời gian được chọn
 */
export const calculateStartDate = (range) => {
  const endDate = new Date();
  const startDate = new Date(endDate);

  switch (range) {
    case "1W":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "1M":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "6M":
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "1Y":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case "ALL":
      return null;
    default:
      startDate.setFullYear(startDate.getFullYear() - 1);
  }

  return startDate;
};

/**
 * Lọc dữ liệu theo khoảng thời gian
 */
export const filterDataByTimeRange = (data, range) => {
  if (!Array.isArray(data) || range === "ALL") return data;

  const startDate = calculateStartDate(range);
  if (!startDate) return data;

  const startTimestamp = startDate.getTime();
  return data.filter(item => Number(item.x) >= startTimestamp);
};

/**
 * Lấy giá trị Y lớn nhất cho mỗi ngày (bỏ trùng timestamp)
 */
export const getOnlyMax = (array) => {
  if (!Array.isArray(array)) return [];

  const map = new Map();

  for (const item of array) {
    const key = Number(item.x);
    const current = map.get(key);

    if (!current || item.y > current.y) {
      map.set(key, { x: key, y: item.y });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.x - b.x);
};

/**
 * Ghép 2 mảng theo ngày gần nhất (±1 ngày)
 * Tính tỷ lệ XAU / XAG
 */
export const mergeRatioByX = (arr1, arr2, type1 = 1) => {
  if (!Array.isArray(arr1) || !Array.isArray(arr2)) return [];

  const DAY = 24 * 60 * 60 * 1000;
  const ratioDivisor = type1 === 1 ? 26.666666 : 1;

  const baseMap = arr1.map(item => ({
    x: Number(item.x),
    y: item.y / ratioDivisor,
  }));

  const result = [];

  for (const item of arr2) {
    const x = Number(item.x);

    // tìm điểm gần nhất trong ±1 ngày
    let nearest = null;
    let minDiff = Infinity;

    for (const base of baseMap) {
      const diff = Math.abs(base.x - x);
      if (diff <= DAY && diff < minDiff) {
        nearest = base;
        minDiff = diff;
      }
    }

    if (!nearest || !nearest.y || nearest.y === 0) continue;

    const ratio = (item.y * 10) / nearest.y;
    
    // Kiểm tra giá trị ratio hợp lệ
    if (!isNaN(ratio) && isFinite(ratio) && ratio > 0) {
      result.push({
        x,
        y: ratio,
      });
    }
  }

  return result.sort((a, b) => a.x - b.x);
};
