import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./LiveNewsPanel.css";
import { LuLanguages } from "react-icons/lu";
import { FaPlayCircle, FaPauseCircle } from "react-icons/fa";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import { decode } from "js-base64";
import { saveReadNews } from "../HistoryNews/newsHistoryUtils";
import { useTranslation } from "react-i18next";
import { translateText } from "../../services/translationService";


const cleanText = (text) => {
  if (!text) return "";
  return text
    .replace(/#[a-zA-Z0-9_]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const SUPPORTED_LANGUAGES = [
  { label: "Afrikaans", code: "af" },
  { label: "Arabic", code: "ar" },
  { label: "Chinese (Simplified)", code: "zh-CN" },
  { label: "Chinese (Traditional)", code: "zh-TW" },
  { label: "English", code: "en" },
  { label: "French", code: "fr" },
  { label: "German", code: "de" },
  { label: "Hebrew", code: "he" },
  { label: "Hindi", code: "hi" },
  { label: "Indonesian", code: "id" },
  { label: "Italian", code: "it" },
  { label: "Japanese", code: "ja" },
  { label: "Korean", code: "ko" },
  { label: "Norwegian", code: "no" },
  { label: "Portuguese (Brazil)", code: "pt-BR" },
  { label: "Russian", code: "ru" },
  { label: "Spanish", code: "es" },
  { label: "Vietnamese", code: "vi" },
];

// --- HÀM FORMAT TÊN TÁC GIẢ ---
const formatAuthorName = (link) => {
  if (!link || typeof link !== "string") return "";

  // Kiểm tra nếu là link facebook (chứa facebook.com hoặc profile.php)
  if (link.includes("facebook.com") || link.includes("profile.php")) {
    try {
      // Xử lý trường hợp link chỉ là "profile.php?id=..." không có domain
      const fullLink = link.includes("http")
        ? link
        : `https://facebook.com/${link.replace(/^\//, "")}`;
      const url = new URL(fullLink);
      const id = url.searchParams.get("id");

      return id ? `Người dùng Facebook (${id})` : "Người dùng Facebook";
    } catch (e) {
      return "Người dùng Facebook";
    }
  }

  if (link.includes("x.com/")) {
    return link.split("x.com/")[1]?.split(/[? /]/)[0] || "X User";
  }

  return link;
};

const stripHtml = (html) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const bcp47ForSpeech = (lang) => {
  if (!lang) return "vi-VN";
  const map = {
    vi: "vi-VN",
    en: "en-US",
    "zh-CN": "zh-CN",
    "zh-TW": "zh-TW",
    ja: "ja-JP",
    ko: "ko-KR",
    th: "th-TH",
    id: "id-ID",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
    es: "es-ES",
    "pt-BR": "pt-BR",
    ru: "ru-RU",
    ar: "ar-SA",
    hi: "hi-IN",
  };
  return map[lang] || (lang.includes("-") ? lang : "vi-VN");
};

const LiveNewsPanel = ({ open, onClose }) => {
  const { t, i18n } = useTranslation();
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [news, setNews] = useState([]);
  const [isZoom, setIsZoom] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [loadingTranslate, setLoadingTranslate] = useState(false);

  const [isListTranslated, setIsListTranslated] = useState(false);
  const [translatedMap, setTranslatedMap] = useState({});
  const [loadingListTranslate, setLoadingListTranslate] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const [textSpeak, setTextSpeak] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const [isDetailSpeaking, setIsDetailSpeaking] = useState(false);
  const detailSpeechRef = useRef(null);
  const [list, setList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- TRONG COMPONENT ---

  // Đồng bộ với ngôn ngữ giao diện (đổi ở Header → tin tức dịch theo)
  const getLangFromUrl = () => {
    // URL dạng /#/sq/gold → lấy "sq"
    const hash = window.location.hash; // "#/sq/gold"
    const parts = hash.replace("#/", "").split("/");
    const urlLang = parts[0];
    // Kiểm tra có phải language code hợp lệ không (2-5 ký tự, không phải route tiếng Việt)
    const viRoutes = ["vietnam", "bai-viet", "tin-tuc", "ty-gia", "lich", "live", "chart", "etf", "wallet", "vi", "du", "so", "luong", "shark", "btc", "oil", "zsl", "fomo", "ig", "order", "bao", "vang", "slv", "rsi", "dxy", "mcx", "cvol", "tai", "danh", "thong", "hyperliquid", "comex", "lbma", "spdr", "xau", "futures", "trade", "pslv", "shanghaichart", "compareshanghaicomex", "map", "orderflowanalysis", "EtfSharkDetail", "chart-detail", "calendar", "lich_kinh_te"];
    if (urlLang && urlLang.length >= 2 && urlLang.length <= 7 && !viRoutes.includes(urlLang)) {
      return urlLang;
    }
    return localStorage.getItem("lang") || i18n.language || "vi";
  };

  const [selectedLang, setSelectedLang] = useState(() => getLangFromUrl());

  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedUpdatedLabel, setTranslatedUpdatedLabel] = useState("");

  const applyLang = (lang) => {
    setSelectedLang(lang);
    localStorage.setItem("news_preferred_lang", lang);
  };

  useEffect(() => {
    applyLang(i18n.language || "vi");
  }, [i18n.language]);

  // Lắng nghe window event "language-changed" để bắt cả background translation
  useEffect(() => {
    const handleWindowLangChange = (e) => {
      applyLang(e.detail?.lang || i18n.language || "vi");
    };
    window.addEventListener("language-changed", handleWindowLangChange);
    return () => window.removeEventListener("language-changed", handleWindowLangChange);
  }, [i18n]);

  // Dịch title và label khi ngôn ngữ thay đổi
  useEffect(() => {
    if (!selectedLang || selectedLang.startsWith("vi")) {
      setTranslatedTitle("");
      setTranslatedUpdatedLabel("");
      return;
    }
    const texts = [
      "📰 TIN TỨC MỚI NHẤT",
      "Cập nhật lần cuối:",
    ];
    Promise.all(
      texts.map(text => translateText(text, selectedLang))
    ).then(([title, updated]) => {
      setTranslatedTitle(title);
      setTranslatedUpdatedLabel(updated);
    });

  }, [selectedLang]);

  // Hàm dịch tự động mới
  const autoTranslateContent = async (text, targetLang) => {
    if (!text || !targetLang) return;

    if (targetLang === "vi" || targetLang.startsWith("vi")) {
      setTranslatedText("");
      setIsTranslated(false);
      setLoadingTranslate(false);
      return;
    }

    setLoadingTranslate(true);
    try {
      const plain = stripHtml(text);
      const translated = await translateText(plain, targetLang);
      setTranslatedText(translated);
      setIsTranslated(true);
    } catch (e) {
      console.error("Auto translate error:", e);
    } finally {
      setLoadingTranslate(false);
    }

  };

  // Theo dõi khi chọn tin tức HOẶC đổi ngôn ngữ để tự dịch
  useEffect(() => {
    if (selectedNews) {
      // Gọi hàm dịch tự động dựa trên ngôn ngữ đang chọn
      autoTranslateContent(selectedNews.content, selectedLang);
    } else {
      setTranslatedText("");
      setIsTranslated(false);
    }
  }, [selectedNews, selectedLang]);

  // Hàm xử lý khi người dùng chọn ngôn ngữ khác trên UI
  const handleSelectLang = (e) => {
    const newLang = e.target.value;
    setSelectedLang(newLang);
    localStorage.setItem("news_preferred_lang", newLang);
  };

  // Hàm xử lý cập nhật URL khi chọn tin tức
  const updateUrlWithId = (id) => {
    const searchParams = new URLSearchParams(location.search);
    if (id) {
      searchParams.set("id", id);
    } else {
      searchParams.delete("id");
    }
    const newSearch = searchParams.toString();
    navigate(
      {
        pathname: location.pathname,
        search: newSearch ? `?${newSearch}` : "",
      },
      { replace: true },
    );
  };

  useEffect(() => {
    if (!open || selectedNews) return;

    const handleClickOutside = (e) => {
      const isClickInsidePanel =
        panelRef.current && panelRef.current.contains(e.target);
      const isClickOnToast =
        e.target.closest(".news-toast") ||
        e.target.closest(".hot-toast-container");

      if (!isClickInsidePanel && !isClickOnToast) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose, selectedNews]);

  const safeDecode = (str) => {
    try {
      return str ? decode(str) : "";
    } catch (e) {
      console.error("Decode error:", e);
      return str;
    }
  };

  useEffect(() => {
    if (!open) return;

    const fetchLiveNews = async () => {
      setLoadingNews(true);
      try {
        const res = await axios.get(
          "https://api_gold.thinkdiff.us/tin_tuc_moi_nhat_1_ngay",
        );
        const fileList = res.data?.data || [];
        if (!fileList.length) {
          setNews([]);
          return;
        }
        setList(fileList);
        let indexToUse = currentIndex;
        if (indexToUse === null) {
          indexToUse = fileList.length - 1;
          setCurrentIndex(indexToUse);
        }
        const selectedFile = fileList[indexToUse];
        if (!selectedFile) return;

        const detailRes = await axios.get(selectedFile.link);
        const posts = detailRes.data?.posts || [];
        if (!posts.length) {
          setNews([]);
          return;
        }

        const formattedNews = posts
          .filter((post) => post.post_db_id)
          .map((post) => {
            const decodedContent = safeDecode(post.content);
            const decodedContentVi = safeDecode(post.content_text_vi);
            return {
              id: post.post_db_id,
              content: decodedContentVi || decodedContent,
              time: post.date_time,
              source: post.user_id || "",
              link: post.link_baiviet_goc || post.page_web || "",
              images: post.images || [],
              author: post.link_group || "",
            };
          })
          .sort((a, b) => new Date(b.time) - new Date(a.time));

        const timeCuoiInsert = detailRes.data?.time_save || "";
        if (timeCuoiInsert) setLastUpdated(timeCuoiInsert);
        setNews(formattedNews);
      } catch (err) {
        console.error("Lỗi load API:", err);
        setNews([]);
      } finally {
        setLoadingNews(false);
      }
    };
    fetchLiveNews();
  }, [open, currentIndex]);

  const newsFingerprint = useMemo(
    () => news.map((item) => item.id).join("|"),
    [news],
  );

  useEffect(() => {
    if (!selectedNews) {
      setIsTranslated(false);
      setTranslatedText("");
    }
  }, [selectedNews]);

  const handleToggleDetailSpeak = () => {
    if (!selectedNews) return;
    if (isDetailSpeaking) {
      window.speechSynthesis.cancel();
      setIsDetailSpeaking(false);
      return;
    }
    const content = isTranslated ? translatedText : selectedNews.content;
    const cleanContent = stripHtml(content);
    if (!cleanContent) return;
    const utterance = new SpeechSynthesisUtterance(cleanContent);
    utterance.lang = isTranslated ? bcp47ForSpeech(selectedLang) : "vi-VN";
    utterance.rate = 1.0;
    utterance.onend = () => setIsDetailSpeaking(false);
    utterance.onerror = () => setIsDetailSpeaking(false);
    detailSpeechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsDetailSpeaking(true);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setIsDetailSpeaking(false);
    };
  }, [selectedNews]);

  // Tự dịch danh sách tin theo ngôn ngữ giao diện (không còn cố định sang tiếng Việt)
  useEffect(() => {
    if (!open || !news.length) return;
    const target = selectedLang || i18n.language || "vi";

    if (target.startsWith("vi")) {
      setTranslatedMap({});
      setIsListTranslated(false);
      setTextSpeak(
        news.map((item) => cleanText(stripHtml(item.content))).join(". . . "),
      );
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingListTranslate(true);
      setTranslatedMap({}); // clear bản dịch cũ ngay khi bắt đầu
      const newMap = {};
      try {
        await Promise.all(
          news.map(async (item) => {
            const snippet = stripHtml(item.content);
            const translated = await translateText(snippet, target);
            if (cancelled) return;
            newMap[item.id] = translated;
            setTranslatedMap((prev) => ({ ...prev, [item.id]: translated }));
          }),
        );
        if (cancelled) return;
        setIsListTranslated(true);
        setTextSpeak(
          Object.values(newMap)
            .map((raw) => cleanText(raw))
            .join(". . . "),
        );
      } catch (e) {
        console.error("Translate list failed:", e);
      } finally {
        if (!cancelled) setLoadingListTranslate(false);
      }

    })();

    return () => {
      cancelled = true;
    };
  }, [open, newsFingerprint, selectedLang]);

  if (!open) return null;

  const handleTranslateDetailToggle = () => {
    if (!selectedNews) return;
    setIsTranslated((prev) => !prev);
  };

  const handleTranslateListToggle = () => {
    setIsListTranslated((prev) => !prev);
  };

  const handlePlay = () => {
    const synth = window.speechSynthesis;
    if (isPaused) {
      synth.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }
    if (isSpeaking && !isPaused) {
      synth.pause();
      setIsPaused(true);
      return;
    }
    if (!textSpeak) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(textSpeak);
    utterance.lang = bcp47ForSpeech(selectedLang);
    utterance.rate = 1.1;
    utterance.onboundary = (event) => {
      const charIndex = event.charIndex;
      const totalLength = textSpeak.length;
      if (totalLength > 0) setProgress((charIndex / totalLength) * 100);
    };
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setProgress(0);
    };
    utteranceRef.current = utterance;
    synth.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setProgress(0);
  };

  return (
    <>
      <div className="live-news-overlay">
        <div
          ref={panelRef}
          className={`live-news-panel ${isZoom ? "zoomed" : ""}`}
        >
          <div className="live-news-header">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <button
                onClick={() => {
                  navigate("/live-news");
                  onClose();
                }}
                title="Xem trang tin tức đầy đủ"
                style={{
                  fontWeight: "bold",
                  background: "none",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {translatedTitle || t("LiveNewsPanel.tt1")}
              </button>
              {lastUpdated && (
                <span
                  style={{ fontSize: "10px", opacity: 0.8, marginTop: "2px" }}
                >
                  {translatedUpdatedLabel || t("LiveNewsPanel.ct1")}{" "}
                  <span style={{ color: "#16a34a", fontWeight: 800 }}>
                    {lastUpdated}
                  </span>
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              {currentIndex > 0 && (
                <button
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  style={{
                    padding: "6px 10px",
                    cursor: "pointer",
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                  }}
                >
                  {t("LiveNewsPanel.n1")}
                </button>
              )}
              {currentIndex < list.length - 1 && (
                <button
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  style={{
                    padding: "6px 10px",
                    cursor: "pointer",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                  }}
                >
                  {t("LiveNewsPanel.n2")}
                </button>
              )}
            </div>

            <div className="live-news-actions">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  width: "100%",
                  padding: "10px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: "8px",
                    backgroundColor: "#e0e0e0",
                    borderRadius: "5px",
                    overflow: "hidden",
                    minWidth: "100px",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      backgroundColor: "#4caf50",
                      transition: "width 0.2s ease-in-out",
                    }}
                  ></div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button
                    onClick={handlePlay}
                    style={{
                      padding: "8px 16px",
                      cursor: "pointer",
                      backgroundColor:
                        isSpeaking && !isPaused ? "#f0ad4e" : "#0275d8",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      whiteSpace: "nowrap",
                      fontSize: "14px",
                    }}
                  >
                    {isPaused ? "▶" : isSpeaking ? "⏸" : "▶"}
                  </button>
                  <button
                    onClick={handleStop}
                    disabled={!isSpeaking && !isPaused}
                    style={{
                      padding: "8px 16px",
                      cursor: "pointer",
                      backgroundColor: "#d9534f",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "14px",
                      opacity: !isSpeaking && !isPaused ? 0.5 : 1,
                    }}
                  >
                    Stop
                  </button>
                </div>
              </div>
              {!selectedLang.startsWith("vi") && (
                <button
                  type="button"
                  className={`live-news-translate ${isListTranslated ? "active" : ""}`}
                  onClick={handleTranslateListToggle}
                  disabled={loadingListTranslate}
                >
                  <LuLanguages size={14} />{" "}
                  {loadingListTranslate
                    ? "..."
                    : isListTranslated
                      ? t("common.viewOriginal")
                      : t("common.translate")}
                </button>
              )}
              <button
                className="live-news-zoom"
                onClick={() => {
                  navigate("/live-news");
                  onClose();
                }}
              >
                {isZoom ? "⤡" : "⤢"}
              </button>
              <button
                className="live-news-close"
                onClick={() => {
                  onClose();
                  handleStop();
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="live-news-body">
            <div className="live-news-vertical">
              {!loadingNews &&
                news.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="live-news-row"
                    onClick={() => {
                      setSelectedNews(item);
                      updateUrlWithId(item.id); // Cập nhật tham số id vào URL
                      // ✅ LƯU LỊCH SỬ
                      const tempDiv = document.createElement("div");
                      tempDiv.innerHTML = item.content || "";

                      saveReadNews({
                        id: item.id,
                        title: (tempDiv.innerText || "").slice(0, 100), // lấy 100 ký tự làm title
                        link: item.link,
                        author: item.author,
                        content: tempDiv.innerText || "",
                      });
                    }}
                  >
                    {item.images.length > 0 && (
                      <img src={item.images[0]} alt="" className="news-thumb" />
                    )}
                    <div className="news-preview">
                      {(() => {
                        if (translatedMap[item.id]) return translatedMap[item.id];
                        if (
                          !selectedLang.startsWith("vi") &&
                          loadingListTranslate
                        ) {
                          return "…";
                        }
                        return item.content;
                      })()}
                    </div>
                    <div className="live-news-meta">
                      <span>{item.link}</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {selectedNews &&
        createPortal(
          <div
            className="news-modal-overlay"
            onClick={() => {
              setSelectedNews(null);
              updateUrlWithId(null); // Xóa id khỏi URL khi đóng
            }}
          >
            <div
              className={`news-modal-content ${isExpanded ? "news-modal--expanded" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="news-modal-header">
                <h2>📰 Tin tức chi tiết</h2>
                {/* Nút chọn ngôn ngữ */}
                <select
                  value={selectedLang}
                  onChange={handleSelectLang}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    backgroundColor: "#2d2d2d",
                    color: "#fff",
                    border: "1px solid #444",
                    fontSize: "13px",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>

                <div className="news-modal-actions">
                  <button
                    onClick={handleToggleDetailSpeak}
                    style={{
                      marginRight: "8px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: isDetailSpeaking ? "#ef4444" : "#3b82f6",
                    }}
                  >
                    {isDetailSpeaking ? (
                      <IoVolumeHigh size={20} />
                    ) : (
                      <IoVolumeMute size={20} />
                    )}
                  </button>
                  <button
                    type="button"
                    className="news-translate-btn"
                    onClick={handleTranslateDetailToggle}
                    disabled={
                      loadingTranslate || (selectedLang || "").startsWith("vi")
                    }
                  >
                    <LuLanguages size={14} />{" "}
                    {loadingTranslate
                      ? "..."
                      : isTranslated
                        ? t("common.viewOriginal")
                        : t("common.translate")}
                  </button>
                  <button
                    onClick={() => setIsExpanded((prev) => !prev)}
                    title="Phóng to / Thu nhỏ"
                    style={{
                      marginRight: "8px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "18px",
                      color: "#fff",
                    }}
                  >
                    {isExpanded ? "🗗" : "🗖"}
                  </button>
                  <button
                    className="news-modal-close"
                    onClick={() => {
                      setSelectedNews(null);
                      updateUrlWithId(null); // Xóa id khỏi URL khi đóng
                      setIsExpanded(false);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {isFullscreen && (
                <div
                  className="fullscreen-overlay"
                  onClick={() => setIsFullscreen(false)}
                >
                  <img
                    src={selectedNews.images[0]}
                    alt=""
                    className="fullscreen-image"
                  />
                </div>
              )}
              {selectedNews.images?.length > 0 && (
                <img
                  src={selectedNews.images[0]}
                  alt=""
                  className="news-modal-image"
                  onClick={() => setIsFullscreen(true)}
                />
              )}

              <p
                className="news-modal-text"
                dangerouslySetInnerHTML={{
                  __html: linkify(
                    isTranslated ? translatedText : selectedNews.content,
                  ),
                }}
              />
              <div className="news-modal-meta">
                {selectedNews.link} • {selectedNews.time}
              </div>
              {/* HIỂN THỊ TÁC GIẢ */}
              {selectedNews.author && (
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "15px",
                    fontWeight: "600",
                    color: "#ffffff",
                    fontSize: "0.95rem",
                    borderBottom: "1px solid #eee",
                    paddingBottom: "10px",
                  }}
                >
                  Được đăng bởi:
                  <a
                    href="https://vang247.xyz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none" }}
                  >
                    <span style={{ color: "#0084ff", marginLeft: "5px" }}>
                      {formatAuthorName(selectedNews.author)}
                    </span>
                  </a>
                </div>
              )}

              {/* XỬ LÝ LINK NGUỒN GỐC */}
              <div style={{ marginTop: "15px" }}>
                {(() => {
                  // 1. Kiểm tra các nguồn link có phải Facebook không
                  const isAuthorFB =
                    selectedNews.author?.includes("facebook.com") ||
                    selectedNews.author?.includes("profile.php");
                  const isLinkFB =
                    selectedNews.link?.includes("facebook.com") ||
                    selectedNews.link?.includes("fb.com");

                  // 2. Ưu tiên lấy link từ author nếu nó chứa Facebook (vì thường chứa profile ID)
                  let finalHref = selectedNews.link;
                  if (isAuthorFB) {
                    finalHref = selectedNews.author.includes("http")
                      ? selectedNews.author
                      : `https://facebook.com/${selectedNews.author.replace(/^\//, "")}`;
                  }

                  // 3. Đảm bảo luôn có giao thức https
                  if (finalHref && !finalHref.startsWith("http")) {
                    finalHref = `https://${finalHref}`;
                  }

                  const isFacebook = isAuthorFB || isLinkFB;
                  if (!finalHref) return null;

                  return (
                    <a
                      href={finalHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="news-modal-link"
                      style={{
                        textDecoration: "none",
                        color: isFacebook ? "#1877F2" : "#3b82f6",
                        fontWeight: "bold",
                      }}
                    >
                      {isFacebook
                        ? "Xem nguồn gốc từ Facebook →"
                        : "Xem nguồn gốc →"}
                    </a>
                  );
                })()}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default LiveNewsPanel;

function linkify(text) {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="linkified">${url}</a>`;
  });
}
