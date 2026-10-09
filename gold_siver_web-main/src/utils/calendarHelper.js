/**
 * Helper functions cho Economic Calendar
 */

// Mapping country code to country name
const COUNTRY_MAP = {
  USD: "US",
  EUR: "EU",
  GBP: "GB",
  JPY: "JP",
  AUD: "AU",
  CAD: "CA",
  CHF: "CH",
  CNY: "CN",
  NZD: "NZ",
  SGD: "SG",
  HKD: "HK",
  KRW: "KR",
  INR: "IN",
  MYR: "MY",
  THB: "TH",
  VND: "VN",
};

/**
 * Chuyển currency code sang country code cho react-country-flag
 * @param {string} currencyCode - USD, EUR, GBP...
 * @returns {string} - US, EU, GB...
 */
export const getCountryCode = (currencyCode) => {
  return COUNTRY_MAP[currencyCode] || currencyCode;
};

/**
 * Format thời gian từ ISO string sang định dạng "HH:mm - Thứ X, DD/MM"
 * @param {string} isoTime - "2025-11-03T15:00:00.706Z"
 * @returns {string} - "22:00 - Chủ Nhật, 03/11"
 */
export const formatCalendarTime = (isoTime) => {
  if (!isoTime) return "N/A";

  const date = new Date(isoTime);

  // Format giờ HH:mm
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  // Format ngày DD/MM
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  // Lấy thứ trong tuần
  const weekdays = [
    "Chủ Nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];
  const weekday = weekdays[date.getDay()];

  return `${hours}:${minutes} - ${weekday}, ${day}/${month}`;
};

/**
 * Lấy số sao importance (1-3)
 * @param {string|number} important - "3", "2", "1"
 * @returns {number} - 3, 2, 1
 */
export const getImportanceStars = (important) => {
  return parseInt(important) || 1;
};

/**
 * Xác định màu cho giá trị actual dựa trên result
 * @param {boolean} result - true = tốt, false = xấu
 * @returns {string} - CSS class name
 */
export const getResultColor = (result) => {
  if (result === true) return "calendar-positive"; // Xanh #20C997
  if (result === false) return "calendar-negative"; // Đỏ #E63946
  return "calendar-neutral"; // Xám #999
};

/**
 * Format số liệu kinh tế (actual, forecast, previous)
 * @param {number} value - Giá trị số
 * @param {string} unit - Đơn vị (K, M, B, %)
 * @returns {string} - "48.7", "42K", "50.8%"
 */
export const formatEconomicValue = (value, unit = "") => {
  if (value === null || value === undefined) return "N/A";

  // Nếu có đơn vị, thêm vào sau số
  if (unit) {
    return `${value}${unit}`;
  }

  return String(value);
};

/**
 * Sắp xếp calendars theo thời gian (gần nhất lên đầu)
 * @param {Array} calendars - Mảng calendar items
 * @returns {Array} - Mảng đã sắp xếp
 */
export const sortCalendarsByTime = (calendars) => {
  if (!calendars || !Array.isArray(calendars)) return [];

  return [...calendars].sort((a, b) => {
    const dateA = new Date(a.time);
    const dateB = new Date(b.time);
    return dateB - dateA; // Mới nhất lên đầu
  });
};

/**
 * Lọc calendars theo ngày (hôm nay, tuần này, tháng này)
 * @param {Array} calendars - Mảng calendar items
 * @param {string} filter - "today" | "week" | "month" | "all"
 * @returns {Array} - Mảng đã lọc
 */
export const filterCalendarsByDate = (calendars, filter = "all") => {
  if (!calendars || !Array.isArray(calendars) || filter === "all") {
    return calendars;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return calendars.filter((item) => {
    const eventDate = new Date(item.time);
    const eventDay = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate()
    );

    switch (filter) {
      case "today":
        return eventDay.getTime() === today.getTime();

      case "week": {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return eventDay >= weekAgo && eventDay <= today;
      }

      case "month": {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return eventDay >= monthAgo && eventDay <= today;
      }

      default:
        return true;
    }
  });
};
