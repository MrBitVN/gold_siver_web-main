import React, { useEffect, useMemo, useState, useRef } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import "./Header.css";
import NotificationBell from "../components/notification/NotificationBell";
import { useDateGold } from "../hooks/useDateGold";
import { useVang247Dates } from "../hooks/useHourOneDay";
import { MdHistory } from "react-icons/md";
import UpdateDataModal from "../components/Modal/UpdateDataModal";
import LiveNewsBell from "../components/notification/LiveNewsBell";
import LiveNewsPanel from "../components/notification/LiveNewsPanel";
import LatestPostTicker from "../components/notification/LatestPostTicker";
import NotificationHistory from "../components/tradingview/NotificationHistory";
import GoldSearch from "../components/tradingview/GoldSearch";
import ReadNewsHistory from "../components/HistoryNews/ReadNewshistory";
import LanguageSelector from "../components/Modal/LanguageSelector";
import {
  changeLanguageWithTranslation,
  TRANSLATION_BACKGROUND_STATUS_EVENT,
} from "../services/translationService";
import { getLanguageFlagMetaByCode } from "../config/languages";
import { resources } from "../config/i18n";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
const filterDate = {
  sortBy: "datetime",
  sortOrder: "desc",
};

const Header = ({ lastUpdated, newsInAPI, liveData }) => {
  const [openHistory, setOpenHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [isLanguageSelectorOpen, setIsLanguageSelectorOpen] = useState(false);
  const [isBackgroundTranslating, setIsBackgroundTranslating] = useState(false);
  const { t } = useTranslation();

  // Hàm thay đổi ngôn ngữ
  const changeLanguage = async (lang) => {
    await changeLanguageWithTranslation(lang, resources);

    // Khi thay đổi ngôn ngữ, cập nhật URL route - thay "vietnam" bằng language code
    const pathParts = location.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      const currentFirstPart = pathParts[0].toLowerCase();
      
      // Tuyệt đối không điều hướng nếu đang ở Polymarket hoặc các trang cố định
      const staticRoutes = ['polymarket', 'lich_kinh_te', 'ty-gia', 'money-flow-heatmap', 'tin-tuc-moi-nhat', 'live-news', 'lich-su-gia'];
      if (staticRoutes.includes(currentFirstPart)) {
        return; // Không đổi URL
      }

      const regionsAndLangs = ['vietnam', 'thailand', 'japan', 'korea', 'china', 'usa', 'world', 'vi', 'en', 'th', 'lo', 'zh-cn', 'ja', 'ko'];
      
      if (regionsAndLangs.includes(currentFirstPart)) {
        pathParts[0] = lang;
        navigate("/" + pathParts.join("/"), { replace: true });
      }
    }
  };
  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, []);
  useEffect(() => {
    const handleBackgroundTranslationStatus = (event) => {
      setIsBackgroundTranslating(Boolean(event.detail?.isTranslating));
    };

    window.addEventListener(
      TRANSLATION_BACKGROUND_STATUS_EVENT,
      handleBackgroundTranslationStatus,
    );

    return () => {
      window.removeEventListener(
        TRANSLATION_BACKGROUND_STATUS_EVENT,
        handleBackgroundTranslationStatus,
      );
    };
  }, []);
  useEffect(() => {
    const updateHistoryFromStorage = () => {
      const saved = localStorage.getItem("noti_history_log");
      if (saved) {
        setHistoryList(JSON.parse(saved));
      }
    };
    updateHistoryFromStorage();
    window.addEventListener("storage_updated", updateHistoryFromStorage);
    window.addEventListener("storage", updateHistoryFromStorage);
    return () => {
      window.removeEventListener("storage_updated", updateHistoryFromStorage);
      window.removeEventListener("storage", updateHistoryFromStorage);
    };
  }, []);
  const [selectedNews, setSelectedNews] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [isModalTrans, setIsModalTrans] = useState(false);
  const [transModalContent, setTransModalContent] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [timeLastest, setTimeLastest] = useState(null);

  const prevThoigianRef = useRef("");
  const audioRef = useRef(null);

  // Cập nhật thời gian thực từ liveData (API mới)
  useEffect(() => {
    if (liveData?.thoigian && liveData.thoigian !== prevThoigianRef.current) {
      prevThoigianRef.current = liveData.thoigian;
      try {
        const [datePart, timePart] = liveData.thoigian.split(" ");
        const [year, month, day] = datePart.split("-");
        const [hour, minute] = timePart.split(":");

        const newTime = {
          day: String(day).padStart(2, "0"),
          month: String(month).padStart(2, "0"),
          year,
          hour: String(hour).padStart(2, "0"),
          minute: String(minute).padStart(2, "0"),
        };
        setTimeLastest(newTime);
      } catch (e) {
        console.warn("Lỗi parse thoigian:", e);
      }
    }
  }, [liveData]);

  // Logic phát âm thanh an toàn
  useEffect(() => {
    if (timeLastest) {
      const currentTimeStr = `${timeLastest.day}-${timeLastest.month}-${timeLastest.year}-${timeLastest.hour}-${timeLastest.minute}`;
      const lastSavedTime = localStorage.getItem("last_data_time");

      if (lastSavedTime && lastSavedTime !== currentTimeStr) {
        if (!audioRef.current) {
          audioRef.current = new Audio("/co_du_lieu_moi.mp3");
          audioRef.current.volume = 0.7;
        }
        audioRef.current.play().catch(() => { });
      }
      localStorage.setItem("last_data_time", currentTimeStr);
    }
  }, [timeLastest]);
  // ---------------------------------------------------------
  const { displayedDates, isLoading: isDatesLoading } = useDateGold(filterDate); // SONPIPI
  // Tìm ngày có dữ liệu gần nhất (loại bỏ 'image_tintuc' và chỉ lấy ngày có dirname === datetime)
  const latestDateString = useMemo(() => {
    if (displayedDates.length === 0) return null;

    // Lọc và sắp xếp các ngày hợp lệ
    const validDates = displayedDates
      .filter((date) => date.dirname !== "image_tintuc") // Bỏ điều kiện === date.datetime
      .sort((a, b) => b.datetime.localeCompare(a.datetime)); // Sắp xếp giảm dần

    if (validDates.length > 0)
      console.log("latestDateString: ", validDates[0].dirname);
    return validDates.length > 0 ? validDates[0].dirname : null;
  }, [displayedDates]); // SONPIPI _________
  const [latestDay, latestMonth, latestYear] = latestDateString
    ? latestDateString.split("_")
    : [null, null, null]; // SONPIPI _________
  const { files: latestDateFiles, isLoading: isTimesLoading } = useVang247Dates(
    latestDay,
    latestMonth,
    latestYear,
    displayedDates,
  ); // SONPIPI _________
  const latestFile = latestDateFiles?.length > 0 ? latestDateFiles[0] : null; // SONPIPI _________
  // Lấy ngày thực tế từ file tìm được (có thể khác với latestDateString nếu fallback)
  const actualDay = latestFile?.day || latestDay; // SONPIPI _________
  const actualMonth = latestFile?.month || latestMonth; // SONPIPI _________
  const actualYear = latestFile?.year || latestYear; // SONPIPI _________

  const path = location.pathname;
  const params = useParams();
  const currentLanguageFlagMeta = useMemo(
    () => getLanguageFlagMetaByCode(i18n.language),
    [i18n.language],
  );

  const parts = path.split("/");
  let timeURL = "";
  if (parts.length >= 8) {
    const day = String(parts[3]).padStart(2, "0");
    const month = String(parts[4]).padStart(2, "0");
    const year = parts[5];
    const hour = String(parts[6]).padStart(2, "0");
    const minute = String(parts[7]).padStart(2, "0");
    timeURL = `${day}/${month}/${year}/${hour}/${minute}`;
  }

  const handleTranslateModal = async (e, content) => {
    e.stopPropagation();
    if (isModalTrans) {
      setIsModalTrans(false);
      return;
    }
    if (transModalContent) {
      setIsModalTrans(true);
      return;
    }

    setModalLoading(true);
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(content || "")}`,
      );
      const result = await res.json();
      if (result && result[0]) {
        const text = result[0].map((i) => i[0]).join("");
        setTransModalContent(text);
        setIsModalTrans(true);
      }
    } catch (err) {
      console.error("Lỗi dịch:", err);
    } finally {
      setModalLoading(false);
    }
  };
  // SONPIPI
  useEffect(() => {
    (async () => {
      let timeLastest = null;
      let objectTimeLastest = null;
      if (latestFile && actualDay && actualMonth && actualYear) {
        timeLastest = `${actualDay}/${actualMonth}/${actualYear}/${String(latestFile.hour).padStart(2, "0")}/${String(latestFile.minute).padStart(2, "0")}`;
        setTimeLastest({
          day: actualDay,
          month: actualMonth,
          year: actualYear,
          hour: latestFile.hour,
          minute: latestFile.minute,
        });
        objectTimeLastest = {
          day: actualDay,
          month: actualMonth,
          year: actualYear,
          hour: latestFile.hour,
          minute: latestFile.minute,
        };
      }
      let foundData = null;
      const today = new Date();

      for (let daysBack = 0; daysBack < 3; daysBack++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - daysBack);

        const checkDay = String(checkDate.getDate()).padStart(2, "0");
        const checkMonth = String(checkDate.getMonth() + 1).padStart(2, "0");
        const checkYear = checkDate.getFullYear();

        try {
          const res = await fetch(
            `https://api_gold.thinkdiff.us/all_json_1_day/${checkDay}_${checkMonth}_${checkYear}`,
          );
          if (!res.ok) continue;

          const json = await res.json();
          if (json.status === "success" && json.data?.length) {
            foundData = json.data;
            break;
          }
        } catch (err) {
          continue;
        }
      }
      if (!foundData) return;

      const lastItem = foundData?.at(-1);
      if (!lastItem?.modified_time) return;

      const [date, time] = lastItem.modified_time.split(" ");
      const [day, month, year] = date.split("/");
      const [hour, minute] = time.split(":");

      // setTimeLastest({
      //   day: day,
      //   month: month,
      //   year: year,
      //   hour: hour,
      //   minute: minute
      // });
    })();
  }, [path]);

  const handleNewsClick = (newsItem) => {
    setSelectedNews(newsItem);
    setIsModalTrans(false);
    setTransModalContent("");
  };

  const closeModal = () => {
    setSelectedNews(null);
    setIsModalTrans(false);
    setTransModalContent("");
  };

  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const handleUpdateToLatest = () => {
    setHasNewUpdate(false);
    navigate(
      `/vietnam/gold/${timeLastest?.day}/${timeLastest?.month}/${timeLastest?.year}/${timeLastest?.hour}/${timeLastest?.minute}`,
    );
  };

  const handleSkipUpdate = () => {
    setHasNewUpdate(false);
  };

  const [openLiveNews, setOpenLiveNews] = useState(false);

  const getTodayLink = () => {
    const now = new Date();
    const d = now.getDate();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    return `/orderflowanalysis/gold/${d}/${m}/${y}`;
  };

  return (
    <>
      {timeLastest && (
        <UpdateDataModal
          isVisible={hasNewUpdate}
          latestData={timeLastest}
          onConfirm={handleUpdateToLatest}
          onCancel={handleSkipUpdate}
        />
      )}
      {/* Dán ở đây, ngay đầu phần return của Header */}

      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div
              style={{
                color: "#ffffff",
                fontSize: "24px",
                fontWeight: "500",
                marginBottom: "5px",
              }}
            >
              {t("header.lastUpdate")}{" "}
              <span
                style={{
                  color:
                    `${timeLastest?.day}/${timeLastest?.month}/${timeLastest?.year}/${timeLastest?.hour}/${timeLastest?.minute}` ===
                      timeURL
                      ? "#006400"
                      : "red",
                  cursor: "pointer",
                }}
                onClick={() => {
                  if (
                    timeLastest &&
                    `${timeLastest?.day}/${timeLastest?.month}/${timeLastest?.year}/${timeLastest?.hour}/${timeLastest?.minute}` !==
                    timeURL
                  ) {
                    setHasNewUpdate(true);
                  }
                }}
              >
                {timeLastest
                  ? `${timeLastest?.day}/${timeLastest?.month}/${timeLastest?.year} ${timeLastest?.hour}:${timeLastest?.minute}`
                  : t("common.loadingTime")}
              </span>
            </div>
            <h2 className="site-title">{t("header.title")}</h2>
          </div>
          <div className="header-right">
            <div className="header-right-top">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title={t("menu.goldPrice")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M3 17l4-9h10l4 9H3zm7-7l-2 5h8l-2-5H10z" />
                </svg>
                <span className="calendar-text">{t("menu.goldPrice")}</span>
              </NavLink>
              <NavLink
                to="/tin-tuc-moi-nhat"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title={t("menu.latestNews", "Tin tức mới nhất")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M19 3H4a2 2 0 00-2 2v13a3 3 0 003 3h14a3 3 0 003-3V6a3 3 0 00-3-3zm0 15H5a1 1 0 01-1-1V6h15z" />
                  <path d="M7 8h7v2H7zM7 12h10v2H7z" />
                </svg>
                <span className="calendar-text">{t("menu.news")}</span>
              </NavLink>
              <NavLink
                to="/forex-news"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title={t("ForexNews.title") || "Tin tức Forex"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8z" />
                </svg>
                <span className="calendar-text">{t("ForexNews.title") || "Forex News"}</span>
              </NavLink>
              <NavLink
                to="/money-flow-heatmap"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title={t("MoneyFlowHeatmap.title")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <rect x="2" y="2" width="4" height="4" rx="1" />
                  <rect x="8" y="2" width="4" height="4" rx="1" />
                  <rect x="14" y="2" width="4" height="4" rx="1" />
                  <rect x="20" y="2" width="2" height="4" rx="1" />
                  <rect x="2" y="8" width="4" height="4" rx="1" />
                  <rect x="8" y="8" width="8" height="4" rx="1" />
                  <rect x="18" y="8" width="4" height="4" rx="1" />
                  <rect x="2" y="14" width="8" height="4" rx="1" />
                  <rect x="12" y="14" width="10" height="4" rx="1" />
                  <rect x="2" y="20" width="20" height="2" rx="1" />
                </svg>
                <span className="calendar-text">🔥 {t("MoneyFlowHeatmap.titleShort")}</span>
              </NavLink>
              <NavLink
                to="/lich_kinh_te"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title={t("menu.economicCalendar", "Lịch Kinh Tế")}
              >
                <svg
                  className="calendar-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
                </svg>
                <span className="calendar-text">
                  {t("menu.economicCalendar")}
                </span>
              </NavLink>

              <NavLink
                to="/ty-gia"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title={t("menu.usdExchangeRate", "Tỷ Giá USD")}
              >
                <svg
                  className="calendar-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z" />
                </svg>
                <span className="calendar-text">{t("menu.exchangeRate")}</span>
              </NavLink>
              <NavLink
                to="/TradingEconomicsWidgets"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title={t("menu.economicIndex", "Chỉ số kinh tế")}
              >
                <svg
                  className="calendar-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
                <span className="calendar-text">{t("menu.economicIndex")}</span>
              </NavLink>
              <NavLink
                to="/lich-su-gia"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title={t("menu.priceHistory", "Lịch sử giá")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M13 3a9 9 0 1 0 8.94 10h-2.02A7 7 0 1 1 13 5v4l5-5-5-5v4z" />
                  <path d="M12 8v5l4 2 .75-1.23-3.25-1.77V8z" />
                </svg>
                <span className="calendar-text">{t("menu.priceHistory")}</span>
              </NavLink>
              <NavLink
                to="/bao-cao-luong-luu-tru"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Báo cáo lượng lưu trữ SHFE"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <rect
                    x="3"
                    y="2"
                    width="18"
                    height="20"
                    rx="2"
                    ry="2"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                  />
                  <path d="M5 5h14v1H5z" /> <path d="M5 8h14v1H5z" />{" "}
                  <path d="M5 11h14v1H5z" />
                  <path d="M5 14h14v1H5z" /> <path d="M5 17h14v1H5z" />{" "}
                  <path d="M5 20h14v1H5z" />
                </svg>
                <span className="calendar-text">{t("menu.shfeInventory")}</span>
              </NavLink>
              <NavLink
                to="/bao-cao-san-thuong-hai-tuong-lai"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="bao-cao-san-thuong-hai-tuong-lai"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
                <span className="calendar-text">{t("menu.shfeReport")}</span>
              </NavLink>

              <NavLink
                to="/luong-truy-cap"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Lượng truy cập"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M3 3h2v18H3V3zm7 6h2v12h-2V9zm7-4h2v16h-2V5z" />
                </svg>
                <span className="calendar-text">{t("menu.traffic")}</span>
              </NavLink>
              <NavLink
                to="/lbma-reserves"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="LBMA Reserves"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M12 2C6.48 2 2 4.02 2 6.5S6.48 11 12 11s10-2.02 10-4.5S17.52 2 12 2zm0 9c-5.52 0-10 2.02-10 4.5S6.48 20 12 20s10-2.02 10-4.5S17.52 11 12 11z" />
                </svg>
                <span className="calendar-text">{t("menu.lbmaReserves")}</span>
              </NavLink>
              <NavLink
                to="/loi-nhuan-tuan"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Lợi nhuận tuần"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                </svg>
                <span className="calendar-text">{t("menu.weeklyGrowth")}</span>
              </NavLink>
              <NavLink
                to="/volumexagxau"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Xem tất cả biểu đồ"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                </svg>
                <span className="calendar-text">{t("menu.volumeXauXag")}</span>
              </NavLink>
              <NavLink
                to="/futures-chain"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Futures Chain"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M3 3h18v2H3V3zm2 4h3v10H5V7zm5 4h3v6h-3v-6zm5-6h3v12h-3V5z" />
                </svg>
                <span className="calendar-text">{t("menu.futures")}</span>
              </NavLink>
              <NavLink
                to="/xau-xag-chart"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Biểu đồ XAU/XAG"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                </svg>
                <span className="calendar-text">{t("menu.combinedChart")}</span>
              </NavLink>
              <NavLink
                to="/zsl"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="ZSL"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
                <span className="calendar-text">ZSL</span>
              </NavLink>
              <NavLink
                to="/dang-ky-tai-khoan"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Đăng ký tài khoản"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                </svg>
                <span className="calendar-text">
                  {t("menu.registerWallet")}
                </span>
              </NavLink>

              <NavLink
                to={getTodayLink()}
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Biểu đồ đặt lệnh giá vàng bạc theo timeline"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" />
                  <path d="M7 14h2v3H7zm4-2h2v5h-2zm4-3h2v8h-2z" opacity=".3" />
                </svg>
                <span className="calendar-text"> {t("menu.timeline")}</span>
              </NavLink>

              <NavLink
                to={`/trade-flow`}
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="SLV Trade History"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M3 13h6v8H3zM9 3h6v18H9zM15 9h6v12h-6z" />
                </svg>
                <span className="calendar-text">{t("menu.slvTrade")}</span>
              </NavLink>
              <NavLink
                to="/slv-short-volume"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="SLV Short Volume"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M3 13h6v8H3zM9 3h6v18H9zM15 9h6v12h-6z" />
                </svg>
                <span className="calendar-text">
                  {t("menu.slvShortVolume")}
                </span>
              </NavLink>
              <NavLink
                to="/ig-sentiment"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="IG Sentiment"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="calendar-icon"
                >
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                  <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
                <span className="calendar-text">{t("menu.igSentiment")}</span>
              </NavLink>
              <NavLink
                to="/cftc_comexchart"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Báo cáo COT & Comex"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="calendar-icon"
                >
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <span className="calendar-text">{t("menu.cftcComex")}</span>
              </NavLink>
              <NavLink
                to="/order-book"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Order Book"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
                <span className="calendar-text">{t("menu.orderBook")}</span>
              </NavLink>
              <NavLink
                to="/bai-viet/"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Bài viết mới nhất"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 9H7v-2h10v2zm0-3H7V7h10v2z" />
                </svg>
                <span className="calendar-text">{t("menu.article")}</span>
              </NavLink>
              <NavLink
                to="/vangtheotuan"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Vàng theo tuần"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 9H7v-2h10v2zm0-3H7V7h10v2z" />
                </svg>
                <span className="calendar-text">{t("menu.weeklyGold")}</span>
              </NavLink>
              <NavLink
                to="/tong-hop"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Tổng hợp dữ liệu"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                </svg>
                <span className="calendar-text">{t("menu.summary")}</span>
              </NavLink>
              <NavLink
                to="/shark-global"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="ETF Cá Mập"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M2 12l7-3 4-5 3 4 5 2-4 2-2 4-5-1-3 2z" />
                </svg>
                <span className="calendar-text"> {t("menu.etfShark")} </span>
              </NavLink>
              <NavLink
                to="/etf-chart"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="ETF Biểu đồ"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M3 3h2v18H3V3zm4 10h2v8H7v-8zm4-6h2v14h-2V7zm4 4h2v10h-2V11zm4-8h2v18h-2V3z" />
                </svg>
                <span className="calendar-text"> {t("menu.etfChart")} </span>
              </NavLink>
              <NavLink
                to="/comex_chart"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Biểu đồ Comex"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="calendar-icon"
                >
                  <path d="M9 5v4M15 13v2M9 15v4M15 7v4M5 3v18M19 3v18M3 11h4M17 13h4M11 7h4M11 15h4" />
                </svg>
                <span className="calendar-text"> {t("menu.comexChart")} </span>
              </NavLink>
              <NavLink
                to="/duong-trung-binh"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Đường trung bình bạc"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M3 3h2v18H3V3zm4 10h2v8H7v-8zm4-6h2v14h-2V7zm4 4h2v10h-2V11zm4-8h2v18h-2V3z" />
                </svg>
                <span className="calendar-text">
                  {" "}
                  {t("menu.movingAverage")}{" "}
                </span>
              </NavLink>
              <NavLink
                to="/comex-silver-inventory"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="COMEX Silver Inventory"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  {/* Icon kho hàng / kho dự trữ (có thể thay bằng icon khác nếu muốn) */}
                  <path d="M3 3h18v2H3V3zm0 4h18v14H3V7zm2 2v10h14V9H5zm2 2h10v2H7v-2zm0 4h10v2H7v-2z" />
                </svg>
                <span className="calendar-text">
                  {" "}
                  {t("menu.comexSilverInventory")}{" "}
                </span>
              </NavLink>
              <NavLink
                to="/tai-ung-dung"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Tải ứng dụng Vàng247"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18h14v2H5z" />
                </svg>
                <span className="calendar-text"> {t("menu.download")} </span>
              </NavLink>
              <NavLink
                to="/btc-ca-map"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="BTC Ca Map"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 32 32"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <circle cx="16" cy="16" r="16" fill="#f7931a" />
                  <path
                    fill="#fff"
                    d="M19.2 14.4c.933-1.067.467-2.667-1.333-3.2l.867-3.467-2-.5-.867 3.467c-.6-.133-1.2-.267-1.8-.4l.867-3.467-2-.5-.867 3.467c-.667-.133-1.333-.267-2-.4l-.133.533s1.067.267 1.067.267l-.867 3.467c-.933.267-1.6.933-1.867 2-.4 1.6.733 2 1.867 2l-.867 3.467 2 .5.867-3.467c.6.133 1.2.267 1.8.4l-.867 3.467 2 .5.867-3.467c1.6.4 2.867-.533 3.2-1.867zM15.6 13.6v2.933l.867-.4c.667-.267.933-.867.733-1.533-.2-.667-.867-.933-1.6-.867zm0 4v2.933l.867-.4c.667-.267.933-.867.733-1.533-.2-.667-.867-.933-1.6-.867z"
                  />
                </svg>
                <span className="calendar-text">{t("btcMap.title1")}</span>
              </NavLink>
              <NavLink
                to="/oil-ca-map"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Oil Ca Map"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M6 2v20h12V2H6zm2 2h8v2H8V4zm0 4h8v12H8V8z" />
                </svg>
                <span className="calendar-text">
                  {t("oilLongShortMap.title")}
                </span>
              </NavLink>
              <NavLink
                to="/polymarket"
                className={({ isActive }) =>
                  `calendar-btn ${isActive ? "active" : ""}`
                }
                title="Polymarket"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="calendar-icon"
                >
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
                <span className="calendar-text">
                  Polymarket
                </span>
              </NavLink>
            </div>
            <div
              className="header-right-bottom"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                position: "relative",
              }}
            >
              {/* Đặt component vào đây để nó hiện kế bên các icon */}
              <NotificationHistory
                isOpen={openHistory}
                onClose={() => setOpenHistory(false)}
                history={historyList}
              />
              <LiveNewsBell
                hasNew={true}
                onClick={() => setOpenLiveNews(true)}
              />

              <LiveNewsPanel
                open={openLiveNews}
                onClose={() => setOpenLiveNews(false)}
              />

              <NotificationBell
                onNewsClick={handleNewsClick}
                newsInAPI={newsInAPI}
              />

              <LatestPostTicker
                onNewsClick={handleNewsClick}
                newsInAPI={newsInAPI}
              />
              <GoldSearch onNewsClick={handleNewsClick} newsInAPI={newsInAPI} />
              <ReadNewsHistory
                onNewsClick={handleNewsClick}
                newsInAPI={newsInAPI}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenHistory(!openHistory);
                }}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "8px",
                  background: "transparent", // Để trong suốt giống các icon trên
                  border: "none", // Bỏ viền để tiệp hoàn toàn vào nền vàng
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 1002,
                  transition: "background 0.3s", // Hiệu ứng mượt khi hover
                }}
                // Thêm hiệu ứng hover nhẹ nếu muốn
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(0,0,0,0.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <MdHistory size={24} color="#000000" />
              </button>
              <button
                onClick={() => setIsLanguageSelectorOpen(true)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  fontSize: "12px",
                  background: "#f5f5f5",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#e8e8e8")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#f5f5f5")
                }
              >
                {currentLanguageFlagMeta.type === "image" ? (
                  <img
                    src={currentLanguageFlagMeta.value}
                    alt={currentLanguageFlagMeta.alt}
                    style={{
                      width: "18px",
                      height: "13px",
                      borderRadius: "2px",
                      objectFit: "cover",
                      boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
                    }}
                    loading="lazy"
                  />
                ) : (
                  <span
                    style={{
                      fontSize: "16px",
                      lineHeight: 1,
                    }}
                    role="img"
                    aria-label="current language flag"
                  >
                    {currentLanguageFlagMeta.value}
                  </span>
                )}
                <span>{i18n.language.toUpperCase()}</span>
              </button>
              {isBackgroundTranslating && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "#1f2937",
                    background: "#fef3c7",
                    border: "1px solid #f59e0b",
                    borderRadius: "999px",
                    padding: "4px 8px",
                    maxWidth: "180px",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {t('common.optimizingTranslation', 'Đang tối ưu bản dịch...')}
                </div>
              )}
            </div>
          </div>
        </div>
        {selectedNews && (
          <div className="news-modal-overlay" onClick={closeModal}>
            <div
              className="news-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="news-modal-close" onClick={closeModal}>
                ✕
              </button>
              <h2 className="news-modal-title">{selectedNews.title}</h2>

              <div style={{ marginBottom: "15px" }}>
                <button
                  onClick={(e) => handleTranslateModal(e, selectedNews.content)}
                  disabled={modalLoading}
                  style={{
                    cursor: "pointer",
                    padding: "5px 12px",
                    borderRadius: "15px",
                    border: "1px solid #1877f2",
                    fontSize: "12px",
                    fontWeight: "bold",
                    background: isModalTrans ? "#1877f2" : "#fff",
                    color: isModalTrans ? "#fff" : "#1877f2",
                  }}
                >
                  {modalLoading
                    ? "..."
                    : isModalTrans
                      ? t("common.viewOriginal")
                      : t("common.translate")}
                </button>
              </div>

              <div
                className="news-modal-body"
                dangerouslySetInnerHTML={{
                  __html: isModalTrans
                    ? transModalContent
                    : selectedNews.content,
                }}
              />
              <div className="news-modal-footer">
                <small>
                  {selectedNews.created_at
                    ? new Date(selectedNews.created_at).toLocaleString("vi-VN")
                    : ""}
                </small>
              </div>
            </div>
          </div>
        )}
      </header>
      <LanguageSelector
        isOpen={isLanguageSelectorOpen}
        onClose={() => setIsLanguageSelectorOpen(false)}
        onSelectLanguage={changeLanguage}
        currentLanguage={i18n.language}
      />
    </>
  );
};

export default Header;
