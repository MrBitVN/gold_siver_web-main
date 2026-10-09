import React, { useState, useEffect } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import {
  Select,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  Empty,
  Spin,
  Button,
  Popover,
} from 'antd';
import { InfoCircleOutlined, HistoryOutlined, SyncOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { translateText } from '../services/translationService';
import ForexNews from './ForexNews';
import { safeJsonFetch } from '../utils/apiHelper';

const WHALE_API_URL = 'https://api_gold.thinkdiff.us/phantich_silver_history';

// Hàm hỗ trợ gọi JSONP lấy tin tức
const fetchJsonp = (url, params) => {
  return new Promise((resolve, reject) => {
    const callbackName = `cb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    window[callbackName] = (data) => {
      resolve(data);
      cleanup();
    };
    const queryString = new URLSearchParams({
      ...params,
      callback: callbackName,
      _: Date.now()
    }).toString();
    const script = document.createElement('script');
    script.src = `${url}?${queryString}`;
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
  });
};

const ListApi = () => {
  const { t, i18n } = useTranslation();
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [translatedImplication, setTranslatedImplication] = useState("");
  const [translatedAtrDescription, setTranslatedAtrDescription] = useState("");
  const [translatedReasons, setTranslatedReasons] = useState({});
  const [translatedRiskExp, setTranslatedRiskExp] = useState("");
  const [newsText, setNewsText] = useState(
    "Đang cập nhật tin tức thị trường từ CNFOL...",
  );
  const [refreshInterval, setRefreshInterval] = useState(30000); // Default 30s

  // 1. Logic Fetch Data
  const fetchData = async () => {
    try {
      const data = await safeJsonFetch(WHALE_API_URL);

      if (data && data.length > 0) {
        setApiData(data);
        // Chỉ cập nhật selectedIndex về bản mới nhất nếu người dùng chưa chọn xem lịch sử
        setSelectedIndex((prevIndex) =>
          prevIndex === null ? data.length - 1 : prevIndex,
        );
      }
    } catch (error) {
      console.error("Lỗi fetch data Whale Intelligence:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Fetch News từ CNFOL
  useEffect(() => {
    const fetchNews = async () => {
      try {
        let text = "";

        // 1. Thử gọi local Node proxy server
        try {
          const res = await fetch(`http://localhost:3005/api/cnfol-news`);
          if (res.ok) {
            text = await res.text();
          }
        } catch (localErr) {
          console.warn("Local proxy CNFOL news fetch failed, trying public CORS proxy fallback...", localErr.message);
        }

        // 2. Fallback sang public CORS proxy nếu local thất bại
        if (!text) {
          const targetUrl = `https://app.cnfol.com/dataapi/index.php/kuaixundata/golddata?num1=0&num2=15&strlen=25&cstrlen=200&_=${Date.now()}`;
          const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
          if (res.ok) {
            const proxyJson = await res.json();
            text = proxyJson.contents;
          }
        }

        if (text) {
          let json;
          const start = text.indexOf("[");
          const end = text.lastIndexOf("]") + 1;
          if (start >= 0 && end > start) {
            json = JSON.parse(text.substring(start, end));
          } else {
            json = JSON.parse(text);
          }

          if (json && Array.isArray(json)) {
            const titles = json.map((item) => `🔥 ${item.Title}`).join("   |   ");
            setNewsText(titles);
          }
        }
      } catch (error) {
        console.error("Lỗi fetch tin tức CNFOL:", error);
      }
    };
    fetchNews();
    const newsInterval = setInterval(fetchNews, refreshInterval); // Cập nhật theo interval chọn
    return () => clearInterval(newsInterval);
  }, [refreshInterval]);

  const getSignalLabel = (signal) => {
    const config = {
      "REAL MOVE": t("listApi.signal_real"),
      "WEAK CONFIRMATION": t("listApi.signal_weak"),
      "FAKE SIGNAL": t("listApi.signal_fake"),
      "NO SIGNAL": t("listApi.signal_none"),
    };
    return config[signal] || signal;
  };

  const getSignalTag = (signal) => {
    const colorMap = {
      "REAL MOVE": "green",
      "WEAK CONFIRMATION": "orange",
      "FAKE SIGNAL": "red",
      "NO SIGNAL": "default",
    };
    const color = colorMap[signal] || "default";
    const label = getSignalLabel(signal);
    return (
      <Tag color={color} style={{ fontWeight: "bold" }}>
        {label}
      </Tag>
    );
  };

  const translateWhale = (whale) => {
    const map = {
      BULLISH: t("listApi.bullish"),
      BEARISH: t("listApi.bearish"),
      NEUTRAL: t("listApi.neutral"),
    };
    return map[whale] || whale || t("listApi.na");
  };

  const translateEntry = (signal) => {
    const map = {
      WAIT: t("listApi.wait"),
      BUY: t("listApi.buy"),
      SELL: t("listApi.sell"),
    };
    return map[signal] || signal || t("listApi.wait");
  };

  const translateRisk = (risk) => {
    const map = {
      SAFE: t("listApi.safe"),
      MEDIUM: t("listApi.medium"),
      HIGH: t("listApi.highRisk"),
    };
    return map[risk] || risk || t("listApi.unknown");
  };

  const translateVolatility = (vol) => {
    const map = {
      HIGH: t("listApi.vol_high"),
      NORMAL: t("listApi.vol_normal"),
      LOW: t("listApi.vol_low"),
      MEDIUM: t("listApi.medium"),
    };
    return map[vol] || vol || t("listApi.vol_normal");
  };

  const getTrendIcon = (trend) => {
    if (trend === 'UP') return <span style={{ color: '#52c41a', marginLeft: '4px' }}>▲</span>;
    if (trend === 'DOWN') return <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>▼</span>;
    return null;
  };

  const currentData =
    apiData.length > 0
      ? apiData[selectedIndex] || apiData[apiData.length - 1]
      : null;
  const isHistory =
    selectedIndex !== null && selectedIndex !== apiData.length - 1;

  useEffect(() => {
    const implication = currentData?.market?.atr?.trading_implication;
    const description = currentData?.market?.atr?.description;
    const breakdown = currentData?.score?.breakdown || [];
    const riskExp =
      currentData?.trade?.risk_usd?.explanation ||
      currentData?.trade?.risk_usd?.description;

    const currentLang = i18n.language || "vi";

    if (currentLang.startsWith("vi")) {
      setTranslatedImplication(implication || "");
      setTranslatedAtrDescription(description || "");
      setTranslatedRiskExp(riskExp || "");
      const baseReasons = {};
      breakdown.forEach((item) => {
        baseReasons[item.reason] = item.reason;
      });
      setTranslatedReasons(baseReasons);
      return;
    }

    if (implication) {
      translateText(implication, currentLang)
        .then((res) => setTranslatedImplication(res))
        .catch(() => setTranslatedImplication(implication));
    }

    if (description) {
      translateText(description, currentLang)
        .then((res) => setTranslatedAtrDescription(res))
        .catch(() => setTranslatedAtrDescription(description));
    }

    if (riskExp) {
      translateText(riskExp, currentLang)
        .then((res) => setTranslatedRiskExp(res))
        .catch(() => setTranslatedRiskExp(riskExp));
    }

    if (breakdown.length > 0) {
      const reasonsToTranslate = breakdown.map((item) => item.reason);
      Promise.all(
        reasonsToTranslate.map((r) => translateText(r, currentLang)),
      ).then((translated) => {
        const newReasons = {};
        reasonsToTranslate.forEach((original, idx) => {
          newReasons[original] = translated[idx];
        });
        setTranslatedReasons(newReasons);
      });
    }
  }, [currentData, i18n.language]);

  if (loading && apiData.length === 0)
    return (
      <div className="flex justify-center p-10 bg-[#141414] rounded-lg">
        <Spin tip={t('listApi.loading')} size="large" />
      </div>
    );

  if (apiData.length === 0)
    return <Empty description={t('listApi.noData')} />;

  return (
    <div 
      className="text-gray-200 p-6 rounded-xl shadow-2xl font-sans"
      style={{ backgroundColor: '#141414', borderColor: '#333', borderWidth: '1px', borderStyle: 'solid' }}
    >
      {/* HEADER SECTION */}
      <div 
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 pb-4"
        style={{ borderBottom: '1px solid #333' }}
      >
        <div className="flex-shrink-0">
          <h2 className="text-xl font-extrabold text-yellow-500 uppercase tracking-wider flex items-center gap-2 m-0">
            {t('listApi.title')}
          </h2>
          <p className="text-gray-300 text-xs mt-1 flex items-center gap-1">
            <HistoryOutlined /> {t('listApi.lastUpdate')} <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{currentData?.time}</span>
            {isHistory && (
              <span className="text-red-400 font-bold ml-2">
                {t('listApi.viewingHistory')}
              </span>
            )}
          </p>
        </div>

        {/* SCROLLING TEXT (MARQUEE) */}
        <div className="flex-1 w-full lg:w-auto lg:mx-4 flex items-center marquee-container overflow-hidden bg-gray-900/50 rounded p-2 border border-gray-800">
           <div className="animate-marquee text-yellow-400 font-bold text-sm md:text-base tracking-wide whitespace-nowrap cursor-pointer hover:text-yellow-300 transition-colors">
              {newsText}
           </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 w-full lg:w-auto mt-4 lg:mt-0">
          <Button 
            type="primary" 
            icon={<SyncOutlined />} 
            onClick={fetchData} 
            loading={loading}
            className="bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500"
            style={{ backgroundColor: '#262626', borderColor: '#444' }}
          />
          <span className="text-sm text-gray-300">{t('listApi.selectHistory')}</span>
          <Select
            value={selectedIndex}
            onChange={setSelectedIndex}
            className="w-64 custom-dark-select"
            popupClassName="dark-dropdown"
          >
            {apiData
              .map((item, index) => (
                <Select.Option key={index} value={index}>
                  {item.time} - {getSignalLabel(item.signal_quality)}
                </Select.Option>
              ))
              .reverse()}
          </Select>
        </div>
      </div>

      {/* METRICS GRID */}
      <Row gutter={[16, 16]}>
        {/* Panel 1: Tín hiệu & Whale */}
        <Col xs={24} md={8}>
          <Card
            className="h-full"
            style={{ backgroundColor: '#1e1e1e', borderColor: '#333' }}
            bodyStyle={{ padding: '20px' }}
          >
            <div className="flex justify-between items-start mb-4">
              <span className="font-semibold text-sm uppercase" style={{ color: '#fff' }}>
                {t('listApi.systemSignal')}
              </span>
              {getSignalTag(currentData?.signal_quality)}
            </div>
            
            <Row gutter={16} className="mb-4">
              <Col span={12}>
                <Statistic
                  title={<span className="font-semibold" style={{ color: '#ccc' }}>{t('listApi.whaleSentiment')}</span>}
                  value={translateWhale(currentData?.etf_analysis?.whale)}
                  valueStyle={{ color: '#3498db', fontWeight: 'bold', fontSize: '16px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<span className="font-semibold" style={{ color: '#ccc' }}>{t('listApi.etfPrice')}</span>}
                  value={currentData?.etf_analysis?.etf?.value}
                  precision={2}
                  valueStyle={{ color: '#fff', fontSize: '16px' }}
                  suffix={getTrendIcon(currentData?.etf_analysis?.etf?.trend)}
                />
              </Col>
            </Row>

            <div className="mb-4">
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#ccc' }}>
                  <span>{t('listApi.etfChange')}</span>
                  <span style={{ color: currentData?.etf_analysis?.etf?.change_percent >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
                    {currentData?.etf_analysis?.etf?.change_percent > 0 ? '+' : ''}{currentData?.etf_analysis?.etf?.change_percent}%
                  </span>
               </div>
            </div>

            <Popover
              content={
                <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar" style={{ maxWidth: '350px' }}>
                  {currentData?.score?.breakdown?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #444' }}>
                      <span style={{ color: '#fff', fontSize: '14px' }}>
                        {translatedReasons[item.reason] || item.reason}
                      </span>
                      <span style={{ color: '#eab308', fontWeight: 'bold', fontSize: '14px', marginLeft: '15px', whiteSpace: 'nowrap' }}>
                        {item.point > 0 ? '+' : ''}{item.point}
                      </span>
                    </div>
                  )) || <span style={{ color: '#9ca3af', fontSize: '14px' }}>{t('listApi.noBreakdown')}</span>}
                </div>
              }
              title={<span style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', paddingBottom: '8px', display: 'block', borderBottom: '1px solid #444' }}>{t('listApi.scoreBreakdown')}</span>}
              trigger="click"
              placement="bottom"
              color="#262626"
              overlayInnerStyle={{ borderColor: '#444', borderWidth: '1px' }}
            >
              <div className="p-3 rounded-lg cursor-pointer transition-colors duration-200" style={{ backgroundColor: '#262626' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#262626'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ color: '#ccc' }}>{t('listApi.score')}</span>
                  <span className="text-2xl font-bold" style={{ color: '#ff4d4f', marginLeft: '15px' }}>
                    {currentData?.score?.value || 0}
                  </span>
                </div>
              </div>
            </Popover>
          </Card>
        </Col>

        {/* Panel 2: Market & Volatility */}
        <Col xs={24} md={8}>
          <Card
            className="h-full"
            style={{ backgroundColor: '#1e1e1e', borderColor: '#333' }}
            bodyStyle={{ padding: '20px' }}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-sm uppercase" style={{ color: '#fff' }}>
                {t('listApi.marketIndex')}
              </span>
              <Tooltip title={translatedAtrDescription}>
                <InfoCircleOutlined style={{ color: '#ccc', cursor: 'help' }} />
              </Tooltip>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={<span className="font-semibold" style={{ color: '#ccc' }}>{t('listApi.silverPrice')}</span>}
                  value={currentData?.market?.price}
                  precision={2}
                  valueStyle={{ color: '#fff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<span className="font-semibold" style={{ color: '#ccc' }}>{t('listApi.dxyValue')}</span>}
                  value={currentData?.etf_analysis?.dxy?.value}
                  precision={2}
                  valueStyle={{ color: '#fff' }}
                  suffix={getTrendIcon(currentData?.etf_analysis?.dxy?.trend)}
                />
              </Col>
            </Row>

            <div className="mt-4 grid grid-cols-2 gap-4">
               <div>
                  <div className="text-[10px] text-gray-400 uppercase">{t('listApi.ma50')}</div>
                  <div className="text-sm font-bold text-blue-400">{currentData?.market?.ma50 || 'N/A'}</div>
               </div>
               <div>
                  <div className="text-[10px] text-gray-400 uppercase">{t('listApi.ma200')}</div>
                  <div className="text-sm font-bold text-purple-400">{currentData?.market?.ma200 || 'N/A'}</div>
               </div>
            </div>

            <div className="mt-6">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold uppercase" style={{ color: '#ccc' }}>
                  {t('listApi.volatility')}
                </span>
                <Tag
                  color={
                    currentData?.market?.atr?.volatility_level === 'HIGH'
                      ? 'red'
                      : 'green'
                  }
                >
                  {translateVolatility(currentData?.market?.atr?.volatility_level)}
                </Tag>
              </div>
              <p className="text-xs leading-relaxed italic line-clamp-2" style={{ color: '#ccc' }}>
                {translatedAtrDescription || t('listApi.loadingAnalysis')}
              </p>
            </div>
          </Card>
        </Col>

        {/* Panel 3: Gợi ý Giao dịch */}
        <Col xs={24} md={8}>
          <Card
            className="h-full"
            style={{ backgroundColor: '#1e1e1e', borderColor: '#333' }}
            bodyStyle={{ padding: '20px' }}
          >
            <span className="font-semibold text-sm uppercase block mb-4" style={{ color: '#fff' }}>
              {t('listApi.tradingRecommendation')}
            </span>
            <div className="flex items-center gap-4 mb-6">
              <div className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.5)' }}>
                <span className="text-green-500 font-bold text-lg" style={{ color: '#22c55e' }}>
                  {translateEntry(currentData?.trade?.entry_signal)}
                </span>
              </div>
              <div>
                <Tooltip title={translatedRiskExp}>
                  <div className="text-xs" style={{ color: '#ccc', cursor: 'help' }}>
                    {t('listApi.riskLevel')} <InfoCircleOutlined style={{ fontSize: '10px' }} />
                  </div>
                </Tooltip>
                <div
                  className={`font-bold ${currentData?.trade?.risk_usd?.level === 'SAFE' ? 'text-green-500' : 'text-orange-500'}`}
                  style={{ color: currentData?.trade?.risk_usd?.level === 'SAFE' ? '#22c55e' : '#f97316' }}
                >
                  {translateRisk(currentData?.trade?.risk_usd?.level)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Popover
                content={
                  <div style={{ maxWidth: '300px', minWidth: '220px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #444' }}>
                      <span style={{ color: '#fff', fontSize: '14px' }}>{t('listApi.stoplossShort')}</span>
                      <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '14px', marginLeft: '15px' }}>
                        {currentData?.market?.atr?.suggested_stoploss?.['1x_atr'] || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #444' }}>
                      <span style={{ color: '#fff', fontSize: '14px' }}>{t('listApi.stoplossStandard')}</span>
                      <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '14px', marginLeft: '15px' }}>
                        {currentData?.market?.atr?.suggested_stoploss?.['1_5x_atr'] || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <span style={{ color: '#fff', fontSize: '14px' }}>{t('listApi.stoplossWide')}</span>
                      <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '14px', marginLeft: '15px' }}>
                        {currentData?.market?.atr?.suggested_stoploss?.['2x_atr'] || 'N/A'}
                      </span>
                    </div>
                  </div>
                }
                title={<span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', paddingBottom: '8px', display: 'block', borderBottom: '1px solid #444' }}>{t('listApi.stoplossDetail')}</span>}
                trigger="click"
                placement="bottom"
                color="#262626"
                overlayInnerStyle={{ borderColor: '#444', borderWidth: '1px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderRadius: '4px', backgroundColor: '#262626', marginBottom: '12px', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#262626'}>
                  <span className="text-xs" style={{ color: '#ccc' }}>
                    {t('listApi.stoploss')}
                  </span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>
                    {currentData?.trade?.stoploss || '0.00'}
                  </span>
                </div>
              </Popover>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderRadius: '4px', backgroundColor: '#262626' }}>
                <span className="text-xs" style={{ color: '#ccc' }}>{t('listApi.positionSize')}</span>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>
                  {currentData?.trade?.position_size || '0'}%
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* FOOTER DETAIL */}
      <div 
        className="mt-6 p-4 rounded-lg"
        style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
      >
        <h4 className="font-semibold text-xs uppercase mb-2 flex items-center gap-2" style={{ color: '#fff' }}>
          <InfoCircleOutlined /> {t('listApi.tradingImplication')}
        </h4>
        <p className="text-sm leading-loose whitespace-pre-line font-light italic" style={{ color: '#ccc' }}>
          {translatedImplication || t('listApi.loadingAnalysis')}
        </p>
      </div>

      {/* DETAILED NEWS SECTION */}
      <div className="mt-8">
        <ForexNews />
      </div>

      {/* CSS STYLES */}
      <style>{`
        .custom-dark-select .ant-select-selector {
          background-color: #262626 !important;
          border-color: #444 !important;
          color: #eee !important;
        }
        .dark-dropdown {
          background-color: #262626 !important;
          border: 1px solid #444 !important;
        }
        .dark-dropdown .ant-select-item {
          color: #ccc !important;
        }
        .dark-dropdown .ant-select-item-option-active {
          background-color: #333 !important;
        }
        .ant-statistic-title {
          color: #ccc !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
        }

        .marquee-container {
          width: 100%;
          overflow: hidden;
          white-space: nowrap;
          box-sizing: border-box;
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
          0%   { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #262626; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #555; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #777; 
        }
      `}</style>
    </div>
  );
};

export default ListApi;
