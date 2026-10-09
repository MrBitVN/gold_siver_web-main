// newsHistoryUtils.js
export const saveReadNews = (news) => {
  try {
    const saved = localStorage.getItem("read_news_history");
    const history = saved ? JSON.parse(saved) : [];

    // Tránh lưu trùng
    if (!history.find(item => item.id === news.id)) {
      history.unshift({
        id: news.id,
        title: news.title,
        link: news.link,
        author: news.author,
        content: news.Content,
        timestamp: new Date().toISOString(),

      });
      localStorage.setItem("read_news_history", JSON.stringify(history));
    }
  } catch (err) {
    console.error("Lỗi lưu lịch sử tin đã đọc:", err);
  }
};

export const getReadNewsHistory = () => {
  const saved = localStorage.getItem("read_news_history");
  return saved ? JSON.parse(saved) : [];
};