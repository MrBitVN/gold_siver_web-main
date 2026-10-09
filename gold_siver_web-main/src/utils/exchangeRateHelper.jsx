/**
 * Utility functions cho Exchange Rate
 */
import React from "react";
import ReactCountryFlag from "react-country-flag";

/**
 * Format số tiền theo định dạng VNĐ
 * @param {number|null} amount - Số tiền cần format
 * @returns {string} Số tiền đã được format
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("vi-VN").format(amount);
};

/**
 * Lấy tên đầy đủ của ngoại tệ
 * @param {string} code - Mã ngoại tệ (USD, EUR, etc.)
 * @returns {string} Tên đầy đủ
 */
export const getCurrencyName = (code) => {
  const currencyNames = {
    USD: "ĐÔ LA MỸ",
    USD_TUDO: "USD TỰ DO",
    EUR: "EURO",
    GBP: "BẢNG ANH",
    JPY: "YÊN NHẬT",
    AUD: "ĐÔ LA ÚC",
    CAD: "ĐÔ LA CANADA",
    CHF: "FRANC THỤY SĨ",
    HKD: "ĐÔ LA HỒNG KÔNG",
    SGD: "ĐÔ LA SINGAPORE",
    THB: "BẠT THÁI LAN",
    KRW: "WON HÀN QUỐC",
    CNY: "NHÂN DÂN TỆ",
    INR: "RUPEE ẤN ĐỘ",
    MYR: "RINGGIT MALAYSIA",
    NOK: "KRONE NA UY",
    SEK: "KRONA THỤY ĐIỂN",
    DKK: "KRONE ĐAN MẠCH",
    RUB: "RUBLE NGA",
    KWD: "DINAR KUWAIT",
  };

  return currencyNames[code] || code;
};

/**
 * Map mã ngoại tệ với country code cho react-country-flag
 * @param {string} code - Mã ngoại tệ
 * @returns {string} Country code
 */
export const getCurrencyCountryCode = (code) => {
  const countryMap = {
    USD: "US",
    USD_TUDO: "US",
    EUR: "EU",
    GBP: "GB",
    JPY: "JP",
    AUD: "AU",
    CAD: "CA",
    CHF: "CH",
    HKD: "HK",
    SGD: "SG",
    THB: "TH",
    KRW: "KR",
    CNY: "CN",
    INR: "IN",
    MYR: "MY",
    NOK: "NO",
    SEK: "SE",
    DKK: "DK",
    RUB: "RU",
    KWD: "KW",
  };

  return countryMap[code] || "XX";
};

/**
 * Render quốc kỳ cho ngoại tệ
 * @param {string} code - Mã ngoại tệ
 * @param {number} size - Kích thước flag
 * @returns {JSX.Element} React Country Flag component
 */
export const getCurrencyFlag = (code, size = 24) => {
  const countryCode = getCurrencyCountryCode(code);
  
  // Xử lý đặc biệt cho EUR (không có country code)
  if (code === "EUR") {
    return <span style={{ fontSize: `${size}px` }}>🇪🇺</span>;
  }

  return (
    <ReactCountryFlag
      countryCode={countryCode}
      svg
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      title={getCurrencyName(code)}
    />
  );
};

/**
 * Lọc dữ liệu theo khoảng thời gian
 * @param {Object} data - Dữ liệu đã xử lý { "YYYY-MM-DD": {...} }
 * @param {number} days - Số ngày (7, 30, 90, 365)
 * @returns {Object} Dữ liệu đã lọc
 */
export const filterDataByDateRange = (data, days) => {
  if (!data || typeof data !== "object") return {};

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - days);

  const filtered = {};
  Object.keys(data)
    .sort()
    .forEach((dateStr) => {
      const date = new Date(dateStr);
      if (date >= startDate && date <= today) {
        filtered[dateStr] = data[dateStr];
      }
    });

  return filtered;
};

/**
 * Chuyển đổi date string từ "YYYY-MM-DD" sang "DD-MM-YYYY" cho URL
 * @param {string} dateStr - Ngày theo format "YYYY-MM-DD"
 * @returns {string} Ngày theo format "DD-MM-YYYY"
 */
export const formatDateForUrl = (dateStr) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
};

/**
 * Chuyển đổi date string từ "DD-MM-YYYY" sang "YYYY-MM-DD"
 * @param {string} dateStr - Ngày theo format "DD-MM-YYYY"
 * @returns {string} Ngày theo format "YYYY-MM-DD"
 */
export const parseDateFromUrl = (dateStr) => {
  if (!dateStr) return "";
  const [day, month, year] = dateStr.split("-");
  return `${year}-${month}-${day}`;
};

/**
 * Lấy danh sách các ngày gần nhất có dữ liệu
 * @param {Object} data - Dữ liệu đã xử lý
 * @param {number} count - Số ngày cần lấy (mặc định 7)
 * @returns {Array<string>} Mảng các ngày theo format "YYYY-MM-DD"
 */
export const getRecentDates = (data, count = 7) => {
  if (!data || typeof data !== "object") return [];

  return Object.keys(data)
    .sort()
    .reverse()
    .slice(0, count);
};

