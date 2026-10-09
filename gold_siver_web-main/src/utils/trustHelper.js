/**
 * Lấy màu sắc dựa trên độ uy tín (1 = tốt nhất, 10 = thấp nhất)
 * @param {number} trustScore - Điểm uy tín (1-10)
 * @returns {string} - Màu sắc tương ứng
 */
export const getTrustColor = (trustScore) => {
  if (trustScore === undefined || trustScore === null) {
    return "#94A3B8"; // Màu xám mặc định
  }

  const score = Number(trustScore);

  if (score <= 2) {
    // Rất tốt (1-2) - Xanh lá đậm
    return "#22C55E";
  } else if (score <= 4) {
    // Tốt (3-4) - Xanh lá nhạt
    return "#84CC16";
  } else if (score <= 6) {
    // Trung bình (5-6) - Vàng
    return "#FACC15";
  } else if (score <= 8) {
    // Kém (7-8) - Cam
    return "#F97316";
  } else {
    // Rất kém (9-10) - Đỏ
    return "#EF4444";
  }
};
