const API_ENDPOINTS_RAW = [
  "https://api_gold.thinkdiff.us/btmc",
  "https://api_gold.thinkdiff.us/ngoctham",
  "https://api_gold.thinkdiff.us/vangphutai",
  "https://api_gold.thinkdiff.us/pnj",
  "https://api_gold.thinkdiff.us/ancarat_giabac",
  "https://api_gold.thinkdiff.us/kimhoancamau",
  "https://api_gold.thinkdiff.us/kimchau_info",
  "https://api_gold.thinkdiff.us/vang_sinhdien",
  "https://api_gold.thinkdiff.us/vangchienminh",
  "https://api_gold.thinkdiff.us/kimnganphuc",
  "https://api_gold.thinkdiff.us/baotinlanvy",
  "https://api_gold.thinkdiff.us/ancarat_giavang",
  "https://api_gold.thinkdiff.us/lamngocthanh",
  "https://api_gold.thinkdiff.us/teokimtruc",
  "https://api_gold.thinkdiff.us/sjc_com_vn",
  "https://api_gold.thinkdiff.us/goldavenue",
  "https://api_gold.thinkdiff.us/suissegold",
  "https://api_gold.thinkdiff.us/igold_silver",
  "https://api_gold.thinkdiff.us/kanzjewels",
  "https://api_gold.thinkdiff.us/gvs_trading",
  "https://api_gold.thinkdiff.us/anekalogam",
  "https://api_gold.thinkdiff.us/aurum_gold",
  "https://api_gold.thinkdiff.us/aurum_silver",
  "https://api_gold.thinkdiff.us/aurum_silverSalt",
  "https://api_gold.thinkdiff.us/phuquy_bac",
  "https://api_gold.thinkdiff.us/phuquy_vang",
  "https://api_gold.thinkdiff.us/btmh_gold",
  "https://api_gold.thinkdiff.us/kimtin_com_vn",
  "https://api_gold.thinkdiff.us/orient",
  "https://api_gold.thinkdiff.us/malabar/silver",
  "https://api_gold.thinkdiff.us/malabar/gold",
  "https://api_gold.thinkdiff.us/tokuriki",
  "https://api_gold.thinkdiff.us/tanaka",
  "https://api_gold.thinkdiff.us/ishifuku",
  "https://api_gold.thinkdiff.us/candere",
  "https://api_gold.thinkdiff.us/vang_nguyenlieu_haihau_namdinh",
  "https://api_gold.thinkdiff.us/huythanhjewelry",
  "https://api_gold.thinkdiff.us/skjewellery",
  // "https://api_gold.thinkdiff.us/png" ,
  "https://api_gold.thinkdiff.us/doji",
  "https://api_gold.thinkdiff.us/vang_haihong",
  "https://api_gold.thinkdiff.us/vang_huongdiu",
  "https://api_gold.thinkdiff.us/socket_mihong_goldenfund",
  "https://api_gold.thinkdiff.us/chowsangsang_html",
  "https://api_gold.thinkdiff.us/chowtaiseng",
  "https://api_gold.thinkdiff.us/chowtaifook",
  "https://api_gold.thinkdiff.us/sbj_silver",
  "https://api_gold.thinkdiff.us/sbj_gold",
  "https://api_gold.thinkdiff.us/kimtung",
  "https://api_gold.thinkdiff.us/kimngoc",
  "https://api_gold.thinkdiff.us/quocbaolam",
  "https://api_gold.thinkdiff.us/kimthuy",
  "https://api_gold.thinkdiff.us/kimyen",
  "https://api_gold.thinkdiff.us/kimphatthoian",
  "https://api_gold.thinkdiff.us/lucngocthanh",
  "https://api_gold.thinkdiff.us/phuocthanh",
  "https://api_gold.thinkdiff.us/kimphathiepthanh",
  "https://api_gold.thinkdiff.us/kimphat",
  "https://api_gold.thinkdiff.us/quocbaoson",
  "https://api_gold.thinkdiff.us/quocbao",
  "https://api_gold.thinkdiff.us/kimhanh",
  "https://api_gold.thinkdiff.us/minhthanhbenluc",
  "https://api_gold.thinkdiff.us/myngoc",
  "https://api_gold.thinkdiff.us/kimton",
  "https://api_gold.thinkdiff.us/lapduc",
  "https://api_gold.thinkdiff.us/kimhungphat",
  "https://api_gold.thinkdiff.us/yenhien",
  "https://api_gold.thinkdiff.us/xuanmui",
  "https://api_gold.thinkdiff.us/haisen",
  "https://api_gold.thinkdiff.us/kimchauhaihau",
  "https://api_gold.thinkdiff.us/thanhxuandonganh",
  "https://api_gold.thinkdiff.us/daphuc",
  "https://api_gold.thinkdiff.us/nhahuong",
  "https://api_gold.thinkdiff.us/hjctaiquangninh",
  "https://api_gold.thinkdiff.us/kimchung",
  "https://api_gold.thinkdiff.us/hoatung",
  "https://api_gold.thinkdiff.us/quytung",
  "https://api_gold.thinkdiff.us/kimlien",
  "https://api_gold.thinkdiff.us/trungsinhthainguyen",
  "https://api_gold.thinkdiff.us/huongyen",
  "https://api_gold.thinkdiff.us/kimkhanhhanam",
  "https://api_gold.thinkdiff.us/haihong",
  "https://api_gold.thinkdiff.us/quanghanh",
  "https://api_gold.thinkdiff.us/sonha",
  "https://api_gold.thinkdiff.us/luhuong",
  "https://api_gold.thinkdiff.us/anhminh",
  "https://api_gold.thinkdiff.us/huongchi",
  "https://api_gold.thinkdiff.us/nhathahaiphong",
  "https://api_gold.thinkdiff.us/phidoan",
  "https://api_gold.thinkdiff.us/dainghia",
  "https://api_gold.thinkdiff.us/tienngoc",
  "https://api_gold.thinkdiff.us/phucthanhnamdinh",
  "https://api_gold.thinkdiff.us/phucthanhlongbien",
  "https://api_gold.thinkdiff.us/hoanhuelaocai",
  "https://api_gold.thinkdiff.us/koreagoldx_silver",
  "https://api_gold.thinkdiff.us/koreagoldx",
];

/**
 * Format số tiền từ VND sang dạng hiển thị dễ đọc
 * @param {number} amount - Số tiền cần format
 * @returns {string} - Số tiền đã được format
 */
export const formatPrice = (amount) => {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("vi-VN").format(amount);
};

/**
 * Tính chênh lệch giá (spread) giữa giá bán và giá mua
 * @param {number} sellPrice - Giá bán
 * @param {number} buyPrice - Giá mua
 * @returns {number} - Chênh lệch (sell - buy)
 */
export const calculateSpread = (sellPrice, buyPrice) => {
  if (!sellPrice || !buyPrice) return 0;
  return sellPrice - buyPrice;
};

/**
 * Gọi một API endpoint
 * @param {string} url - URL của API
 * @returns {Promise} - Promise chứa dữ liệu hoặc lỗi
 */

const fetchSingleAPI = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Kiểm tra cấu trúc dữ liệu
    if (data.status === "success" && data.data && data.data.data) {
      const priceData = data.data.data;
      // ✅ Kiểm tra priceData không null trước khi truy cập
      if (!priceData || !priceData.site) {
        throw new Error("Invalid priceData structure: missing site");
      }
      const site = priceData.site || data.data.site;

      // name, do_uy_tin và quoc_gia nằm ở root level của response
      const name = data.name || site;
      const do_uy_tin =
        typeof data.do_uy_tin !== "undefined" && data.do_uy_tin !== null
          ? data.do_uy_tin
          : undefined;
      const quoc_gia = data.quoc_gia || "Vietnam"; // Default Vietnam

      return {
        site,
        name,
        fetched_at: priceData.fetched_at || priceData.time_date_get,
        items: priceData.items || [],
        timestamp: priceData.site_timestamp || priceData.time_date_get,
        do_uy_tin,
        quoc_gia,
      };
    }

    throw new Error("Invalid data structure");
  } catch (error) {
    // Tắt log để giảm spam console
    // console.error(`Error fetching ${url}:`, error);
    throw error;
  }
};

/**
 * Gọi tất cả các API endpoints song song
 * @returns {Promise<Array>} - Mảng chứa dữ liệu từ tất cả các API thành công
 */
export const fetchAllGoldPrices = async () => {
  try {
    // Sử dụng Promise.allSettled để gọi tất cả API song song
    const results = await Promise.allSettled(
      API_ENDPOINTS_RAW.map((url) => fetchSingleAPI(url)),
    );

    // Lọc ra các API call thành công và lấy dữ liệu
    const successfulData = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    // Log các API call thất bại để debug
    const failedCalls = results
      .filter((result) => result.status === "rejected")
      .map((result, index) => ({
        url: API_ENDPOINTS[index],
        reason: result.reason,
      }));

    if (failedCalls.length > 0) {
      console.warn("Some API calls failed:", failedCalls);
    }

    return successfulData;
  } catch (error) {
    console.error("Error in fetchAllGoldPrices:", error);
    throw error;
  }
};

/**
 * Gọi API song song và emit từng vendor ngay khi hoàn thành (incremental loading)
 * Cải thiện UX: hiển thị vendor nhanh nhất trước, không đợi tất cả
 * @param {(vendor: object, loaded: number, total: number) => void} onVendorLoaded - Callback khi một vendor hoàn thành
 * @returns {Promise<Array>} - Mảng chứa dữ liệu từ tất cả các API thành công
 */
export const fetchGoldPricesIncremental = async (onVendorLoaded) => {
  const total = API_ENDPOINTS_RAW.length;
  let loaded = 0;
  const successfulData = [];

  try {
    // Tạo array các promise với callback khi complete
    const promises = API_ENDPOINTS_RAW.filter((_, index) => index === 0).map(
      (url) =>
        fetchSingleAPI(url)
          .then((vendor) => {
            loaded++;
            successfulData.push(vendor);
            // Emit vendor ngay khi xong
            if (onVendorLoaded) {
              try {
                onVendorLoaded(vendor, loaded, total);
              } catch (callbackError) {
                console.warn(
                  "Callback error in onVendorLoaded:",
                  callbackError,
                );
              }
            }
            return { status: "fulfilled", value: vendor };
          })
          .catch((error) => {
            loaded++;
            // Tắt log để giảm spam
            // console.error(`Failed to fetch ${url}:`, error);
            return { status: "rejected", reason: error, url };
          }),
    );

    // Đợi tất cả hoàn thành
    const results = await Promise.all(promises);

    // Log các API thất bại
    const failedCalls = results
      .filter((r) => r.status === "rejected")
      .map((r) => ({ url: r.url, reason: r.reason }));

    // Tắt warning log
    // if (failedCalls.length > 0) {
    //   console.warn("Some API calls failed (incremental):", failedCalls);
    // }

    return successfulData;
  } catch (error) {
    console.error("Error in fetchGoldPricesIncremental:", error);
    throw error;
  }
};

export const fetchOneGoldPriceIncremental = async (
  onVendorLoaded,
  priceData,
) => {
  const total = API_ENDPOINTS_RAW.length;
  let loaded = 0;
  const successfulData = [];

  try {
    // ---- SỬA QUAN TRỌNG: lọc các API trùng với site ----
    // Kiểm tra null trước khi truy cập
    if (!priceData || !priceData.site) {
      console.warn("priceData.site is missing, fetching all APIs");
      var apisToFetch = API_ENDPOINTS_RAW;
    } else {
      const siteKey = priceData.site.toLowerCase().replace(/\./g, "_");

      const API_INDEX = API_ENDPOINTS_RAW.filter((api) => {
        const endpoint = api.split("/").pop(); // ví dụ: btmc, pnj, goldavenue
        return siteKey.includes(endpoint.toLowerCase());
      });

      // Nếu không khớp API nào → fallback fetch toàn bộ
      var apisToFetch = API_INDEX.length > 0 ? API_INDEX : API_ENDPOINTS_RAW;
    }

    const promises = apisToFetch.map((url) =>
      fetchSingleAPI(url)
        .then((vendor) => {
          loaded++;
          successfulData.push(vendor);
          onVendorLoaded?.(vendor, loaded, total, priceData);
          return { status: "fulfilled", value: vendor };
        })
        .catch((error) => {
          loaded++;
          return { status: "rejected", reason: error, url };
        }),
    );

    await Promise.all(promises);
    return successfulData;
  } catch (error) {
    console.error("Error in fetchGoldPricesIncremental:", error);
    throw error;
  }
};
/**
 * Lấy thời gian cập nhật mới nhất từ tất cả các nhà cung cấp
 * @param {Array} pricesData - Mảng dữ liệu giá vàng
 * @returns {string} - Thời gian cập nhật mới nhất
 */
export const getLatestUpdateTime = (pricesData) => {
  if (!pricesData || pricesData.length === 0) return "";

  // Lấy thời gian mới nhất
  const latestData = pricesData.reduce((latest, current) => {
    if (!latest.timestamp) return current;
    return new Date(current.timestamp) > new Date(latest.timestamp)
      ? current
      : latest;
  }, pricesData[0]);

  return latestData.fetched_at || latestData.timestamp;
};
