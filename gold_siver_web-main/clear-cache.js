/**
 * HƯỚNG DẪN: Chạy script này trong DevTools Console (F12)
 * để xóa cache translation cũ và reload trang
 */

console.log("🧹 Đang xóa cache translation...");

// 1. Clear tất cả i18n cache từ localStorage
const translationCacheKeys = Object.keys(localStorage).filter(
  (key) =>
    key.includes("i18n_resource_") ||
    key.includes("noti_history_log") ||
    key.includes("lang"),
);

translationCacheKeys.forEach((key) => {
  console.log(`  ❌ Xóa: ${key}`);
  localStorage.removeItem(key);
});

// 2. Clear sessionStorage
sessionStorage.clear();
console.log("  ❌ Xóa sessionStorage");

// 3. Reload trang
console.log("🔄 Reloading page...");
setTimeout(() => {
  location.reload();
}, 500);

console.log("✅ Xong! Trang sẽ load lại ngay.");
