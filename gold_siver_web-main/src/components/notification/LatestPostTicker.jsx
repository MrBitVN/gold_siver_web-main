import React, { useEffect, useState, useRef } from "react";
import "./LatestPostTicker.css";
import { IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import { useTranslation } from "react-i18next";

const getLangFromUrl = () => {
  const hash = window.location.hash;
  const parts = hash.replace("#/", "").split("/");
  const urlLang = parts[0];
  const viRoutes = [
    "vietnam","bai-viet","tin-tuc","ty-gia","lich","live","chart","etf",
    "wallet","vi","du","so","luong","shark","btc","oil","zsl","fomo","ig",
    "order","bao","vang","slv","rsi","dxy","mcx","cvol","tai","danh","thong",
    "hyperliquid","comex","lbma","spdr","xau","futures","trade","pslv",
    "shanghaichart","compareshanghaicomex","map","orderflowanalysis",
    "EtfSharkDetail","chart-detail","calendar","lich_kinh_te",
  ];
  if (urlLang && urlLang.length >= 2 && urlLang.length <= 7 && !viRoutes.includes(urlLang)) {
    return urlLang;
  }
  return localStorage.getItem("lang") || "vi";
};

const translateViaGoogle = async (text, targetLang) => {
  if (!text || targetLang.startsWith("vi")) return text;
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const result = data?.[0]?.map((i) => i[0]).join("") || "";
    return result || text;
  } catch (e) {
    console.warn("[LatestPostTicker] translate failed:", e.message);
    return text;
  }
};

const LatestPostTicker = () => {
  const { i18n } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeLink, setActiveLink] = useState(null);
  const panelRef = useRef(null);

  const [previews, setPreviews] = useState({});
  const [translatedPreviews, setTranslatedPreviews] = useState({});
  const [fullTexts, setFullTexts] = useState({});

  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState("");

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeakingList, setIsSpeakingList] = useState(false);

  const [currentLang, setCurrentLang] = useState(() => getLangFromUrl());
  const [translatedTitle, setTranslatedTitle] = useState("");
  const translateTimerRef = useRef(null); // kept for potential future use

  // Sync lang từ i18n và window event
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

  // Dịch title khi ngôn ngữ thay đổi
  useEffect(() => {
    if (currentLang.startsWith("vi")) {
      setTranslatedTitle("");
      return;
    }
    const newestDay = days[days.length - 1]?.dirname;
    const isNewest = selectedDay === newestDay;
    const viText = isNewest ? "📄 BÀI VIẾT MỚI NHẤT" : `📄 BÀI VIẾT NGÀY ${selectedDay}`;
    translateViaGoogle(viText, currentLang).then(setTranslatedTitle);
  }, [currentLang, selectedDay, days]);

  /* ================= FETCH DAY ================= */
  useEffect(() => {
    fetch("https://api_gold.thinkdiff.us/all_day_tin_tuc")
      .then((res) => res.json())
      .then((res) => {
        if (res?.status === "success" && res.data.length > 0) {
          const newestDay = res.data[res.data.length - 1].dirname;
          setDays(res.data);
          setSelectedDay(newestDay);
        }
      });
  }, []);

  /* ================= FETCH POSTS ================= */
  useEffect(() => {
    if (!selectedDay) return;
    setPosts([]);
    setPreviews({});
    setTranslatedPreviews({});
    setFullTexts({});
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsSpeakingList(false);

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
          const preview = clean.length > 100 ? clean.slice(0, 100) + "…" : clean;
          setPreviews((prev) => ({ ...prev, [item.link]: preview }));
        })
        .catch(() => {
          setPreviews((prev) => ({ ...prev, [item.link]: "📄 Không thể tải nội dung" }));
        });
    });
  }, [posts, fullTexts]);

  /* ================= DỊCH PREVIEWS ================= */
  const lastTranslatedLangRef = useRef("vi");

  useEffect(() => {
    const entries = Object.entries(previews);
    if (!entries.length) return;

    if (currentLang.startsWith("vi")) {
      setTranslatedPreviews(previews);
      lastTranslatedLangRef.current = currentLang;
      return;
    }

    const langChanged = lastTranslatedLangRef.current !== currentLang;

    // Nếu đổi ngôn ngữ → dịch lại tất cả
    // Nếu cùng ngôn ngữ → chỉ dịch item mới chưa có
    const toTranslate = langChanged
      ? entries
      : entries.filter(([link]) => !translatedPreviews[link]);

    if (!toTranslate.length) return;

    if (langChanged) {
      setTranslatedPreviews({});
      lastTranslatedLangRef.current = currentLang;
    }

    const lang = currentLang;
    console.log(`[LatestPostTicker] Translating ${toTranslate.length} items to "${lang}" (langChanged=${langChanged})`);
    toTranslate.forEach(async ([link, text]) => {
      const result = await translateViaGoogle(text, lang);
      console.log(`[LatestPostTicker] Translated: "${text.slice(0,30)}" → "${result.slice(0,30)}"`);
      setTranslatedPreviews((prev) => ({ ...prev, [link]: result }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previews, currentLang]);

  /* ================= SPEAK ================= */
  const speakText = (text, setState) => {
    if (!text) return;
    const chunks = text.match(/[^.!?\n]+[.!?…]?/g)?.map((s) => s.trim()).filter(Boolean) || [text];
    chunks.forEach((chunk) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = "vi-VN";
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    });
    window.speechSynthesis.onend = () => setState(false);
    setState(true);
  };

  const handleToggleSpeak = () => {
    if (!activeLink) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    speakText(fullTexts[activeLink], setIsSpeaking);
  };

  const handleToggleSpeakList = () => {
    if (isSpeakingList) { window.speechSynthesis.cancel(); setIsSpeakingList(false); return; }
    const allText = posts.map((item) => fullTexts[item.link]).filter(Boolean).join(". ");
    speakText(allText, setIsSpeakingList);
  };

  const newestDay = days[days.length - 1]?.dirname;
  const isNewestDay = selectedDay === newestDay;

  const titleText = translatedTitle ||
    (isNewestDay ? "📄 BÀI VIẾT MỚI NHẤT" : `📄 BÀI VIẾT NGÀY ${selectedDay}`);

  return (
    <>
      <button className="notification-bell bell-icon" onClick={() => setOpen((prev) => !prev)}>
        📄
      </button>

      {open && (
        <div className="live-news-overlay" style={{ marginTop: "70px" }}>
          <div ref={panelRef} className="live-news-panel">
            <div className="live-news-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>{titleText}</span>
                <button
                  onClick={handleToggleSpeakList}
                  title={isSpeakingList ? "Dừng đọc" : "Đọc tất cả"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: isSpeakingList ? "#ef4444" : "#3b82f6" }}
                >
                  {isSpeakingList ? <IoVolumeHigh size={18} /> : <IoVolumeMute size={18} />}
                </button>
              </div>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                style={{ background: "#020617", color: "#e5e7eb", border: "1px solid #334155", borderRadius: "6px", padding: "4px 8px", fontSize: "13px", cursor: "pointer" }}
              >
                {days.map((day) => (
                  <option key={day.dirname} value={day.dirname}>{day.dirname}</option>
                ))}
              </select>
              <div className="live-news-actions">
                <button className="live-news-close" onClick={() => setOpen(false)}>✕</button>
              </div>
            </div>

            <div className="live-news-body">
              <div className="live-news-vertical">
                {posts.length === 0 && (
                  <div className="live-news-empty">⏳ Đang cập nhật bài viết mới...</div>
                )}
                {posts.map((item, index) => (
                  <div
                    key={index}
                    className="live-news-row"
                    onClick={() => { setActiveLink(item.link); setOpen(false); }}
                  >
                    <div className="news-preview">
                      {translatedPreviews[item.link] || previews[item.link] || "⏳ Đang tải..."}
                    </div>
                    <div className="live-news-meta">
                      <span>{item.modified_time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeLink && (
        <div className="article-overlay" onClick={() => setActiveLink(null)}>
          <div className="article-panel" onClick={(e) => e.stopPropagation()}>
            <div className="article-header">
              <div style={{ display: "flex", gap: "50px", alignItems: "center" }}>
                <h2>📄 Bài viết chi tiết</h2>
                <button
                  onClick={handleToggleSpeak}
                  title={isSpeaking ? "Dừng đọc" : "Đọc bài viết"}
                  style={{ background: "none", border: "none", cursor: "pointer", color: isSpeaking ? "#ef4444" : "#3b82f6" }}
                >
                  {isSpeaking ? <IoVolumeHigh size={22} /> : <IoVolumeMute size={22} />}
                </button>
              </div>
              <div className="author-info" style={{ fontSize: "14px", color: "#94a3b8" }}>
                Được đăng bởi:{" "}
                <a href="https://vang247.xyz/" target="_blank" rel="noopener noreferrer"
                  style={{ color: "#3b82f6", textDecoration: "none", fontWeight: "bold" }}>
                  Vàng 247
                </a>
              </div>
              <button className="article-close" onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); setActiveLink(null); }}>✕</button>
            </div>
            <iframe src={activeLink} title="Nội dung bài viết" className="article-frame" />
          </div>
        </div>
      )}
    </>
  );
};

export default LatestPostTicker;
