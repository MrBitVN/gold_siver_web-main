import { translateText } from './translate.js';

// Cache cho các bản dịch ETF
const etfTranslationCache = new Map();

/**
 * Dịch thông tin ETF từ tiếng Anh sang tiếng Việt
 * @param {Object} etfData - Dữ liệu ETF gốc
 * @returns {Promise<Object>} - Dữ liệu ETF đã dịch
 */
export const translateETFData = async (etfData) => {
    if (!etfData) return etfData;

    const cacheKey = `etf_${etfData.slug}`;
    if (etfTranslationCache.has(cacheKey)) {
        return etfTranslationCache.get(cacheKey);
    }

    try {
        const translatedData = { ...etfData };

        // Dịch từng phần một cách an toàn
        console.log('Đang dịch ETF:', etfData.name);

        // Dịch description
        if (etfData.description && Array.isArray(etfData.description)) {
            console.log('Đang dịch description...');
            translatedData.description = [];
            for (let i = 0; i < etfData.description.length; i++) {
                try {
                    const translated = await translateText(etfData.description[i], 'en', 'vi');
                    translatedData.description.push(translated);
                    // Delay nhỏ để tránh rate limit
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (err) {
                    console.warn(`Lỗi dịch description ${i}:`, err);
                    translatedData.description.push(etfData.description[i]);
                }
            }
        }

        // Dịch basics
        if (etfData.basics && Array.isArray(etfData.basics)) {
            console.log('Đang dịch basics...');
            translatedData.basics = [];
            for (let i = 0; i < etfData.basics.length; i++) {
                try {
                    const basic = etfData.basics[i];
                    const translatedKey = await translateText(basic.key, 'en', 'vi');
                    await new Promise(resolve => setTimeout(resolve, 50));
                    const translatedValue = await translateText(basic.value, 'en', 'vi');
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    translatedData.basics.push({
                        key: translatedKey,
                        value: translatedValue
                    });
                } catch (err) {
                    console.warn(`Lỗi dịch basic ${i}:`, err);
                    translatedData.basics.push(etfData.basics[i]);
                }
            }
        }

        // Dịch holdings
        if (etfData.holdings) {
            console.log('Đang dịch holdings...');
            translatedData.holdings = { ...etfData.holdings };

            // Dịch tên công ty trong topHoldings
            if (etfData.holdings.topHoldings) {
                translatedData.holdings.topHoldings = [];
                for (let i = 0; i < etfData.holdings.topHoldings.length; i++) {
                    try {
                        const holding = etfData.holdings.topHoldings[i];
                        const translatedName = await translateText(holding.name, 'en', 'vi');
                        await new Promise(resolve => setTimeout(resolve, 50));
                        
                        translatedData.holdings.topHoldings.push({
                            ...holding,
                            name: translatedName
                        });
                    } catch (err) {
                        console.warn(`Lỗi dịch holding ${i}:`, err);
                        translatedData.holdings.topHoldings.push(etfData.holdings.topHoldings[i]);
                    }
                }
            }

            // Dịch tên quốc gia
            if (etfData.holdings.countries) {
                translatedData.holdings.countries = [];
                for (let i = 0; i < etfData.holdings.countries.length; i++) {
                    try {
                        const country = etfData.holdings.countries[i];
                        const translatedName = await translateText(country.name, 'en', 'vi');
                        await new Promise(resolve => setTimeout(resolve, 50));
                        
                        translatedData.holdings.countries.push({
                            ...country,
                            name: translatedName
                        });
                    } catch (err) {
                        console.warn(`Lỗi dịch country ${i}:`, err);
                        translatedData.holdings.countries.push(etfData.holdings.countries[i]);
                    }
                }
            }

            // Dịch tên ngành
            if (etfData.holdings.sectors) {
                translatedData.holdings.sectors = [];
                for (let i = 0; i < etfData.holdings.sectors.length; i++) {
                    try {
                        const sector = etfData.holdings.sectors[i];
                        const translatedName = await translateText(sector.name, 'en', 'vi');
                        await new Promise(resolve => setTimeout(resolve, 50));
                        
                        translatedData.holdings.sectors.push({
                            ...sector,
                            name: translatedName
                        });
                    } catch (err) {
                        console.warn(`Lỗi dịch sector ${i}:`, err);
                        translatedData.holdings.sectors.push(etfData.holdings.sectors[i]);
                    }
                }
            }
        }

        // Dịch performance labels
        if (etfData.performance && etfData.performance.summary) {
            console.log('Đang dịch performance...');
            translatedData.performance = { ...etfData.performance };
            translatedData.performance.summary = [];
            
            for (let i = 0; i < etfData.performance.summary.length; i++) {
                try {
                    const item = etfData.performance.summary[i];
                    const translatedLabel = await translateText(item.label, 'en', 'vi');
                    await new Promise(resolve => setTimeout(resolve, 50));
                    
                    translatedData.performance.summary.push({
                        ...item,
                        label: translatedLabel
                    });
                } catch (err) {
                    console.warn(`Lỗi dịch performance ${i}:`, err);
                    translatedData.performance.summary.push(etfData.performance.summary[i]);
                }
            }
        }

        // Dịch risk
        if (etfData.risk) {
            console.log('Đang dịch risk...');
            translatedData.risk = { ...etfData.risk };
            
            try {
                translatedData.risk.title = await translateText(etfData.risk.title, 'en', 'vi');
                await new Promise(resolve => setTimeout(resolve, 50));
            } catch (err) {
                console.warn('Lỗi dịch risk title:', err);
            }

            if (etfData.risk.overview) {
                translatedData.risk.overview = [];
                for (let i = 0; i < etfData.risk.overview.length; i++) {
                    try {
                        const item = etfData.risk.overview[i];
                        const translatedLabel = await translateText(item.label, 'en', 'vi');
                        await new Promise(resolve => setTimeout(resolve, 50));
                        
                        translatedData.risk.overview.push({
                            ...item,
                            label: translatedLabel
                        });
                    } catch (err) {
                        console.warn(`Lỗi dịch risk overview ${i}:`, err);
                        translatedData.risk.overview.push(etfData.risk.overview[i]);
                    }
                }
            }

            if (etfData.risk.rollingVolatility) {
                try {
                    translatedData.risk.rollingVolatility = {
                        ...etfData.risk.rollingVolatility,
                        title: await translateText(etfData.risk.rollingVolatility.title, 'en', 'vi')
                    };
                } catch (err) {
                    console.warn('Lỗi dịch rolling volatility:', err);
                    translatedData.risk.rollingVolatility = etfData.risk.rollingVolatility;
                }
            }
        }

        console.log('Hoàn thành dịch ETF:', etfData.name);

        // Cache kết quả
        etfTranslationCache.set(cacheKey, translatedData);
        return translatedData;

    } catch (error) {
        console.error('Error translating ETF data:', error);
        // Trả về dữ liệu gốc với quick translate
        return quickTranslateETFData(etfData);
    }
};

/**
 * Dịch nhanh ETF data bằng từ điển có sẵn
 * @param {Object} etfData 
 * @returns {Object}
 */
function quickTranslateETFData(etfData) {
    console.log('Sử dụng quick translate cho:', etfData.name);
    
    const translated = { ...etfData };
    
    // Quick translate cho basics
    if (etfData.basics) {
        translated.basics = etfData.basics.map(basic => ({
            key: quickTranslateETF(basic.key),
            value: quickTranslateETF(basic.value)
        }));
    }
    
    // Quick translate cho holdings
    if (etfData.holdings) {
        translated.holdings = { ...etfData.holdings };
        
        if (etfData.holdings.topHoldings) {
            translated.holdings.topHoldings = etfData.holdings.topHoldings.map(holding => ({
                ...holding,
                name: quickTranslateETF(holding.name)
            }));
        }
        
        if (etfData.holdings.countries) {
            translated.holdings.countries = etfData.holdings.countries.map(country => ({
                ...country,
                name: quickTranslateETF(country.name)
            }));
        }
        
        if (etfData.holdings.sectors) {
            translated.holdings.sectors = etfData.holdings.sectors.map(sector => ({
                ...sector,
                name: quickTranslateETF(sector.name)
            }));
        }
    }
    
    return translated;
}

/**
 * Dịch nhanh các từ phổ biến trong ETF
 * @param {string} text 
 * @returns {string}
 */
export const quickTranslateETF = (text) => {
    const commonTranslations = {
        // Company names
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
    for (const [en, vi] of Object.entries(commonTranslations)) {
        const regex = new RegExp(`\\b${en}\\b`, 'gi');
        translated = translated.replace(regex, vi);
    }
    
    return translated;
};