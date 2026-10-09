import React, { useState, useMemo } from "react";
import ReactCountryFlag from "react-country-flag";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import useRealTimeData from "../hooks/useRealTimeData.js";
import {
  getCountryCode,
  formatCalendarTime,
  getImportanceStars,
  getResultColor,
  formatEconomicValue,
  sortCalendarsByTime,
  filterCalendarsByDate,
} from "../utils/calendarHelper.js";
import "./CalendarPage.css";

/**
 * Trang Lịch Kinh Tế - Economic Calendar
 */
const CalendarPage = () => {
  const { liveData, isConnected } = useRealTimeData();
  const [dateFilter, setDateFilter] = useState("all"); // "today" | "week" | "month" | "all"

  // Lấy dữ liệu Calendars từ WebSocket
  const calendars = useMemo(() => {
    if (!liveData || !liveData.Calendars) return [];

    // Sắp xếp và lọc
    const sorted = sortCalendarsByTime(liveData.Calendars);
    return filterCalendarsByDate(sorted, dateFilter);
  }, [liveData, dateFilter]);

  // Loading state - chờ kết nối WebSocket
  if (!isConnected || !liveData) {
    return (
      <main className="main-content">
        <div className="calendar-page">
          <div className="calendar-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải dữ liệu lịch kinh tế...</p>
          </div>
        </div>
      </main>
    );
  }

  // Empty state - không có dữ liệu
  if (!calendars || calendars.length === 0) {
    return (
      <main className="main-content">
        <div className="calendar-page">
          <div className="calendar-header">
            <h1 className="calendar-title">📅</h1>
            <div className="calendar-status connected">
              <span className="status-dot"></span>
              LIVE
            </div>
          </div>
          <div className="calendar-filters">
            <button
              className={`filter-btn ${dateFilter === "all" ? "active" : ""}`}
              onClick={() => setDateFilter("all")}
            >
              Tất cả
            </button>
            <button
              className={`filter-btn ${dateFilter === "today" ? "active" : ""}`}
              onClick={() => setDateFilter("today")}
            >
              Hôm nay
            </button>
            <button
              className={`filter-btn ${dateFilter === "week" ? "active" : ""}`}
              onClick={() => setDateFilter("week")}
            >
              Tuần này
            </button>
            <button
              className={`filter-btn ${dateFilter === "month" ? "active" : ""}`}
              onClick={() => setDateFilter("month")}
            >
              Tháng này
            </button>
          </div>
          <div className="calendar-empty">
            <p>Không có sự kiện kinh tế nào trong khoảng thời gian này.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      <div className="calendar-page">
        {/* Header */}
        <div className="calendar-header">
          <h1 className="calendar-title">📅 </h1>
          <div className="calendar-status connected">
            <span className="status-dot"></span>
            LIVE
          </div>
        </div>

        {/* Filters */}
        <div className="calendar-filters">
          <button
            className={`filter-btn ${dateFilter === "all" ? "active" : ""}`}
            onClick={() => setDateFilter("all")}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${dateFilter === "today" ? "active" : ""}`}
            onClick={() => setDateFilter("today")}
          >
            Hôm nay
          </button>
          <button
            className={`filter-btn ${dateFilter === "week" ? "active" : ""}`}
            onClick={() => setDateFilter("week")}
          >
            Tuần này
          </button>
          <button
            className={`filter-btn ${dateFilter === "month" ? "active" : ""}`}
            onClick={() => setDateFilter("month")}
          >
            Tháng này
          </button>
        </div>

        {/* Table */}
        <div className="calendar-table-wrapper">
          <table className="calendar-table">
            <thead>
              <tr>
                <th className="col-time">Thời gian</th>
                <th className="col-country">Quốc gia</th>
                <th className="col-importance">Mức độ</th>
                <th className="col-event">Sự kiện</th>
                <th className="col-previous">Trước đó</th>
                <th className="col-forecast">Dự báo</th>
                <th className="col-actual">Thực tế</th>
              </tr>
            </thead>
            <tbody>
              {calendars.map((event) => (
                <CalendarRow key={event.ID} event={event} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

/**
 * Component hiển thị một dòng sự kiện
 */
const CalendarRow = ({ event }) => {
  const countryCode = getCountryCode(event.country);
  const stars = getImportanceStars(event.important);
  const resultColorClass = getResultColor(event.result);

  return (
    <tr className="calendar-row">
      {/* Thời gian */}
      <td className="col-time">{formatCalendarTime(event.time)}</td>

      {/* Quốc gia */}
      <td className="col-country">
        <div className="country-cell">
          <ReactCountryFlag
            countryCode={countryCode}
            svg
            style={{
              width: "24px",
              height: "18px",
              marginRight: "8px",
            }}
            title={event.country}
          />
          <span className="country-name">{event.country}</span>
        </div>
      </td>

      {/* Mức độ quan trọng */}
      <td className="col-importance">
        <div className="importance-stars">
          {[1, 2, 3].map((i) => (
            <span key={i} className="star-icon">
              {i <= stars ? (
                <AiFillStar color="#FFD700" size={16} />
              ) : (
                <AiOutlineStar color="#ccc" size={16} />
              )}
            </span>
          ))}
        </div>
      </td>

      {/* Sự kiện */}
      <td className="col-event">
        <span className="event-title">{event.title}</span>
      </td>

      {/* Trước đó */}
      <td className="col-previous calendar-neutral">
        {formatEconomicValue(event.previous, event.unit)}
      </td>

      {/* Dự báo */}
      <td className="col-forecast calendar-neutral">
        {formatEconomicValue(event.forecast, event.unit)}
      </td>

      {/* Thực tế */}
      <td className={`col-actual ${resultColorClass}`}>
        {formatEconomicValue(event.actual, event.unit)}
      </td>
    </tr>
  );
};

export default CalendarPage;
