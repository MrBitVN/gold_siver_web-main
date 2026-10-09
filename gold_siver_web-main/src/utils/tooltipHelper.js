/**
 * Helper để tạo nội dung tooltip cho Fear & Greed Index
 * Cung cấp lời khuyên đầu tư dựa trên mức độ chỉ số
 */

/**
 * Lấy nội dung tooltip dựa trên giá trị chỉ số
 * @param {number} value - Giá trị chỉ số (0-100)
 * @returns {string} - Thông điệp tư vấn
 */
export const getTooltipText = (value) => {
  if (value === undefined || value === null) {
    return "Không có dữ liệu";
  }

  const numValue = Number(value);

  if (numValue >= 75) {
    // Tham lam tột độ (75-100)
    return "🔥 Thị trường đang hưng phấn. Cân nhắc rủi ro chốt lời.";
  } else if (numValue >= 55) {
    // Tham lam (55-74)
    return "📈 Tâm lý lạc quan đang chiếm ưu thế.";
  } else if (numValue >= 46) {
    // Trung lập (46-54)
    return "⚖️ Thị trường đang lưỡng lự. Quan sát thêm.";
  } else if (numValue >= 26) {
    // Sợ hãi (26-45)
    return "📉 Tâm lý bi quan đang xuất hiện.";
  } else {
    // Sợ hãi tột độ (0-25)
    return "💎 Thị trường đang hoảng loạn. Có thể là cơ hội cho nhà đầu tư dài hạn.";
  }
};
