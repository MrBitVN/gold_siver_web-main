/**
 * Service để lấy dữ liệu phân tích tâm lý thị trường (Fear & Greed Index)
 */

const getProxyUrl = (path) => {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocalhost) {
    // Thay thế tên miền API bằng prefix proxy đã cấu hình
    return path.replace("https://api_gold.thinkdiff.us", "/api_gold");
  }

  return path;
};
// ------------------------------------------------------------


/**
 * Service để lấy dữ liệu phân tích tâm lý thị trường (Fear & Greed Index)
 */

// ✅ ÁP DỤNG HELPER CHO API ENDPOINT
const API_ENDPOINT = getProxyUrl("https://api_gold.thinkdiff.us/phantich_fear");

/**
 * Fetch Fear & Greed Index từ API
 * @returns {Promise<Array>} Mảng dữ liệu đã được sắp xếp theo thời gian TĂNG DẦN
 */
export const fetchFearIndex = async () => {
  try {
    const response = await fetch(API_ENDPOINT);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data.status === "success" && data.chi_so_noi_so) {
      // QUAN TRỌNG: Sắp xếp mảng theo id_time TĂNG DẦN (cũ nhất → mới nhất)
      const sortedData = [...data.chi_so_noi_so].sort((a, b) => {
        return new Date(a.id_time) - new Date(b.id_time);
      });

      return sortedData;
    }

    throw new Error("Invalid data structure");
  } catch (error) {
    console.error("Error fetching fear index:", error);
    throw error;
  }
};

/**
 * Lọc dữ liệu theo khoảng thời gian
 * @param {Array} data - Mảng dữ liệu đầy đủ đã sắp xếp
 * @param {number} days - Số ngày cần lấy (7, 30, 90, 365)
 * @returns {Array} Mảng dữ liệu đã lọc
 */
export const filterByDays = (data, days) => {
  if (!data || data.length === 0) return [];

  // Lấy N phần tử cuối cùng (mới nhất)
  return data.slice(-days);
};
