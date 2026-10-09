import { useState, useEffect, useRef } from "react";
import { LuClock, LuLanguages } from "react-icons/lu";
import { FaEye, FaShare } from "react-icons/fa";
import { FaRegComment } from "react-icons/fa6";
import "./CardNews.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { translateText } from "../../services/translationService";

function CardNews({
  data,
  setIsShowModal,
  setNewsSelect,
  currentPage = 1, // ← Nhận currentPage từ parent (LastestNews)
  translateState, // ← trạng thái dịch từ cha
  setTranslateState, // ← hàm cập nhật trạng thái dịch từ cha
}) {
  // const [isTranslated, setIsTranslated] = useState(false);
  // const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const { isTranslated, translatedText } = translateState;
  const contentRef = useRef(null);
  const [showSeeMore, setShowSeeMore] = useState(false);
  const { t, i18n } = useTranslation();

  const [searchParams] = useSearchParams(); // Để lấy page hiện tại nếu cần
  const navigate = useNavigate();

  const userAvatarUrl = `https://cdn1.vectorstock.com/i/1000x1000/31/95/user-sign-icon-person-symbol-human-avatar-vector-12693195.jpg`;

  if (!data) return null;

  // ✨ Track language changes
  useEffect(() => {
    console.log(`🔔 CardNews detected language change to: ${i18n.language}`);
  }, [i18n.language]);

  // ✨ Tự động dịch nội dung khi ngôn ngữ thay đổi
  useEffect(() => {
    if (!data) return;

    const doTranslate = async () => {
      console.log(
        `📝 CardNews TRANSLATE FUNCTION CALLED - language = ${i18n.language}`,
      );

      if (i18n.language === "vi") {
        console.log("🇻🇳 Vietnamese - skip translation");
        setTranslateState({ isTranslated: false, translatedText: "" });
        return;
      }

      try {
        // Lấy content từ các field
        const sourceHtml =
          data?.content_text ||
          data?.content_text_vi ||
          data?.contentDisplay ||
          data?.Content ||
          "";

        console.log(
          "📄 Found content:",
          !!sourceHtml,
          "length:",
          sourceHtml?.length,
        );
        if (!sourceHtml?.trim()) {
          console.log("⚠️ No content found");
          return;
        }

        // Extract plain text
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = sourceHtml;
        const plainText = tempDiv.innerText || tempDiv.textContent || "";

        if (!plainText.trim()) {
          console.log("⚠️ No plain text");
          return;
        }

        console.log(
          `🌐 Translating to ${i18n.language}...`,
          plainText.substring(0, 30),
        );
        const translated = await translateText(plainText, i18n.language);
        console.log(`✅ Translation Result:`, translated.substring(0, 50));
        console.log(
          `✅ Setting state - isTranslated: true, text length:`,
          translated?.length,
        );

        setTranslateState({ isTranslated: true, translatedText: translated });
      } catch (err) {
        console.error("❌ Error:", err);
        setTranslateState({ isTranslated: false, translatedText: "" });
      }
    };

    doTranslate();
  }, [i18n.language]);

  const handleTranslate = async (e) => {
    e.stopPropagation();
    if (isTranslated) {
      setTranslateState({ isTranslated: false, translatedText: "" });
      return;
    }
    if (translatedText) {
      setTranslateState({ isTranslated: true, translatedText });
      return;
    }

    setLoading(true);
    try {
      const originalHtml = data?.content_text || data?.content_text_vi || "";
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = originalHtml;
      const plainText = tempDiv.innerText || tempDiv.textContent || "";

      if (!plainText.trim()) return;

      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(plainText)}`,
      );
      const result = await response.json();
      const translated = result[0].map((item) => item[0]).join("");

      setTranslateState({ isTranslated: true, translatedText: translated });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resolveImageSrc = (img) => {
    if (!img && img !== 0) return null;
    if (typeof img !== "string") {
      if (img && typeof img === "object") return img.url || img.src || null;
      return null;
    }
    const s = img.trim();
    if (!s) return null;
    if (s.startsWith("data:image/")) return s;
    if (/^https?:\/\//i.test(s)) return s;
    const cleaned = s.replace(/\s+/g, "");
    if (cleaned.startsWith("iVBOR")) return `data:image/png;base64,${cleaned}`;
    if (cleaned.startsWith("/9")) return `data:image/jpeg;base64,${cleaned}`;
    return s;
  };

  const images = Array.isArray(data?.images)
    ? data.images
    : typeof data?.images === "string"
      ? [data.images]
      : [];
  const resolvedImages = images
    .map((img) => resolveImageSrc(img))
    .filter(Boolean);

  // Sử dụng translatedText nếu đã dịch, nếu không dùng contentDisplay
  const originalHtml = data?.contentDisplay || "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = originalHtml;
  const plainText = tempDiv.innerText || tempDiv.textContent || "";

  // Nếu đã dịch, hiển thị translatedText; nếu không, dùng plainText
  const content = isTranslated ? translatedText || plainText : plainText;

  const isLongContent = content.length > 200;
  const displayedContent = isLongContent
    ? `${content.substring(0, 200)}...`
    : content;

  const handleSelectNews = () => {
    // Chuẩn bị dữ liệu truyền vào modal
    const dataToPass = {
      ...data,
      isTranslatedFromCard: isTranslated,
      translatedTextFromCard: translatedText,
    };

    if (setNewsSelect) setNewsSelect(dataToPass);
    if (setIsShowModal) setIsShowModal(true);

    // Luôn giữ page hiện tại + thêm idPost
    const currentPageValue = currentPage || searchParams.get("page") || 1;

    const newParams = new URLSearchParams();
    newParams.set("page", currentPageValue);
    newParams.set("idPost", data.post_db_id);

    navigate(`?${newParams.toString()}`);
  };

  const handleShare = async () => {
    const currentPageValue = currentPage || searchParams.get("page") || 1;
    const baseUrl = window.location.href.split("?")[0];
    const shareUrl = `${baseUrl}?page=${currentPageValue}&idPost=${data.post_db_id}`;
    const title = data?.name_group || "Tin tức";
    const text = displayedContent;

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
          alert("Đã sao chép liên kết!");
        })
        .catch((err) => {
          console.error("Lỗi sao chép:", err);
        });
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <img
          src={data?.avatar_group || userAvatarUrl}
          alt="User Avatar"
          className="user-avatar"
        />
        <div className="user-info">
          <h3 className="user-name">{data?.name_group}</h3>
          <span className="post-date">
            <LuClock size={14} className="icon-small" /> {data?.PostTime || ""}
          </span>
        </div>

        <button
          onClick={handleTranslate}
          disabled={loading}
          className="translate-btn"
          style={{
            marginLeft: "auto",
            padding: "4px 12px",
            fontSize: "12px",
            cursor: loading ? "not-allowed" : "pointer",
            borderRadius: "20px",
            border: "1px solid #1877f2",
            background: isTranslated ? "#1877f2" : "#fff",
            color: isTranslated ? "#fff" : "#1877f2",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <LuLanguages size={14} />
          {loading ? "..." : isTranslated ? "Gốc" : "Dịch VN"}
        </button>
      </div>

      {/* Click vào nội dung */}
      <div className="post-content" onClick={handleSelectNews}>
        <div
          ref={contentRef}
          className="post-content-text"
          dangerouslySetInnerHTML={{
            __html: isTranslated ? translatedText : data?.contentDisplay || "",
          }}
        />
        {(content.length > 300 || isLongContent) && (
          <div className="see-more">
            {t('common.seeMore', 'Xem thêm')}...
          </div>
        )}
      </div>

      {/* Click vào ảnh */}
      <div className="post-media" onClick={handleSelectNews}>
        {resolvedImages.length > 0 && (
          <img src={resolvedImages[0]} className="post-card-image" alt="news" />
        )}
      </div>

      <div className="post-footer">
        <div className="post-stats">
          <div className="stat-item">
            <FaEye size={18} />
            <span>{data?.so_lan_view || "0"}</span>
          </div>
        </div>
        <div className="post-actions">
          {/* Nút bình luận cũng mở modal + cập nhật URL */}
          <button className="action-btn" onClick={handleSelectNews}>
            <FaRegComment size={18} /> <span>{t("CardNews.bl")}</span>
          </button>
          <button className="action-btn" onClick={handleShare}>
            <FaShare size={18} /> {t("CardNews.cse")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CardNews;
