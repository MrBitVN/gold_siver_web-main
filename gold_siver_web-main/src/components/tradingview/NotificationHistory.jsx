import React, { useState, useMemo, useEffect } from "react";
import { MdClose, MdDeleteSweep } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { translateText } from "../../services/translationService";
import notificationList from "./notificationListConfig";

const NotificationHistory = ({ isOpen, onClose, history = [] }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState("");
  const [, forceUpdate] = useState(0);
  const [translatedTitles, setTranslatedTitles] = useState({});

  // Force re-render khi language thay đổi + dịch lại titles
  useEffect(() => {
    const handleLanguageChange = async () => {
      forceUpdate((prev) => prev + 1);
      // Dịch lại tất cả titles khi language thay đổi
      if (i18n.language !== "vi") {
        const translated = {};
        for (const item of history) {
          if (item.title && item.title.trim()) {
            translated[item.title] = await translateText(
              item.title,
              i18n.language,
            );
          }
        }
        setTranslatedTitles(translated);
      } else {
        setTranslatedTitles({});
      }
    };

    i18n.on("languageChanged", handleLanguageChange);
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n, history]);

  // Dịch titles lần đầu khi component mount hoặc history thay đổi
  useEffect(() => {
    const translateTitles = async () => {
      if (i18n.language !== "vi" && history.length > 0) {
        const translated = {};
        for (const item of history) {
          if (item.title && item.title.trim()) {
            translated[item.title] = await translateText(
              item.title,
              i18n.language,
            );
          }
        }
        setTranslatedTitles(translated);
      }
    };

    translateTitles();
  }, [history, i18n.language]);

  const parseDateSafe = (timeStr) => {
    if (!timeStr) return null;

    const dateMatch = timeStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      const [_, d, m, y] = dateMatch;
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
      const hour = timeMatch ? parseInt(timeMatch[1]) : 0;
      const min = timeMatch ? parseInt(timeMatch[2]) : 0;
      return new Date(y, m - 1, d, hour, min);
    }

    // Thử parse kiểu ISO chuẩn
    const isoDate = new Date(timeStr);
    return isNaN(isoDate.getTime()) ? null : isoDate;
  };

  const formatDateKey = (date) => {
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  };

  // 2. Gom nhóm dữ liệu
  const groupedHistory = useMemo(() => {
    console.log("Dữ liệu đầu vào history:", history); // Debug xem có đủ từ 17-25 không

    const groups = history.reduce((acc, item) => {
      if (!item) return acc;

      const dateObj = parseDateSafe(item.time);
      let dateKey = t("notificationHistory.undetermined") || "Không xác định";

      if (dateObj) {
        dateKey = formatDateKey(dateObj);
      } else if (item.time) {
        // Nếu không parse được nhưng có string time, lấy 10 ký tự đầu làm key tạm
        dateKey = item.time.substring(0, 10);
      }

      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push({ ...item, _sortDate: dateObj || new Date(0) });
      return acc;
    }, {});

    return groups;
  }, [history]);

  // 3. Lấy danh sách ngày đã sort (mới nhất lên đầu)
  const availableDates = useMemo(() => {
    return Object.keys(groupedHistory).sort((a, b) => {
      const parse = (s) => {
        const parts = s.split("/");
        return parts.length === 3
          ? new Date(parts[2], parts[1] - 1, parts[0])
          : new Date(0);
      };
      return parse(b) - parse(a);
    });
  }, [groupedHistory]);

  if (!isOpen) return null;

  // 4. Logic hiển thị
  const displayedDates = selectedDate ? [selectedDate] : availableDates;

  const clearHistory = () => {
    if (window.confirm(t("notificationHistory.deleteConfirm"))) {
      localStorage.setItem("noti_history_log", "[]");
      window.dispatchEvent(new Event("storage_updated"));
    }
  };

  return (
    <div
      className="history-popover"
      style={{
        position: "absolute",
        right: "50px",
        top: "0",
        width: "300px",
        backgroundColor: "#1a1a1a",
        borderRadius: "12px",
        border: "1px solid #333",
        boxShadow: "-5px 5px 20px rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        maxHeight: "500px",
        color: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px",
          borderBottom: "1px solid #333",
        }}
      >
        <span style={{ fontWeight: "bold", color: "#FFD700" }}>
          {t("notificationHistory.history", { count: history.length })}
        </span>
        <div style={{ display: "flex", gap: "10px" }}>
          <MdDeleteSweep
            size={20}
            style={{ cursor: "pointer", color: "#ff4d4d" }}
            onClick={clearHistory}
          />
          <MdClose size={20} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
      </div>

      <div style={{ padding: "10px" }}>
        <select
          style={{
            width: "100%",
            padding: "5px",
            background: "#262626",
            color: "#fff",
            borderRadius: "4px",
          }}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          <option value="">
            {t("notificationHistory.allDays", { count: availableDates.length })}
          </option>
          {availableDates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
        {displayedDates.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            {t("notificationHistory.empty")}
          </p>
        ) : (
          displayedDates.map((date) => (
            <div key={date} style={{ marginBottom: "15px" }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "#FFD700",
                  marginBottom: "5px",
                  fontWeight: "bold",
                }}
              >
                {date}
              </div>
              {groupedHistory[date].map((item, idx) => {
                const match = notificationList.find((l) =>
                  item.title?.includes(l.title),
                );
                return (
                  <div
                    key={idx}
                    onClick={() =>
                      match?.path && (navigate(match.path), onClose())
                    }
                    style={{
                      background: "#262626",
                      padding: "8px",
                      borderRadius: "6px",
                      marginBottom: "5px",
                      borderLeft: "3px solid #FFD700",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: "9px", color: "#888" }}>
                      {item.time}
                    </div>
                    <div style={{ fontSize: "12px", color: "#eee" }}>
                      {translatedTitles[item.title] || item.title}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationHistory;
