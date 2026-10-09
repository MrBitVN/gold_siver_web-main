// Helper: đổi URL sang proxy khi đang chạy localhost
const getApiUrl = (url) => {
    const isLocal = window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

    if (isLocal) {
        return url.replace("https://api_gold.thinkdiff.us", "/api_gold");
    }
    return url;
};

// API endpoint
const API_GET_DIRS = "https://api_gold.thinkdiff.us/all_day_save_price";

/**
 * Gọi API để lấy danh sách dirname
 * @returns {Promise<Array<string>>}
 */
export const fetchAllDirnames = async () => {
    try {
        const finalUrl = getApiUrl(API_GET_DIRS);

        const response = await fetch(finalUrl);
        console.log("response: ", response);
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        const json = await response.json();
        return json.data.toSorted((a, b) => {
            const pa = a.dirname.split("_").map(Number);
            const pb = b.dirname.split("_").map(Number);
            return new Date(pb[2], pb[1] - 1, pb[0]) - new Date(pa[2], pa[1] - 1, pa[0]);
        });

    } catch (err) {
        console.error("Error fetchAllDirnames:", err);
        throw err;
    }
};
