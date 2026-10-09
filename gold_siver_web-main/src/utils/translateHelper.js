import axios from "axios";

/**
 * Phát hiện xem text là tiếng Anh hay không
 * @param {string} text - Text cần kiểm tra
 * @returns {boolean} - true nếu là tiếng Anh
 */
export const isEnglishText = (text) => {
    if (!text || typeof text !== 'string') return false;
    
    // Xóa HTML tags để kiểm tra
    const plainText = text.replace(/<[^>]*>/g, '').trim();
    
    if (plainText.length < 10) return false; // Text quá ngắn, bỏ qua
    
    // Danh sách từ tiếng Anh phổ biến
    const englishWords = [
        'the', 'a', 'an', 'is', 'are', 'be', 'have', 'has', 'do', 'does', 
        'will', 'would', 'could', 'should', 'can', 'may', 'might',
        'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with',
        'this', 'that', 'these', 'those', 'it', 'its', 'what', 'which',
        'gold', 'price', 'market', 'stock', 'investor', 'trading', 'investment',
        'news', 'today', 'economy', 'rate', 'trend', 'from', 'by', 'as', 'if',
        'how', 'when', 'where', 'why', 'get', 'make', 'say', 'go', 'come',
        'see', 'know', 'take', 'think', 'new', 'good', 'day', 'year', 'time'
    ];

    const words = plainText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    if (words.length === 0) return false;
    
    const englishWordCount = words.filter(word => 
        englishWords.some(enWord => word.includes(enWord))
    ).length;

    // Nếu có ít nhất 20% từ tiếng Anh, xem là English content (giảm từ 30% xuống 20%)
    const englishRatio = englishWordCount / words.length;
    
    console.log('Language detection:', {
        textLength: plainText.length,
        wordCount: words.length,
        englishWordCount,
        englishRatio: englishRatio.toFixed(2),
        isEnglish: englishRatio >= 0.2
    });
    
    return englishRatio >= 0.2;
};

/**
 * Dịch text từ tiếng Anh sang tiếng Việt
 * @param {string} text - Text cần dịch
 * @returns {Promise<string>} - Text đã dịch hoặc text gốc nếu lỗi
 */
export const translateToVietnamese = async (text) => {
    if (!text || typeof text !== 'string') return text;

    try {
        const response = await axios.post(
            "https://api_gold.thinkdiff.us/translate_text",
            {
                text: text,
                target_lang: "vi",
            },
            { timeout: 10000 } // Timeout 10 giây
        );

        return response?.data?.translatedText || text;
    } catch (error) {
        console.error("Translation error:", error);
        return text; // Fallback: trả về text gốc
    }
};

/**
 * Auto-translate: nếu content là English thì tự động dịch sang Vietnamese
 * @param {string} content - Content cần check và dịch
 * @returns {Promise<string>} - Content đã dịch (nếu là tiếng Anh) hoặc content gốc
 */
export const autoTranslateIfEnglish = async (content) => {
    if (!content) return content;

    // Check nếu là tiếng Anh
    if (isEnglishText(content)) {
        return await translateToVietnamese(content);
    }

    return content;
};
