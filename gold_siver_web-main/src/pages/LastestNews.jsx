import { useEffect, useState, useRef } from "react";
import CardNews from "../components/lastestNews/CardNews";
import "./LastestNews.css";
import ModalNews from "../components/lastestNews/ModalNews";
import _ from "lodash";
import { useSearchParams, useNavigate } from "react-router-dom";
import { logUserInfo } from "../utils/logUserInfo";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
function LastestNews() {
  const { t, i18n } = useTranslation();
  const [isShowModal, setIsShowModal] = useState(false);
  const [news, setNews] = useState(null);
  const [lat, setLat] = useState(null);
  const [long, setLong] = useState(null);
  const [newsSelect, setNewsSelect] = useState(null); // tin để cho vào modal
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [translateStates, setTranslateStates] = useState({});
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // "all" or category name
  const [displayNews, setDisplayNews] = useState([]);
  const tabsRef = useRef(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const idPost = searchParams.get("idPost");
  const pageParam = searchParams.get("page");

  const fetchNews = async (page = 1) => {
    setIsLoading(true);
    try {
      const url = `https://api_gold.thinkdiff.us/tintuc_moi_nhat${page > 1 ? `?page=${page}` : ""}`;
      console.log("Fetching page:", page, "URL:", url);
      const response = await fetch(url);
      const json = await response.json();

      console.log(
        "Response status:",
        json.status,
        "Items count:",
        json?.data?.items?.length,
      );

      if (json.status === "success") {
        const items = json?.data?.items || [];

        // Tách dữ liệu: Tin tức chung và Các danh mục (categories)
        const generalNews = [];
        const extractedCategories = [];

        items.forEach(item => {
          if (item.list && Array.isArray(item.list)) {
            // Đây là một danh mục (ví dụ: Finance Yahoo)
            extractedCategories.push({
              name: item.name || item.name_group || "Category",
              list: item.list
            });
          } else {
            // Đây là tin tức bình thường
            generalNews.push(item);
          }
        });

        setCategories(extractedCategories);
        setNews(generalNews); // Lưu tin tức "Tất cả" gốc

        // Cập nhật tin hiển thị dựa trên tab
        if (activeTab === "all") {
          setDisplayNews(generalNews);
        } else {
          const found = extractedCategories.find(c => c.name === activeTab);
          if (found) setDisplayNews(found.list);
        }

        setCurrentPage(page);

        // Set totalPages to 100 as per user request
        setTotalPages(100);
      }
    } catch (error) {
      console.error("Fetch news error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPostDetail = async (postId) => {
    try {
      const res = await fetch(
        `https://api_gold.thinkdiff.us/view_detail_comment_post/${postId}`,
      );

      const json = await res.json();

      if (json) {
        const post = json.data_post || {};
        const comments = json.data || [];

        console.log(
          "Fetched post detail for postId:",
          postId,
          "Post title:",
          post.Content,
          "Comments count:",
          comments.length,
        );
        // gộp comment vào post để ModalNews dùng luôn
        const postData = {
          ...post,
          list_comment: comments,
        };

        setNewsSelect(postData);
        setIsShowModal(true);
      }
    } catch (error) {
      console.error("Fetch post detail error:", error);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      const pageToLoad = pageParam ? parseInt(pageParam) : 1;
      await fetchNews(pageToLoad);
    };
    fetch();

    (async () => {
      await logUserInfo("Màn hình Tin tức mới nhất");
    })();
  }, [pageParam]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  // Redirect if currentPage exceeds totalPages (invalid page)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      console.log(
        "Current page",
        currentPage,
        "exceeds totalPages",
        totalPages,
        "- redirecting to",
        totalPages,
      );
      navigate(`?page=${totalPages}`, { replace: true });
    }
  }, [currentPage, totalPages, navigate]);
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      navigate(`?page=${newPage}`);
    }
  };

  const handlePreviousPage = () => {
    const prevPage = Math.max(1, currentPage - 1);
    if (prevPage !== currentPage) {
      navigate(`?page=${prevPage}`);
    }
  };

  const handleNextPage = () => {
    const nextPage = Math.min(totalPages, currentPage + 1);
    if (nextPage !== currentPage) {
      navigate(`?page=${nextPage}`);
    }
  };

  useEffect(() => {
    if (!idPost) return;
    fetchPostDetail(idPost);
  }, [idPost]);

  // Cập nhật hiển thị khi đổi tab
  useEffect(() => {
    if (activeTab === "all") {
      setDisplayNews(news || []);
    } else {
      const found = categories.find(c => c.name === activeTab);
      if (found) setDisplayNews(found.list);
    }
  }, [activeTab, news, categories]);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    // Cuộn tab được chọn vào giữa view nếu cần (Swift effect)
    const el = document.getElementById(`tab-${tabName}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  // --- DRAG TO SCROLL LOGIC ---
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - tabsRef.current.offsetLeft);
    setScrollLeft(tabsRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - tabsRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll-fast factor
    tabsRef.current.scrollLeft = scrollLeft - walk;
  };

  const getPageNumbers = () => {
    const pages = [];
    const showMax = 7; // Number of pages to show at the start/end

    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 5) {
        // Show 1 2 3 4 5 6 7 ... 100
        for (let i = 1; i <= showMax; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 4) {
        // Show 1 ... 94 95 96 97 98 99 100
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - showMax + 1; i <= totalPages; i++) pages.push(i);
      } else {
        // Show 1 ... 10 11 12 13 14 ... 100
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const paginationUI = totalPages > 1 && (
    <div className="pagination-container">
      <button
        className="pagination-btn arrow"
        onClick={handlePreviousPage}
        disabled={currentPage === 1}
      >
        <span className="arrow-icon">←</span> {t("LastestNews.trang1")}
      </button>

      <div className="page-numbers">
        {getPageNumbers().map((p, idx) => (
          <button
            key={idx}
            className={`page-num-btn ${p === currentPage ? "active" : ""} ${p === "..." ? "ellipsis" : ""}`}
            onClick={() => typeof p === "number" && handlePageChange(p)}
            disabled={p === "..."}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        className="pagination-btn arrow"
        onClick={handleNextPage}
        disabled={currentPage >= totalPages}
      >
        {t("LastestNews.trangs")} <span className="arrow-icon">→</span>
      </button>
    </div>
  );

  return (
    <div className="containt-lastestnews">
      <div className="news-page-header">
        <h1 className="news-page-title">{t('menu.latestNews', 'Tin tức mới nhất')}</h1>
        <p className="news-page-subtitle">{t('home.newsDescription', 'PHÂN TÍCH THỊ TRƯỜNG VÀ DỮ LIỆU CÁ MẬP THỜI GIAN THỰC')}</p>
      </div>

      {/* SWIFT PAGE MENU (Tabs) */}
      <div className="swift-tabs-container">
        <div
          className="swift-tabs-scroll"
          ref={tabsRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <button
            id="tab-all"
            className={`swift-tab-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabClick('all')}
          >
            {t('common.all', 'Tất cả')}
          </button>
          {categories.map((cat, idx) => (
            <button
              key={idx}
              id={`tab-${cat.name}`}
              className={`swift-tab-item ${activeTab === cat.name ? 'active' : ''}`}
              onClick={() => handleTabClick(cat.name)}
            >
              {cat.name.replace(/_/g, ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div>
        {/* Pagination - Top */}
        {paginationUI}

        {/* Loading */}
        {(news === null || isLoading) && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>{t('common.loading', 'Đang tải ...')}</p>
          </div>
        )}

        {/* Có dữ liệu */}
        <div className="news-grid">
          {displayNews &&
            displayNews.length > 0 &&
            displayNews.map((item, index) => {
              const contentDisplay =
                i18n.language === "vi"
                  ? item.content_text_vi || item.content
                  : item.content;

              // Dùng post_db_id hoặc index làm key duy nhất
              const stateKey = item?.post_db_id || item?.PostID || index;

              return (
                <CardNews
                  key={`card-news-${item?.user_id}-${index}`}
                  data={{
                    ...item,
                    contentDisplay, // truyền content đã xử lý
                  }}
                  setIsShowModal={setIsShowModal}
                  currentPage={currentPage}
                  translateState={
                    translateStates[stateKey] || {
                      isTranslated: false,
                      translatedText: "",
                    }
                  }
                  setTranslateState={(newState) =>
                    setTranslateStates((prev) => ({
                      ...prev,
                      [stateKey]: newState,
                    }))
                  }
                />
              );
            })}
        </div>

        {/* Không có dữ liệu */}
        {news && news.length === 0 && !isLoading && (
          <p className="news-empty-text" style={{ color: "#94a3b8", textAlign: "center", marginTop: "40px" }}>
            {t('common.noData', 'Không có bài viết nào!')}
          </p>
        )}

        {/* Pagination - Bottom */}
        {paginationUI}
      </div>

      {isShowModal && (
        <ModalNews
          setIsShowModal={setIsShowModal}
          newsSelect={newsSelect}
          translateState={
            translateStates[
            newsSelect?.post_db_id || newsSelect?.PostID || "modal"
            ] || {
              isTranslated: false,
              translatedText: "",
            }
          }
          setTranslateState={(newState) => {
            const stateKey = newsSelect?.post_db_id || newsSelect?.PostID;
            if (stateKey) {
              setTranslateStates((prev) => ({
                ...prev,
                [stateKey]: newState,
              }));
            }
          }}
          lat={lat}
          long={long}
          fetchNews={fetchNews}
        />
      )}
    </div>
  );
}

export default LastestNews;
