import React from "react";
import { useTranslation } from "react-i18next";
import { formatStat } from "../../services/calendarService";
import "./StatsBlock.css";

/**
 * Component hiển thị số liệu: Thực tế, Dự báo, Trước đó
 * @param {number|string} actual - Số liệu thực tế
 * @param {number|string} forecast - Số liệu dự báo
 * @param {number|string} previous - Số liệu trước đó
 * @param {boolean} result - true=tốt (xanh), false=xấu (đỏ), null=trung lập
 */
const StatsBlock = ({ actual, forecast, previous, result }) => {
  const { t } = useTranslation();

  // Xác định màu cho Thực tế
  const getActualColor = () => {
    if (result === true) return "stat-good"; // Xanh
    if (result === false) return "stat-bad"; // Đỏ
    return ""; // Xám
  };

  return (
    <div className="stats-block">
      <div className="stat-column">
        <div className="stat-label">{t('calendar.statActual')}</div>
        <div className={`stat-value ${getActualColor()}`}>
          {formatStat(actual)}
        </div>
      </div>
      
      <div className="stat-column">
        <div className="stat-label">{t('calendar.statForecast')}</div>
        <div className="stat-value stat-neutral">
          {formatStat(forecast)}
        </div>
      </div>
      
      <div className="stat-column">
        <div className="stat-label">{t('calendar.statPrevious')}</div>
        <div className="stat-value stat-neutral">
          {formatStat(previous)}
        </div>
      </div>
    </div>
  );
};

export default StatsBlock;

