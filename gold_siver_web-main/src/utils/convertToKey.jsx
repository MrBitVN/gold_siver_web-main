export const convertToKey = (str) => {
    if (!str) return "";

    return str
        .normalize("NFD")                   // 1. Tách dấu ra khỏi ký tự gốc (ví dụ: 'ý' -> 'y' + dấu sắc)
        .replace(/[\u0300-\u036f]/g, "")    // 2. Xóa các ký tự dấu vừa tách ra
        .replace(/đ/g, "d").replace(/Đ/g, "D") // 3. Xử lý riêng chữ Đ/đ (vì normalize không tách được chữ này)
        .toLowerCase()                      // 4. Chuyển thành chữ thường
        .trim()                             // 5. Xóa khoảng trắng thừa ở đầu và cuối chuỗi
        .replace(/\s+/g, "_");              // 6. Thay tất cả khoảng trắng (hoặc nhiều khoảng trắng liên tiếp) thành "_"
};