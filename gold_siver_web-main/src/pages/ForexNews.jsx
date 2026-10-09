import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Spin, Empty } from "antd";
import { FileTextOutlined, ClockCircleOutlined, LinkOutlined, SyncOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { translateText } from "../services/translationService";
import "./ForexNews.css";

const PROXIES = [
  "https://api.codetabs.com/v1/proxy?quest=",
  "https://thingproxy.freeboard.io/fetch/"
];

// Robust JSONP fetcher
const fetchJsonp = (url, params) => {
  return new Promise((resolve, reject) => {
    const callbackName = `cb_forex_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    window[callbackName] = (data) => {
      resolve(data);
      cleanup();
    };
    const query = new URLSearchParams(params).toString();
    const script = document.createElement('script');
    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}callback=${callbackName}&${query}`;
    script.id = callbackName;
    script.onerror = () => {
      reject(new Error(`JSONP request failed`));
      cleanup();
    };
    const cleanup = () => {
      delete window[callbackName];
      const s = document.getElementById(callbackName);
      if (s) document.body.removeChild(s);
    };
    document.body.appendChild(script);
    setTimeout(() => {
      cleanup();
      reject(new Error("JSONP Timeout"));
    }, 8000);
  });
};

async function fetchWithFallback(targetUrl, params, endpoint) {
  try {
    const baseUrl = `http://app.cnfol.com/dataapi/index.php/kuaixundata/${endpoint}`;
    const data = await fetchJsonp(baseUrl, params);
    if (data) return data;
  } catch (e) {
    console.warn("Direct JSONP failed, trying proxies...");
  }

  for (const proxy of PROXIES) {
    try {
      const fullUrl = `${targetUrl}&callback=cb`;
      const url = proxy.includes("allorigins")
        ? `${proxy}${encodeURIComponent(fullUrl)}`
        : `${proxy}${fullUrl}`;

      const res = await fetch(url);
      if (!res.ok) continue;

      let text = "";
      if (proxy.includes("allorigins")) {
        const json = await res.json();
        text = json.contents;
      } else {
        text = await res.text();
      }

      if (text) {
        const match = text.match(/\[.*\]/s);
        if (match) return JSON.parse(match[0]);
        return JSON.parse(text);
      }
    } catch (e) {
      console.warn(`Proxy ${proxy} failed`);
    }
  }
  throw new Error("All methods failed");
}

function decodeUnicode(str = "") {
  if (!str) return "";
  try {
    return str.replace(/\\u([\d\w]{4})/gi, (match, grp) => {
      return String.fromCharCode(parseInt(grp, 16));
    });
  } catch {
    return str;
  }
}

const NewsItem = React.memo(({ item, currentLang }) => {
  const { t } = useTranslation();
  const [translatedContent, setTranslatedContent] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [images, setImages] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const rawContent = decodeUnicode(item.Content || item.content || "");

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    const extractedImages = [];
    while ((match = imgRegex.exec(rawContent)) !== null) {
      extractedImages.push(match[1]);
    }
    if (item.Thumb) extractedImages.push(item.Thumb);
    if (item.Thumb2) extractedImages.push(item.Thumb2);
    if (Array.isArray(item.images)) {
      item.images.forEach(img => extractedImages.push(img));
    }

    if (isMounted) setImages([...new Set(extractedImages)]);

    const strippedContent = rawContent.replace(/<[^>]+>/g, "").trim();

    if (!strippedContent) {
      setTranslatedContent("");
      return;
    }

    if (currentLang === "zh" || currentLang === "cn") {
      if (isMounted) {
        setTranslatedContent(strippedContent);
        setIsTranslating(false);
      }
      return;
    }

    setIsTranslating(true);
    translateText(strippedContent, currentLang)
      .then(res => {
        if (isMounted) {
          setTranslatedContent(res);
          setIsTranslating(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTranslatedContent(strippedContent);
          setIsTranslating(false);
        }
      });

    return () => { isMounted = false; };
  }, [item.Content, currentLang]);

  return (
    <div className="forex-news-item">
      <div className="news-card-main">
        <div className="news-card-text-side">
          <div className="forex-news-item-time">{item.displayTime}</div>
          {isTranslating ? (
            <div className="forex-news-skeleton">
              <div className="skeleton-line full"></div>
            </div>
          ) : (
            <div className="forex-news-item-content">
              {translatedContent}
            </div>
          )}
        </div>

        {images.length > 0 && !isTranslating && (
          <div className="news-card-image-side">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="news"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="forex-news-item-footer">
        <a href={item.Url || item.url} target="_blank" rel="noreferrer" className="forex-news-link">
          <LinkOutlined /> {t('ForexNews.originalText') || "Bản gốc"}
        </a>
      </div>
    </div>
  );
});

export default function ForexNews() {
  const { i18n, t } = useTranslation();
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState("gold");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const fetchInProgress = useRef(false);
  const rawDataRef = useRef([]);

  const fetchData = useCallback(async (isSilent = false, currentOffset = 0) => {
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    if (currentOffset === 0) {
      setLoading(prev => {
        if (!isSilent && rawDataRef.current.length === 0) return true;
        return prev;
      });
    } else {
      setLoadingMore(true);
    }

    let nextData = [];

    // XÁC ĐỊNH URL DỰA TRÊN TAB ĐANG CHỌN VÀ OFFSET
    const limit = 20;
    let apiUrl = `https://api_gold.thinkdiff.us/all_tintuc_cnfol/${currentOffset}/${limit}`;
    if (activeTab === "gold") apiUrl = `https://api_gold.thinkdiff.us/gold_cnfol/${currentOffset}/${limit}`;
    else if (activeTab === "forex") apiUrl = `https://api_gold.thinkdiff.us/forex_cnfol/${currentOffset}/${limit}`;

    try {
      const res = await fetch(apiUrl);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json)) {
          if (json.length < limit) setHasMore(false);
          else setHasMore(true);

          nextData = json.map(item => {
            const itemTime = item.Time || item.time || "";
            let ts = null;
            if (itemTime) {
              // CNFOL API returns Beijing Time (+8) but often labels it as GMT or has no label.
              // We force it to +0800 so the browser can convert it to local time (VN +7).
              let timeStr = itemTime.replace(/-/g, '/');
              if (timeStr.includes('GMT')) {
                timeStr = timeStr.replace('GMT', '+0800');
              } else if (!timeStr.includes('+') && !timeStr.includes('Z')) {
                timeStr += ' +0800';
              }
              ts = new Date(timeStr);
            } else {
              ts = new Date();
            }
            if (isNaN(ts.getTime())) ts = new Date();
            return {
              ...item,
              timestamp: ts,
              displayTime: ts.toLocaleTimeString(i18n.language === 'lo' ? 'lo-LA' : 'vi-VN', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
              })
            };
          });
        }
      }
    } catch (e) {
      console.warn(`User API (${activeTab}) failed`);
    }

    if (nextData.length > 0) {
      if (currentOffset === 0) {
        setRawData(nextData);
        rawDataRef.current = nextData;
      } else {
        setRawData(prev => {
          const combined = [...prev, ...nextData];
          // Remove duplicates based on ID or content
          const unique = Array.from(new Map(combined.map(item => [item.ContId || item.id || item.time, item])).values());
          return unique.sort((a, b) => b.timestamp - a.timestamp);
        });
      }
    }

    setLoading(false);
    setLoadingMore(false);
    fetchInProgress.current = false;
    setLastUpdated(new Date());
  }, [i18n.language, activeTab]);

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    fetchData(false, 0);
  }, [activeTab, fetchData]);

  const handleLoadMore = () => {
    const nextOffset = offset + 20;
    setOffset(nextOffset);
    fetchData(false, nextOffset);
  };

  const filteredData = useMemo(() => {
    if (activeTab === "all") return rawData;

    const goldKeywords = [
      "gold", "vàng", "黄金", "金", "xau", "xag", "bạc", "silver", "白银", "银",
      "kim loại quý", "precious metal"
    ];
    const forexKeywords = [
      "forex", "ngoại hối", "外汇", "usd", "eur", "jpy", "gbp", "fed", "lãi suất", "tỷ giá", "dxy",
      "lạm phát", "cpi", "pce", "nfp", "bảng lương", "phi nông nghiệp", "thất nghiệp", "đô la",
      "bank", "ngân hàng", "central bank", "ecb", "boj", "boe", "rba", "powell", "lagarde",
      "yên", "bảng", "tệ", "汇率", "美元", "欧元", "日元", "英镑", "美联储", "利率", "通胀",
      "非农", "失业", "央行", "美元指数", "经济", "市场", "macro", "vĩ mô", "gdp", "pmi"
    ];

    return rawData.filter(item => {
      const title = (item.Title || item.title || "").toLowerCase();
      const content = (item.Content || item.content || "").toLowerCase();
      const text = title + " " + content;

      if (activeTab === "gold") {
        return goldKeywords.some(kw => text.includes(kw));
      } else if (activeTab === "forex") {
        return forexKeywords.some(kw => text.includes(kw));
      }
      return true;
    });
  }, [rawData, activeTab]);

  const currentLang = i18n.language || "vi";

  const { nowData, fiveMinData, tenMinData, hourData } = useMemo(() => {
    const nowData = [];
    const fiveMinData = [];
    const tenMinData = [];
    const hourData = [];
    const now = new Date();

    filteredData.forEach(item => {
      const diffMins = Math.floor((now - item.timestamp) / 60000);
      if (diffMins < 5) nowData.push(item);
      else if (diffMins < 10) fiveMinData.push(item);
      else if (diffMins < 60) tenMinData.push(item);
      else hourData.push(item);
    });

    return { nowData, fiveMinData, tenMinData, hourData };
  }, [filteredData]);

  return (
    <div className="forex-news-container compact">
      <div className="forex-news-header">
        <div className="forex-news-title-area">
          <ClockCircleOutlined /> <span>{t('ForexNews.title', 'TIN TỨC THỊ TRƯỜNG 24H')}</span>
        </div>
        <div className="forex-news-header-tabs">
          <div className={`forex-news-tab ${activeTab === "gold" ? "active" : ""}`} onClick={() => setActiveTab("gold")}>
            {t('ForexNews.tabs.gold', 'Vàng')}
          </div>
          <div className={`forex-news-tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
            {t('ForexNews.tabs.all', 'Tất cả')}
          </div>
          <div className={`forex-news-tab ${activeTab === "forex" ? "active" : ""}`} onClick={() => setActiveTab("forex")}>
            {t('ForexNews.tabs.forex', 'Ngoại hối')}
          </div>
        </div>

        <div className="forex-news-refresh-controls">
          <span className="last-updated-text">
            {t('ForexNews.lastUpdated', 'Cập nhật lúc:')} {lastUpdated.toLocaleTimeString(currentLang === 'lo' ? 'lo-LA' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="refresh-buttons">
            <button className="refresh-btn now" onClick={() => fetchData()}>
              <SyncOutlined spin={loading} /> {t('ForexNews.now', 'Bây giờ')}
            </button>
          </div>
        </div>
      </div>

      <div className="forex-news-list custom-scrollbar">
        {loading && filteredData.length === 0 ? (
          <div className="forex-news-loading"><Spin size="large" /></div>
        ) : (
          <>
            {nowData.length > 0 && (
              <div className="timeline-group-forex">
                <div className="forex-news-time-divider"><span>{t('ForexNews.now', 'Bây giờ')}</span></div>
                {nowData.map(item => <NewsItem key={item.ContId || item.id} item={item} currentLang={currentLang} />)}
              </div>
            )}
            {fiveMinData.length > 0 && (
              <div className="timeline-group-forex">
                <div className="forex-news-time-divider"><span>{t('ForexNews.fiveMinAgo', '5 phút trước')}</span></div>
                {fiveMinData.map(item => <NewsItem key={item.ContId || item.id} item={item} currentLang={currentLang} />)}
              </div>
            )}
            {tenMinData.length > 0 && (
              <div className="timeline-group-forex">
                <div className="forex-news-time-divider"><span>{t('ForexNews.tenMinAgo', '10 phút trước')}</span></div>
                {tenMinData.map(item => <NewsItem key={item.ContId || item.id} item={item} currentLang={currentLang} />)}
              </div>
            )}
            {hourData.length > 0 && (
              <div className="timeline-group-forex">
                <div className="forex-news-time-divider"><span>{t('ForexNews.hourly', 'Từng giờ')}</span></div>
                {hourData.map(item => <NewsItem key={item.ContId || item.id} item={item} currentLang={currentLang} />)}
              </div>
            )}

            {hasMore && (
              <div className="forex-news-load-more">
                <button
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? <SyncOutlined spin /> : (t('multichart.loadMore', 'Xem thêm'))}
                </button>
              </div>
            )}
          </>
        )}
        {!loading && filteredData.length === 0 && (
          <div className="forex-news-empty"><Empty description={t('ForexNews.noData', 'Không có dữ liệu')} /></div>
        )}
      </div>
    </div>
  );
}