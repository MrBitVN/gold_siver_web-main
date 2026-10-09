import { safeJsonFetch } from "../utils/apiHelper";
/**
 * Service để fetch dữ liệu COMEX Gold và Silver Inventory
 */


const API_COMEX_GOLD = "https://api_gold.thinkdiff.us/comex_gold_data";
const API_COMEX_SILVER = "https://api_gold.thinkdiff.us/comex_silver_data";

/**
 * Helper: đổi URL sang proxy khi đang chạy localhost
 */
const getApiUrl = (url) => {
  const isLocal = window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocal) {
    return url.replace("https://api_gold.thinkdiff.us", "/api_gold");
  }
  return url;
};

/**
 * Gọi API để lấy dữ liệu COMEX Gold Inventory
 * @returns {Promise<Array>} Dữ liệu vàng từ API
 */
export const fetchComexGoldData = async () => {
  try {
    const finalUrl = getApiUrl(API_COMEX_GOLD);
    return await safeJsonFetch(finalUrl);
  } catch (error) {
    console.error("Error fetching COMEX Gold data:", error);
    throw error;
  }
};

/**
 * Gọi API để lấy dữ liệu COMEX Silver Inventory
 * @returns {Promise<Array>} Dữ liệu bạc từ API
 */
export const fetchComexSilverData = async () => {
  try {
    const finalUrl = getApiUrl(API_COMEX_SILVER);
    return await safeJsonFetch(finalUrl);
  } catch (error) {
    console.error("Error fetching COMEX Silver data:", error);
    throw error;
  }
};

/**
 * Gọi API để lấy dữ liệu COMEX Silver Analysis (phân tích bạc)
 * @returns {Promise<Array>} Dữ liệu phân tích từ API
 */
export const fetchComexAnalysisData = async () => {
  try {
    return await safeJsonFetch("https://api_gold.thinkdiff.us/phantich_silver_history");
  } catch (error) {
    console.error("Error fetching COMEX Analysis data:", error);
    throw error;
  }
};

/**
 * Gọi API để lấy dữ liệu COMEX Gold & Silver Inventory song song
 * @returns {Promise<Object>} { goldData, silverData, analysisData }
 */
export const fetchComexInventoryData = async () => {
  try {
    const [goldRes, silverRes, analysisRes] = await Promise.allSettled([
      fetchComexGoldData(),
      fetchComexSilverData(),
      fetchComexAnalysisData()
    ]);
    const goldData = goldRes.status === "fulfilled" ? goldRes.value : null;
    const silverData = silverRes.status === "fulfilled" ? silverRes.value : null;
    const analysisData = analysisRes.status === "fulfilled" ? analysisRes.value : null;
    return { goldData, silverData, analysisData };
  } catch (error) {
    console.error("Error fetching COMEX Inventory data:", error);
    return { goldData: null, silverData: null, analysisData: null };
  }
};

