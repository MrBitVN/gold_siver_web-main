import { IoMdClose } from "react-icons/io";
import { IoSend } from "react-icons/io5";
import { LuLanguages } from "react-icons/lu"; // Thêm icon dịch
import { useState, useEffect, useRef } from "react";

export default function LightboxModal({
  isOpen,
  onClose,
  imageSrc,
  newsSelect,
  comments: initialComments = [],
  lat,
  long
}) {
  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const commentsEndRef = useRef(null);
  const userAvatarUrl = `https://cdn1.vectorstock.com/i/1000x1000/31/95/user-sign-icon-person-symbol-human-avatar-vector-12693195.jpg`


  // LOGIC DỊCH ĐỒNG BỘ
  const [isTranslated, setIsTranslated] = useState(newsSelect?.isTranslatedFromCard || false);
  const [translatedText, setTranslatedText] = useState(newsSelect?.translatedTextFromCard || "");
  const [loadingTranslate, setLoadingTranslate] = useState(false);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Cập nhật trạng thái dịch khi newsSelect thay đổi
  useEffect(() => {
    setIsTranslated(newsSelect?.isTranslatedFromCard || false);
    setTranslatedText(newsSelect?.translatedTextFromCard || "");
  }, [newsSelect]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  if (!isOpen) return null;

  // Hàm dịch tương tự CardNews
  const handleTranslate = async () => {
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
      const originalHtml = newsSelect?.Content || newsSelect?.ContentVI || "";
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = originalHtml;
      const plainText = tempDiv.innerText || tempDiv.textContent || "";

      if (!plainText.trim()) return;

      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(plainText)}`
      );
      const result = await response.json();

      if (result && result[0]) {
        const translated = result[0].map(item => item[0]).join("");
        setTranslatedText(translated);
        setIsTranslated(true);
      }
    } catch (error) {
      console.error("Lỗi dịch Lightbox:", error);
    } finally {
      setLoadingTranslate(false);
    }
  };

  const fetchLatestComments = async () => {
    if (!newsSelect?.PostID) return;
    try {
      const url = `https://api_gold.thinkdiff.us/view_detail_comment_post/${newsSelect.PostID}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json?.data) setComments(json.data);
    } catch (err) {
      console.warn('Error fetching comments:', err);
    }
  };

  const handlePostComment = async () => {
    if (!content.trim()) return;
    const mapsData = (lat != null && long != null) ? { lat, long } : { lat: 0, long: 0 };
    const formData = new FormData();
    formData.append("maps", JSON.stringify(mapsData));
    formData.append("content", content);
    formData.append("idPost", newsSelect?.PostID);

    try {
      setIsLoading(true);
      const res = await fetch("https://api_gold.thinkdiff.us/post_comment", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data?.status === "success") {
        setContent('');
        await fetchLatestComments();
      }
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lightbox-overlay" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()} style={{ display: "flex", width: "95%", height: "90%", background: "#111", borderRadius: "12px", overflow: "hidden" }}>

        {/* TRÁI: ẢNH */}
        <div style={{ flex: 2, display: "flex", justifyContent: "center", alignItems: "center", background: "#000", borderRight: "1px solid #222" }}>
          <img src={imageSrc} alt="Post" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        </div>

        {/* PHẢI: INFO & BÌNH LUẬN */}
        <div style={{ flex: 1, minWidth: "350px", display: "flex", flexDirection: "column", background: "#111" }}>

          {/* Header Lightbox */}
          <div style={{ padding: "16px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, color: "#eaf205", fontSize: "16px" }}>{newsSelect?.page_web}</h3>
              <small style={{ color: "#888" }}>{newsSelect?.PostTime}</small>
            </div>
            {/* NÚT DỊCH TRONG LIGHTBOX */}
            <button
              onClick={handleTranslate}
              disabled={loadingTranslate}
              style={{
                padding: "5px 10px", borderRadius: "15px", border: "1px solid #1877f2",
                background: isTranslated ? "#1877f2" : "transparent", color: isTranslated ? "#fff" : "#1877f2",
                fontSize: "12px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px"
              }}
            >
              <LuLanguages size={14} /> {loadingTranslate ? "..." : (isTranslated ? "Gốc" : "Dịch VN")}
            </button>
          </div>

          <div style={{ flexGrow: 1, overflowY: "auto", padding: "16px" }}>
            <div
              style={{ color: "#eee", fontSize: "14px", lineHeight: "1.5", whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{ __html: isTranslated ? translatedText : (newsSelect?.Content || newsSelect?.ContentVI || "") }}
            />

            <div style={{ marginTop: "24px" }}>
              <strong style={{ color: "#fff", display: "block", marginBottom: "12px", borderTop: "1px solid #222", paddingTop: "12px" }}>Bình luận</strong>
              {comments.map((cmt, idx) => (
                <div key={cmt.id || idx} style={{ marginBottom: "12px", display: "flex", gap: "10px" }}>
                  <img src={userAvatarUrl} className="user-avatar" style={{ width: '30px', height: '30px', marginRight: '10px', borderRadius: '50%' }} alt="u" />
                  <div style={{ background: "#222", padding: "8px 12px", borderRadius: "12px", flexGrow: 1 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: "bold", color: "#aaa" }}>Người dùng {idx + 1}</p>
                    <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#fff" }}>{cmt.contentVI || cmt.content}</p>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef}></div>
            </div>
          </div>

          {/* INPUT BÌNH LUẬN */}
          <div style={{ padding: "16px", borderTop: "1px solid #222", display: "flex", gap: "10px", alignItems: "center" }}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Viết bình luận..."
              style={{
                flexGrow: 1, padding: "10px 15px", borderRadius: "20px", border: "1px solid #333",
                background: "#1a1a1a", color: "#fff", outline: "none", resize: "none", height: "40px", fontSize: "14px"
              }}
            />
            <button
              onClick={handlePostComment}
              disabled={!content.trim() || isLoading}
              style={{
                background: "transparent", color: content.trim() ? "#0a84ff" : "#555",
                border: "none", cursor: "pointer", fontSize: "20px", display: "flex"
              }}
            >
              {isLoading ? "..." : <IoSend />}
            </button>
          </div>
        </div>
      </div>

      {/* Close button float */}
      <button onClick={onClose} style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <IoMdClose size={24} />
      </button>
    </div>
  );
}