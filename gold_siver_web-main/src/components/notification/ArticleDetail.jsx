import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";

const ArticleDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const filePath = location.pathname.replace("/bai-viet/", "");
  const fullLink = `https://api_gold.thinkdiff.us/view_tintuc/${filePath}`;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [articleText, setArticleText] = useState("");
  const speechRef = useRef(null);

  // Fetch nội dung để đọc
  useEffect(() => {
    fetch(fullLink)
      .then((res) => res.text())
      .then((text) => {
        // Bỏ HTML
        const cleanText = text.replace(/<[^>]*>/g, " ");
        setArticleText(cleanText);
      })
      .catch(() => {
        setArticleText("");
      });
  }, [fullLink]);

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!articleText) return;

    const utterance = new SpeechSynthesisUtterance(articleText);
    utterance.lang = "vi-VN";
    utterance.rate = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Cleanup khi rời trang
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div style={{ padding: 10, position: "relative" }}>
      <div className="article-header">
        <h2>📄 Bài viết chi tiết</h2>

        <div style={{ display: "flex", gap: "50px", alignItems: "center" }}>
          <button
            onClick={handleToggleSpeak}
            title={isSpeaking ? "Dừng đọc" : "Đọc bài viết"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: isSpeaking ? "#ef4444" : "#3b82f6",
            }}
          >
            {isSpeaking ? (
              <IoVolumeHigh size={22} />
            ) : (
              <IoVolumeMute size={22} />
            )}
          </button>

          <button
            className="article-close"
            onClick={() => {
              window.speechSynthesis.cancel();
              navigate(-1);
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <iframe
        src={fullLink}
        title="Chi tiết bài viết"
        className="article-frame"
        style={{
          width: "100%",
          height: "100vh",
          border: "none",
        }}
      />
    </div>
  );
};

export default ArticleDetail;
