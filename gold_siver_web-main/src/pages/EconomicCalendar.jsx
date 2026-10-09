import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import useRealTimeData from "../hooks/useRealTimeData";
import { normalizeCalendarEvents, generateMockCalendarData } from "../services/calendarService";
import CalendarTable from "../components/calendar/CalendarTable";
import "./EconomicCalendar.css";
import { logUserInfo } from "../utils/logUserInfo";

/**
 * Page Lịch Kinh Tế
 */
const EconomicCalendar = () => {
  const { t } = useTranslation();
  const { liveData } = useRealTimeData();

  useEffect(() => {
    (async () => {
      await logUserInfo("Màn hình EconomicCanlendar.jsx")
    })();
  }, []);

  const events = useMemo(() => {
    if (liveData) {
      // Thử nhiều cách để lấy calendar data
      const fromSocket = normalizeCalendarEvents(
        liveData.Calendars || // Từ API REST: socket_all.Calendars
        liveData.calendar ||
        liveData.Calendar ||
        liveData.calendars ||
        liveData.calendarEvents ||
        liveData.EconomicCalendar ||
        liveData.calendar_data
      );

      if (fromSocket.length > 0) {
        return fromSocket;
      }
    }

    return generateMockCalendarData();
  }, [liveData]);

  return (
    <section className="calendar-section">
      <div className="calendar-container">
        {/* Title */}
        <h2 className="calendar-title">{t('calendar.title')}</h2>

        {/* Calendar Table */}
        <CalendarTable events={events} />
      </div>
    </section>
  );
};

export default EconomicCalendar;

