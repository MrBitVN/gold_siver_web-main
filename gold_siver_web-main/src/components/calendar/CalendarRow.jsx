import React from "react";
import { useTranslation } from "react-i18next";
import { formatTime, formatDate } from "../../services/calendarService";
import CountryFlag from "./CountryFlag";
import ImportanceStars from "./ImportanceStars";
import StatsBlock from "./StatsBlock";
import "./CalendarRow.css";

/**
 * Component hiển thị 1 dòng sự kiện trong lịch
 */
const CalendarRow = ({ event }) => {
  const { t } = useTranslation();

  return (
    <div className="calendar-row">
      {/* Cột 1: NGÀY + THỜI GIAN */}
      <div className="col-datetime">
        <div className="date-text">{formatDate(event.time)}</div>
        <div className="time-text">{formatTime(event.time)}</div>
      </div>

      {/* Cột 2: QUỐC GIA */}
      <div className="col-country">
        <CountryFlag country={event.country} />
      </div>

      {/* Cột 3: MỨC ĐỘ */}
      <div className="col-importance">
        <ImportanceStars level={event.important} />
      </div>

      {/* Cột 4: NỘI DUNG */}
      <div className="col-content">
        <div className="event-title">{event.title}</div>
        <button className="btn-detail">
          {t('calendar.buttonDetail')}
        </button>
      </div>

      {/* Cột 5: THỐNG KÊ SỐ LIỆU */}
      <div className="col-stats">
        <StatsBlock
          actual={event.actual}
          forecast={event.forecast}
          previous={event.previous}
          result={event.result}
        />
      </div>
    </div>
  );
};

export default CalendarRow;

