import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useLocation } from "react-router-dom"; // Thêm useLocation
import axios from "axios";
import "../components/notification/LiveNewsPanel.css";
import { decode } from "js-base64";
import { LuLanguages } from "react-icons/lu";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import { useTranslation } from "react-i18next";

const pad = (v) => (v < 10 ? `0${v}` : `${v}`);

const safeDecode = (str) => {
  try {
    return str ? decode(str) : "";
  } catch (e) {
    console.error("Decode error:", e);
    return str;
  }
};

const stripHtml = (html) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const cleanText = (text) => {
  if (!text) return "";
  return text
    .replace(/#[a-zA-Z0-9_]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

// --- HÀM FORMAT TÊN TÁC GIẢ ---
const formatAuthorName = (link) => {
  if (!link || typeof link !== "string") return "";

  // Nếu là link facebook (chứa facebook.com hoặc profile.php)
  if (link.includes("facebook.com") || link.includes("profile.php")) {
    try {
      // Xử lý trường hợp link chỉ là "profile.php?id=..." không có domain
      const fullLink = link.includes("http")
        ? link
        : `https://facebook.com/${link.replace(/^\//, "")}`;
      const url = new URL(fullLink);
      const id = url.searchParams.get("id");

      return id ? `Facebook User (${id})` : "Facebook User";
    } catch (e) {
      return "Facebook User";
    }
  }

  if (link.includes("x.com/")) {
    return link.split("x.com/")[1]?.split(/[? /]/)[0] || "X User";
  }

  return link;
};

const extractDateKey = (item) => {
  if (!item?.link) return null;

  // match: 2026_2_27.json
  const match = item.link.match(/(\d{4})_(\d{1,2})_(\d{1,2})\.json/);

  if (!match) return null;

  const year = match[1];
  const month = pad(Number(match[2]));
  const day = pad(Number(match[3]));

  // convert → DD_MM_YYYY
  return `${day}_${month}_${year}`;
};

const LiveNewsPage = () => {
  const { t, i18n } = useTranslation();

  const { date } = useParams(); // expected format: DD_MM_YYYY
  const navigate = useNavigate();
  const location = useLocation(); // Dùng để quản lý query params (?id=...)
  const panelRef = useRef(null);

  const [list, setList] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [currentIndex, setCurrentIndex] = useState(null);

  // Translation states
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [loadingTranslate, setLoadingTranslate] = useState(false);

  const [isListTranslated, setIsListTranslated] = useState(false);
  const [translatedMap, setTranslatedMap] = useState({});
  const [loadingListTranslate, setLoadingListTranslate] = useState(false);

  // Text-to-speech states
  const [textSpeak, setTextSpeak] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const [isDetailSpeaking, setIsDetailSpeaking] = useState(false);
  const detailSpeechRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // --- LOGIC CẬP NHẬT ID LÊN URL ---
  const updateUrlParams = (id) => {
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

  // Đồng bộ URL -> State (Nếu vào link có sẵn ?id=...)
  useEffect(() => {
    if (news.length > 0) {
      const params = new URLSearchParams(location.search);
      const idFromUrl = params.get("id");
      if (idFromUrl) {
        const found = news.find(
          (item) => String(item.id) === String(idFromUrl),
        );
        if (found && (!selectedNews || selectedNews.id !== found.id)) {
          setSelectedNews(found);
        }
      }
    }
  }, [location.search, news]);
  // ---------------------------------

  useEffect(() => {
    const fetchListAndDetail = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          "https://api_gold.thinkdiff.us/tin_tuc_moi_nhat_1_ngay",
        );
        const fileList = res.data?.data || [];

        if (!fileList.length) {
          setList([]);
          setNews([]);
          return;
        }

        setList(fileList);

        // ✅ LUÔN tính index từ URL date
        let indexToUse;

        if (date) {
          const matched = fileList.findIndex(
            (it) => extractDateKey(it) === date,
          );
          indexToUse = matched >= 0 ? matched : fileList.length - 1;
        } else {
          indexToUse = fileList.length - 1;
        }

        // ✅ update currentIndex theo URL
        setCurrentIndex(indexToUse);

        const selectedFile = fileList[indexToUse];

        if (!selectedFile) {
          setNews([]);
          return;
        }

        setLoadingDetail(true);

        const detailRes = await axios.get(selectedFile.link);

        const posts = detailRes.data?.posts || [];

        const formatted = posts
          .filter((p) => p.post_db_id)
          .map((post) => ({
            id: post.post_db_id,
            content:
              safeDecode(post.content_text_vi) || safeDecode(post.content),
            time: post.date_time,
            source: post.user_id || "",
            author: post.link_group || post.user_id || "",
            link: post.link_baiviet_goc || post.page_web || "",
            images: post.images || [],
          }))
          .sort((a, b) => new Date(b.time) - new Date(a.time));

        setNews(formatted);

        if (detailRes.data?.time_save) setLastUpdated(detailRes.data.time_save);
      } catch (err) {
        console.error(err);
        setNews([]);
      } finally {
        setLoading(false);
        setLoadingDetail(false);
      }
    };

    fetchListAndDetail();
  }, [date]); // ✅ dependency đúng

  // Auto-translate list when page loads
  useEffect(() => {
    if (news.length && !isListTranslated) {
      handleTranslateList();
    }
  }, [news]);

  // Reset detail translation when modal closes
  useEffect(() => {
    if (!selectedNews) {
      setIsTranslated(false);
      setTranslatedText("");
    }
  }, [selectedNews]);

  // Cleanup detail speech on unmount or modal close
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setIsDetailSpeaking(false);
    };
  }, [selectedNews]);

  const handleTranslateDetail = async () => {
    if (!selectedNews) return;

    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    if (translatedText) {
      setIsTranslated(true);
      return;
    }

    setLoadingTranslate(true);
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(
          selectedNews.content,
        )}`,
      );
      const data = await res.json();
      const translated = data[0].map((i) => i[0]).join("");

      setTranslatedText(translated);
      setIsTranslated(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTranslate(false);
    }
  };

  const handleTranslateList = async () => {
    if (isListTranslated) {
      setIsListTranslated(false);
      return;
    }

    if (Object.keys(translatedMap).length) {
      setIsListTranslated(true);
      return;
    }

    setLoadingListTranslate(true);
    const newMap = {};

    try {
      for (const item of news) {
        const res = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(
            item.content.slice(0, 400),
          )}`,
        );

        const data = await res.json();
        newMap[item.id] = data[0].map((i) => i[0]).join("");
      }
      const textToSpeak = Object.values(newMap)
        .map((rawContent) => cleanText(rawContent))
        .join(". . . Tin tức tiếp theo . . .");

      setTextSpeak(textToSpeak);
      setTranslatedMap(newMap);
      setIsListTranslated(true);
    } catch (e) {
      console.error("Translate list failed:", e);
    } finally {
      setLoadingListTranslate(false);
    }
  };

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
    utterance.lang = isTranslated ? "vi-VN" : "en-US";
    utterance.rate = 1.0;

    utterance.onend = () => setIsDetailSpeaking(false);
    utterance.onerror = () => setIsDetailSpeaking(false);

    detailSpeechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsDetailSpeaking(true);
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
    utterance.lang = "vi-VN";
    utterance.rate = 1.1;

    utterance.onboundary = (event) => {
      const charIndex = event.charIndex;
      const totalLength = textSpeak.length;
      if (totalLength > 0) {
        setProgress((charIndex / totalLength) * 100);
      }
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

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
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

  const handleNavigateDay = (newIndex) => {
    if (newIndex < 0 || newIndex >= list.length) return;

    const selectedFile = list[newIndex];

    let extractedDate = extractDateKey(selectedFile);

    if (!extractedDate) {
      const now = new Date();
      extractedDate = `${pad(now.getDate())}_${pad(now.getMonth() + 1)}_${now.getFullYear()}`;
    }

    navigate(`/live-news/${extractedDate}`);
  };

  const handleSelectNews = (item) => {
    setSelectedNews(item);
    updateUrlParams(item.id); // Đưa ID lên URL khi click
  };

  const handleCloseModal = () => {
    setSelectedNews(null);
    updateUrlParams(null); // Xóa ID khỏi URL khi đóng
    setIsExpanded(false);
  };

  if (loading)
    return <div style={{ padding: 20 }}>{t("LiveNewsPage.loading")}</div>;

  return (
    <div className="live-news-page" style={{ padding: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>{t("LiveNewsPage.title")}</h2>
          {lastUpdated && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {t("LiveNewsPage.updated")}{" "}
              <strong style={{ color: "#16a34a" }}>{lastUpdated}</strong>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minWidth: "250px",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "6px",
                backgroundColor: "#e0e0e0",
                borderRadius: "3px",
                overflow: "hidden",
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

            <button
              onClick={handlePlay}
              title={
                isSpeaking ? (isPaused ? "Tiếp tục" : "Tạm dừng") : "Đọc tin"
              }
              style={{
                padding: "6px 12px",
                cursor: "pointer",
                backgroundColor:
                  isSpeaking && !isPaused ? "#f0ad4e" : "#0275d8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                whiteSpace: "nowrap",
              }}
            >
              {isPaused ? "▶" : isSpeaking ? "⏸" : "▶"}
            </button>

            <button
              onClick={handleStop}
              disabled={!isSpeaking && !isPaused}
              title="Dừng"
              style={{
                padding: "6px 12px",
                cursor: "pointer",
                backgroundColor: "#d9534f",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                opacity: !isSpeaking && !isPaused ? 0.5 : 1,
                whiteSpace: "nowrap",
              }}
            >
              Stop
            </button>
          </div>

          <button
            onClick={handleTranslateList}
            disabled={loadingListTranslate}
            title="Dịch toàn bộ tin"
            style={{
              width: "32px",
              height: "28px",
              borderRadius: "6px",
              border: "1px solid #facc15",
              backgroundColor: isListTranslated ? "#facc15" : "transparent",
              color: isListTranslated ? "#020617" : "#facc15",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            <LuLanguages size={14} />
          </button>

          {currentIndex > 0 && (
            <button
              onClick={() => handleNavigateDay(currentIndex - 1)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              {t("LiveNewsPage.prev_day")}
            </button>
          )}

          {currentIndex !== null && currentIndex < list.length - 1 && (
            <button
              onClick={() => handleNavigateDay(currentIndex + 1)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              {t("LiveNewsPage.next_day")}
            </button>
          )}
        </div>
      </div>

      <div
        className="live-news-body"
        style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
      >
        {loadingDetail && (
          <div className="live-news-empty">{t("LiveNewsPage.loading_day")}</div>
        )}

        {!loadingDetail && news.length === 0 && (
          <div className="live-news-empty">{t("LiveNewPagae.no_news")}</div>
        )}

        <div className="live-news-vertical" style={{ gap: 12 }}>
          {news.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="live-news-row"
              onClick={() => handleSelectNews(item)}
            >
              {item.images?.length > 0 && (
                <img src={item.images[0]} alt="" className="news-thumb" />
              )}
              <div className="news-preview">
                {isListTranslated
                  ? translatedMap[item.id] || item.content
                  : item.content}
              </div>
              <div className="live-news-meta">
                <span>{item.link}</span>
                <span>{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedNews &&
        createPortal(
          <div className="news-modal-overlay" onClick={handleCloseModal}>
            <div
              className={`news-modal-content ${isExpanded ? "news-modal--expanded" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="news-modal-header">
                <h2>📰 Tin tức chi tiết</h2>
                <div className="news-modal-actions">
                  <button
                    onClick={handleToggleDetailSpeak}
                    title={isDetailSpeaking ? "Dừng đọc" : "Đọc bài viết"}
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
                    onClick={handleTranslateDetail}
                    disabled={loadingTranslate}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 10px",
                      fontSize: "12px",
                      borderRadius: "20px",
                      border: "1px solid #38bdf8",
                      background: "transparent",
                      color: "#38bdf8",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    <LuLanguages size={14} />
                    {loadingTranslate ? "..." : isTranslated ? "Gốc" : "VN"}
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
                    onClick={handleCloseModal}
                    style={{ position: "static" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {selectedNews.images?.length > 0 && (
                <img
                  src={selectedNews.images[0]}
                  alt=""
                  className="news-modal-image"
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
              {(() => {
                // 1. Xác định link nào là link Facebook
                const isAuthorFB =
                  selectedNews.author?.toString().includes("facebook.com") ||
                  selectedNews.author?.toString().includes("profile.php");
                const isLinkFB =
                  selectedNews.link?.includes("facebook.com") ||
                  selectedNews.link?.includes("fb.com");

                // 2. Ưu tiên link từ author nếu nó là Facebook (vì ảnh của bạn cho thấy profile.php nằm ở đây)
                let finalHref = selectedNews.link;
                if (isAuthorFB) {
                  finalHref = selectedNews.author;
                }

                // 3. Format lại URL chuẩn
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
                    style={
                      isFacebook ? { color: "#1877F2", fontWeight: "bold" } : {}
                    }
                  >
                    {isFacebook
                      ? "Xem nguồn gốc từ Facebook →"
                      : "Xem nguồn gốc →"}
                  </a>
                );
              })()}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default LiveNewsPage;

function linkify(text) {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="linkified">${url}</a>`;
  });
}
