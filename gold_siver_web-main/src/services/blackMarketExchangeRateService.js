/**
 * Service để lấy dữ liệu tỷ giá ngoại tệ chợ đen từ API view_full_data_json
 */

import { fetchVang247FileList, fetchVang247SingleFile } from "./allVang247Service";

/**
 * Chuyển đổi URL từ thinkdiff.us sang api_gold.thinkdiff.us để tránh CORS
 * @param {string} url - URL gốc
 * @returns {string} URL đã được chuyển đổi
 */
const convertToApiGoldUrl = (url) => {
    if (!url) return url;

    // Nếu URL đã là api_gold.thinkdiff.us thì không cần chuyển đổi
    if (url.includes("api_gold.thinkdiff.us")) {
        return url;
    }

    // Chuyển từ thinkdiff.us sang api_gold.thinkdiff.us
    // Ví dụ: https://thinkdiff.us/vang247_xyz/28_11_2025/28_11_2025_6_28.json
    // -> https://api_gold.thinkdiff.us/view_full_data_json/28_11_2025/28_11_2025_6_28.json
    if (url.includes("thinkdiff.us")) {
        // Tìm phần path sau domain
        const urlMatch = url.match(/thinkdiff\.us\/(.+)$/);
        if (urlMatch) {
            const path = urlMatch[1];
            // Nếu path có dạng vang247_xyz/..., chuyển thành view_full_data_json/...
            const convertedPath = path.replace(/^vang247_xyz\//, "view_full_data_json/");
            return `https://api_gold.thinkdiff.us/${convertedPath}`;
        }
    }

    return url;
};

/**
 * Lấy URL file mới nhất cho ngày hiện tại
 * @param {string} day - Ngày (DD)
 * @param {string} month - Tháng (MM)
 * @param {string} year - Năm (YYYY)
 * @returns {Promise<string|null>} URL của file mới nhất hoặc null nếu không tìm thấy
 */
const getLatestFileUrl = async (day, month, year) => {
    try {
        const files = await fetchVang247FileList(day, month, year);
        if (!files || files.length === 0) {
            return null;
        }

        // Sắp xếp theo thời gian (mới nhất trước)
        const sortedFiles = [...files].sort((a, b) => {
            const timeA = a.modified_time || 0;
            const timeB = b.modified_time || 0;
            return timeB - timeA;
        });

        const originalUrl = sortedFiles[0]?.link;
        if (!originalUrl) return null;

        // Chuyển đổi URL để tránh CORS
        return convertToApiGoldUrl(originalUrl);
    } catch (error) {
        console.error("Error getting latest file URL:", error);
        return null;
    }
};

/**
 * Lấy dữ liệu tỷ giá chợ đen mới nhất
 * @returns {Promise<Array|null>} Mảng dữ liệu tỷ giá hoặc null nếu lỗi
 */
export const fetchBlackMarketExchangeRates = async () => {
    try {
        // Lấy ngày hiện tại
        const now = new Date();
        const day = String(now.getDate()).padStart(2, "0");
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const year = String(now.getFullYear());

        // Thử lấy file mới nhất của ngày hiện tại
        let fileUrl = await getLatestFileUrl(day, month, year);

        // Nếu không có dữ liệu hôm nay, thử ngày hôm qua
        if (!fileUrl) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const prevDay = String(yesterday.getDate()).padStart(2, "0");
            const prevMonth = String(yesterday.getMonth() + 1).padStart(2, "0");
            const prevYear = String(yesterday.getFullYear());
            fileUrl = await getLatestFileUrl(prevDay, prevMonth, prevYear);
        }

        if (!fileUrl) {
            console.warn("Không tìm thấy dữ liệu tỷ giá chợ đen");
            return null;
        }

        // Fetch dữ liệu từ file
        console.log("fileUrl: ", fileUrl);
        
        const response = await fetchVang247SingleFile(fileUrl);

        // Kiểm tra cấu trúc dữ liệu
        if (!response || !response.data || !response.data.chogia_vn || !response.data.chogia_vn.data) {
            console.warn("Cấu trúc dữ liệu không đúng:", response);
            return null;
        }

        return response.data.chogia_vn.data;
    } catch (error) {
        console.error("Error fetching black market exchange rates:", error);
        return null;
    }
};

