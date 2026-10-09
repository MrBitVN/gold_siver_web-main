# 📊 Tính Năng Thông Báo Dữ Liệu Mới - Feature Guide

## 🎯 Mô Tả Tính Năng

Khi người dùng dán vào một URL cũ (với thời gian/ngày cũ) vào thanh địa chỉ, hệ thống sẽ:
1. **Tự động kiểm tra** xem có dữ liệu vàng/bạc mới hơn trên server
2. **Hiển thị Modal thông báo** nếu có dữ liệu mới với thời gian cập nhật mới nhất
3. **Cho phép người dùng lựa chọn**: 
   - ✅ **"Cập Nhật Ngay"** - Nhảy đến dữ liệu mới nhất
   - ❌ **"Không, Cảm Ơn"** - Tiếp tục xem dữ liệu cũ

## 📍 Cấu Trúc URL

```
http://localhost:3000/#/vietnam/gold/23/12/2025/15/14
```

**Giải thích từng phần:**
- `vietnam` - Khu vực (region)
- `gold` - Loại dữ liệu (gold, silver, etc.)
- `23/12/2025` - Ngày/Tháng/Năm
- `15/14` - **Giờ/Phút** (mới thêm)

## 🔧 Cách Thực Hiện

### 1. Component Modal (`UpdateDataModal.jsx`)

```jsx
<UpdateDataModal
  isVisible={hasNewUpdate}           // Hiển thị modal khi có dữ liệu mới
  latestData={latestDateData}        // Dữ liệu mới nhất từ server
  onConfirm={handleUpdateToLatest}   // Callback khi click "Cập Nhật"
  onCancel={() => setHasNewUpdate(false)}  // Callback khi đóng modal
/>
```

**Props:**
- `isVisible` (boolean) - Điều khiển hiển thị modal
- `latestData` (object) - Chứa `{day, month, year, hour, minute}`
- `onConfirm` (function) - Gọi khi user chọn "Cập Nhật"
- `onCancel` (function) - Gọi khi user chọn "Không"

### 2. Logic Kiểm Tra (`HomePage.jsx`)

```javascript
// ✅ Kiểm tra dữ liệu mới mỗi 20 giây
useEffect(() => {
  if (!params.day || !params.month || !params.year) return;

  const checkLatestUpdate = async () => {
    const res = await fetch(
      `https://api_gold.thinkdiff.us/all_json_1_day/${params.day}_${params.month}_${params.year}`
    );
    const json = await res.json();
    
    // So sánh thời gian server vs thời gian user đang xem
    if (serverTime > userViewTime) {
      setLatestDateData({...});
      setHasNewUpdate(true);
    }
  };

  checkLatestUpdate();
  const timer = setInterval(checkLatestUpdate, 20000); // Kiểm tra 20s/lần
  return () => clearInterval(timer);
}, [params.day, params.month, params.year, params.hour, params.minute]);
```

### 3. Xử Lý Update

```javascript
// Nhảy đến dữ liệu mới nhất
const handleUpdateToLatest = () => {
  if (!latestDateData) return;
  
  const { day, month, year, hour, minute } = latestDateData;
  navigate(
    `/${filterOptions.region}/${filterOptions.type}/${day}/${month}/${year}/${hour}/${minute}`
  );
  setHasNewUpdate(false);
  window.scrollTo({ top: 0, behavior: "smooth" });
};
```

## 🎨 Giao Diện Modal

### Cấu Trúc

```
┌─────────────────────────────────────┐
│  📊 Dữ Liệu Mới Có Sẵn          ✕  │
├─────────────────────────────────────┤
│                                     │
│  Đã phát hiện dữ liệu vàng mới hơn  │
│  ⏰ 23/12/2025 15:14                │
│                                     │
│  Bạn có muốn cập nhật để xem dữ     │
│  liệu mới nhất không?               │
│                                     │
├─────────────────────────────────────┤
│  [ Không, Cảm Ơn ] [ 🚀 Cập Nhật ] │
└─────────────────────────────────────┘
```

### Màu Sắc & Styling

- **Header**: Gradient vàng `#f1c40f` → `#f39c12`
- **Button Cập Nhật**: Highlight với gradient & shadow
- **Overlay**: Backdrop mờ với blur effect
- **Responsive**: Tối ưu cho mobile (hiển thị ở dưới cùng)

## 🔄 Luồng Hoạt Động

```
User dán URL cũ vào
     ↓
Modal kiểm tra server (mỗi 20s)
     ↓
Có dữ liệu mới? → YES → Modal hiển thị
              → NO  → Không làm gì
     ↓
User chọn "Cập Nhật" → Nhảy đến dữ liệu mới
             ↓
             URL thay đổi
             ↓
             Dữ liệu tải lại
             ↓
             Scroll lên đầu (smooth)
             
User chọn "Không" → Modal đóng, tiếp tục xem dữ liệu cũ
```

## 📝 Thử Nghiệm

### 1. Test URL Cũ

```bash
# Mở link với ngày hôm trước
http://localhost:3000/#/vietnam/gold/22/12/2025/10/30

# Nếu có dữ liệu mới hôm nay
# → Modal sẽ hiển thị "23/12/2025 15:14"
```

### 2. Test Nút Cập Nhật

```javascript
// Trong browser console:
// Modal sẽ đóng và navigate tới URL mới
// URL thay đổi từ 22/12/2025 sang 23/12/2025
```

### 3. Test Interval Kiểm Tra

```javascript
// Modal kiểm tra server mỗi 20 giây
// Nếu có dữ liệu mới thêm, modal sẽ cập nhật tự động
```

## 🐛 Xử Lý Lỗi

- **Lỗi fetch server**: Catch error, không hiển thị modal
- **URL không hợp lệ**: Kiểm tra `params.day`, `params.month`, `params.year`
- **Dữ liệu không có**: Return early, `setHasNewUpdate(false)`

## 📂 File Liên Quan

```
src/
├── components/Modal/
│   ├── UpdateDataModal.jsx     ← Component Modal mới
│   ├── UpdateDataModal.css     ← Styling modal
│   └── LightboxModal.jsx       ← Component Modal cũ (tùy chọn)
├── pages/
│   └── HomePage.jsx            ← Tích hợp modal
└── hooks/
    └── UseGoldOneDayPrices.js  ← Fetch dữ liệu vàng
```

## 🚀 Cách Sử Dụng Trong Dự Án

### Import Component

```jsx
import UpdateDataModal from "../components/Modal/UpdateDataModal";
```

### Sử Dụng Trong Component

```jsx
const [hasNewUpdate, setHasNewUpdate] = useState(false);
const [latestDateData, setLatestDateData] = useState(null);

return (
  <>
    <UpdateDataModal
      isVisible={hasNewUpdate}
      latestData={latestDateData}
      onConfirm={handleUpdateToLatest}
      onCancel={() => setHasNewUpdate(false)}
    />
    {/* Nội dung trang */}
  </>
);
```

## 💡 Tính Năng Nâng Cao (Optional)

### 1. Tùy Chỉnh Interval Kiểm Tra

```javascript
// Thay đổi từ 20s sang 30s
const timer = setInterval(checkLatestUpdate, 30000);
```

### 2. Thêm Sound Notification

```javascript
// Phát âm thanh khi có dữ liệu mới
const audio = new Audio('/notification.mp3');
if (hasNewUpdate) audio.play();
```

### 3. Local Storage - Ghi Nhớ Lựa Chọn

```javascript
// Ghi nhớ nếu user không muốn được thông báo trong lần này
localStorage.setItem('skipUpdateUntil', timestamp);
```

## ✅ Checklist

- [x] Component Modal tạo
- [x] CSS styling modal
- [x] Import vào HomePage
- [x] Tích hợp logic kiểm tra
- [x] Test URL cũ
- [x] Test button cập nhật
- [x] Responsive design

---

**Tạo ngày**: December 23, 2025  
**Phiên bản**: 1.0  
**Status**: ✅ Production Ready
