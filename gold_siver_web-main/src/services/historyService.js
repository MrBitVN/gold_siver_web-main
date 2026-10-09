/**
 * Service để lấy dữ liệu lịch sử giá (Candlestick)
 */

import { formatCandlestickData } from "../utils/candlestickHelper";
import { formatLineMaterialData, formatLineMaterialDataXY, formatLineMaterialDateData } from "../utils/candleLineMaterialHelper";

// ✅ THÊM HELPER NÀY VÀO FILE NÀY HOẶC MỘT FILE CHUNG
const getProxyUrl = (path) => {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // Nếu ở localhost, loại bỏ tên miền và thay bằng prefix proxy
  if (isLocalhost) {
    // Tên miền cho các API này là api_gold.thinkdiff.us
    return path.replace("https://api_gold.thinkdiff.us", "/api_gold");
  }

  return path;
};
// ------------------------------------------------------------

/**
 * Service để lấy dữ liệu lịch sử giá (Candlestick)
 */
// ✅ ÁP DỤNG HELPER CHO TẤT CẢ CÁC HẰNG SỐ
const API_ENDPOINT = getProxyUrl(
  "https://api_gold.thinkdiff.us/history_sjc_nguyenlieu_USD_SILVER_GOLDENFUN"
);

// Api nguyên liệu mới từ 2009
const API_ENDPOINT_MATERIAL = getProxyUrl(
  "https://api_gold.thinkdiff.us/history_lich_su_vang_nguyen_lieu_kimtin_tu_2009"
);

// Api history goonus
const API_ENDPOINT_HISTORY_GOONUS = getProxyUrl(
  "https://api_gold.thinkdiff.us/history_goonus"
);

const API_ENDPOINT_HISTORY_BAC_PHUQUY = getProxyUrl(
  "https://api_gold.thinkdiff.us/history_bac_phuquy"
);

const API_ENDPOINT_HISTORY_PHUQUY_GOLD = getProxyUrl(
  "https://api_gold.thinkdiff.us/phuquy_gold_history"
);

const API_ENDPOINT_HISTORY_HANQUOC = getProxyUrl(
  "https://api_gold.thinkdiff.us/korea_gold_history"
); //

const API_ENDPOINT_HISTORY_VANG_SAC = getProxyUrl(
  "https://api_gold.thinkdiff.us/sacombank_vang_history"
);

const API_ENDPOINT_HISTORY_BAC_SAC = getProxyUrl(
  "https://api_gold.thinkdiff.us/sacombank_bac_history"
);

const API_ENDPOINT_HISTORY_SJC_GOLD = getProxyUrl("https://api_gold.thinkdiff.us/sacombank_vang_history");

const API_ENDPOINT_HISTORY_SJC_SILVER = getProxyUrl("https://api_gold.thinkdiff.us/sacombank_bac_history");

// ... (Phần còn lại của hàm fetchCandlestickData giữ nguyên)
/**
 * Fetch dữ liệu Candlestick từ API
 * @returns {Promise<Object>} { sjcData, nguyenLieuData, usdData }
 */
export const fetchCandlestickData = async () => {
  try {
    const response = await fetch(API_ENDPOINT);
    const responseMaterial = await fetch(API_ENDPOINT_MATERIAL);
    const responseHistoryGoonus = await fetch(API_ENDPOINT_HISTORY_GOONUS);

    const responseHistorySJC_GOLD = await fetch(API_ENDPOINT_HISTORY_SJC_GOLD);
    const responseHistorySJC_SILVER = await fetch(API_ENDPOINT_HISTORY_SJC_SILVER);


    const responseHistoryBacPhuQuy = await fetch(
      API_ENDPOINT_HISTORY_BAC_PHUQUY
    );
    const responseHistoryPhuQuyGold = await fetch(
      API_ENDPOINT_HISTORY_PHUQUY_GOLD
    );
    const responseHistoryVangHanQuoc = await fetch(
      API_ENDPOINT_HISTORY_HANQUOC
    );
    const responseHistoryVangSac = await fetch(API_ENDPOINT_HISTORY_VANG_SAC);
    const responseHistoryBacSac = await fetch(API_ENDPOINT_HISTORY_BAC_SAC);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (!responseMaterial.ok) {
      throw new Error(`HTTP error! status: ${responseMaterial.status}`);
    }
    const dataMaterial = await responseMaterial.json();

    if (!responseHistoryGoonus.ok) {
      throw new Error(`HTTP error! status: ${responseHistoryGoonus.status}`);
    }
    const dataHistoryGoonus = await responseHistoryGoonus.json();

    if (!responseHistoryBacPhuQuy.ok) {
      throw new Error(`HTTP error! status: ${responseHistoryBacPhuQuy.status}`);
    }
    const dataHistoryBacPhuQuy = await responseHistoryBacPhuQuy.json();

    if (!responseHistoryPhuQuyGold.ok) {
      throw new Error(
        `HTTP error! status: ${responseHistoryPhuQuyGold.status}`
      );
    }
    const dataHistoryPhuQuyGold = await responseHistoryPhuQuyGold.json();

    if (!responseHistoryVangHanQuoc.ok) {
      throw new Error(
        `HTTP error! status: ${responseHistoryVangHanQuoc.status}`
      );
    }

    if (!responseHistorySJC_GOLD.ok) {
      throw new Error(`HTTP error! status: ${responseHistorySJC_GOLD.status}`);
    }
    const dataHistorySJC_GOLD = await responseHistorySJC_GOLD.json();

    if (!responseHistorySJC_SILVER.ok) {
      throw new Error(`HTTP error! status: ${responseHistorySJC_SILVER.status}`);
    }
    const dataHistorySJC_SILVER = await responseHistorySJC_SILVER.json();

    console.log('Raw dataHistorySJC_GOLD:', dataHistorySJC_GOLD?.data?.slice(0, 2));
    console.log('Raw dataHistorySJC_SILVER:', dataHistorySJC_SILVER?.data?.slice(0, 2));

    const materialHistorySJC_GOLD = dataHistorySJC_GOLD.data.map((item, index) => {
      // Kiểm tra cấu trúc dữ liệu và lấy giá trị buy
      let y = null;
      
      // Thử cách 1: item.data?.[1]?.buy (cấu trúc cũ)
      if (item.data && Array.isArray(item.data) && item.data[1] && item.data[1].buy !== undefined) {
        y = item.data[1].buy;
      }
      // Thử cách 2: item.buy (cấu trúc trực tiếp)
      else if (item.buy !== undefined) {
        y = item.buy;
      }
      
      return {
        x: item?.date,
        y: y
      }
    });
    
    const materialHistorySJC_SILVER = dataHistorySJC_SILVER.data.map((item, index) => {
      return {
        x: item.date,
        y: item.buy,
      }
    });

    console.log('Formatted materialHistorySJC_GOLD:', materialHistorySJC_GOLD.slice(0, 2));
    console.log('Formatted materialHistorySJC_SILVER:', materialHistorySJC_SILVER.slice(0, 2));

    if (!responseHistoryBacSac.ok) {
      throw new Error(`HTTP error! status: ${responseHistoryBacSac.status}`);
    }

    if (!responseHistoryVangSac.ok) {
      throw new Error(`HTTP error! status: ${responseHistoryVangSac.status}`);
    }
    const dataHistoryVangSac = await responseHistoryVangSac.json();
    const dataHistoryBacSac = await responseHistoryBacSac.json();

    const dataHistoryVangHanQuoc = await responseHistoryVangHanQuoc.json();
    // Trích xuất 3 mảng dữ liệu chính
    const sjcRaw = data.SJC || [];
    const nguyenLieuRaw = data.vang_nguyenlieu || [];
    const usdRaw = data.tygia_usd || [];

    // Trích xuất thêm 1 mảng dữ liệu chính
    const materialGoldRaw = dataMaterial.lich_su_gia_nguyen_lieu_vietnam || [];
    const materialHistoryGooonusBTMCRaw = dataHistoryGoonus.btmc || [];
    const materialHistoryGooonusBTMHRaw = dataHistoryGoonus.btmh || [];
    const materialHistoryGooonusDOJIRaw = dataHistoryGoonus.doji || [];
    const materialHistoryGooonusMIHONGRaw = dataHistoryGoonus.mihong || [];
    const materialHistoryGooonusNGOCTHAMRaw = dataHistoryGoonus.ngoctham || [];
    const materialHistoryGooonusPNJRaw = dataHistoryGoonus.pnj || [];
    const materialHistoryGooonusVANGPHUQUYRaw =
      dataHistoryGoonus.vang_phuquy || [];

    const materialHistoryGooonusBacPhuQuyRaw =
      dataHistoryBacPhuQuy.list_phuquy || [];

    const materialHistoryGooonusNhanTronPhuQuy9999Raw =
      dataHistoryPhuQuyGold.map((item) =>
        item.nhan_tron_phu_quy_9999
          ? {
            id_time: item.update_time,
            ...JSON.parse(item.nhan_tron_phu_quy_9999),
          }
          : null
      );
    const materialHistoryGooonusVangMiengSjcRaw = dataHistoryPhuQuyGold.map(
      (item) =>
        item.vang_mieng_sjc
          ? {
            id_time: item.update_time,
            ...JSON.parse(item.vang_mieng_sjc),
          }
          : null
    );
    const materialHistoryGooonusVangTrangSuc98Raw = dataHistoryPhuQuyGold.map(
      (item) =>
        item.vang_trang_suc_98
          ? {
            id_time: item.update_time,
            ...JSON.parse(item.vang_trang_suc_98),
          }
          : null
    );
    const materialHistoryGooonusVangTrangSuc99Raw = dataHistoryPhuQuyGold.map(
      (item) =>
        item.vang_trang_suc_99
          ? {
            id_time: item.update_time,
            ...JSON.parse(item.vang_trang_suc_99),
          }
          : null
    );
    const materialHistoryGooonusVangTrangSuc999Raw = dataHistoryPhuQuyGold.map(
      (item) =>
        item.vang_trang_suc_999
          ? {
            id_time: item.update_time,
            ...JSON.parse(item.vang_trang_suc_999),
          }
          : null
    );
    const materialHistoryGooonusVangTrangSuc9999Raw = dataHistoryPhuQuyGold.map(
      (item) =>
        item.vang_trang_suc_9999
          ? {
            id_time: item.update_time,
            ...JSON.parse(item.vang_trang_suc_9999),
          }
          : null
    );

    // Hàm detect và filter outlier - chỉ xóa những record lỗi cụ thể
    const removeOutliers = (data, field = 'buy') => {
      // Giữ lại data hợp lệ: giá từ 20 triệu đến 500 triệu
      const MIN_PRICE = 20000000;
      const MAX_PRICE = 500000000;
      
      const filtered = data.filter(item => {
        const value = item[field];
        const isValid = value >= MIN_PRICE && value <= MAX_PRICE;
        if (!isValid) {
          console.log(`Outlier removed - ${field}: ${value} (outside range [${MIN_PRICE}, ${MAX_PRICE}])`);
        }
        return isValid;
      });
      
      console.log(`Outlier filter - Before: ${data.length}, After: ${filtered.length}`);
      return filtered;
    };

    // Xử lý dữ liệu Vàng Sacombank - không cần lọc theo name
    const TARGET_NAME = "1 VÀNG MỸ NGHỆ ÉP VỈ";
    let materialHistoryGooonusVangSac = [];

    // Debug: Kiểm tra cấu trúc dữ liệu Vàng Sac
    console.log("Vàng Sac - Data structure:", {
      hasData: !!dataHistoryVangSac?.data,
      isArray: Array.isArray(dataHistoryVangSac?.data),
      firstItem: dataHistoryVangSac?.data?.[0],
    });

    // Cấu trúc 1: Mảng đơn giản từ Sacombank API: { data: [{ date, buy, sell }] }
    if (
      dataHistoryVangSac?.data &&
      Array.isArray(dataHistoryVangSac?.data) &&
      dataHistoryVangSac?.data.length > 0 &&
      !dataHistoryVangSac?.data[0]?.data // Không có nested data field
    ) {
      let rawData = dataHistoryVangSac.data
        .map((item) => {
          const buyValue = item.buy !== undefined && item.buy !== null ? item.buy : 0;
          const sellValue = item.sell !== undefined && item.sell !== null ? item.sell : 0;
          
          return {
            id_time: item.date || new Date().toISOString().split("T")[0],
            buy: buyValue,
            sell: sellValue,
          };
        })
        .filter((item) => item.id_time && item.buy > 0 && item.sell > 0);

      // Filter outliers - xóa những record lỗi (giá < 20M hoặc > 500M)
      materialHistoryGooonusVangSac = removeOutliers(rawData, 'buy');

      console.log(
        "Vàng Sac (Simple) - After outlier removal:",
        materialHistoryGooonusVangSac.slice(0, 3),
        "Total items:", materialHistoryGooonusVangSac.length
      );
    }
    // Cấu trúc 2: nested phức tạp: { data: [{ data: [{ buy, sell, name, date }] }] }
    else if (
      dataHistoryVangSac?.data &&
      Array.isArray(dataHistoryVangSac?.data) &&
      dataHistoryVangSac?.data.length > 0 &&
      dataHistoryVangSac?.data[0]?.data &&
      Array.isArray(dataHistoryVangSac?.data[0].data)
    ) {
      // Flatten nested structure và chỉ lấy item có name là "1 VÀNG MỸ NGHỆ ÉP VỈ"
      materialHistoryGooonusVangSac = dataHistoryVangSac.data
        .flatMap((group) => {
          if (group.data && Array.isArray(group.data)) {
            return group.data
              .filter((item) => item.name === TARGET_NAME)
              .map((item) => {
                const buyValue =
                  item.buy !== undefined && item.buy !== null
                    ? item.buy
                    : item.buy_price !== undefined && item.buy_price !== null
                      ? item.buy_price
                      : 0;
                const sellValue =
                  item.sell !== undefined && item.sell !== null
                    ? item.sell
                    : item.sell_price !== undefined && item.sell_price !== null
                      ? item.sell_price
                      : 0;

                return {
                  id_time:
                    item.date ||
                    item.id_time ||
                    group.date ||
                    new Date().toISOString().split("T")[0],
                  buy: buyValue,
                  sell: sellValue,
                };
              });
          }
          return [];
        })
        .filter((item) => item.buy > 0 && item.sell > 0);

      console.log(
        "Vàng Sac (Nested) - First 3 items after parse:",
        materialHistoryGooonusVangSac.slice(0, 3)
      );
    }
    // Cấu trúc 3: Mảng các object với buy_price, sell_price
    else if (Array.isArray(dataHistoryVangSac)) {
      materialHistoryGooonusVangSac = dataHistoryVangSac
        .map((item) => ({
          id_time: item.date || item.id_time || item.update_time,
          buy:
            item.buy !== undefined && item.buy !== null
              ? item.buy
              : item.buy_price !== undefined && item.buy_price !== null
                ? item.buy_price
                : 0,
          sell:
            item.sell !== undefined && item.sell !== null
              ? item.sell
              : item.sell_price !== undefined && item.sell_price !== null
                ? item.sell_price
                : 0,
        }))
        .filter((item) => item.id_time && item.buy > 0 && item.sell > 0);
    }
    // Cấu trúc 4: object có thuộc tính data là mảng: { data: [{ date, buy, sell, name }] }
    else if (
      dataHistoryVangSac.data &&
      Array.isArray(dataHistoryVangSac.data)
    ) {
      materialHistoryGooonusVangSac = dataHistoryVangSac.data
        .map((item) => ({
          id_time: item.date || item.id_time || item.update_time,
          buy:
            item.buy !== undefined && item.buy !== null
              ? item.buy
              : item.buy_price !== undefined && item.buy_price !== null
                ? item.buy_price
                : 0,
          sell:
            item.sell !== undefined && item.sell !== null
              ? item.sell
              : item.sell_price !== undefined && item.sell_price !== null
                ? item.sell_price
                : 0,
        }))
        .filter((item) => item.id_time && item.buy > 0 && item.sell > 0);
    }

    //bs
    let materialHistoryGooonusBacSac = [];

    // response có thể trả về mảng trực tiếp hoặc object { data: [...] }
    const rawBacSacItems = Array.isArray(dataHistoryBacSac)
      ? dataHistoryBacSac
      : (dataHistoryBacSac && dataHistoryBacSac.data) || [];

    materialHistoryGooonusBacSac = rawBacSacItems
      .map((item) => {
        if (!item) return null;
        const id_time =
          item.date || item.id_time || item.crawled_at || item.update_time;
        const buy =
          item.buy !== undefined && item.buy !== null
            ? item.buy
            : item.buy_price !== undefined && item.buy_price !== null
              ? item.buy_price
              : 0;
        const sell =
          item.sell !== undefined && item.sell !== null
            ? item.sell
            : item.sell_price !== undefined && item.sell_price !== null
              ? item.sell_price
              : 0;

        return id_time && (buy > 0 || sell > 0) ? { id_time, buy, sell } : null;
      })
      .filter(Boolean);

    // ✅ Lọc bỏ dữ liệu năm 1970 và null
    // const materialHistoryVangHanQuoc = Object.entries(
    //   dataHistoryVangHanQuoc
    // ).map(([date, value]) => ({
    //   id_time: date,
    //   buy: value.buy,
    //   sell: value.sell,
    // }));

    // const materialHistoryVangHanQuoc = dataHistoryVangHanQuoc.data.records.map(
    //   (item) => ({
    //     id_time: item.date_key,
    //     buy: item.gold_pure.buy_vnd,
    //     sell: item.gold_pure.sell_vnd,
    //   })
    // );

    // Debug: Kiểm tra cấu trúc dữ liệu Vàng Hàn Quốc
    console.log(
      "Vàng Hàn Quốc - Sample record:",
      dataHistoryVangHanQuoc.data?.records?.[0]
    );
    console.log(
      "Vàng Hàn Quốc - gold_pure structure:",
      dataHistoryVangHanQuoc.data?.records?.[0]?.gold_pure
    );

    const materialHistoryVangHanQuoc = dataHistoryVangHanQuoc.data.records
      .filter((item) => {
        // ✅ Lọc bỏ dữ liệu năm 1970 và null
        if (!item || !item.date_key || !item.gold_pure) return false;
        const year = new Date(item.date_key).getFullYear();
        return year >= 2009 && !isNaN(year);
      })
      .map((item) => {
        const buyValue = item.gold_pure?.buy_vnd || item.gold_pure?.buy || 0;
        const sellValue = item.gold_pure?.sell_vnd || item.gold_pure?.sell || 0;

        // Debug một vài items đầu
        if (
          item ===
          dataHistoryVangHanQuoc.data.records.filter((i) => i?.gold_pure)[0]
        ) {
          console.log("Vàng Hàn Quốc - First item parsed:", {
            date_key: item.date_key,
            buy_vnd: item.gold_pure?.buy_vnd,
            sell_vnd: item.gold_pure?.sell_vnd,
            buy: item.gold_pure?.buy,
            sell: item.gold_pure?.sell,
            parsed_buy: buyValue,
            parsed_sell: sellValue,
            full_gold_pure: item.gold_pure,
          });
        }

        return {
          id_time: item.date_key,
          buy: buyValue,
          sell: sellValue,
        };
      })
      .filter((item) => item.buy > 0 && item.sell > 0); // Lọc bỏ các item có giá trị = 0

    console.log(
      "Vàng Hàn Quốc - First 3 items after parse:",
      materialHistoryVangHanQuoc.slice(0, 3)
    );

    // Format dữ liệu cho từng loại
    const sjcData = formatCandlestickData(sjcRaw);
    const nguyenLieuData = formatCandlestickData(nguyenLieuRaw);
    const usdData = formatCandlestickData(usdRaw);
    const buyDataMaterial = formatLineMaterialData(materialGoldRaw, "buy");
    const sellDataMaterial = formatLineMaterialData(materialGoldRaw, "sell");

    const buyDataHistoryGooonusBTMC = formatLineMaterialData(
      materialHistoryGooonusBTMCRaw,
      "buy"
    );
    const sellDataHistoryGooonusBTMC = formatLineMaterialData(
      materialHistoryGooonusBTMCRaw,
      "sell"
    );

    const buyDataHistoryGooonusBTMH = formatLineMaterialData(
      materialHistoryGooonusBTMHRaw,
      "buy"
    );
    const sellDataHistoryGooonusBTMH = formatLineMaterialData(
      materialHistoryGooonusBTMHRaw,
      "sell"
    );

    const buyDataHistoryGooonusDOJI = formatLineMaterialData(
      materialHistoryGooonusDOJIRaw,
      "buy"
    );
    const sellDataHistoryGooonusDOJI = formatLineMaterialData(
      materialHistoryGooonusDOJIRaw,
      "sell"
    );

    const buyDataHistoryGooonusMIHONG = formatLineMaterialData(
      materialHistoryGooonusMIHONGRaw,
      "buy"
    );
    const sellDataHistoryGooonusMIHONG = formatLineMaterialData(
      materialHistoryGooonusMIHONGRaw,
      "sell"
    );

    const buyDataHistoryGooonusNGOCTHAM = formatLineMaterialData(
      materialHistoryGooonusNGOCTHAMRaw,
      "buy"
    );
    const sellDataHistoryGooonusNGOCTHAM = formatLineMaterialData(
      materialHistoryGooonusNGOCTHAMRaw,
      "sell"
    );

    const buyDataHistoryGooonusPNJ = formatLineMaterialData(
      materialHistoryGooonusPNJRaw,
      "buy"
    );
    const sellDataHistoryGooonusPNJ = formatLineMaterialData(
      materialHistoryGooonusPNJRaw,
      "sell"
    );

    const buyDataHistoryGooonusVANGPHUQUY = formatLineMaterialData(
      materialHistoryGooonusVANGPHUQUYRaw,
      "buy"
    );
    const sellDataHistoryGooonusVANGPHUQUY = formatLineMaterialData(
      materialHistoryGooonusVANGPHUQUYRaw,
      "sell"
    );

    const buyDataHistoryGooonusBacPhuQuy = formatLineMaterialDateData(
      materialHistoryGooonusBacPhuQuyRaw,
      "buy"
    );
    const sellDataHistoryGooonusBacPhuQuy = formatLineMaterialDateData(
      materialHistoryGooonusBacPhuQuyRaw,
      "sell"
    );

    const buyDataHistoryGooonusNhanTronPhuQuy9999 = formatLineMaterialDateData(
      materialHistoryGooonusNhanTronPhuQuy9999Raw,
      "mua"
    );
    const sellDataHistoryGooonusNhanTronPhuQuy9999 = formatLineMaterialDateData(
      materialHistoryGooonusNhanTronPhuQuy9999Raw,
      "ban"
    );

    const buyDataHistoryGooonusVangMiengSjc = formatLineMaterialDateData(
      materialHistoryGooonusVangMiengSjcRaw,
      "mua"
    );
    const sellDataHistoryGooonusVangMiengSjc = formatLineMaterialDateData(
      materialHistoryGooonusVangMiengSjcRaw,
      "ban"
    );

    const buyDataHistoryGooonusVangTrangSuc99 = formatLineMaterialDateData(
      materialHistoryGooonusVangTrangSuc99Raw,
      "mua"
    );
    const sellDataHistoryGooonusVangTrangSuc99 = formatLineMaterialDateData(
      materialHistoryGooonusVangTrangSuc99Raw,
      "ban"
    );

    const buyDataHistoryGooonusVangTrangSuc999 = formatLineMaterialDateData(
      materialHistoryGooonusVangTrangSuc999Raw,
      "mua"
    );
    const sellDataHistoryGooonusVangTrangSuc999 = formatLineMaterialDateData(
      materialHistoryGooonusVangTrangSuc999Raw,
      "ban"
    );

    const buyDataHistoryGooonusVangTrangSuc9999 = formatLineMaterialDateData(
      materialHistoryGooonusVangTrangSuc9999Raw,
      "mua"
    );
    const sellDataHistoryGooonusVangTrangSuc9999 = formatLineMaterialDateData(
      materialHistoryGooonusVangTrangSuc9999Raw,
      "ban"
    );

    const buyDataHistoryGooonusVangTrangSuc98 = formatLineMaterialDateData(
      materialHistoryGooonusVangTrangSuc98Raw,
      "mua"
    );
    const sellDataHistoryGooonusVangTrangSuc98 = formatLineMaterialDateData(
      materialHistoryGooonusVangTrangSuc98Raw,
      "ban"
    );

    const buyDataHistoryVangHanQuoc = formatLineMaterialDateData(
      materialHistoryVangHanQuoc,
      "buy"
    );
    const sellDataHistoryVangHanQuoc = formatLineMaterialDateData(
      materialHistoryVangHanQuoc,
      "sell"
    );
    const buyDataHistoryGooonusBacSac = formatLineMaterialDateData(
      materialHistoryGooonusBacSac,
      "buy"
    );
    const sellDataHistoryGooonusBacSac = formatLineMaterialDateData(
      materialHistoryGooonusBacSac,
      "sell"
    );

    // Debug: Kiểm tra giá trị sau khi format
    if (buyDataHistoryVangHanQuoc.length > 0) {
      console.log(
        "Vàng Hàn Quốc - After format (first 3):",
        buyDataHistoryVangHanQuoc.slice(0, 3)
      );
      console.log(
        "Vàng Hàn Quốc - Max buy:",
        Math.max(...buyDataHistoryVangHanQuoc.map((d) => d.y))
      );
      console.log(
        "Vàng Hàn Quốc - Min buy:",
        Math.min(...buyDataHistoryVangHanQuoc.map((d) => d.y))
      );
    }

    // Format dữ liệu Vàng Sac mặc định (tất cả items)
    const buyDataHistoryGooonusVangSac = formatLineMaterialDateData(
      materialHistoryGooonusVangSac,
      "buy"
    );
    const sellDataHistoryGooonusVangSac = formatLineMaterialDateData(
      materialHistoryGooonusVangSac,
      "sell"
    );

    // Debug: Kiểm tra giá trị sau khi format
    if (buyDataHistoryGooonusVangSac.length > 0) {
      console.log(
        "Vàng Sac - After format (first 3):",
        buyDataHistoryGooonusVangSac.slice(0, 3)
      );
      console.log(
        "Vàng Sac - Max buy:",
        Math.max(...buyDataHistoryGooonusVangSac.map((d) => d.y))
      );
      console.log(
        "Vàng Sac - Min buy:",
        Math.min(...buyDataHistoryGooonusVangSac.map((d) => d.y))
      );
    }

    const buySJC_GOLD = formatLineMaterialDataXY(materialHistorySJC_GOLD);
    const buySJC_SILVER = formatLineMaterialDataXY(materialHistorySJC_SILVER);
    return {
      sjcData,
      nguyenLieuData,
      usdData,
      buyDataMaterial,
      sellDataMaterial,
      buyDataHistoryGooonusBTMC,
      sellDataHistoryGooonusBTMC,
      buyDataHistoryGooonusBTMH,
      sellDataHistoryGooonusBTMH,
      buyDataHistoryGooonusDOJI,
      sellDataHistoryGooonusDOJI,
      buyDataHistoryGooonusMIHONG,
      sellDataHistoryGooonusMIHONG,
      buyDataHistoryGooonusNGOCTHAM,
      sellDataHistoryGooonusNGOCTHAM,
      buyDataHistoryGooonusPNJ,
      sellDataHistoryGooonusPNJ,
      buyDataHistoryGooonusVANGPHUQUY,
      sellDataHistoryGooonusVANGPHUQUY,
      buyDataHistoryGooonusBacPhuQuy,
      sellDataHistoryGooonusBacPhuQuy,

      buyDataHistoryGooonusNhanTronPhuQuy9999,
      sellDataHistoryGooonusNhanTronPhuQuy9999,
      buyDataHistoryGooonusVangMiengSjc,
      sellDataHistoryGooonusVangMiengSjc,
      buyDataHistoryGooonusVangTrangSuc99,
      sellDataHistoryGooonusVangTrangSuc99,
      buyDataHistoryGooonusVangTrangSuc999,
      sellDataHistoryGooonusVangTrangSuc999,
      buyDataHistoryGooonusVangTrangSuc9999,
      sellDataHistoryGooonusVangTrangSuc9999,
      buyDataHistoryGooonusVangTrangSuc98,
      sellDataHistoryGooonusVangTrangSuc98,
      buySJC_GOLD,
      buySJC_SILVER,
      buyDataHistoryGooonusVangHanQuoc: buyDataHistoryVangHanQuoc,
      sellDataHistoryGooonusVangHanQuoc: sellDataHistoryVangHanQuoc,
      buyDataHistoryGooonusVangSac,
      sellDataHistoryGooonusVangSac,
      buyDataHistoryGooonusBacSac,
      sellDataHistoryGooonusBacSac,
    };
  } catch (error) {
    console.error("Error fetching candlestick data:", error);
    throw error;
  }
};
