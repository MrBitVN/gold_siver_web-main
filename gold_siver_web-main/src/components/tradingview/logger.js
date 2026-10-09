// logger.js
export const saveToNotificationHistory = (title, type = "General") => {
  const history = JSON.parse(localStorage.getItem("noti_history_log") || "[]");
  
  // Tạo một mã định danh đơn giản để tránh trùng lặp tin nhắn giống hệt nhau trong thời gian ngắn
  const lastEntry = history[0];
  if (lastEntry && lastEntry.title === title && (Date.now() - lastEntry.id < 5000)) {
    return; // Nếu tin giống hệt xuất hiện cách nhau chưa tới 5s thì bỏ qua
  }

  const newEntry = {
    id: Date.now(),
    title: title,
    type: type,
    time: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
  };

  const updatedHistory = [newEntry, ...history];
  localStorage.setItem("noti_history_log", JSON.stringify(updatedHistory));
  
  // Thông báo cho các component khác (như Header) biết để cập nhật giao diện ngay lập tức
  window.dispatchEvent(new Event("storage_updated"));
};