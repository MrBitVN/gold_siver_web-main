import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import { translateText } from "../../services/translationService";

const NewsSidebar = () => {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [previews, setPreviews] = useState({});
  const [translatedPreviews, setTranslatedPreviews] = useState({});
  const [fullTexts, setFullTexts] = useState({});
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const navigate = useNavigate();
  const { day } = useParams();
  const translateTimerRef = useRef(null);
  const previewsRef = useRef({});

  // Lắng nghe sự kiện đổi ngôn ngữ từ i18n và window event (background translation)
  useEffect(() => {
    const handleLangChange = (lang) => setCurrentLang(lang);
    const handleWindowLangChange = (e) => setCurrentLang(e.detail?.lang || i18n.language);

    i18n.on("languageChanged", handleLangChange);
    window.addEventListener("language-changed", handleWindowLangChange);
    return () => {
      i18n.off("languageChanged", handleLangChange);
      window.removeEventListener("language-changed", handleWindowLangChange);
    };
  }, [i18n]);

  /* ================= FETCH DAYS ================= */
  useEffect(() => {
    fetch("https://api_gold.thinkdiff.us/all_day_tin_tuc")
      .then((res) => res.json())
      .then((res) => {
        if (res?.status === "success" && res.data.length > 0) {
          setDays(res.data);
          const newestDay = res.data[res.data.length - 1].dirname;
          if (day) {
            setSelectedDay(day);
          } else {
            setSelectedDay(newestDay);
            navigate(`/bai-viet/${newestDay}`, { replace: true });
          }
        }
      });
  }, [day, navigate]);

  /* ================= FETCH POSTS ================= */
  useEffect(() => {
    if (!selectedDay) return;
    setPosts([]);
    setPreviews({});
    setTranslatedPreviews({});
    setFullTexts({});
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    fetch(`https://api_gold.thinkdiff.us/liet_ke_tin_tuc_1ngay/${selectedDay}`)
      .then((res) => res.json())
      .then((postsRes) => {
        if (postsRes?.status === "success") setPosts(postsRes.data);
      });
  }, [selectedDay]);

  /* ================= FETCH FULL CONTENT ================= */
  useEffect(() => {
    posts.forEach((item) => {
      if (!item.link || fullTexts[item.link]) return;

      fetch(item.link)
        .then((res) => res.text())
        .then((text) => {
          let clean = text
            .replace(/<script[^>]*>.*?<\/script>/gi, "")
            .replace(/<style[^>]*>.*?<\/style>/gi, "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          setFullTexts((prev) => ({ ...prev, [item.link]: clean }));

          const preview = clean.length > 160 ? clean.slice(0, 160) + "…" : clean;
          setPreviews((prev) => {
            const next = { ...prev, [item.link]: preview };
            previewsRef.current = next;
            return next;
          });
        })
        .catch(() => {
          setPreviews((prev) => ({
            ...prev,
            [item.link]: "📄 Không thể tải nội dung",
          }));
        });
    });
  }, [posts, fullTexts]);

  /* ================= DỊCH PREVIEWS KHI NGÔN NGỮ THAY ĐỔI ================= */
  const translatePreviews = useCallback(async (lang, currentPreviews) => {
    if (lang === "vi") {
      setTranslatedPreviews(currentPreviews);
      return;
    }
    const entries = Object.entries(currentPreviews);
    if (entries.length === 0) return;

    const translated = {};
    await Promise.all(
      entries.map(async ([link, text]) => {
        try {
          translated[link] = await translateText(text, lang);
        } catch {
          translated[link] = text;
        }
      })
    );
    setTranslatedPreviews(translated);
  }, []);

  // Khi previews hoặc ngôn ngữ thay đổi → dịch lại
  useEffect(() => {
    if (Object.keys(previews).length === 0) return;
    // Reset bản dịch cũ ngay khi ngôn ngữ thay đổi để tránh hiển thị sai
    setTranslatedPreviews({});
    if (translateTimerRef.current) clearTimeout(translateTimerRef.current);
    translateTimerRef.current = setTimeout(() => {
      translatePreviews(currentLang, previews);
    }, 300);
    return () => clearTimeout(translateTimerRef.current);
  }, [previews, currentLang, translatePreviews]);

  /* ================= SPEAK ================= */
  const speakText = (text) => {
    if (!text) return;
    const chunks = text
      .match(/[^.!?\n]+[.!?…]?/g)
      ?.map((s) => s.trim())
      .filter(Boolean) || [text];
    chunks.forEach((chunk) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = "vi-VN";
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    });
    window.speechSynthesis.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const allText = posts.map((item) => fullTexts[item.link]).filter(Boolean).join(". ");
    speakText(allText);
  };

  const newestDay = days[days.length - 1]?.dirname;
  const isNewestDay = selectedDay === newestDay;

  const headerTitle = isNewestDay
    ? t("NewsSidebar.latestTitle")
    : t("NewsSidebar.dayTitle", { day: selectedDay });

  return (
    <>
      <div className="latest-posts-container">
        <div className="latest-posts-header posts-header">
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <h3 className="posts-title">📄 {headerTitle}</h3>
            <button
              onClick={handleToggleSpeak}
              title={isSpeaking ? t("NewsSidebar.stopRead") : t("NewsSidebar.readAll")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: isSpeaking ? "#ef4444" : "#3b82f6",
              }}
            >
              {isSpeaking ? <IoVolumeHigh size={18} /> : <IoVolumeMute size={18} />}
            </button>
          </div>

          <select
            value={selectedDay}
            onChange={(e) => {
              const newDay = e.target.value;
              setSelectedDay(newDay);
              navigate(`/bai-viet/${newDay}`);
            }}
            className="day-select"
          >
            {days.map((d) => (
              <option key={d.dirname} value={d.dirname}>{d.dirname}</option>
            ))}
          </select>
        </div>

        <div className="latest-posts-list">
          {posts.length === 0 && <div>⏳ {t("NewsSidebar.updating")}</div>}

          {posts.map((item, index) => (
            <div
              key={index}
              className="latest-post-item"
              onClick={() => {
                const filePath = item.link.replace(
                  "https://api_gold.thinkdiff.us/view_tintuc/", ""
                );
                navigate(`/bai-viet/${filePath}`);
              }}
              style={{ cursor: "pointer", padding: "12px 0", borderBottom: "1px solid #e5e7eb" }}
            >
              <div>
                {translatedPreviews[item.link] || previews[item.link] || `⏳ ${t("NewsSidebar.loadingContent")}`}
              </div>
              <small style={{ color: "#888" }}>{item.modified_time}</small>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default NewsSidebar;
