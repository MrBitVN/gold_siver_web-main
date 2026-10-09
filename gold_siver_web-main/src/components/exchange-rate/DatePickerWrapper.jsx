import React, { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./DatePickerWrapper.css";

/**
 * Wrapper cho react-calendar với styling phù hợp dark theme
 * @param {Object} props
 * @param {Date|null} props.selected - Ngày được chọn
 * @param {Function} props.onChange - Callback khi ngày thay đổi
 * @param {Date|null} props.maxDate - Ngày tối đa có thể chọn
 * @param {Date|null} props.minDate - Ngày tối thiểu có thể chọn
 */
const DatePickerWrapper = ({ selected, onChange, maxDate, minDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const handleDateChange = (date) => {
    if (onChange) {
      onChange(date);
    }
    setIsOpen(false);
  };

  // Đóng calendar khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="date-picker-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="date-picker-input"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected ? selected.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "Chọn ngày"}
      </button>
      {isOpen && (
        <div className="calendar-popup">
          <Calendar
            onChange={handleDateChange}
            value={selected}
            maxDate={maxDate}
            minDate={minDate}
            className="exchange-rate-calendar"
          />
        </div>
      )}
    </div>
  );
};

export default DatePickerWrapper;

