import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { getFearLevel } from "../../utils/fearLevelHelper";
import "./GaugeChart.css";
import { useTranslation } from "react-i18next";
const GaugeChart = ({
  value,
  size = "large",
  label = null,
  showLabel = true,
}) => {
  const { t } = useTranslation();
  const displayValue = value !== undefined && value !== null ? value : 0;
  
  // FIX: Định nghĩa màu sắc trực tiếp theo yêu cầu
  let currentColor = "#FACC15"; // Mặc định là Vàng
  let currentLabel = t("gauge.extreme"); // Mặc định là Trung bình

  if (displayValue > 95) {
    currentColor = "#FF4136"; // Đỏ
    currentLabel = t("gauge.extreme");
  } else if (displayValue < 80) {
    currentColor = "#2ECC71"; // Xanh lá
    currentLabel = t("gauge.safe");
  }

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
            pathColor: currentColor,
            trailColor: "rgba(255, 255, 255, 0.1)",
            pathTransitionDuration: 0.5,
          })}
        />
      </div>

      {showLabel && (
        <div className="gauge-label" style={{ color: currentColor }}>
          {label || currentLabel}
        </div>
      )}
    </div>
  );
};

export default GaugeChart;