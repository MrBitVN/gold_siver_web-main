import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useRealTimeData from "../../hooks/useRealTimeData";
import NotificationDropdown from "./NotificationDropdown";
import "./NotificationBell.css";

/**
 * Component icon chuông thông báo với badge đếm tin chưa đọc
 */
const NotificationBell = ({ onNewsClick, newsInAPI }) => {
  const { t } = useTranslation();
  const { news, unreadNewsCount, markNewsAsSeen } = useRealTimeData();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const bellRef = useRef(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleBellClick = () => {
    if (!isDropdownOpen) {
      // Mở dropdown và đánh dấu tất cả là đã đọc
      markNewsAsSeen();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleNewsClick = (newsItem) => {
    setIsDropdownOpen(false);
    if (onNewsClick) {
      onNewsClick(newsItem);
    }
  };

  return (
    <div className="notification-bell-container" ref={bellRef}>
      <button
        className={`notification-bell ${
          unreadNewsCount > 0 ? "has-unread" : ""
        }`}
        onClick={handleBellClick}
        aria-label={t('notifications.title', 'Thông báo')}
      >
        <span className="bell-icon">🔔</span>
        {unreadNewsCount > 0 && (
          <span className="notification-badge">{unreadNewsCount}</span>
        )}
      </button>

      {isDropdownOpen && (
        <NotificationDropdown
          newsItems={news}
          onNewsClick={handleNewsClick}
          onClose={() => setIsDropdownOpen(false)}
          newsInAPI={newsInAPI}
        />
      )}
    </div>
  );
};

export default NotificationBell;
