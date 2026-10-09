import React from "react";
import { useTranslation } from "react-i18next";
import CalendarRow from "./CalendarRow";
import "./CalendarTable.css";

/**
 * Component hiển thị bảng lịch kinh tế
 * @param {Array} events - Danh sách sự kiện
 */
const CalendarTable = ({ events = [] }) => {
  const { t } = useTranslation();

  if (events.length === 0) {
    return (
      <div className="calendar-empty">
        <p>{t('calendar.noEvents')}</p>
      </div>
    );
  }

  return (
    <div className="calendar-table">
      {/* Header */}
      <div className="calendar-header">
        <div className="header-col-datetime">
          <span>{t('calendar.headerDate')}</span>
          <span>{t('calendar.headerTime')}</span>
        </div>
        <div className="header-col-country">{t('calendar.headerCountry')}</div>
        <div className="header-col-importance">{t('calendar.headerImportance')}</div>
        <div className="header-col-content">{t('calendar.headerContent')}</div>
        <div className="header-col-stats">{t('calendar.headerStats')}</div>
      </div>

      {/* Body */}
      <div className="calendar-body">
        {events.map((event) => (
          <CalendarRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
};

export default CalendarTable;

