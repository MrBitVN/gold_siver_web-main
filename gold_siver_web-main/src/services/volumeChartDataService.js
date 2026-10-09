import { sortByField } from "../utils/candlestickHelper";

const BASE_API_URL = "https://api_gold.thinkdiff.us";
/**
 * Fetch dữ liệu volume XAU/XAG từ API với page động
 * @param {number} page - Số trang cần load (mặc định là 1)
 * @returns {Promise<Object>} { volumeXauRaw, volumeXagRaw, hasMore }
 */
export const fetchXauXagVolumeDataByPage = async (page = 1) => {
    try {
        const apiUrlXau = `${BASE_API_URL}/volume_xau_usd?page=${page}`;
        const apiUrlXag = `${BASE_API_URL}/volume_xag_usd?page=${page}`;

        const responseVolumeXau = await fetch(apiUrlXau);
        const responseVolumeXag = await fetch(apiUrlXag);

        if (!responseVolumeXau.ok) throw new Error(`XAU HTTP error! ${responseVolumeXau.status}`);
        if (!responseVolumeXag.ok) throw new Error(`XAG HTTP error! ${responseVolumeXag.status}`);

        const dataVolumeXau = await responseVolumeXau.json();
        const dataVolumeXag = await responseVolumeXag.json();
        
        const totalPages = dataVolumeXau?.data?.total_page || dataVolumeXag?.data?.total_page || 0;
        
        const volumeXauRaw = dataVolumeXau?.data?.list_volume || [];
        const volumeXagRaw = dataVolumeXag?.data?.list_volume || [];
        
        // Kiểm tra xem còn dữ liệu để load không (dựa vào số lượng items trả về)
        const hasMoreXau = volumeXauRaw.length > 0;
        const hasMoreXag = volumeXagRaw.length > 0;
        const hasMore = hasMoreXau || hasMoreXag;


        return { volumeXauRaw, volumeXagRaw, hasMore, page , totalPages};
    } catch (error) {
        console.error(`Error fetching XAU/XAG data for page ${page}:`, error);
        return { volumeXauRaw: [], volumeXagRaw: [], hasMore: false, page, totalPages: 0 };
    }
};

/**
 * Fetch dữ liệu volume XAU/XAG từ nhiều page (lazy loading)
 * @param {number} startPage - Trang bắt đầu (mặc định là 1)
 * @param {number} endPage - Trang kết thúc (mặc định là 1)
 * @param {Function} onPageLoaded - Callback được gọi khi mỗi page load xong: (page, data, loaded, total) => void
 * @returns {Promise<Object>} { volumeXauRaw, volumeXagRaw, totalPages }
 */
export const fetchXauXagVolumeDataMultiplePages = async (
    startPage = 1,
    endPage = 1,
    onPageLoaded = null
) => {
    const allVolumeXauRaw = [];
    const allVolumeXagRaw = [];
    let totalPages = 0;

    try {
        const pages = [];
        for (let page = startPage; page <= endPage; page++) {
            pages.push(page);
        }

        const promises = pages.map(async (page) => {
            const result = await fetchXauXagVolumeDataByPage(page);
            return { page, ...result };
        });

        const results = await Promise.all(promises);
        // Merge dữ liệu từ tất cả các page
        results.forEach((result, index) => {
            if (result.volumeXauRaw.length > 0 || result.volumeXagRaw.length > 0) {
                allVolumeXauRaw.push(...result.volumeXauRaw);
                allVolumeXagRaw.push(...result.volumeXagRaw);
                totalPages = result.page;

                // Gọi callback nếu có

                if (onPageLoaded) {
                    try {
                        onPageLoaded(result.page, result, index + 1, results.length);
                    } catch (callbackError) {
                        console.warn("Callback error in onPageLoaded:", callbackError);
                    }
                }
            }
        });
        // Sort lại sau khi merge

        // Loại bỏ duplicate dựa trên timestamp (nếu có)
        const uniqueVolumeXauRaw = Array.from(
            new Map(allVolumeXauRaw.map(item => [item.timestamp, item])).values()
        );
        const uniqueVolumeXagRaw = Array.from(
            new Map(allVolumeXagRaw.map(item => [item.timestamp, item])).values()
        );

        sortByField(uniqueVolumeXauRaw, 'timestamp', true);
        sortByField(uniqueVolumeXagRaw, 'timestamp', false);

        console.log('Total loaded - volumeXauRaw:', uniqueVolumeXauRaw.length, 'items');
        console.log('Total loaded - volumeXagRaw:', uniqueVolumeXagRaw.length, 'items');

        return {
            volumeXauRaw: uniqueVolumeXauRaw,
            volumeXagRaw: uniqueVolumeXagRaw,
            totalPages
        };
    } catch (error) {
        console.error("Error fetching multiple pages XAU/XAG data:", error);
        return { volumeXauRaw: allVolumeXauRaw, volumeXagRaw: allVolumeXagRaw, totalPages };
    }
};
/**
 * Fetch dữ liệu volume XAU/XAG từ API (tương thích với code cũ - load page 1)
 * @returns {Promise<Object>} { volumeXauRaw, volumeXagRaw }
 */
export const fetchXauXagVolumeData = async (page) => {
    const result = await fetchXauXagVolumeDataByPage(page);
    const avgVolumeXau = result.volumeXauRaw.length
        ? result.volumeXauRaw.reduce((sum, item) => sum + item.volume, 0) / result.volumeXauRaw.length
        : 0;

    const avgVolumeXag = result.volumeXagRaw.length
        ? result.volumeXagRaw.reduce((sum, item) => sum + item.volume, 0) / result.volumeXagRaw.length
        : 0;
    return {
        volumeXauRaw: result.volumeXauRaw,
        volumeXagRaw: result.volumeXagRaw,
        totalPages: result.totalPages, // 💡 Trả về totalPages
        hasMore: result.hasMore,       // Trả về hasMore
        volume_trungbinh: {
            xau: avgVolumeXau,
            xag: avgVolumeXag
        }
    };
};