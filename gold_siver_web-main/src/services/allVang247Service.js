const APT_ANALYSIS_DATA = "https://api_gold.thinkdiff.us/view_full_data_json/22_11_2025/22_11_2025_20_49.json";

export const getVang247FolderUrl = (day, month, year) => {
    const dStr = String(day).padStart(2, '0');
    const mStr = String(month).padStart(2, '0');
    
    const d = `${dStr}_${mStr}_${year}`;
    const url = `https://api_gold.thinkdiff.us/all_json_1_day/${d}`;
    return getApiUrl(url);
};



const API_BASE_THINKDIFF = "https://api_gold.thinkdiff.us"; // Đảm bảo bạn đã định nghĩa hằng số này ở đầu file

// Helper để kiểm tra môi trường
const isLocalhost = () =>
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

// Helper để tạo URL phù hợp với môi trường
const getApiUrl = (path) => {
    if (isLocalhost()) {
        // Sử dụng proxy khi ở localhost
        if (path.includes('api_gold.thinkdiff.us')) {
            return path.replace('https://api_gold.thinkdiff.us', '/api_gold');
        }
        if (path.includes('thinkdiff.us')) {
            return path.replace('https://thinkdiff.us', '/vang247_xyz');
        }
    }
    return path;
};

/**
 * 🟡 Tạo URL file theo thời gian đầy đủ
 * @param {string} day
 * @param {string} month
 * @param {string} year
 * @param {string} hour
 * @param {string} minute
 * @param {string} second
 * @returns {string} URL API tuyệt đối (Production) hoặc URL Proxy (Localhost)
 */
export const getVang247FileUrl = (day, month, year, hour, minute, second = null) => {
    // Basic validation: ensure day/month/year present
    if (!day || !month || !year) {
        console.warn("getVang247FileUrl: missing date parts", { day, month, year, hour, minute, second });
        return null;
    }

    const d = `${Number(day)}_${Number(month)}_${year}`;

    // Convert hour/minute/second to numbers and validate
    const h = Number(hour);
    const m = Number(minute);
    const s = second !== null ? Number(second) : null;

    if (!Number.isFinite(h) || !Number.isFinite(m) || (second !== null && !Number.isFinite(s))) {
        console.warn("getVang247FileUrl: invalid time parts", { day, month, year, hour, minute, second });
        return null;
    }

    const time = s === null ? `${h}_${m}` : `${h}_${m}_${s}`;

    const pathSegment = `view_full_data_json/${d}/${d}_${time}.json`;

    const url = `${API_BASE_THINKDIFF}/${pathSegment}`;
    return getApiUrl(url);
};

/**
 * 🟡 Lấy danh sách file trong ngày
 */
export const fetchVang247FileList = async (day, month, year) => {
    const url = getVang247FolderUrl(day, month, year);
    const res = await fetch(url);
    if (!res.ok) {
        // Xử lý lỗi HTTP: 404, 500, etc.
        throw new Error(`HTTP ${res.status}`);
    }

    // ✅ BƯỚC MỚI: Kiểm tra Content-Type
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        // Nếu không phải JSON (rất có thể là HTML), đọc nó dưới dạng text để gỡ lỗi
        const errorText = await res.text();
        console.error(
            "API Error: Server returned non-JSON data (likely HTML error page). Content:",
            errorText.substring(0, 200) + (errorText.length > 200 ? '...' : '')
        );
        throw new Error("API did not return expected JSON data. Check the URL rewrite or API endpoint.");
    }

    // Nếu là JSON, tiếp tục phân tích cú pháp
    const data = await res.json();

    if (!data || !data.data) {
        throw new Error("Invalid structure: 'data' field not found in response.");
    }
    return data.data.map((item) => ({
        link: item.link,
        modified_time: item.modified_time,
        size_bytes: item.size_bytes,
    }));
};

/**
 * 🟡 Lấy nội dung file đơn
 */
export const fetchVang247SingleFile = async (fileUrl) => {
    const url = getApiUrl(fileUrl);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
};

export const fetchAnalysisData = async () => {
    const url = getApiUrl(APT_ANALYSIS_DATA);
    const data = await fetchVang247SingleFile(url);
    return data.data.phan_tich;
}

/**
 * 🟡 Lấy nhiều file (incremental loading)
 */
export const fetchVang247Incremental = async (files, onLoaded) => {
    const total = files.length;
    let loaded = 0;
    const results = [];

    const promises = files.map(async (f) => {
        try {
            const data = await fetchVang247SingleFile(f.link);
            loaded++;
            const merged = { ...f, data };
            results.push(merged);

            if (onLoaded) onLoaded(merged, loaded, total);

            return { status: "fulfilled", value: merged };
        } catch (err) {
            loaded++;
            return { status: "rejected", reason: err };
        }
    });

    await Promise.all(promises);
    return results;
};
