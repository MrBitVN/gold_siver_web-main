import React from "react";
import "./TimeRangeFilter.css";

/**
 * Component bộ lọc khoảng thời gian cho biểu đồ nến
 * @param {string} activeRange - Khoảng thời gian đang active ('1W', '1M', '6M', '1Y', 'ALL')
 * @param {Function} onRangeChange - Callback khi người dùng chọn range mới
 */
const TimeRangeFilter = ({ activeRange, onRangeChange }) => {
  // Danh sách các khoảng thời gian
  const timeRanges = [
    { value: "1W", label: "1 Tuần" },
    { value: "1M", label: "1 Tháng" },
    { value: "6M", label: "6 Tháng" },
    { value: "1Y", label: "1 Năm" },
    { value: "ALL", label: "Tất cả" },
  ];

  return (
    <div className="time-range-filter">
      <div className="filter-label">Khoảng thời gian:</div>
      <div className="filter-buttons">
        {timeRanges.map((range) => (
          <button
            key={range.value}
            className={`filter-btn ${
              activeRange === range.value ? "active" : ""
            }`}
            onClick={() => onRangeChange(range.value)}
            aria-label={`Xem dữ liệu ${range.label}`}
          >
            {range.value}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeRangeFilter;
