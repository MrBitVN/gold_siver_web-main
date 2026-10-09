import { getProxyUrl } from "../utils/apiHelper";

const API_ENDPOINT = "https://api_gold.thinkdiff.us/lich_su_tygia_dola";

/**
 * Gọi API để lấy lịch sử tỷ giá
 * @returns {Promise<Object>} Dữ liệu thô từ API
 */
export const fetchExchangeRateHistory = async () => {
    try {
        const response = await fetch(getProxyUrl(API_ENDPOINT));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching exchange rate history:", error);
        throw error;
    }
};

/**
 * Chuyển đổi dữ liệu từ API thành format dễ sử dụng
 * @param {Object} rawData - Dữ liệu thô từ API
 * @returns {Object} Dữ liệu đã xử lý theo format { "YYYY-MM-DD": { "USD": { buy, sell }, ... } }
 */
export const processApiData = (rawData) => {
    if (!rawData || !rawData.data || !Array.isArray(rawData.data) || rawData.data.length < 3) {
        console.error("Invalid API data structure");
        return {};
    }

    // Dữ liệu chính nằm trong response.data[2].data
    const mainData = rawData.data[2]?.data;
    if (!mainData || !Array.isArray(mainData)) {
        console.error("Invalid main data structure");
        return {};
    }

    const processed = {};

    mainData.forEach((item) => {
        if (!item.date) return;

        // Format date từ "2014-09-01 00:00:00" sang "2014-09-01"
        const dateStr = item.date.split(" ")[0];
        if (!processed[dateStr]) {
            processed[dateStr] = {};
        }

        // Xử lý từng currency
        Object.keys(item).forEach((key) => {
            // Bỏ qua các field không phải currency
            if (key === "date" || key === "id") return;

            try {
                // Parse JSON string thành object
                const currencyData = typeof item[key] === "string"
                    ? JSON.parse(item[key])
                    : item[key];

                if (currencyData && (currencyData.buy !== undefined || currencyData.sell !== undefined)) {
                    processed[dateStr][key] = {
                        buy: currencyData.buy,
                        sell: currencyData.sell,
                    };
                }
            } catch (e) {
                // Nếu không parse được, bỏ qua
                console.warn(`Failed to parse currency data for ${key}:`, e);
            }
        });
    });

    return processed;
};

/**
 * Lấy tỷ giá theo ngày cụ thể
 * @param {Object} processedData - Dữ liệu đã xử lý
 * @param {string} dateStr - Ngày theo format "YYYY-MM-DD"
 * @returns {Object|null} Tỷ giá của ngày đó hoặc null nếu không có
 */
export const getExchangeRateByDate = (processedData, dateStr) => {
    if (!processedData || !dateStr) return null;
    return processedData[dateStr] || null;
};

/**
 * Lấy ngày có dữ liệu mới nhất
 * @param {Object} processedData - Dữ liệu đã xử lý
 * @returns {string|null} Ngày có dữ liệu mới nhất hoặc null
 */
export const getLatestDateWithData = (processedData) => {
    if (!processedData || Object.keys(processedData).length === 0) return null;
    const dates = Object.keys(processedData).sort().reverse();
    return dates[0] || null;
};

/**
 * Tính toán thay đổi giá so với ngày trước
 * @param {Object} current - Giá hiện tại { buy, sell }
 * @param {Object} previous - Giá ngày trước { buy, sell }
 * @returns {Object} { buyChange, sellChange, buyPercent, sellPercent }
 */
export const calculatePriceChange = (current, previous) => {
    if (!current || !previous) {
        return {
            buyChange: null,
            sellChange: null,
            buyPercent: null,
            sellPercent: null,
        };
    }

    const buyChange = current.buy !== null && previous.buy !== null
        ? current.buy - previous.buy
        : null;

    const sellChange = current.sell !== null && previous.sell !== null
        ? current.sell - previous.sell
        : null;

    const buyPercent = buyChange !== null && previous.buy !== null && previous.buy !== 0
        ? ((buyChange / previous.buy) * 100).toFixed(2)
        : null;

    const sellPercent = sellChange !== null && previous.sell !== null && previous.sell !== 0
        ? ((sellChange / previous.sell) * 100).toFixed(2)
        : null;

    return {
        buyChange,
        sellChange,
        buyPercent,
        sellPercent,
    };
};

/**
 * Lấy ngày trước đó
 * @param {string} dateStr - Ngày theo format "YYYY-MM-DD"
 * @returns {string} Ngày trước đó
 */
export const getPreviousDate = (dateStr) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split("T")[0];
};

