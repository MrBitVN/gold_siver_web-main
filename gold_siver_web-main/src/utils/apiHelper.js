/**
 * Tiện ích hỗ trợ các thao tác API
 */

/**
 * Helper: đổi URL sang proxy khi đang chạy localhost
 */
export const getProxyUrl = (url) => {
  if (!url) return url;
  const isLocal = window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocal && typeof url === 'string') {
    return url.replace("https://api_gold.thinkdiff.us", "/api_gold");
  }
  return url;
};

/**
 * Helper: Đọc response dưới dạng text và thay thế NaN bằng null trước khi parse JSON
 * Điều này cần thiết vì một số API trả về NaN - vốn không hợp lệ trong JSON chuẩn
 * 
 * @param {string} url URL cần fetch
 * @param {Object} options Options cho fetch
 * @returns {Promise<any>} Dữ liệu JSON đã được xử lý
 */
export const safeJsonFetch = async (url, options = {}) => {
  const finalUrl = getProxyUrl(url);
  const response = await fetch(finalUrl, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const text = await response.text();
  
  // Thay thế NaN bằng null (sử dụng regex an toàn để thay thế mọi giá trị NaN đứng độc lập)
  // NaN không phải là kiểu dữ liệu hợp lệ trong JSON chuẩn
  const sanitizedText = text.replace(/\bNaN\b/g, 'null');
  
  try {
    return JSON.parse(sanitizedText);
  } catch (e) {
    console.error("JSON Parse Error after sanitization:", e);
    // Nếu vẫn lỗi, thử parse trực tiếp để lấy lỗi gốc của trình duyệt
    return JSON.parse(text);
  }
};

