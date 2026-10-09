// ModalNews.js - Component hiển thị modal chi tiết tin tức
import { IoMdClose, IoMdExpand } from "react-icons/io";
import "./ModalNews.css";
import { LuClock, LuLanguages } from "react-icons/lu";
import { FaEye, FaRegComment, FaShare } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { IoSend } from "react-icons/io5";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import LightboxModal from "../Modal/LightboxModal";
import {
  saveReadNews,
  getReadNewsHistory,
} from "../HistoryNews/newsHistoryUtils";
import { useTranslation } from "react-i18next";
import { 
  translateText, 
  changeLanguageWithTranslation 
} from "../../services/translationService";
import { resources } from "../../config/i18n";

function ModalNews({
  setIsShowModal,
  newsSelect,
  translateState,
  setTranslateState,
}) {
  const userAvatarUrl = `https://cdn1.vectorstock.com/i/1000x1000/31/95/user-sign-icon-person-symbol-human-avatar-vector-12693195.jpg`;

  const [isZoom, setIsZoom] = useState(false);
  const { t, i18n } = useTranslation();

  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState([]);

  // LOGIC DỊCH GIỐNG CARDNEWS - Xử lý dịch văn bản từ tiếng Anh sang tiếng Việt
  // const [isTranslated, setIsTranslated] = useState(newsSelect?.isTranslatedFromCard || false);
  // const [translatedText, setTranslatedText] = useState(newsSelect?.translatedTextFromCard || "");
  const [loadingTranslate, setLoadingTranslate] = useState(false);

  // State cho dịch bình luận
  const [commentTranslations, setCommentTranslations] = useState({});
  const [commentLoadingStates, setCommentLoadingStates] = useState({});

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  // const [userLat, setUserLat] = useState(null);
  // const [userLong, setUserLong] = useState(null);
  const { isTranslated, translatedText } = translateState;

  const [textSpeak, setTextSpeak] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef(null);

  // ✨ Track language changes
  useEffect(() => {
    console.log(`🔔 ModalNews detected language change to: ${i18n.language}`);
  }, [i18n.language]);

  // ✨ Tự động dịch nội dung khi ngôn ngữ thay đổi
  useEffect(() => {
    if (!newsSelect) return;

    const doTranslate = async () => {
      console.log(
        `📝 ModalNews TRANSLATE FUNCTION CALLED - language = ${i18n.language}`,
      );

      if (i18n.language === "vi") {
        console.log("🇻🇳 Vietnamese - skip translation (modal)");
        setTranslateState({ isTranslated: false, translatedText: "" });
        return;
      }

      try {
        // Lấy content từ các field
        const sourceContent =
          newsSelect?.Content ||
          newsSelect?.ContentVI ||
          newsSelect?.content_text ||
          "";

        console.log(
          "📄 Found modal content:",
          !!sourceContent,
          "length:",
          sourceContent?.length,
        );
        if (!sourceContent?.trim()) {
          console.log("⚠️ No modal content found");
          return;
        }

        console.log(
          `🌐 Translating modal to ${i18n.language}...`,
          sourceContent.substring(0, 30),
        );
        const translated = await translateText(sourceContent, i18n.language);
        console.log(
          `✅ Modal Translation Result:`,
          translated.substring(0, 50),
        );
        console.log(
          `✅ Setting state - isTranslated: true, text length:`,
          translated?.length,
        );

        setTranslateState({ isTranslated: true, translatedText: translated });
      } catch (err) {
        console.error("❌ Modal Error:", err);
        setTranslateState({ isTranslated: false, translatedText: "" });
      }
    };

    doTranslate();
  }, [i18n.language]);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Hàm dịch bình luận
  const handleTranslateComment = async (commentId, commentText) => {
    const lang =
      translateState.language ||
      localStorage.getItem("preferredLanguage") ||
      "vi";

    if (commentTranslations[commentId]) {
      setCommentTranslations((prev) => ({
        ...prev,
        [commentId]: {
          ...prev[commentId],
          isTranslated: !prev[commentId].isTranslated,
        },
      }));
      return;
    }

    setCommentLoadingStates((prev) => ({ ...prev, [commentId]: true }));

    try {
      const translated = await translateText(commentText, lang);

      setCommentTranslations((prev) => ({
        ...prev,
        [commentId]: {
          originalText: commentText,
          translatedText: translated,
          isTranslated: true,
        },
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setCommentLoadingStates((prev) => ({ ...prev, [commentId]: false }));
    }

  };

  const handleTranslate = async () => {
    // 👉 Nếu đang là bản dịch → quay về gốc
    if (isTranslated) {
      setTranslateState({
        isTranslated: false,
        translatedText: translatedText, // vẫn giữ cache
      });

      const originalHtml = newsSelect?.Content || newsSelect?.ContentVI || "";
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = originalHtml;
      const plainText = tempDiv.innerText || tempDiv.textContent || "";

      setTextSpeak(plainText);
      return;
    }

    // 👉 Nếu đã từng dịch rồi → dùng lại
    if (translatedText) {
      setTranslateState({
        isTranslated: true,
        translatedText: translatedText,
      });
      setTextSpeak(translatedText);
      return;
    }

    // 👉 Chưa dịch lần nào → gọi API
    setLoadingTranslate(true);
    try {
      const originalHtml = newsSelect?.Content || newsSelect?.ContentVI || "";
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = originalHtml;
      const plainText = tempDiv.innerText || tempDiv.textContent || "";

      if (!plainText.trim()) return;
      const lang =
        translateState.language ||
        localStorage.getItem("preferredLanguage") ||
        "vi";
      
      const translated = await translateText(plainText, lang);

      setTranslateState({
        isTranslated: true,
        translatedText: translated,
      });

      setTextSpeak(translated);
    } catch (err) {
      console.error("Lỗi tự động dịch:", err);
    } finally {
      setLoadingTranslate(false);
    }

  };

  useEffect(() => {
    setTranslateState({
      isTranslated: false,
      translatedText: "",
    });
  }, [newsSelect?.PostID]);

  useEffect(() => {
    if (newsSelect?.PostID) {
      fetchLatestComments();
    }
  }, [newsSelect?.PostID]);

  useEffect(() => {
    if (newsSelect?.PostID && !translateState.translatedText) {
      handleTranslate();
    }
  }, [newsSelect?.PostID]);

  const fetchLatestComments = async () => {
    if (!newsSelect?.PostID) return;
    try {
      const res = await fetch(
        `https://api_gold.thinkdiff.us/view_detail_comment_post/${newsSelect.PostID}`,
      );
      const json = await res.json();
      if (json?.data) setComments(json.data);
    } catch (err) {
      if (newsSelect?.list_comment) setComments(newsSelect.list_comment);
    }
  };

  function useUserLocation() {
    const [coords, setCoords] = useState({ lat: null, long: null });

    useEffect(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoords({
              lat: position.coords.latitude,
              long: position.coords.longitude,
            });
          },
          (error) => {
            console.error("Lỗi lấy vị trí:", error);
            setCoords({ lat: null, long: null });
          },
        );
      } else {
        console.error("Trình duyệt không hỗ trợ geolocation");
      }
    }, []);

    return coords;
  }
  const { lat, long } = useUserLocation();

  const handlePostComment = async () => {
    if (!content.trim() || isLoading) return;

    const maps = {
      lat: lat || 0,
      long: long || 0,
    };

    const formData = new FormData();
    formData.append("content", content);
    formData.append("idPost", newsSelect?.PostID);
    formData.append("browser_info", "Chrome Web");
    formData.append("maps", JSON.stringify(maps));

    try {
      setIsLoading(true);
      const res = await fetch("https://api_gold.thinkdiff.us/post_comment", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setContent("");
        setTimeout(fetchLatestComments, 1000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsShowModal(false);
    const currentPage = searchParams.get("page") || 1;
    navigate(`?page=${currentPage}`, { replace: true });
    handleStop();
  };

  const handleShare = async () => {
    const currentPageValue = searchParams.get("page") || 1;
    const baseUrl = window.location.href.split("?")[0];
    const shareUrl = `${baseUrl}?page=${currentPageValue}&idPost=${newsSelect.PostID}`;
    const title = newsSelect?.name_group || "Tin tức";
    const text = isTranslated
      ? translatedText
      : newsSelect?.Content || newsSelect?.ContentVI || "";

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Lỗi chia sẻ:", err);
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => {
          alert(t('modalNews.linkCopied', 'Đã sao chép liên kết!'));
        })
        .catch((err) => {
          console.error("Lỗi sao chép:", err);
        });
    }
  };

  const uniqueComments = Array.isArray(comments)
    ? comments.filter((c, i, s) => s.findIndex((t) => t.id === c.id) === i)
    : [];

  const autoTranslateBatch = async (listComments) => {
    if (!listComments || listComments.length === 0) return;

    // Đánh dấu đang loading cho các comment chuẩn bị dịch
    const newLoadingStates = {};
    listComments.forEach((cmt, idx) => {
      const commentId = cmt.id || idx;
      // Chỉ dịch nếu chưa có trong state commentTranslations
      if (!commentTranslations[commentId]) {
        newLoadingStates[commentId] = true;
      }
    });

    setCommentLoadingStates((prev) => ({ ...prev, ...newLoadingStates }));

    const newTranslations = {};

    await Promise.all(
      listComments.map(async (cmt, idx) => {
        const commentId = cmt.id || idx;

        // Nếu đã dịch rồi thì bỏ qua để tiết kiệm API
        if (commentTranslations[commentId]) return;

        const commentText = cmt.content || cmt.contentVI || "";
        if (!commentText.trim()) return;

        try {
          const lang =
            translateState.language ||
            localStorage.getItem("preferredLanguage") ||
            "vi";
          
          const translated = await translateText(commentText, lang);

          if (translated && translated !== commentText) {
            newTranslations[commentId] = {
              originalText: commentText,
              translatedText: translated,
              isTranslated: true,
            };
          }
        } catch (error) {
          console.error(`Lỗi dịch comment ${commentId}:`, error);
        }

      }),
    );

    // Cập nhật state bản dịch
    setCommentTranslations((prev) => ({ ...prev, ...newTranslations }));

    // Tắt loading
    setCommentLoadingStates((prev) => {
      const newState = { ...prev };
      Object.keys(newLoadingStates).forEach((key) => (newState[key] = false));
      return newState;
    });
  };

  useEffect(() => {
    if (comments && comments.length > 0) {
      // Lọc ra các comment trùng lặp trước khi gửi đi dịch (giống logic render uniqueComments)
      const uniqueList = comments.filter(
        (c, i, s) => s.findIndex((t) => t.id === c.id) === i,
      );
      autoTranslateBatch(uniqueList);
    }
  }, [comments]); // Chạy lại mỗi khi list comments thay đổi

  useEffect(() => {
    // Ưu tiên bản dịch, nếu không có thì lấy nội dung gốc
    const currentContent = isTranslated
      ? translatedText
      : newsSelect?.Content || newsSelect?.ContentVI || "";

    if (currentContent) {
      // Loại bỏ các thẻ HTML nếu có để tránh máy đọc cả tag <div>, <p>...
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = currentContent;
      const cleanText = tempDiv.innerText || tempDiv.textContent || "";

      setTextSpeak(cleanText);
    }
  }, [isTranslated, translatedText, newsSelect]);

  const handlePlay = () => {
    const synth = window.speechSynthesis;

    // 1. Nếu đang Pause -> Tiếp tục
    if (isPaused) {
      synth.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    // 2. Nếu đang đọc -> Tạm dừng
    if (isSpeaking && !isPaused) {
      synth.pause();
      setIsPaused(true);
      return;
    }

    // 3. Bắt đầu đọc mới
    if (!textSpeak) return;

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(textSpeak);
    utterance.lang = "vi-VN";
    utterance.rate = 1.1; // Tăng tốc một chút cho tự nhiên

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
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
  };

  useEffect(() => {
    setCommentTranslations({});
    setCommentLoadingStates({});
  }, [newsSelect?.PostID, translateState.language]);

  // dich nhieu ngus
  const handleChangeLanguage = async (lang) => {
    localStorage.setItem("lang", lang);
    localStorage.setItem("preferredLanguage", lang);

    // Sync with global i18n
    await changeLanguageWithTranslation(lang, resources);

    // Lưu ngôn ngữ vào state để component rerender
    setTranslateState((prev) => ({ ...prev, language: lang }));

    // Dịch bài viết ngay lập tức
    const originalHtml = newsSelect?.Content || newsSelect?.ContentVI || "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = originalHtml;
    const plainText = tempDiv.innerText || tempDiv.textContent || "";

    if (!plainText.trim()) return;

    setLoadingTranslate(true);
    try {
      const translated = await translateText(plainText, lang);

      setTranslateState({
        isTranslated: true,
        translatedText: translated,
        language: lang,
      });

      setTextSpeak(translated);
    } catch (err) {
      console.error("Lỗi dịch:", err);
    } finally {
      setLoadingTranslate(false);
    }

  };

  useEffect(() => {
    const preferredLang = localStorage.getItem("preferredLanguage");
    if (preferredLang && newsSelect?.PostID) {
      handleChangeLanguage(preferredLang);
    }
  }, [newsSelect?.PostID]);

  // useEffect(() => {
  //     setCommentTranslations({});
  // }, [translateState.language]);

  useEffect(() => {
    if (newsSelect?.PostID) {
      saveReadNews({
        id: newsSelect.PostID,
        title: newsSelect.page_web || newsSelect.name_group,
        link: newsSelect.link_baiviet_goc,
        author: newsSelect.page_web,
        content: newsSelect.Content,
      });
    }
  }, [newsSelect?.PostID]);

  return (
    <div
      className="overlay-modal-news"
      onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
    >
      <div className={`modal ${isZoom ? "modal-zoom" : ""}`}>
        <div className="modal-header">
          <h3 style={{ flex: 1, textAlign: "center", marginLeft: "24px" }}>
            {t('modalNews.detailTitle', 'Bài viết chi tiết')}
          </h3>

          <select
            style={{ marginLeft: "16px", color: "#fff" }}
            value={
              translateState.language ||
              localStorage.getItem("preferredLanguage") ||
              "vi"
            }
            onChange={(e) => handleChangeLanguage(e.target.value)}
          >
            <option value="af">Afrikaans</option>
            <option value="ar">Arabic</option>
            <option value="zh-CN">Chinese (Simplified)</option>
            <option value="zh-TW">Chinese (Traditional)</option>
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="he">Hebrew</option>
            <option value="hi">Hindi</option>
            <option value="id">Indonesian</option>
            <option value="it">Italian</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="no">Norwegian</option>
            <option value="pt-BR">Portuguese (Brazil)</option>
            <option value="ru">Russian</option>
            <option value="es">Spanish</option>
            <option value="vi">Vietnamese</option>
          </select>

          <div className="modal-actions">
            {textSpeak && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center", // Căn giữa theo chiều dọc
                  gap: "15px", // Khoảng cách giữa thanh progress và các nút
                  width: "100%",
                  padding: "10px",
                }}
              >
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
                      whiteSpace: "nowrap", // Không cho chữ xuống dòng
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
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t('modalNews.stop', 'Dừng')}
                  </button>
                </div>
              </div>
            )}
            <button
              className="modal-icon-btn"
              onClick={() => setIsZoom((prev) => !prev)}
              title={isZoom ? t('modalNews.shrink', 'Thu nhỏ') : t('modalNews.expand', 'Phóng to')}
            >
              <IoMdExpand />
            </button>

            <button
              className="modal-icon-btn"
              onClick={handleCloseModal}
              title={t('modalNews.close', 'Đóng')}
            >
              <IoMdClose />
            </button>
          </div>
        </div>

        <div className="modal-content-news">
          <div className="post-card">
            <div
              className="post-header"
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              {/* Avatar */}
              <img
                src={newsSelect?.avatar_group || userAvatarUrl}
                className="user-avatar"
                style={{ borderRadius: "50%" }}
                alt="avt"
              />
              {/* Info */}
              <div
                className="user-info"
                style={{ display: "flex", flexDirection: "column" }}
              >
                <h3
                  onClick={() => window.open(newsSelect?.link_group)}
                  style={{ cursor: "pointer", margin: 0 }}
                >
                  {newsSelect?.page_web}
                </h3>
                <span
                  className="post-date"
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <LuClock /> {newsSelect?.PostTime}
                </span>
              </div>
              {/* Nút dịch */}
              <div style={{ marginLeft: "auto" }}>
                <button
                  onClick={handleTranslate}
                  disabled={loadingTranslate}
                  className={`translate-btn ${isTranslated ? "active" : ""}`}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <LuLanguages size={14} />
                  {loadingTranslate
                    ? "..."
                    : isTranslated
                      ? t('modalNews.viewOriginal', 'Xem bản gốc')
                      : t('modalNews.translateVN', 'Xem bản dịch')}
                </button>
              </div>
            </div>

            <div className="post-content" style={{ marginTop: "15px" }}>
              {newsSelect && (
                <div
                  style={{ whiteSpace: "pre-wrap" }}
                  dangerouslySetInnerHTML={{
                    __html:
                      isTranslated && translatedText
                        ? linkify(translatedText)
                        : linkify(
                            i18n.language === "vi"
                              ? newsSelect.ContentVI || ""
                              : newsSelect.Content || "",
                          ),
                  }}
                />
              )}
            </div>

            {newsSelect?.link_image?.length > 0 && (
              <img
                src={newsSelect.link_image[0]}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  marginTop: "12px",
                  cursor: "pointer",
                }}
                onClick={() => setIsLightboxOpen(true)}
                alt="post"
              />
            )}

            <div className="post-footer">
              <div className="post-stats">
                <FaEye /> {newsSelect?.so_lan_view || 0}
              </div>
              <button
                onClick={() =>
                  window.open(newsSelect?.link_baiviet_goc, "_blank")
                }
                style={{
                  background: "#ffffff", // nền trắng
                  border: "1px solid #1877f2", // viền màu xanh
                  borderRadius: "4px", // bo góc nhẹ
                  color: "#1877f2", // chữ xanh
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: "500",
                  padding: "4px 8px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#e6f0ff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#ffffff")
                }
              >
                {t('modalNews.viewSource', 'Xem bài gốc')}
              </button>
              <div className="post-actions">
                <button className="action-btn">
                  <FaRegComment /> {uniqueComments.length} {t('modalNews.comments', 'Bình luận')}
                </button>
                <button className="action-btn" onClick={handleShare}>
                  <FaShare /> {t('modalNews.share', 'Chia sẻ')}
                </button>
              </div>
            </div>
          </div>

          {/* FORM NHẬP BÌNH LUẬN - Input để người dùng viết bình luận */}
          <div
            style={{ display: "flex", padding: "16px", alignItems: "center" }}
          >
            <img
              src={userAvatarUrl}
              className="user-avatar"
              style={{ marginRight: "10px" }}
              alt="me"
            />
            <div
              style={{
                flexGrow: 1,
                background: "#111",
                border: "1px solid #333",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                padding: "0 15px",
              }}
            >
              <textarea
                placeholder={t('modalNews.writeComment', 'Viết bình luận...')}
                style={{
                  flexGrow: 1,
                  height: "40px",
                  padding: "10px 0",
                  color: "#eee",
                  resize: "none",
                  fontSize: "14px",
                  outline: "none",
                  background: "transparent",
                  border: "none",
                }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              {isLoading ? (
                <div className="comment-loading-spinner" />
              ) : (
                <IoSend
                  onClick={handlePostComment}
                  style={{
                    cursor: "pointer",
                    color: content.trim() ? "#0084ff" : "#555",
                  }}
                />
              )}
            </div>
          </div>

          <div style={{ padding: "0 16px 16px" }}>
            {uniqueComments.length === 0 && (
              <p style={{ fontStyle: "italic", color: "#888", textAlign: "center", marginTop: "10px" }}>
                {t('modalNews.noComments', 'Chưa có bình luận')}
              </p>
            )}
            {uniqueComments.map((cmt, idx) => {
              const commentId = cmt.id || idx;
              const commentText = cmt.content || cmt.contentVI || "";
              const translation = commentTranslations[commentId];
              const isLoadingComment = commentLoadingStates[commentId];
              const commentActionAt = cmt.actionAt;
              const commentUserAgent = cmt.user_agent || "";
              const commentMap = cmt.linkmap || "";

              return (
                <div key={idx} style={{ marginTop: "15px" }}>
                  <div style={{ display: "flex" }}>
                    <img
                      src={userAvatarUrl}
                      className="user-avatar"
                      style={{
                        width: "30px",
                        height: "30px",
                        marginRight: "10px",
                        borderRadius: "50%",
                      }}
                      alt="u"
                    />
                    <div
                      style={{
                        background: "#333",
                        borderRadius: "12px",
                        padding: "8px 12px",
                        flex: 1,
                      }}
                    >
                      <h5
                        style={{ margin: 0, fontSize: "12px", color: "#aaa" }}
                      >
                        {t('modalNews.user', 'Người dùng')} {idx + 1}
                      </h5>
                      <div style={{ fontSize: "14px", color: "#fff" }}>
                        {translation?.isTranslated
                          ? translation.translatedText
                          : commentText}
                      </div>
                    </div>
                  </div>

                  {/* Nút dịch bình luận giống Facebook */}
                  <div
                    style={{
                      marginLeft: "40px",
                      marginTop: "5px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={() =>
                        handleTranslateComment(commentId, commentText)
                      }
                      disabled={isLoadingComment}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#65676b",
                        fontSize: "12px",
                        cursor: isLoadingComment ? "not-allowed" : "pointer",
                        padding: "2px 0",
                        fontWeight: "500",
                      }}
                    >
                      {isLoadingComment
                        ? t('modalNews.translating', 'Đang dịch...')
                        : translation?.isTranslated
                          ? t('modalNews.viewOriginal', 'Xem bản gốc')
                          : t('modalNews.translateThis', 'Dịch đoạn này')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <LightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageSrc={newsSelect?.link_image?.[0]}
        newsSelect={newsSelect}
        comments={uniqueComments}
      />
    </div>
  );
}

export default ModalNews;

function linkify(text) {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="linkified">${url}</a>`;
  });
}
