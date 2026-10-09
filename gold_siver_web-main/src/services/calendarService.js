import i18n from 'i18next';

/**
 * Calendar Service - Lấy dữ liệu lịch kinh tế
 */

/**
 * Normalize calendar events từ dữ liệu WebSocket hoặc REST API
 * @param {Array|Object} source - Nguồn dữ liệu lấy từ liveData
 * @returns {Array}
 */
export const normalizeCalendarEvents = (source) => {
  if (!source) return [];

  let rawEvents = [];

  if (Array.isArray(source)) {
    rawEvents = source;
  } else if (Array.isArray(source.Calendars)) {
    // Từ API REST: socket_all.Calendars
    rawEvents = source.Calendars;
  } else if (Array.isArray(source.calendar)) {
    rawEvents = source.calendar;
  } else if (Array.isArray(source.calendarEvents)) {
    rawEvents = source.calendarEvents;
  } else if (source.calendars && Array.isArray(source.calendars.items)) {
    rawEvents = source.calendars.items;
  } else if (source.calendars && Array.isArray(source.calendars)) {
    rawEvents = source.calendars;
  }

  return rawEvents.map((event, index) => {
    const date = parseDateTime(event);

    return {
      id: event.id || event.ID || event.event_id || index,
      title: event.title || event.event || event.event_name || "Sự kiện kinh tế",
      country: (event.country || event.country_code || "US").toUpperCase(),
      important: Number(event.important ?? event.importance ?? event.level ?? 0),
      previous: event.previous ?? event.prev ?? null,
      forecast: event.forecast ?? event.consensus ?? null,
      actual: event.actual ?? event.real ?? null,
      time: date,
      result: inferResult(event),
    };
  });
};

/**
 * Generate mock calendar data để test UI
 */
export const generateMockCalendarData = () => {
  return [
    {
      id: 1,
      title: i18n.t('calendar.mockEvent1'),
      country: "US",
      important: 3,
      previous: 49.1,
      forecast: 49.4,
      actual: 48.7,
      time: new Date("2025-11-03T22:00:00"),
      result: false, // Thực tế < Dự báo → Xấu → Đỏ
    },
    {
      id: 2,
      title: i18n.t('calendar.mockEvent2'),
      country: "US",
      important: 3,
      previous: null,
      forecast: 28,
      actual: 42,
      time: new Date("2025-11-05T20:15:00"),
      result: true, // Thực tế > Dự báo → Tốt → Xanh
    },
    {
      id: 3,
      title: i18n.t('calendar.mockEvent3'),
      country: "US",
      important: 3,
      previous: 50,
      forecast: 50.8,
      actual: 52.4,
      time: new Date("2025-11-05T22:00:00"),
      result: true,
    },
  ];
};

/**
 * Format giờ theo locale hiện tại
 * @param {Date} date
 * @returns {string} "22:00" hoặc "20:15"
 */
export const formatTime = (date) => {
  if (!date) return i18n.t('calendar.na');
  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format ngày theo locale hiện tại
 * @param {Date} date
 * @returns {string} "Thứ Hai, 03/11" hoặc "Monday, 03/11"
 */
export const formatDate = (date) => {
  if (!date) return i18n.t('calendar.na');

  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
  const dayName = date.toLocaleDateString(locale, { weekday: 'long' });
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${dayName}, ${day}/${month}`;
};

/**
 * Format số liệu
 */
export const formatStat = (value) => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "string") return value;
  return Number(value).toLocaleString("vi-VN");
};

/**
 * Parse date + time từ nhiều format khác nhau
 */
const parseDateTime = (event) => {
  if (!event) return new Date();

  const dateValue = event.date || event.day || event.event_date || event.ngay || event.date_time;
  const timeValue = event.time || event.event_time || event.gio || event.hour;

  if (event.timestamp) {
    const timestamp = Number(event.timestamp);
    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp * (timestamp < 1e12 ? 1000 : 1));
    }
  }

  if (dateValue) {
    const dateString = `${dateValue} ${timeValue || ""}`.trim();
    const parsed = new Date(dateString);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
};

/**
 * Suy ra kết quả tốt/xấu nếu có dữ liệu actual/forecast
 */
const inferResult = (event) => {
  const actual = Number(event.actual ?? event.real ?? NaN);
  const forecast = Number(event.forecast ?? event.consensus ?? NaN);

  if (!Number.isNaN(actual) && !Number.isNaN(forecast)) {
    return actual >= forecast;
  }

  if (typeof event.result !== "undefined") {
    if (event.result === true || event.result === "good") return true;
    if (event.result === false || event.result === "bad") return false;
  }

  return null;
};

