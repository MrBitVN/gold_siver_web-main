import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "./RsiChart.css";

/**
 * Component đồng hồ đo Fear & Greed Index
 * @param {number} value - Giá trị chỉ số (0-100)
 * @param {string} size - Kích thước: 'large' | 'small'
 * @param {string} label - Label hiển thị bên dưới (optional)
 * @param {boolean} showLabel - Có hiển thị label hay không
 */

const getFearLevel = (value) => {
  if (value <= 40) {
    return {
      level: "extreme-fear",
      label: "Sợ hãi tột độ",
      labelEn: "Extreme Fear",
      color: "#84CC16", // Xanh lá nhạt
      textColor: "#FFF",
    };
  }

  if (value >= 40 && value <= 70) {
    return {
      level: "neutral",
      label: "THỊ TRƯỜNG GIẰNG CO",
      labelEn: "Neutral",
      color: "#FACC15", // Vàng
      textColor: "#000",
    };
  }

  if (value > 70) {
    return {
      level: "greed",
      label: "NIỀM TIN TĂNG GIÁ TRUNG BÌNH",
      labelEn: "Greed",
      color: "#EF4444", // Đỏ
      textColor: "#000",
    };
  }

  // Fallback
  return {
    level: "unknown",
    label: "Không xác định",
    labelEn: "Unknown",
    color: "#6B7280",
    textColor: "#FFF",
  };
};

const RsiChart = ({
  value,
  size = "large",
  label = null,
  showLabel = true,
}) => {
  const fearData = getFearLevel(value);
  const displayValue = value !== undefined && value !== null ? value : 0;

  const containerClass = size === "large" ? "gauge-large" : "gauge-small";

  return (
    <div className={`gauge-container ${containerClass}`}>
      <div className="gauge-chart">
        <CircularProgressbar
          value={displayValue}
          text={`${displayValue}`}
          styles={buildStyles({
            textSize: size === "large" ? "28px" : "20px",
            textColor: "#ffffff",
            pathColor: fearData.color,
            trailColor: "rgba(255, 255, 255, 0.1)",
            pathTransitionDuration: 0.5,
          })}
        />
      </div>

      {showLabel && (
        <div className="gauge-label">{label || fearData.label}</div>
      )}
    </div>
  );
};

export default RsiChart;
