import React, { useState, useEffect, useRef } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { Tooltip } from "react-tooltip";
import "react-circular-progressbar/dist/styles.css";
import { getFearLevel } from "../../utils/fearLevelHelper";
import { getTooltipText } from "../../utils/tooltipHelper";
import "./GaugeChart.css";

const AnimatedGaugeChart = ({ value, label = null, showLabel = true }) => {
  const displayValue = value !== undefined && value !== null ? value : 0;
  const [animatedValue, setAnimatedValue] = useState(displayValue);
  const [isHovering, setIsHovering] = useState(false);
  const animationFrameRef = useRef(null);

  // FIX: Luôn lấy dữ liệu màu theo giá trị thực tế cuối cùng (displayValue)
  // Việc này giúp màu không bị "quét" từ xanh sang đỏ khi chạy animation
  const fearData = getFearLevel(displayValue);

  useEffect(() => {
    setAnimatedValue(displayValue);
  }, [displayValue]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setAnimatedValue(0);

    setTimeout(() => {
      const duration = 2000;
      const startTime = performance.now();
      const startValue = 0;
      const endValue = displayValue;

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (endValue - startValue) * easeProgress;

        setAnimatedValue(Math.round(currentValue));

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    }, 10);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setAnimatedValue(displayValue);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="gauge-container gauge-large">
      <div
        className="gauge-chart animated-gauge"
        data-tooltip-id="fear-greed-tooltip"
        data-tooltip-content={getTooltipText(displayValue)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CircularProgressbar
          value={animatedValue}
          text={`${displayValue}`}
          styles={buildStyles({
            textSize: "28px",
            textColor: fearData.color, // Dùng màu từ helper
            pathColor: fearData.color, // Dùng màu từ helper
            trailColor: "rgba(255, 255, 255, 0.1)",
            pathTransitionDuration: 0.1, 
          })}
        />
      </div>

      {showLabel && (
        <div className="gauge-label" style={{ color: fearData.color }}>
          {label || fearData.label}
        </div>
      )}

      <Tooltip
        id="fear-greed-tooltip"
        place="top"
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.95)",
          color: "#FACC15",
          fontSize: "0.875rem",
          fontWeight: "600",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
          maxWidth: "300px",
          zIndex: 1000,
        }}
      />
    </div>
  );
};

export default AnimatedGaugeChart;