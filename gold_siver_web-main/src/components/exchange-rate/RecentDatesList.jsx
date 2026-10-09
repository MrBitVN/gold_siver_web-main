import React from "react";
import { Link } from "react-router-dom";
import { formatDateForUrl, getRecentDates } from "../../utils/exchangeRateHelper";
import "./RecentDatesList.css";
import { useTranslation } from "react-i18next";
/**
 * Component hiển thị danh sách các ngày gần nhất có dữ liệu
 * @param {Object} props
 * @param {Object} props.data - Dữ liệu đã xử lý
 * @param {number} props.count - Số ngày cần hiển thị (mặc định 7)
 */
const RecentDatesList = ({ data, count = 7 }) => {
  const { t } = useTranslation();
  const recentDates = getRecentDates(data, count);

  if (recentDates.length === 0) {
    return null;
  }

  const formatDateDisplay = (dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="recent-dates-list">
      <h3 className="recent-dates-title">{t('RecentDatesList.title')}</h3>
      <div className="recent-dates-items">
        {recentDates.map((dateStr) => {
          const urlDate = formatDateForUrl(dateStr);
          return (
            <Link
              key={dateStr}
              to={`/ty-gia/${urlDate}`}
              className="recent-date-item"
            >
              {formatDateDisplay(dateStr)}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RecentDatesList;

