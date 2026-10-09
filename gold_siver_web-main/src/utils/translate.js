// cache RAM đơn giản
const cache = new Map();
const MAX_CACHE_SIZE = 200;

/**
 * Dịch văn bản bằng Google Translate với nhiều phương pháp fallback
 * @param {string} text
 * @param {string} from
 * @param {string} to
 * @returns {Promise<string>}
 */
export const translateText = async (text, from = "en", to = "vi") => {
    if (!text || typeof text !== "string") return text;

    // Google giới hạn ~5000 ký tự
    const safeText = text.slice(0, 4500);

    const cacheKey = `${from}_${to}_${safeText}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    // Thử nhiều phương pháp dịch
    const methods = [
        () => translateWithGoogleAPI1(safeText, from, to),
        () => translateWithGoogleAPI2(safeText, from, to),
        () => quickTranslateCommon(safeText)
    ];

    for (const method of methods) {
        try {
            const translated = await method();
            if (translated && translated !== safeText) {
                // Cache kết quả thành công
                if (cache.size >= MAX_CACHE_SIZE) {
                    const firstKey = cache.keys().next().value;
                    cache.delete(firstKey);
                }
                cache.set(cacheKey, translated);
                return translated;
            }
        } catch (err) {
            console.warn("Translation method failed:", err.message);
            continue;
        }
    }

    // Nếu tất cả đều thất bại, trả về text gốc
    return safeText;
};

// Phương pháp 1: Google Translate API miễn phí
async function translateWithGoogleAPI1(text, from, to) {
    if (text.length < 1500) {
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`);
        if (!response.ok) throw new Error('Google API 1 failed');
        const data = await response.json();
        return data[0]?.map(item => item[0]).join('') || text;
    }

    // Chia nhỏ text nếu quá dài
    const chunks = [];
    for (let i = 0; i < text.length; i += 1500) {
        chunks.push(text.substring(i, i + 1500));
    }

    const results = await Promise.all(chunks.map(async (chunk) => {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(chunk)}`);
        if (!res.ok) return chunk;
        const data = await res.json();
        return data[0]?.map(item => item[0]).join('') || chunk;
    }));

    return results.join('');
}

// Phương pháp 2: Google Translate API khác
async function translateWithGoogleAPI2(text, from, to) {
    const response = await fetch(`https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${from}&tl=${to}&q=${encodeURIComponent(text)}`);
    
    if (!response.ok) {
        throw new Error('Google API 2 failed');
    }

    const data = await response.json();
    return data[0] || text;
}

// Phương pháp 3: Dịch nhanh các từ phổ biến
function quickTranslateCommon(text) {
    const translations = {
        // Company terms
        'Corporation': 'Tập đoàn',
        'Corp': 'Công ty',
        'Inc': 'Công ty',
        'Limited': 'Công ty',
        'Ltd': 'Công ty',
        'Plc': 'Công ty',
        'Group': 'Tập đoàn',
        'Mining': 'Khai thác Mỏ',
        'Gold': 'Vàng',
        'Silver': 'Bạc',
        'Resources': 'Tài nguyên',
        'Precious Metals': 'Kim loại Quý',
        'Mines': 'Mỏ',
        'Eagle': 'Đại bàng',
        
        // Countries
        'United States': 'Hoa Kỳ',
        'Canada': 'Canada',
        'Australia': 'Úc',
        'China': 'Trung Quốc',
        'South Africa': 'Nam Phi',
        'Mexico': 'Mexico',
        'Brazil': 'Brazil',
        'South Korea': 'Hàn Quốc',
        'Other': 'Khác',
        
        // Sectors
        'Basic Materials': 'Ngành Khai thác & Kim loại',
        'Materials': 'Vật liệu',
        'Energy': 'Năng lượng',
        
        // ETF terms
        'Index': 'Chỉ số',
        'Investment Focus': 'Trọng tâm đầu tư',
        'Fund Size': 'Quy mô quỹ',
        'Total Expense Ratio': 'Tỷ lệ chi phí tổng cộng',
        'Replication': 'Sao chép',
        'Legal Structure': 'Cấu trúc pháp lý',
        'Strategy Risk': 'Rủi ro chiến lược',
        'Sustainability': 'Tính bền vững',
        'Fund Currency': 'Tiền tệ của quỹ',
        'Currency Risk': 'Rủi ro tiền tệ',
        'Volatility': 'Biến động',
        'Inception': 'Thành lập',
        'Listing Date': 'Ngày niêm yết',
        'Distribution Policy': 'Chính sách phân phối',
        'Distribution Frequency': 'Tần suất phân bổ',
        'Fund Domicile': 'Nơi đặt trụ sở quỹ',
        'Fund Provider': 'Nhà cung cấp quỹ',
        
        // Performance terms
        'Year to date': 'Từ đầu năm đến nay',
        'Since inception': 'Kể từ khi thành lập',
        'Risk Overview': 'Tổng quan rủi ro',
        'Rolling': 'Liên tiếp',
        'Maximum Drawdown': 'Mức sụt giảm tối đa',
        'Return to Risk': 'Lợi nhuận trên rủi ro',
        
        // Common terms
        'View Offer': 'Xem ưu đãi',
        'Conditions apply': 'Có điều kiện áp dụng',
        'per annum': 'mỗi năm',
        'Physical': 'Vật lý',
        'Full Replication': 'Sao chép hoàn toàn',
        'Partial Replication': 'Sao chép một phần',
        'Optimized': 'Tối ưu hóa',
        'Accumulating': 'Tích lũy',
        'Distributing': 'Phân phối',
        'Quarterly': 'Hàng quý',
        'Long Only': 'Chỉ dài hạn',
        'Currency not hedged': 'Tiền tệ không được phòng ngừa rủi ro',
        'Ireland': 'Ireland',
        'No': 'KHÔNG',
        'Yes': 'CÓ'
    };

    let translated = text;
    for (const [en, vi] of Object.entries(translations)) {
        const regex = new RegExp(`\\b${en}\\b`, 'gi');
        translated = translated.replace(regex, vi);
    }
    
    return translated !== text ? translated : null; // Trả về null nếu không dịch được
}
