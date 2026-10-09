import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "./NotificationDropdown.css";
import { UseGoldOneDayPrices } from "../../hooks/UseGoldOneDayPrices";
import { useParams } from "react-router-dom";

/**
 * Component dropdown hiển thị danh sách tin tức
 * @param {Array} newsItems - Danh sách tin tức
 * @param {Function} onNewsClick - Callback khi click vào tin
 * @param {Function} onClose - Callback khi đóng dropdown
 */
const NotificationDropdown = ({
  newsItems,
  onNewsClick,
  onClose,
  newsInAPI,
}) => {
  const { t } = useTranslation();
  const lengthNews = () => {
    let sum = newsItems.length;
    newsInAPI.forEach((item, _) => {
      item.data.forEach((it, _) => {
        sum++;
      });
    });

    // 5. Trả về tổng cuối cùng
    return sum;
  };

  if (!newsItems || newsItems.length === 0) {
    return (
      <div className="notification-dropdown">
        <div className="dropdown-header">
          <h3>{t('notifications.title', 'Thông báo')}</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>{t('notifications.empty', 'Chưa có tin tức mới')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-dropdown">
      <div className="dropdown-header">
        <h3>{t('notifications.title', 'Thông báo')} ({lengthNews()})</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="news-list">
        {newsItems.slice(0, 10).map((item) => (
          <div
            key={item.id || item.ID}
            className="news-item"
            onClick={() => onNewsClick(item)}
          >
            <div className="news-icon">📰</div>
            <div className="news-content">
              <div className="news-title">{item.title}</div>
              {item.created_at && (
                <div className="news-time">
                  {new Date(item.created_at).toLocaleString("vi-VN")}
                </div>
              )}
            </div>
            <div className="news-arrow">›</div>
          </div>
        ))}
      </div>

      <div className="dropdown-footer">
        <button className="view-all-btn">{t('notifications.viewAll', 'Xem tất cả')}</button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
