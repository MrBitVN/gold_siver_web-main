import React, { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import useRealTimeData from "../../hooks/useRealTimeData";
import "./NewsNotification.css";
import {
  IoSend,
  IoShareSocialOutline,
  IoVolumeHigh,
  IoVolumeMute,
} from "react-icons/io5";
import { LuExternalLink } from "react-icons/lu";
import { decode } from "js-base64";
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


const NewsNotification = () => {
  const { t, i18n } = useTranslation();
  const userAvatarUrl = `https://cdn1.vectorstock.com/i/1000x1000/31/95/user-sign-icon-person-symbol-human-avatar-vector-12693195.jpg`;
  const { liveData } = useRealTimeData();
  const [shownNewsIds, setShownNewsIds] = useState(new Set());
  const [selectedNews, setSelectedNews] = useState(null);
  const [zoomImg, setZoomImg] = useState(null);
  const [isShowingOriginal, setIsShowingOriginal] = useState(false);

  const [englishTranslation, setEnglishTranslation] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // STATE CHO VIỆC ĐỌC BÀI (TTS)
  const [isSpeaking, setIsSpeaking] = useState(false);

  // COMMENT STATES
  const [postId, setPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComment, setLoadingComment] = useState(false);
  const [translatedComments, setTranslatedComments] = useState({});
  const [translatingComment, setTranslatingComment] = useState(null);

  const queueAPI = useRef([]);
  const queueLive = useRef([]);
  const shownRef = useRef(new Set());
  const speechRef = useRef(null);
  const [targetLang, setTargetLang] = useState(
    localStorage.getItem("newsLang") || "vi",
  );
  const [showLangMenu, setShowLangMenu] = useState(false);

  // dọc lưu
  const readNewsIds = useRef(new Set());

  useEffect(() => {
    const history = getReadNewsHistory();
    readNewsIds.current = new Set(history.map((n) => n.id));
  }, []);

  useEffect(() => {
    const currentLang = i18n.language;

    setTargetLang(currentLang);
    localStorage.setItem("newsLang", currentLang);
  }, [i18n.language]);

  // --- HÀM GIẢI MÃ BASE64 HỖ TRỢ TIẾNG VIỆT ---
  const safeDecode = (str) => {
    try {
      return str ? decode(str) : "";
    } catch (e) {
      return str;
    }
  };

  // --- HÀM XỬ LÝ TÊN TÁC GIẢ TỪ LINK ---
  const formatAuthorName = (link) => {
    if (!link || typeof link !== "string") return "";
    if (link.includes("facebook.com/")) {
      const parts = link.split("/").filter(Boolean);
      return parts[parts.length - 1];
    }
    if (link.includes("x.com/")) {
      return link.split("x.com/")[1]?.split(/[? /]/)[0] || link;
    }
    return link;
  };

  const translateCache = useRef(new Map());

  const autoTranslate = async (text, lang = "vi") => {
    if (!text) return "";
    return await translateText(text, lang);
  };

  const isProcessing = useRef(false);

  // --- LOGIC DỊCH TỰ ĐỘNG CHO TOAST ---
  useEffect(() => {
    const interval = setInterval(async () => {
      if (isProcessing.current) return;

      const currentLang = i18n.language || "vi";

      let news = null;
      if (queueAPI.current.length > 0) {
        news = queueAPI.current.shift();
      } else if (queueLive.current.length > 0) {
        news = queueLive.current.shift();
      }

      if (news) {
        isProcessing.current = true;
        try {
          const sourceTitle = news.originalTitle || news.title;
          const sourceContent = news.originalContent || news.content;

          // Luôn dịch sang ngôn ngữ hiện tại của i18n
          const [translatedTitle, translatedContent] = await Promise.all([
            autoTranslate(sourceTitle, currentLang),
            autoTranslate(sourceContent, currentLang),
          ]);

          showNewsNotification({
            ...news,
            title: translatedTitle,
            content: translatedContent,
            originalTitle: sourceTitle,
            originalContent: sourceContent
          });

          setShownNewsIds((prev) => {
            const next = new Set(prev);
            next.add(news.id);
            return next;
          });
        } catch (err) {
          console.error("Lỗi dịch toast:", err);
          // Nếu lỗi thì vẫn hiện bản gốc (thường là tiếng Việt)
          showNewsNotification(news);
        } finally {
          isProcessing.current = false;
        }
      }
    }, 5000); // Check nhanh hơn (5s) để không bị lỡ tin

    return () => clearInterval(interval);
  }, [i18n.language]);

  if (speechRef.current) {
    window.speechSynthesis.cancel();
  }

  // --- LOGIC FETCH TIN TỪ API ---
  const fetchNewsFromAPI = async () => {
    try {
      const resList = await fetch(
        "https://api_gold.thinkdiff.us/tin_tuc_moi_nhat_1_ngay",
      );
      const listData = await resList.json();

      if (listData.status === "success" && listData.data.length > 0) {
        const latestFile = listData.data[listData.data.length - 1];
        const resDetail = await fetch(latestFile.link);
        const detailData = await resDetail.json();

        if (detailData.posts && detailData.posts.length > 0) {
          const newPending = detailData.posts
            .map((subItem) => {
              const decodedContent = safeDecode(subItem.content);
              const decodedContentVi = safeDecode(subItem.content_text_vi);

              return {
                id: subItem.post_db_id,
                title: decodedContentVi || decodedContent.substring(0, 100),
                content: decodedContentVi || decodedContent,
                image: subItem.images?.[0] || null,
                originalTitle: decodedContent,
                originalContent: decodedContent,
                link: subItem.link_view,
                link_baiviet_goc: subItem.link_baiviet_goc,
                author: subItem.link_group,
              };
            })
            .filter(
              (n) =>
                !shownRef.current.has(n.id) && !readNewsIds.current.has(n.id),
            );

          if (newPending.length > 0) {
            queueAPI.current.push(...newPending);
            newPending.forEach((n) => {
              if (n.id) shownRef.current.add(n.id);
            });
          }
        }
      }
    } catch (error) {
      console.error("Lỗi load API tin tức:", error);
    }
  };

  useEffect(() => {
    fetchNewsFromAPI();
    const apiInterval = setInterval(fetchNewsFromAPI, 60000);
    return () => clearInterval(apiInterval);
  }, []);

  useEffect(() => {
    if (!selectedNews) return;
    const ensureVietnamese = async () => {
      const isContentVietnamese =
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
          selectedNews.content,
        );
      if (!isContentVietnamese && !isShowingOriginal) {

        setIsTranslating(true);
        try {
          const [transTitle, transContent] = await Promise.all([
            autoTranslate(selectedNews.title, targetLang),
            autoTranslate(selectedNews.content, targetLang),
          ]);
          setSelectedNews((prev) => ({
            ...prev,
            title: transTitle,
            content: transContent,
            originalTitle: prev.originalTitle || prev.title,
            originalContent: prev.originalContent || prev.content,
          }));
        } catch (err) {
          console.error("Lỗi force translate khi mở modal:", err);
        } finally {
          setIsTranslating(false);
        }
      }
    };
    ensureVietnamese();
  }, [selectedNews?.id]);

  const stripHtml = (html) => {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const contentHtml = isShowingOriginal
      ? selectedNews.originalContent || selectedNews.content
      : selectedNews.content;

    const textToRead = stripHtml(contentHtml);

    if (!textToRead) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = isShowingOriginal ? "zh-CN" : "vi-VN";

    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [selectedNews]);

  useEffect(() => {
    if (!liveData?.ContentNew) return;
    const newOnes = liveData.ContentNew.map((n) => ({
      ...n,
      author: n.link_group,
    })).filter((n) => !shownRef.current.has(n.id));

    if (newOnes.length > 0) {
      queueLive.current.push(...newOnes);
      newOnes.forEach((n) => shownRef.current.add(n.id));
    }
  }, [liveData]);

  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     let news = null;
  //     if (queueAPI.current.length > 0) {
  //       const idx = Math.floor(Math.random() * queueAPI.current.length);
  //       news = queueAPI.current.splice(idx, 1)[0];
  //     } else if (queueLive.current.length > 0) {
  //       const idx = Math.floor(Math.random() * queueLive.current.length);
  //       news = queueLive.current.splice(idx, 1)[0];
  //     }
  //     if (!news) return;

  //     const translatedTitle = await autoTranslate(news.title, 'vi');
  //     const translatedContent = await autoTranslate(news.content, 'vi');

  //     const finalNews = {
  //       ...news,
  //       title: translatedTitle,
  //       content: translatedContent,
  //       originalTitle: news.title,
  //       originalContent: news.content
  //     };

  //     showNewsNotification(finalNews);
  //     setShownNewsIds(prev => new Set([...prev, news.id]));
  //   }, 10000);
  //   return () => clearInterval(interval);
  // }, []);

  const showNewsNotification = (news) => {
    toast.custom(
      (t) => (
        <div
          className={`news-toast ${t.visible ? "show" : "hide"}`}
          onClick={() => {
            toast.dismiss(t.id);
            setSelectedNews(news);
            saveReadNews(news);
            readNewsIds.current.add(news.id);
          }}
        >
          <div className="toast-icon">
            {news.image ? (
              <img className="icon-img" src={news.image} alt="" />
            ) : (
              "📰"
            )}
          </div>
          <div className="toast-content">
            <div className="toast-title">
              {news.author ? `  ${formatAuthorName(news.author)}` : ""}
            </div>
            <div className="toast-message">{truncateByDevice(news.title)}</div>
          </div>
          <button
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(t.id);
            }}
          >
            ✕
          </button>
        </div>
      ),
      { id: "news-notification-toast", duration: 5000, position: "bottom-right" },
    );
  };

  useEffect(() => {
    if (!selectedNews?.originalContent) return;
    const fetchPost = async () => {
      try {
        const fd = new FormData();
        fd.append("content", selectedNews.originalContent);
        const res = await fetch(
          "https://api_gold.thinkdiff.us/get_api_forumpost",
          { method: "POST", body: fd },
        );
        const json = await res.json();
        setPostId(selectedNews.id);
        setComments(json.data.list_comment_json || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPost();
  }, [selectedNews]);

  function useUserLocation() {
    const [coords, setCoords] = useState({ lat: null, long: null });
    useEffect(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            setCoords({
              lat: position.coords.latitude,
              long: position.coords.longitude,
            }),
          () => setCoords({ lat: null, long: null }),
        );
      }
    }, []);
    return coords;
  }
  const { lat, long } = useUserLocation();

  const handleSubmitComment = async () => {
    if (!newComment.trim() || loadingComment) return;
    setLoadingComment(true);
    try {
      const fd = new FormData();
      fd.append("idPost", postId);
      fd.append("content", newComment);
      fd.append("browser_info", "Chrome Web");
      fd.append("lat", lat || "");
      fd.append("long", long || "");
      const res = await fetch("https://api_gold.thinkdiff.us/post_comment", {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        const tempComment = {
          contentVI: newComment,
          actionAt: new Date().toLocaleString(),
          avatar_group: userAvatarUrl,
        };
        setComments((prev) => [...prev, tempComment]);
        setNewComment("");
        toast.success("Bình luận thành công!");
      }
    } catch (error) {
      toast.error("Không thể gửi bình luận.");
    } finally {
      setLoadingComment(false);
    }
  };

  const handleTranslateComment = async (text, index) => {
    if (!text) return;
    if (translatedComments[index]) {
      setTranslatedComments((prev) => {
        const n = { ...prev };
        delete n[index];
        return n;
      });
      return;
    }
    setTranslatingComment(index);
    try {
      const translated = await autoTranslate(text, targetLang);
      setTranslatedComments((prev) => ({ ...prev, [index]: translated }));
    } catch (e) {
      console.error(e);
    } finally {
      setTranslatingComment(null);
    }
  };

  const closeModal = () => {
    setSelectedNews(null);
    setIsShowingOriginal(false);

    setEnglishTranslation(null);
    setIsTranslating(false);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const truncateByDevice = (text) => {
    if (!text) return "";
    const isMobile = window.innerWidth <= 768;
    const maxLength = isMobile ? 50 : 250; // giảm xuống
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  const handleShare = async () => {
    if (!selectedNews) return;
    const shareUrl = selectedNews.link || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedNews.title,
          text: selectedNews.title,
          url: shareUrl,
        });
      } catch (err) { }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Đã copy link bài viết!");
      } catch (err) { }
    }
  };

  const autoTranslateBatch = async (listComments) => {
    if (!listComments || listComments.length === 0) return;
    const newTranslations = {};
    await Promise.all(
      listComments.map(async (cmt, idx) => {
        if (translatedComments[idx]) return;
        const content = cmt.contentVI || cmt.content || "";
        if (!content.trim()) return;
        try {
          const translated = await autoTranslate(content, targetLang);
          if (translated && translated !== content)
            newTranslations[idx] = translated;
        } catch (err) { }
      }),
    );
    if (Object.keys(newTranslations).length > 0)
      setTranslatedComments((prev) => ({ ...prev, ...newTranslations }));
  };
  useEffect(() => {
    if (comments.length > 0) autoTranslateBatch(comments);
  }, [comments]);

  const handleChangeLang = async (lang) => {
    setTargetLang(lang);
    localStorage.setItem("newsLang", lang);
    localStorage.setItem("lang", lang);

    // Sync with global i18n
    await changeLanguageWithTranslation(lang, resources);
  };

  const handleManualTranslate = () => {
    if (selectedNews) {
      const currentAppLang = i18n.language || "vi";
      translateSelectedNews(selectedNews, currentAppLang);
    }
  };

  const translateSelectedNews = async (news, lang) => {
    if (!news || !lang) return;

    setIsTranslating(true);
    try {
      const [transTitle, transContent] = await Promise.all([
        autoTranslate(news.originalTitle || news.title, lang),
        autoTranslate(news.originalContent || news.content, lang),
      ]);
      setSelectedNews((prev) => ({
        ...prev,
        title: transTitle,
        content: transContent,
        lang: lang,
      }));
    } catch (err) {
      console.error("Lỗi dịch tin tức:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    // Đã bỏ auto-translate khi đổi ngôn ngữ
    // Người dùng cần nhấn nút "Dịch" để dịch
  }, [targetLang]);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (comments.length > 0) autoTranslateBatch(comments);
    }, 800); // delay 0.8s
  }, [comments]);

  const languages = [
    { code: "af", label: "AF" },
    { code: "ar", label: "AR" },
    { code: "zh-CN", label: "ZH-CN" },
    { code: "zh-TW", label: "ZH-TW" },
    { code: "en", label: "EN" },
    { code: "fr", label: "FR" },
    { code: "de", label: "DE" },
    { code: "he", label: "HE" },
    { code: "hi", label: "HI" },
    { code: "id", label: "ID" },
    { code: "it", label: "IT" },
    { code: "ja", label: "JA" },
    { code: "ko", label: "KO" },
    { code: "no", label: "NO" },
    { code: "pt-BR", label: "PT-BR" },
    { code: "ru", label: "RU" },
    { code: "es", label: "ES" },
    { code: "vi", label: "VI" },
  ];

  return (
    <>
      <Toaster
        position="bottom-right"
        containerStyle={{ bottom: 20, right: 20, zIndex: 900 }}
      />

      {selectedNews && (
        <div className="news-modal-overlay" onClick={closeModal}>
          <div
            className={`news-modal ${isExpanded ? "news-modal--expanded" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {truncateByDevice(
                  isShowingOriginal
                    ? selectedNews.originalTitle
                    : selectedNews.title,
                )}

              </h3>
              {/* <select
                value={targetLang}
                onChange={(e) => handleChangeLang(e.target.value)}
                style={{ marginLeft: '8px', padding: '4px', borderRadius: '4px', color: "#fff" }}
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
              </select> */}
              <button
                className="modal-icon-btn"
                onClick={handleToggleSpeak}
                title={isSpeaking ? t('newsNotification.stopSpeak', 'Stop Reading') : t('newsNotification.startSpeak', 'Read Article')}
                style={{
                  marginRight: "8px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: isSpeaking ? "#ef4444" : "#3b82f6",
                }}
              >
                {isSpeaking ? (
                  <IoVolumeHigh size={22} className="animate-pulse" />
                ) : (
                  <IoVolumeMute size={22} />
                )}
              </button>
              <div style={{ position: "relative" }}>
                {/* NÚT NHỎ */}
                <button
                  onClick={() => setShowLangMenu((prev) => !prev)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "6px",
                    background: "#1f2937",
                    color: "#fff",
                    border: "1px solid #374151",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  🌐 {targetLang.toUpperCase()}
                </button>

                {/* DROPDOWN */}
                {showLangMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "110%",
                      right: 0,
                      background: "#111827",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      padding: "6px",
                      zIndex: 999,
                      minWidth: "100px",
                      maxHeight: "300px", // Giới hạn chiều cao
                      overflowY: "auto",  // Cho phép cuộn
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                    }}
                  >
                    {languages.map((lang) => (
                      <div
                        key={lang.code}
                        onClick={() => {
                          handleChangeLang(lang.code);
                          setShowLangMenu(false);
                        }}
                        style={{
                          padding: "6px",
                          cursor: "pointer",
                          borderRadius: "4px",
                          fontSize: "13px",
                          color: targetLang === lang.code ? "#3b82f6" : "#fff",
                          fontWeight: targetLang === lang.code ? "bold" : "normal",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#374151")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {lang.label}
                      </div>
                    ))}
                  </div>
                )}

              </div>
              <button
                className="modal-expand-btn"
                onClick={() => setIsExpanded((prev) => !prev)}
                title={t('newsNotification.zoomTooltip', 'Zoom In / Out')}
              >
                {isExpanded ? "🗗" : "🗖"}
              </button>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* PHẦN HIỂN THỊ TÊN TÁC GIẢ Ở TRÊN CÙNG Ở GIỮA */}
              {/* PHẦN HIỂN THỊ TÊN TÁC GIẢ Ở TRÊN CÙNG Ở GIỮA */}
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
                  {t('newsNotification.postedBy', 'Posted by:')}
                  <a
                    href="https://vang247.xyz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none" }} // Xóa gạch chân mặc định của thẻ a
                  >
                    <span style={{ color: "#0084ff", marginLeft: "5px" }}>
                      {formatAuthorName(selectedNews.author)}
                    </span>
                  </a>
                </div>
              )}

              {selectedNews.image && (
                <div className="contain-image">
                  <img
                    className="icon-img-popup"
                    src={selectedNews.image}
                    alt=""
                    onClick={() => setZoomImg(selectedNews.image)}
                  />
                </div>
              )}

              <div
                className="modal-content-notification"
                dangerouslySetInnerHTML={{
                  __html: linkify(
                    isShowingOriginal
                      ? selectedNews.originalContent
                      : selectedNews.content,

                  ),
                }}
              />

              <div className="comment-section">
                <div className="comment-title">
                  💬 {t('newsNotification.comments', 'Comments')} ({comments.length})
                </div>
                <div className="comment-input-wrap">
                  <img
                    src={userAvatarUrl}
                    className="comment-item-avatar"
                    style={{ borderRadius: "50%" }}
                    alt="avt"
                  />
                  <div className="comment-input-box">
                    <textarea
                      className="comment-textarea"
                      placeholder={t('newsNotification.writeComment', 'Write a comment...')}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    {loadingComment ? (
                      <div className="comment-loading-spinner" />
                    ) : (
                      <IoSend
                        onClick={handleSubmitComment}
                        style={{
                          cursor: "pointer",
                          color: newComment.trim() ? "#0084ff" : "#555",
                          fontSize: "1.2rem",
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="comment-list">
                  {comments.length === 0 && (
                    <p style={{ fontStyle: "italic", color: "#888" }}>
                      {t('newsNotification.noComments', 'Chưa có bình luận')}
                    </p>
                  )}
                  {comments.map((cmt, idx) => {
                    const originalText = cmt.contentVI || cmt.content;
                    const translatedText = translatedComments[idx];
                    return (
                      <div className="comment-item" key={idx}>
                        <img
                          src={cmt?.avatar_group || userAvatarUrl}
                          className="comment-item-avatar"
                          style={{ borderRadius: "50%" }}
                          alt="avt"
                        />
                        <div className="comment-bubble">
                          <div className="comment-username">
                            {t('newsNotification.user', 'Người dùng')} {idx + 1}
                          </div>
                          <div className="comment-content">
                            {translatedText || originalText}
                          </div>
                          <div className="comment-time">{cmt.actionAt}</div>
                          <button
                            className="comment-translate-btn"
                            onClick={() =>
                              handleTranslateComment(originalText, idx)
                            }
                            disabled={translatingComment === idx}
                          >
                            {translatingComment === idx
                              ? "Đang dịch..."
                              : translatedText
                                ? "Hiện bản gốc"
                                : "Dịch"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isTranslating && (
                <div className="translating-indicator">
                  <p
                    style={{
                      color: "#3b82f6",
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    {t('newsNotification.translating', 'Đang tự động dịch...')}
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="modal-footer-left">
                <button
                  className="modal-btn-share"
                  onClick={handleShare}
                  title={t('newsNotification.shareTooltip', 'Chia sẻ tin tức')}
                >
                  <IoShareSocialOutline size={18} />
                  <span>{t('newsNotification.share', 'Chia sẻ')}</span>
                </button>
                <button
                  className="modal-btn-original"
                  onClick={() => setIsShowingOriginal((prev) => !prev)}
                  disabled={isTranslating}
                >
                  {isShowingOriginal
                    ? t('newsNotification.viewTranslation', 'Xem bản dịch')
                    : t('newsNotification.viewOriginal', 'Xem bản gốc')}
                </button>


                {selectedNews?.link_baiviet_goc &&
                  selectedNews.link_baiviet_goc.trim() !== "" && (
                    <button
                      className="modal-btn-original"
                      onClick={() =>
                        window.open(selectedNews.link_baiviet_goc, "_blank")
                      }
                      style={{
                        marginLeft: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        backgroundColor: "#10b981",
                        color: "#fff",
                      }}
                    >
                      <LuExternalLink size={14} />
                      <span>{t('newsNotification.viewSource', 'Xem bài gốc')}</span>
                    </button>
                  )}

                {selectedNews?.link && (
                  <a
                    href={selectedNews.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-link-more"
                  >
                    {t('newsNotification.viewMore', 'Xem thêm')}
                  </a>
                )}
              </div>
              <button
                onClick={handleManualTranslate}
                disabled={isTranslating}
                title={`Dịch sang ${(i18n.language || "vi").toUpperCase()}`}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  background: isTranslating ? "#374151" : "#3b82f6",
                  color: "#fff",
                  border: "none",
                  cursor: isTranslating ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  marginRight: "8px",
                  fontWeight: "bold"
                }}
              >
                {isTranslating ? "⏳ ..." : "🔤 Dịch"}
              </button>
              <button className="modal-btn-close" onClick={closeModal}>
                {t('newsNotification.close', 'Đóng')}
              </button>
            </div>
          </div>
          {zoomImg && (
            <div className="zoom-overlay" onClick={() => setZoomImg(null)}>
              <div
                className="zoom-container"
                onClick={(e) => e.stopPropagation()}
              >
                <img className="zoom-image" src={zoomImg} alt="" />
                <button
                  className="zoom-close-bottom"
                  onClick={() => setZoomImg(null)}
                >
                  {t('newsNotification.close', 'Đóng')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default NewsNotification;

function linkify(text) {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}
