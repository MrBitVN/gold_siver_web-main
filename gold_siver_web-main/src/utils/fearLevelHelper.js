/**
 * Helper để xác định màu sắc và nhãn dựa trên chỉ số
 * Logic: > 95 Đỏ, < 80 Xanh lá, Còn lại Vàng
 */
import { useTranslation } from "react-i18next";
export const getFearLevel = (value) => {
  const { t } = useTranslation();
  if (value > 95) {
    return {
      color: "#FF4136", // Đỏ
      label: t("gauge.extreme"),
      textColor: "#FF4136"
    };
  }

  if (value < 80) {
    return {
      color: "#2ECC71", // Xanh lá
      label: t("gauge.safe"),
      textColor: "#2ECC71"
    };
  }

  // Khoảng từ 80 đến 95
  return {
    color: "#FACC15", // Vàng
    label: t("gauge.medium"),
    textColor: "#FACC15"
  };
};

/**
 * Hàm định dạng ngày tháng để hiển thị trên biểu đồ
 * Thêm hàm này để tránh lỗi "does not provide an export named formatDate"
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    // Trả về định dạng DD/MM (Ví dụ: 25/12)
    return `${date.getDate()}/${date.getMonth() + 1}`;
  } catch (e) {
    return dateString;
  }
};