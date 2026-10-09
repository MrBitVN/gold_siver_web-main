import React from "react";
import "./UpdateDataModal.css";
import { useTranslation } from "react-i18next";

const UpdateDataModal = ({ isVisible, latestData, onConfirm, onCancel }) => {
  const { t, i18n } = useTranslation();

  if (!isVisible || !latestData) return null;

  const formatTime = (day, month, year, hour, minute) => {
    const date = new Date(year, month - 1, day, hour, minute);

    // 🔥 auto format theo ngôn ngữ
    return new Intl.DateTimeFormat(i18n.language === "vi" ? "vi-VN" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const currentTime = formatTime(
    latestData.day,
    latestData.month,
    latestData.year,
    latestData.hour,
    latestData.minute
  );

  return (
    <div className="update-modal-overlay">
      <div className="update-modal-container">
        {/* Header */}
        <div className="update-modal-header">
          <div className="update-modal-icon">📊</div>
          <h2>{t("updateModal.title")}</h2>
          <button className="update-modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="update-modal-body">
          <p className="update-modal-message">
            {t("updateModal.message")}
          </p>

          <div className="update-modal-timestamp">
            <span className="time-icon">⏰</span>
            <span className="time-value">{currentTime}</span>
          </div>

          <p className="update-modal-subtext">
            {t("updateModal.subtext")}
          </p>
        </div>

        {/* Footer */}
        <div className="update-modal-footer">
          <button className="btn-cancel" onClick={onCancel}>
            {t("updateModal.cancel")}
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            🚀 {t("updateModal.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateDataModal;