import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../real-time/NotificationStyles.css";
import { saveToNotificationHistory } from "../tradingview/logger";
import { translateText } from "../../services/translationService";

const WilliamsRNotification = ({ notifications = [], onRemove }) => {
  const { t, i18n } = useTranslation();
  const [visibleNotifs, setVisibleNotifs] = useState({});
  const [translatedTexts, setTranslatedTexts] = useState({});
  const fadeTimeouts = useRef({});
  const [currentLang, setCurrentLang] = useState(
    () => localStorage.getItem("lang") || i18n.language || "vi"
  );

  // Sync lang từ cả i18n và window event
  useEffect(() => {
    const handleI18n = (lang) => setCurrentLang(lang);
    const handleWindow = (e) => setCurrentLang(e.detail?.lang || i18n.language || "vi");
    i18n.on("languageChanged", handleI18n);
    window.addEventListener("language-changed", handleWindow);
    return () => {
      i18n.off("languageChanged", handleI18n);
      window.removeEventListener("language-changed", handleWindow);
    };
  }, [i18n]);

  // Dịch text khi language thay đổi
  useEffect(() => {
    const translateNotificationTexts = async () => {
      const newTranslations = { _lang: currentLang };

      const textsToTranslate = [
        { key: "SELL",        viText: "Khu vực overbuy",  enText: "Overbuy region" },
        { key: "BUY",         viText: "Khu vực oversold", enText: "Oversold region" },
        { key: "BÁN",         viText: "Khu vực overbuy",  enText: "Overbuy region" },
        { key: "MUA",         viText: "Khu vực oversold", enText: "Oversold region" },
        { key: "ALERT",       viText: "Williams R Alert",  enText: "Williams R Alert" },
        { key: "GOLD",        viText: "Vàng",              enText: "Gold" },
        { key: "SILVER",      viText: "Bạc",               enText: "Silver" },
        { key: "SELL_ACTION", viText: "BÁN",               enText: "SELL" },
        { key: "BUY_ACTION",  viText: "MUA",               enText: "BUY" },
      ];

      for (const textItem of textsToTranslate) {
        if (currentLang.startsWith("vi")) {
          newTranslations[textItem.key] = textItem.viText;
        } else if (currentLang.startsWith("en")) {
          newTranslations[textItem.key] = textItem.enText;
        } else {
          try {
            newTranslations[textItem.key] = await translateText(textItem.enText, currentLang);
          } catch {
            newTranslations[textItem.key] = textItem.enText;
          }
        }
      }

      setTranslatedTexts(newTranslations);
    };

    translateNotificationTexts();
  }, [currentLang]);

  useEffect(() => {
    notifications.forEach((notif) => {
      // Nếu là thông báo mới chưa có trong state visible
      if (!(notif.id in visibleNotifs)) {
        // 🔔 Lưu lịch sử thông báo
        const fullContent = `${notif.type} ${notif.action} (WR: ${notif.wrValue})`;
        saveToNotificationHistory(fullContent, "WILLIAMS_R_ALERT");

        setVisibleNotifs((prev) => ({ ...prev, [notif.id]: true }));

        // Tự động ẩn sau 5 giây
        if (fadeTimeouts.current[notif.id]) {
          clearTimeout(fadeTimeouts.current[notif.id]);
        }

        fadeTimeouts.current[notif.id] = setTimeout(() => {
          setVisibleNotifs((prev) => ({ ...prev, [notif.id]: false }));
          setTimeout(() => {
            onRemove(notif.id);
          }, 300);
        }, 5000);
      }
    });
  }, [notifications]);

  const getWilliamsColor = (action) => {
    const normalized = String(action || "")
      .trim()
      .toUpperCase();
    return normalized === "BÁN" || normalized === "SELL"
      ? "#ff4d4d"
      : "#00ff88";
  };

  // Sắp xếp: GOLD luôn ở trên, SILVER luôn ở dưới
  const sortedNotifs = [...notifications].sort((a, b) => {
    if (a.type === "GOLD" && b.type === "SILVER") return -1;
    if (a.type === "SILVER" && b.type === "GOLD") return 1;
    return 0;
  });

  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        left: "10px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <style>{`
        @keyframes sellGlow {
          0%, 100% { box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4), 0 0 5px rgba(255, 77, 77, 0.3); }
          50% { box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4), 0 0 10px rgba(255, 77, 77, 0.6); }
        }
        @keyframes buyGlow {
          0%, 100% { box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4), 0 0 5px rgba(0, 255, 136, 0.3); }
          50% { box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4), 0 0 10px rgba(0, 255, 136, 0.6); }
        }
      `}</style>

      {sortedNotifs.map((notif) => (
        <div
          key={notif.id}
          className="etf-notification"
          style={{
            width: "auto",
            minWidth: "220px",
            maxWidth: "280px",
            padding: "6px 10px",
            border: `1.5px solid ${getWilliamsColor(notif.action)}`,
            background: "rgba(18, 18, 18, 0.95)",
            borderRadius: "8px",
            animation:
              notif.action === "BÁN"
                ? "sellGlow 1.5s infinite"
                : "buyGlow 1.5s infinite",
            opacity: visibleNotifs[notif.id] ? 1 : 0,
            transform: visibleNotifs[notif.id]
              ? "translateX(0)"
              : "translateX(-20px)",
            transition: "all 0.3s ease",
            position: "relative",
          }}
        >
          <div className="notification-inner" style={{ padding: 0 }}>
            <button
              className="notification-close"
              onClick={() => {
                setVisibleNotifs((prev) => ({ ...prev, [notif.id]: false }));
                setTimeout(() => onRemove(notif.id), 300);
              }}
              style={{
                position: "absolute",
                top: "2px",
                right: "4px",
                fontSize: "18px",
                background: "none",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              ×
            </button>

            <div
              style={{
                fontSize: "9px",
                textAlign: "left",
                marginBottom: "2px",
                opacity: 0.8,
                color: getWilliamsColor(notif.action),
                textTransform: "uppercase",
                fontWeight: "700",
                letterSpacing: "0.5px",
              }}
            >
              {translatedTexts["ALERT"] || "Williams R Alert"}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <span
                style={{ fontSize: "12px", fontWeight: "700", color: "#fff" }}
              >
                {notif.type}
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  backgroundColor:
                    notif.action === "BÁN"
                      ? "rgba(255, 77, 77, 0.2)"
                      : "rgba(0, 255, 136, 0.2)",
                  color: getWilliamsColor(notif.action),
                }}
              >
                {notif.action}
              </span>
            </div>

            {/* Chỉ hiển thị WR, đã bỏ Price */}
            <div
              style={{
                fontSize: "11px",
                color: "#e5e7eb",
                marginTop: "6px",
                padding: "4px 0",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: "600",
                gap: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#9ca3af",
                  fontStyle: "italic",
                  flex: 1,
                }}
              >
              {translatedTexts[notif.action] ||
                  (notif.action === "SELL" || notif.action === "BÁN"
                    ? "Khu vực overbuy"
                    : "Khu vực oversold")}
              </div>
              <span
                style={{
                  color: getWilliamsColor(notif.action),
                  whiteSpace: "nowrap",
                }}
              >
                WR: {notif.wrValue}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WilliamsRNotification;
