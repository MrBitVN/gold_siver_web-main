import React, { useEffect, useState, useCallback, useRef } from "react";
import { Spin, Empty } from "antd";
import { FileTextOutlined, ClockCircleOutlined, LinkOutlined, SyncOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { translateText } from "../services/translationService";
import "./GoldData.css";

const PROXIES = [
  "https://api.codetabs.com/v1/proxy?quest=",
  "https://thingproxy.freeboard.io/fetch/"
];

// Pure JSONP fetch - Most robust for this specific API
const fetchJsonp = (url, params) => {
  return new Promise((resolve, reject) => {
    const callbackName = `cb_gold_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
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

const NewsItem = ({ item, currentLang }) => {
  const [translatedContent, setTranslatedContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const raw = decodeUnicode(item.Content || "");

    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    const imgs = [];
    while ((match = imgRegex.exec(raw)) !== null) {
      imgs.push(match[1]);
    }
    if (item.Thumb) imgs.push(item.Thumb);
    if (item.Thumb2) imgs.push(item.Thumb2);
    setImages([...new Set(imgs)]);

    const text = raw.replace(/<[^>]+>/g, "").trim();
    if (!text) return;

    if (currentLang === "zh" || currentLang === "cn") {
      setTranslatedContent(text);
      return;
    }

    setLoading(true);
    translateText(text, currentLang)
      .then((res) => {
        if (mounted) setTranslatedContent(res);
      })
      .catch(() => {
        if (mounted) setTranslatedContent(text);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => (mounted = false);
  }, [item, currentLang]);

  return (
    <div className="news-card">
      <div className="news-card-main">
        <div className="news-card-text-side">
          <div className="news-time-dot"></div>
          {loading ? (
            <div className="news-text-loading">Đang dịch...</div>
          ) : (
            <div className="news-text">{translatedContent}</div>
          )}
        </div>
        
        {images.length > 0 && (
          <div className="news-card-image-side">
            {images.map((img, i) => (
              <img key={i} src={img} alt="" onError={(e) => e.target.style.display = 'none'} />
            ))}
          </div>
        )}
      </div>
      
      <div className="news-card-footer">
        <a href={item.Url} target="_blank" rel="noreferrer" className="news-source">Nguồn: CNFOL</a>
        <div className="news-time">{item.displayTime}</div>
      </div>
    </div>
  );
};

export default function GoldData() {
  const { i18n } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [refreshInterval, setRefreshInterval] = useState(60000); // Default 1m
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
      setData([]); 
    }
    try {
      let endpoint = "kuainewse";
      if (activeTab === "gold") endpoint = "golddata";
      else if (activeTab === "forex") endpoint = "forexdata";

      const fetchParams = {
        num1: 0,
        num2: 100, // Increased for better coverage
        strlen: 25,
        cstrlen: 200,
        _ : Date.now()
      };

      const url = `http://app.cnfol.com/dataapi/index.php/kuaixundata/${endpoint}`;
      const json = await fetchWithFallback(url, fetchParams, endpoint);
      
      if (json && Array.isArray(json)) {
        const list = json.map((item) => {
          const dateStr = item.DTime || "";
          const timeStr = item.CreatedTime || item.CTime || "00:00:00";
          const normalizedDate = dateStr.replace(/\//g, '-');
          let ts = null;
          if (item.Addtime) {
            ts = new Date(parseInt(item.Addtime) * 1000);
          } else if (normalizedDate && timeStr) {
            const fullTime = timeStr.includes(":") && timeStr.split(":").length === 2 ? timeStr + ":00" : timeStr;
            ts = new Date(`${normalizedDate}T${fullTime}+08:00`);
          } else {
            ts = new Date();
          }
          if (isNaN(ts.getTime())) ts = new Date();

          return {
            ...item,
            timestamp: ts,
            displayTime: ts.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
          };
        });

        setData(prev => {
          const combined = [...list, ...prev];
          const unique = new Map();
          combined.forEach(item => {
            const uid = item.ContId || item.Id || item.Url || Math.random();
            if (!unique.has(uid)) {
              unique.set(uid, item);
            }
          });
          return Array.from(unique.values()).sort((a, b) => b.timestamp - a.timestamp);
        });
      }
    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
    const t = setInterval(() => fetchData(true), refreshInterval);
    return () => clearInterval(t);
  }, [fetchData, refreshInterval]);

  const { t } = useTranslation();
  const currentLang = i18n.language || "vi";

  const categorizeData = (dataList) => {
    const nowData = [];
    const fiveMinData = [];
    const tenMinData = [];
    const hourData = [];
    const now = new Date();

    dataList.forEach(item => {
      const diffMins = Math.floor((now - item.timestamp) / 60000);
      if (diffMins < 5) nowData.push(item);
      else if (diffMins < 10) fiveMinData.push(item);
      else if (diffMins < 60) tenMinData.push(item);
      else hourData.push(item);
    });

    return { nowData, fiveMinData, tenMinData, hourData };
  };

  const { nowData, fiveMinData, tenMinData, hourData } = categorizeData(data);

  return (
    <div className="gold-data-container compact">
      <div className="gold-data-header-clean">
        <ClockCircleOutlined /> <span className="title">{t('ForexNews.title') || "Tin Tức Thị Trường 24h"}</span>
      </div>

      <div className="custom-tabs">
        <div className={`custom-tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
          {t('ForexNews.tabs.all') || "Tất cả"}
        </div>
        <div className={`custom-tab ${activeTab === "forex" ? "active" : ""}`} onClick={() => setActiveTab("forex")}>
          {t('ForexNews.tabs.forex') || "Ngoại hối"}
        </div>
        <div className={`custom-tab ${activeTab === "gold" ? "active" : ""}`} onClick={() => setActiveTab("gold")}>
          {t('ForexNews.tabs.gold') || "Vàng"}
        </div>
      </div>

      <div className="gold-data-refresh-controls">
        <span className="last-updated-text">
          {t('ForexNews.lastUpdated') || "Cập nhật lúc:"} {lastUpdated.toLocaleTimeString(currentLang === 'lo' ? 'lo-LA' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div className="refresh-buttons">
          <button className="refresh-btn now" onClick={() => fetchData()}>
             <SyncOutlined spin={loading} /> {t('ForexNews.now') || "Bây giờ"}
          </button>
        </div>
      </div>

      <div className="timeline-container custom-scrollbar">
        {loading && data.length === 0 ? (
          <div className="loading-area"><Spin /></div>
        ) : (
          <>
            {nowData.length > 0 && (
              <div className="timeline-group">
                <div className="timeline-group-header">{t('ForexNews.now') || "Bây giờ"}</div>
                {nowData.map((item, index) => <NewsItem key={item.ContId || index} item={item} currentLang={currentLang} />)}
              </div>
            )}
            {fiveMinData.length > 0 && (
              <div className="timeline-group">
                <div className="timeline-group-header">{t('ForexNews.fiveMinAgo') || "5 phút trước"}</div>
                {fiveMinData.map((item, index) => <NewsItem key={item.ContId || index} item={item} currentLang={currentLang} />)}
              </div>
            )}
            {tenMinData.length > 0 && (
              <div className="timeline-group">
                <div className="timeline-group-header">{t('ForexNews.tenMinAgo') || "10 phút trước"}</div>
                {tenMinData.map((item, index) => <NewsItem key={item.ContId || index} item={item} currentLang={currentLang} />)}
              </div>
            )}
            {hourData.length > 0 && (
              <div className="timeline-group">
                <div className="timeline-group-header">{t('ForexNews.hourly') || "Từng giờ"}</div>
                {hourData.map((item, index) => <NewsItem key={item.ContId || index} item={item} currentLang={currentLang} />)}
              </div>
            )}
            {data.length === 0 && !loading && <Empty description={t('ForexNews.noData') || "Không có dữ liệu"} />}
          </>
        )}
      </div>
    </div>
  );
}