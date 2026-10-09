import { getVang247FileUrl } from "./allVang247Service";

/**
 * Format số tiền từ VND sang dạng hiển thị dễ đọc
 */
export const formatPrice = (amount) => {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("vi-VN").format(amount);
};

/**
 * Tính chênh lệch giá (spread) giữa giá bán và giá mua
 */
export const calculateSpread = (sellPrice, buyPrice) => {
  if (!sellPrice || !buyPrice) return 0;
  return sellPrice - buyPrice;
};

/**
 * Gọi API tổng hợp Vang247
 * @param {number|string} day
 * @param {number|string} month
 * @param {number|string} year
 * @param {number|string} hour
 * @param {number|string} minute
 * @param {number|string|null} second
 */
export const fetchVangOneDayData = async (
  day,
  month,
  year,
  hour,
  minute,
  second = null,
) => {
  try {
    const url = getVang247FileUrl(day, month, year, hour, minute, second);
    console.log("url getVang247FileUrl: ", url);
    if (!url) {
      throw new Error(
        `Invalid parameters when building Vang247 file URL: ${day}/${month}/${year} ${hour}:${minute}`,
      );
    }

    const res = await fetch(url);

    if (!res.ok) {
      // Xử lý các lỗi HTTP khác nhau
      if (res.status === 404 || res.status === 500) {
        const error = new Error(
          `Không tìm thấy dữ liệu cho ngày ${day}/${month}/${year} lúc ${hour}:${minute}`,
        );
        error.status = res.status;
        error.isNotFound = true;
        throw error;
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    console.log("data", data);
    if (!data.data || !data.data.list_server) {
      throw new Error("Invalid data structure");
    }

    // ✅ Lọc bỏ các server null/undefined
    const validServers = (data.data.list_server || []).filter(
      (server) => server != null,
    );

    // Map lại structure giống các API cũ
    const responseResult = validServers.map((server) => ({
      site: server.site || server.data?.site || "unknown",
      name: server.name || server.data?.name || "N/A",
      fetched_at: server.data?.data?.fetched_at || null,
      timestamp: server.data?.data?.site_timestamp || null,
      items: server.data?.data?.items || server.data?.items || [],
      do_uy_tin: server.do_uy_tin || null,
      quoc_gia: server.quoc_gia || null,
      maps: server.maps || [],
    }));
    console.log("list_server", responseResult);
    return {
      list_server: responseResult,
      phan_tich: data.data.phan_tich,
      tin_tuc: data.data.tintuc,
      bieu_do: data.data.bieudo,
    };
  } catch (error) {
    if (error.isNotFound) {
      // Không log lỗi 404/500 vì đây là trường hợp bình thường (file chưa có)
      throw error;
    }
    console.error("Error fetching Vang247 prices:", error.message);
    throw error;
  }
};

/**
 * Tìm file gần nhất (trước đó) từ danh sách files khi không tìm thấy file chính xác
 * @param {Array} files - Danh sách files có { hour, minute, day, month, year }
 * @param {string} targetHour - Giờ mục tiêu
 * @param {string} targetMinute - Phút mục tiêu
 * @returns {Object|null} - File gần nhất hoặc null
 */
export const findNearestAvailableFile = (files, targetHour, targetMinute) => {
  if (!files || files.length === 0) return null;

  const targetTime = new Date(
    `2000-01-01 ${String(targetHour).padStart(2, "0")}:${String(targetMinute).padStart(2, "0")}:00`,
  ).getTime();

  // Tìm file gần nhất (trước đó) - sắp xếp theo thời gian giảm dần
  const sortedFiles = [...files].sort((a, b) => {
    const timeA = new Date(
      `2000-01-01 ${String(a.hour).padStart(2, "0")}:${String(a.minute).padStart(2, "0")}:00`,
    ).getTime();
    const timeB = new Date(
      `2000-01-01 ${String(b.hour).padStart(2, "0")}:${String(b.minute).padStart(2, "0")}:00`,
    ).getTime();
    return timeB - timeA; // Sắp xếp giảm dần (mới nhất trước)
  });

  // Tìm file gần nhất trước thời gian mục tiêu
  const nearestFile = sortedFiles.find((file) => {
    const fileTime = new Date(
      `2000-01-01 ${String(file.hour).padStart(2, "0")}:${String(file.minute).padStart(2, "0")}:00`,
    ).getTime();
    return fileTime <= targetTime;
  });

  // Nếu không tìm thấy file trước đó, lấy file mới nhất
  return nearestFile || sortedFiles[sortedFiles.length - 1] || null;
};

/**
 * Lấy thời gian cập nhật mới nhất từ tất cả các nhà cung cấp
 */
export const getLatestUpdateTime = (pricesData) => {
  if (!pricesData || pricesData.length === 0) return "";

  const latestData = pricesData.reduce((latest, current) => {
    if (!latest.timestamp) return current;
    return new Date(current.timestamp) > new Date(latest.timestamp)
      ? current
      : latest;
  }, pricesData[0]);

  return latestData.fetched_at || latestData.timestamp;
};
