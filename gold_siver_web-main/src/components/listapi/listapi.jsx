import React, { useState, useEffect, useMemo } from 'react';
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
import './listapi.css';
import { translateText } from '../../services/translationService';
import ForexNews from '../../pages/ForexNews';
import { safeJsonFetch, getProxyUrl } from '../../utils/apiHelper';


const WHALE_API_URL = 'https://api_gold.thinkdiff.us/phantich_silver_history';

const formatToVNTime = (timeStr, lang = 'vi-VN') => {
  if (!timeStr) return '';
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    const locale = lang === 'en' ? 'en-US' : (lang === 'vi' ? 'vi-VN' : lang);
    return date.toLocaleString(locale, {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).replace(/\//g, '-');
  } catch (e) {
    return timeStr;
  }
};

export default function ListApi() {
  const { t, i18n } = useTranslation();

  // Fixed formatter to prevent breaking HTML tags when highlighting
  const highlightText = (text) => {
    if (!text) return '';

    let formatted = text;

    // 0. Handle newlines and problematic characters
    formatted = formatted.replace(/\n/g, '<br/>');
    // Strip or replace problematic symbols (including broken encoding ones)
    formatted = formatted.replace(/[◆◇◊\uFFFD\u25C6\u25C7\u25CA]/g, '•');

    // 1. Filter out redundant logic lines that are already in the UI badges
    const redundantPatterns = [
      /ATR.*?cao.*?stop.*?rộng.*?size.*?giảm/i,
      /ATR.*?thấp.*?vào.*?lệnh.*?lớn/i,
      /ATR.*?cao.*?SL.*?rộng.*?Size.*?nhỏ/i,
      /ATR.*?thấp.*?SL.*?ngắn.*?Size.*?lớn/i,
      /Trong trading:/i,
      /- Stoploss.*?/i,
      /- Stop rộng.*?/i
    ];

    let lines = formatted.split('<br/>');
    lines = lines.filter(line => {
      const isRedundant = redundantPatterns.some(pattern => pattern.test(line));
      return !isRedundant && line.trim() !== '';
    });
    formatted = lines.join('<br/>');

    // 2. Initial structural formatting - Compact mode
    formatted = formatted.replace(/ - /g, '<br/>• ');
    formatted = formatted.replace(/([📦👉📊💰🧠•])/g, '<br/>$1');

    // 3. Highlight Logic Operators
    formatted = formatted.replace(/(=>|->|➔)/g, '<span style="color: #00f2ff; font-weight: bold;">$1</span>');

    // 4. Highlight specific labels (Yellow)
    formatted = formatted.replace(/([\p{Lu}\s]{3,}:)/gu, '<span style="color: #ffd700; font-weight: 800;">$1</span>');

    // 5. Highlight numbers, percentages, and decimals
    formatted = formatted.replace(/(<[^>]+>)|(\d+(\.\d+)?%?)/g, (match, tag, num) => {
      if (tag) return tag;
      return `<span style="color: #ff4d4f; font-weight: 800;">${num}</span>`;
    });

    // 6. Final cleanup of excessive breaks
    return formatted.replace(/^(<br\/>)+|(<br\/>)+$/g, '').replace(/(<br\/>){2,}/g, '<br/>');
  };

  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [translatedImplication, setTranslatedImplication] = useState('');
  const [translatedAtrDescription, setTranslatedAtrDescription] = useState('');
  const [translatedRiskExp, setTranslatedRiskExp] = useState('');
  const [translatedComexExplain, setTranslatedComexExplain] = useState('');
  const [translatedVolAnalysis, setTranslatedVolAnalysis] = useState('');
  const [translatedSgeBehavior, setTranslatedSgeBehavior] = useState('');
  const [translatedSmartMoneyExplain, setTranslatedSmartMoneyExplain] = useState('');
  const [translatedSqueezeExplain, setTranslatedSqueezeExplain] = useState('');
  const [translatedInterestRateAnalysis, setTranslatedInterestRateAnalysis] = useState('');
  const [translatedSignalWarning, setTranslatedSignalWarning] = useState('');
  const [translatedForecast, setTranslatedForecast] = useState('');

  const [refreshInterval, setRefreshInterval] = useState(30000); // Default 30s
  const [dailyPredictions, setDailyPredictions] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);


  // 1. Logic Fetch Data
  const fetchData = async () => {
    try {
      const data = await safeJsonFetch(WHALE_API_URL);

      if (data && data.length > 0) {
        setApiData(data);
        // Only update selectedIndex to newest if user hasn't manually selected history
        setSelectedIndex((prevIndex) => {
          // Initial load
          if (prevIndex === null) return data.length - 1;
          // If we were at the end of the previous list, stay at the end of the new list
          if (prevIndex === apiData.length - 1) return data.length - 1;
          // Otherwise, the user manually selected a history item, so stay on that index
          return prevIndex;
        });
      }
    } catch (error) {
      console.error('Whale Intelligence fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyPredictions = async () => {
    try {
      setDailyLoading(true);
      const response = await fetch(getProxyUrl('https://api_gold.thinkdiff.us/get_all_predict_30day'));
      const data = await response.json();

      // Determine asset based on WHALE_API_URL - check endpoint instead of domain
      const isGold = WHALE_API_URL.includes('phantich_gold_history');
      const list = isGold ? data.list_data_pro_gold : data.list_data_pro_silver;

      if (list && list.length > 0) {
        // Get the latest batch
        const latestTime = [...new Set(list.map(item => item.time_make_ai_predict))]
          .sort((a, b) => new Date(b) - new Date(a))[0];

        const filtered = list.filter(item => item.time_make_ai_predict === latestTime)
          .sort((a, b) => new Date(a.target_date) - new Date(b.target_date));

        // Get today and next 7 days - Use local date to match user's perspective
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const next7Days = filtered.filter(item => item.target_date >= today).slice(0, 7);

        setDailyPredictions(next7Days);
      }
    } catch (error) {
      console.error('Error fetching daily predictions:', error);
    } finally {
      setDailyLoading(false);
    }
  };



  useEffect(() => {
    fetchData();
    fetchDailyPredictions();
    const interval = setInterval(() => {
      fetchData();
      fetchDailyPredictions();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const currentData = apiData.length > 0 ? (apiData[selectedIndex] || apiData[apiData.length - 1]) : null;
  const isHistory = selectedIndex !== null && selectedIndex !== apiData.length - 1;

  // Display predictions with today's price synced if viewing live data
  const displayPredictions = useMemo(() => {
    if (!dailyPredictions || dailyPredictions.length === 0) return [];
    const todayStr = new Date().toLocaleDateString('en-CA');

    // If not in history mode and we have a live price, sync the first item (today)
    if (!isHistory && currentData?.market?.price && dailyPredictions[0].target_date === todayStr) {
      const synced = [...dailyPredictions];
      // Ensure it's a number to prevent .toFixed() crashes
      synced[0] = { ...synced[0], price: Number(currentData.market.price) };
      return synced;
    }
    return dailyPredictions;
  }, [dailyPredictions, currentData?.market?.price, isHistory]);

  // Calculate high/low/expected for the current 7-day display
  const weekStats = useMemo(() => {
    if (!displayPredictions || displayPredictions.length === 0) return null;
    const prices = displayPredictions.map(p => Number(p.price)).filter(p => !isNaN(p));
    if (prices.length === 0) return null;
    const high = Math.max(...prices).toFixed(2);
    const low = Math.min(...prices).toFixed(2);
    // Expected move as half the range for visualization
    const expected = ((Math.max(...prices) - Math.min(...prices)) / 2).toFixed(2);
    return { high, low, expected };
  }, [displayPredictions]);


  const getSignalLabel = (signal) => {
    const config = {
      'REAL MOVE': t('listApi.signal_real'),
      'WEAK CONFIRMATION': t('listApi.signal_weak'),
      'FAKE SIGNAL': t('listApi.signal_fake'),
      'NO SIGNAL': t('listApi.signal_none'),
    };
    return config[signal] || signal;
  };

  // 2. Handle Signal Quality colors
  const getSignalTag = (signal) => {
    const colorMap = {
      'REAL MOVE': 'green',
      'WEAK CONFIRMATION': 'orange',
      'FAKE SIGNAL': 'red',
      'NO SIGNAL': 'blue',
    };
    const color = colorMap[signal] || 'default';
    const label = getSignalLabel(signal);
    return (
      <Tag color={color} style={{ fontWeight: 'bold' }}>
        {label}
      </Tag>
    );
  };

  // 3. Translate labels (using i18next)
  const translateWhale = (whale) => {
    const map = {
      'BULLISH': t('listApi.bullish'),
      'BEARISH': t('listApi.bearish'),
      'NEUTRAL': t('listApi.neutral'),
    };
    return map[whale] || whale || t('listApi.na');
  };

  const translateEntry = (signal) => {
    if (!signal) return t('listApi.wait', 'WAITING');

    const signalKey = signal.toLowerCase().replace(/ /g, '_');
    const map = {
      'wait': t('listApi.wait', 'WAITING'),
      'buy': t('listApi.buy', 'BUY'),
      'sell': t('listApi.sell', 'SELL'),
      'buy_pullback': t('listApi.buy_pullback', 'BUY PULLBACK'),
      'sell_pullback': t('listApi.sell_pullback', 'SELL PULLBACK'),
      'strong_buy': t('listApi.strong_buy', 'STRONG BUY'),
      'strong_sell': t('listApi.strong_sell', 'STRONG SELL'),
      'breakout_buy': t('listApi.breakout_buy', 'BREAKOUT BUY'),
      'breakout_sell': t('listApi.breakout_sell', 'BREAKOUT SELL'),
      'buy_breakout': t('listApi.buy_breakout', 'BUY BREAKOUT'),
      'sell_breakout': t('listApi.sell_breakout', 'SELL BREAKOUT')
    };

    return map[signalKey] || signal.replace(/_/g, ' ');
  };

  const translateRisk = (risk) => {
    const map = {
      'SAFE': t('listApi.safe'),
      'MEDIUM': t('listApi.medium'),
      'HIGH': t('listApi.highRisk'),
    };
    return map[risk] || risk || t('listApi.unknown');
  };

  const translateVolatility = (vol) => {
    const map = {
      'HIGH': t('listApi.vol_high'),
      'NORMAL': t('listApi.vol_normal'),
      'LOW': t('listApi.vol_low'),
      'MEDIUM': t('listApi.medium'),
    };
    return map[vol] || vol || t('listApi.vol_normal');
  };

  const translateStatus = (status) => {
    if (!status) return '---';
    const key = status.toLowerCase().replace(/ /g, '_');
    const map = {
      'stable': t('listApi.stable', 'ỔN ĐỊNH'),
      'strong_distribution': t('listApi.strong_distribution', 'PHÂN PHỐI MẠNH'),
      'stealth_accumulation': t('listApi.stealth_accumulation', 'GOM HÀNG NGẤM NGẦM'),
      'no_squeeze': t('listApi.no_squeeze', 'KHÔNG CÓ SQUEEZE'),
      'neutral': t('listApi.neutral', 'TRUNG LẬP'),
      'bullish': t('listApi.bullish', 'TĂNG GIÁ'),
      'bearish': t('listApi.bearish', 'GIẢM GIÁ'),
    };
    return map[key] || status.replace(/_/g, ' ');
  };

  const getTrendIcon = (trend) => {
    if (trend === 'UP') return <span style={{ color: '#52c41a', marginLeft: '4px' }}>▲</span>;
    if (trend === 'DOWN') return <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>▼</span>;
    return null;
  };


  const [translatedReasons, setTranslatedReasons] = useState({});

  useEffect(() => {
    const implication = currentData?.market?.atr?.trading_implication;
    const description = currentData?.market?.atr?.description;
    const breakdown = currentData?.score?.breakdown || [];
    const riskExp =
      currentData?.trade?.risk_usd?.explanation ||
      currentData?.trade?.risk_usd?.description;

    const comexExp = currentData?.comex_analysis?.comex_explain_text;
    const volAna = currentData?.phantich_luong_giaodich_comex;
    const sgeBeh = currentData?.sge_analysis?.behavior?.text || currentData?.sge_analysis?.behavior;
    const smartMoneyAna = currentData?.slv_smart_money?.explain?.join('\n');
    const squeezeAna = currentData?.squeeze_probability?.explain_text;
    const interestAna = currentData?.text_phantich_laisuat;
    const sigWarn = currentData?.tinhieu;
    const pred = currentData?.phantich_kythuat?.next_week_prediction || currentData?.market?.next_week_prediction || currentData?.next_week_prediction || currentData;
    const forecastText = currentData?.forecast_next_week || pred?.forecast_next_week || pred?.forecast || "";


    const currentLang = i18n.language || 'vi';

    // Reset all translated states first
    setTranslatedImplication('');
    setTranslatedAtrDescription('');
    setTranslatedRiskExp('');
    setTranslatedComexExplain('');
    setTranslatedVolAnalysis('');
    setTranslatedSgeBehavior('');
    setTranslatedSmartMoneyExplain('');
    setTranslatedSqueezeExplain('');
    setTranslatedInterestRateAnalysis('');
    setTranslatedSignalWarning('');
    setTranslatedForecast('');
    setTranslatedReasons({});


    if (currentLang.startsWith('vi')) {
      setTranslatedImplication(implication || '');
      setTranslatedAtrDescription(description || '');
      setTranslatedRiskExp(riskExp || '');
      setTranslatedComexExplain(comexExp || '');
      setTranslatedVolAnalysis(volAna || '');
      setTranslatedSgeBehavior(sgeBeh || '');
      setTranslatedSmartMoneyExplain(smartMoneyAna || '');
      setTranslatedSqueezeExplain(squeezeAna || '');
      setTranslatedInterestRateAnalysis(interestAna || '');
      setTranslatedSignalWarning(sigWarn || '');
      setTranslatedForecast(forecastText || '');


      const baseReasons = {};
      breakdown.forEach((item) => {
        baseReasons[item.reason] = item.reason;
      });
      setTranslatedReasons(baseReasons);
    } else {
      const fields = {
        implication, description, riskExp, comexExp, volAna, sgeBeh, smartMoneyAna, squeezeAna, interestAna, sigWarn, forecastText
      };


      const setters = {
        implication: setTranslatedImplication,
        description: setTranslatedAtrDescription,
        riskExp: setTranslatedRiskExp,
        comexExp: setTranslatedComexExplain,
        volAna: setTranslatedVolAnalysis,
        sgeBeh: setTranslatedSgeBehavior,
        smartMoneyAna: setTranslatedSmartMoneyExplain,
        squeezeAna: setTranslatedSqueezeExplain,
        interestAna: setTranslatedInterestRateAnalysis,
        sigWarn: setTranslatedSignalWarning,
        forecastText: setTranslatedForecast
      };


      Object.entries(fields).forEach(([key, val]) => {
        if (val) {
          translateText(val, currentLang)
            .then((res) => setters[key](res))
            .catch(() => setters[key](val));
        } else {
          setters[key](''); // Ensure it's cleared if empty
        }
      });

      // Translate Breakdown Reasons
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
    }
  }, [currentData, i18n.language]);

  // Blocking loading screen removed to allow immediate UI render with placeholders

  if (!apiData || apiData.length === 0)
    return null;

  return (
    <div
      className="text-gray-200 p-6 rounded-xl shadow-2xl font-sans"
      style={{ backgroundColor: '#141414', borderColor: '#333', borderWidth: '1px', borderStyle: 'solid' }}
    >
      {/* HEADER SECTION */}
      <div className="listapi-top-panel">
        <div className="listapi-top-left">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="text-xl font-extrabold text-yellow-500 uppercase tracking-wider flex items-center gap-2 m-0">
              {t('listApi.title')}
            </h2>
            <p className="text-gray-300 text-xs mt-1 flex items-center gap-1">
              <HistoryOutlined /> {t('listApi.lastUpdate')} <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{formatToVNTime(currentData?.time, i18n.language)}</span>
              {isHistory && (
                <span className="text-red-400 font-bold ml-2">
                  {t('listApi.viewingHistory')}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
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
              className="w-64 custom-history-select"
              popupClassName="dark-dropdown"
              optionLabelProp="label"
            >
              {apiData
                .map((item, index) => {
                  const displayLabel = `${formatToVNTime(item.time, i18n.language)} - ${getSignalLabel(item.signal_quality)}`;
                  return (
                    <Select.Option key={index} value={index} label={displayLabel}>
                      <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{formatToVNTime(item.time, i18n.language)}</span>
                      <span style={{ color: '#ffffff', fontWeight: 'bold' }}> - {getSignalLabel(item.signal_quality)}</span>
                    </Select.Option>
                  );
                })
                .reverse()}
            </Select>
          </div>
        </div>

        <div className="listapi-top-right">
          <ForexNews />
        </div>
      </div>

      {/* METRICS GRID - Bố cục Chia đôi 50/50 */}
      <Row gutter={[16, 16]}>
        {/* CỘT TRÁI (md={12}) */}
        <Col xs={24} md={12}>
          {/* Panel 1: Tín hiệu & Whale */}
          <Card
            style={{ backgroundColor: '#000000', borderColor: '#222' }}
            bodyStyle={{ padding: '16px' }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-xs uppercase opacity-60" style={{ color: '#fff', letterSpacing: '1px' }}>
                  {t('listApi.systemSignal')}
                </span>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">{t('listApi.score', 'Score')}</span>
                    <span
                      style={{
                        fontSize: '32px',
                        fontWeight: '900',
                        color: (currentData?.score?.value > 0 ? '#22c55e' : (currentData?.score?.value < 0 ? '#ff4d4f' : '#ffffff')),
                        lineHeight: '1',
                        textShadow: '0 0 20px rgba(34, 197, 94, 0.2)'
                      }}
                    >
                      {currentData?.score?.value || 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getSignalTag(currentData?.signal_quality)}
                {translatedSignalWarning && (
                  <span className="text-[10px] text-red-400 font-bold flex items-center gap-1 animate-pulse">
                    ⚠️ {translatedSignalWarning}
                  </span>
                )}
              </div>
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

            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {t('listApi.scoreBreakdown', 'Score Breakdown')}
                </span>
              </div>


              <div className="max-h-96 overflow-y-auto pr-2 custom-scrollbar space-y-1" style={{
                background: '#0a0a0a',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #222',
                marginTop: '10px'
              }}>

                {(currentData?.score_breakdown || currentData?.score?.breakdown)?.map((item, index) => {
                  const points = item.points ?? item.point ?? 0;
                  const message = translatedReasons[item.reason] || item.reason || item.message;
                  const isPositive = points > 0;
                  const isNegative = points < 0;
                  const isFomo = (message || "").toLowerCase().includes('fomo');

                  // Optimize FOMO title
                  let displayMessage = message;
                  if (isFomo && displayMessage) {
                    displayMessage = displayMessage.replace(/fomo/i, t('listApi.fomoIndex', 'FOMO Sentiment Index'));
                  }

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '12px 1fr 50px',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 0',
                        borderBottom: '1px solid #222'
                      }}
                      className="last:border-0 group"
                    >
                      <div
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: isPositive ? '#22c55e' : (isNegative ? '#ff4d4f' : '#666') }}
                      />
                      <span className="text-[11px] leading-tight font-light" style={{ color: '#ffffff', opacity: 0.85 }}>
                        {displayMessage}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            color: isPositive ? '#22c55e' : (isNegative ? '#ff4d4f' : '#ffffff'),
                            fontWeight: '900',
                            fontSize: '13px',
                            fontFamily: 'monospace'
                          }}
                        >
                          {points > 0 ? `+${points}` : points}
                        </span>
                      </div>
                    </div>
                  );
                }) || <span style={{ color: '#666', fontStyle: 'italic', fontSize: '12px' }}>{t('listApi.noBreakdown')}</span>}
              </div>

              {currentData?.score_full && (
                <div className="mt-2 flex justify-end">
                  <span style={{ fontSize: '14px', fontFamily: 'monospace', color: '#888', background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '6px', border: '1px solid #333' }}>
                    <span style={{ color: '#ffffff', fontWeight: 'bold' }}>RAW_JS:</span>
                    <span style={{ color: '#ff4d4f', marginLeft: '8px', fontWeight: 'bold' }}>{currentData.score_full || currentData.score?.total || 0}</span>
                  </span>
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* CỘT PHẢI (md={12}) */}
        <Col xs={24} md={12}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Panel 2: Market & Volatility */}
            <div>
              <Card
                style={{ backgroundColor: '#141414', borderColor: '#222', borderRadius: '10px' }}
                bodyStyle={{ padding: '16px' }}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-sm uppercase" style={{ color: '#ffffff', letterSpacing: '1px' }}>
                    {t('listApi.marketIndex')}
                  </span>
                  <Tooltip title={translatedAtrDescription}>
                    <InfoCircleOutlined style={{ color: '#ff4d4f', cursor: 'help' }} />
                  </Tooltip>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Statistic
                          title={<span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>{t('listApi.silverPrice')}</span>}
                          value={currentData?.market?.price}
                          precision={2}
                          valueStyle={{ color: '#ff4d4f', fontWeight: '900', fontSize: '22px' }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title={<span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>{t('listApi.dxyValue')}</span>}
                          value={currentData?.etf_analysis?.dxy?.value}
                          precision={2}
                          valueStyle={{ color: '#ff4d4f', fontWeight: '900', fontSize: '22px' }}
                          suffix={<span style={{ fontSize: '14px' }}>{getTrendIcon(currentData?.etf_analysis?.dxy?.trend)}</span>}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title={<span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>ATR (%)</span>}
                          value={currentData?.market?.atr?.atr_percent}
                          precision={2}
                          valueStyle={{ color: '#ff4d4f', fontWeight: '900', fontSize: '22px' }}
                          suffix="%"
                        />
                      </Col>
                    </Row>

                    {/* Replaced old prediction logic with new premium block later in the flex container */}


                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#ffffff', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.8 }}>{t('listApi.ma50')}</span>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#ff4d4f' }}>{currentData?.market?.ma50 || '---'}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#ffffff', textTransform: 'uppercase', fontWeight: 'bold', opacity: 0.8 }}>{t('listApi.ma200')}</span>
                        <span style={{ fontSize: '18px', fontWeight: '900', color: '#ff4d4f' }}>{currentData?.market?.ma200 || '---'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-[#0f0f0f] p-4 rounded-lg border border-[#222]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-[11px] uppercase" style={{ color: '#ffffff', letterSpacing: '1px' }}>
                        {t('listApi.volatility')}
                      </span>
                      <span style={{ color: '#ff4d4f', fontWeight: '900', fontSize: '13px' }}>
                        {translateVolatility(currentData?.market?.atr?.volatility_level)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed italic m-0" style={{ color: '#ffffff', opacity: 0.9 }}>
                      {translatedAtrDescription || t('listApi.loadingAnalysis')}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* PRICE PREDICTION SECTION - MOVED HERE */}
            {(() => {
              const pred = currentData?.phantich_kythuat?.next_week_prediction || currentData?.market?.next_week_prediction || currentData?.next_week_prediction || currentData;
              const range = currentData?.price_range_next_week || pred?.price_range_next_week || pred?.ir_price_range_next_week;
              const forecast = currentData?.forecast_next_week || pred?.forecast_next_week || pred?.forecast;
              const targetPrice = currentData?.trade?.target_price || pred?.target_price || currentData?.target_price;


              let high = '—', low = '—';
              if (typeof range === 'object' && range !== null) {
                high = range.high;
                low = range.low;
              } else if (typeof range === 'string') {
                const hMatch = range.match(/high=([\d.]+)/);
                const lMatch = range.match(/low=([\d.]+)/);
                if (hMatch) high = hMatch[1];
                if (lMatch) low = lMatch[1];
              }

              return (
                <div className="prediction-card-v3">
                  <div className="prediction-glow"></div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                          <span className="prediction-title-v3">{t('listApi.predictionTitle')}</span>
                        </div>

                        {/* Dự báo tuần tới - Premium Summary */}
                        {currentData?.phantich_kythuat?.next_week_prediction && (
                          <div style={{
                            marginLeft: '20px',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <div className="flex items-center gap-2">
                              <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', opacity: 0.5 }}>
                                {t('listApi.nextWeekShort')}:
                              </span>
                              <span style={{
                                color: (currentData.phantich_kythuat?.next_week_prediction?.forecast?.toUpperCase().includes('TANG') ||
                                  currentData.phantich_kythuat?.next_week_prediction?.forecast?.toUpperCase().includes('UP') ||
                                  currentData.phantich_kythuat?.next_week_prediction?.forecast?.toUpperCase().includes('BULLISH')) ? '#22c55e' :
                                  (currentData.phantich_kythuat?.next_week_prediction?.forecast?.toUpperCase().includes('GIẢM') ||
                                    currentData.phantich_kythuat?.next_week_prediction?.forecast?.toUpperCase().includes('DOWN') ||
                                    currentData.phantich_kythuat?.next_week_prediction?.forecast?.toUpperCase().includes('BEARISH')) ? '#ff4d4f' : '#ffd700',
                                fontWeight: '900',
                                fontSize: '12px'
                              }}>
                                {translatedForecast || currentData.phantich_kythuat?.next_week_prediction?.forecast}

                                {currentData.phantich_kythuat.next_week_prediction.price_range_next_week?.expected_move && (
                                  <span style={{ marginLeft: '6px', opacity: 0.8, fontSize: '11px' }}>
                                    (±{currentData.phantich_kythuat.next_week_prediction.price_range_next_week.expected_move})
                                  </span>
                                )}
                              </span>
                            </div>
                            <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                            <div style={{ color: '#ffffff', fontSize: '11px', fontWeight: '900' }}>
                              <span style={{ color: '#22c55e' }}>{high || '---'}</span>
                              <span style={{ margin: '0 3px', opacity: 0.3 }}>/</span>
                              <span style={{ color: '#ff4d4f' }}>{low || '---'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-white/30 uppercase tracking-[2px] font-bold">
                        {t('listApi.whaleAnalyticsEngine')}
                      </span>

                    </div>

                    <div className="flex gap-2">
                      <div className="range-badge-v3">
                        <span className="label">{t('listApi.high')}:</span>
                        <span className="value" style={{ color: '#22c55e' }}>{high}</span>
                      </div>
                      <div className="range-badge-v3">
                        <span className="label">{t('listApi.low')}:</span>
                        <span className="value" style={{ color: '#ff4d4f' }}>{low}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 relative z-10">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-3">
                        <div className="forecast-text-v3">
                          {translatedForecast || forecast || t('listApi.noForecast', 'Updating...')}

                        </div>
                        {targetPrice && (
                          <div className="target-price-v3">
                            <span className="label">{t('listApi.predictedPrice')}:</span>
                            <span className="value">{targetPrice}</span>
                          </div>
                        )}
                      </div>
                      <div className="forecast-status-v3">
                        {t('listApi.whaleSentimentAnalysis')}
                      </div>

                    </div>
                  </div>

                  {/* 7-DAY FORECAST CALENDAR boxes removed as requested, only High/Low summary remains in header */}

                </div>



              );
            })()}

            {/* Redundant stoploss boxes removed */}

            {/* Panel 3: Gợi ý Giao dịch */}
            <div>

              <Card
                style={{ backgroundColor: '#000000', borderColor: '#222', borderRadius: '10px' }}
                bodyStyle={{ padding: '16px' }}
              >
                <span className="font-bold text-sm uppercase block mb-6" style={{ color: '#ffffff', letterSpacing: '1px' }}>
                  {t('listApi.tradingRecommendation')}
                </span>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div className="flex items-center gap-6">
                    <div className="py-2.5">
                      <span style={{
                        color: (!currentData?.trade?.entry_signal ||
                          currentData?.trade?.entry_signal?.toUpperCase().includes('BUY') ||
                          currentData?.trade?.entry_signal?.toUpperCase().includes('MUA') ||
                          currentData?.trade?.entry_signal?.toUpperCase().includes('WAIT') ||
                          currentData?.trade?.entry_signal?.toUpperCase().includes('CHỜ')) ? '#22c55e' :
                          (currentData?.trade?.entry_signal?.toUpperCase().includes('SELL') || currentData?.trade?.entry_signal?.toUpperCase().includes('BÁN')) ? '#ff4d4f' : '#ffffff',
                        fontWeight: '900',
                        fontSize: '22px',
                        letterSpacing: '1px'
                      }}>
                        {translateEntry(currentData?.trade?.entry_signal)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-[11px] font-bold uppercase mb-1" style={{ color: '#ffffff', opacity: 0.8 }}>
                        {t('listApi.marketPrice')}
                      </div>
                      <div style={{ color: '#ffd700', fontWeight: '900', fontSize: '18px' }}>
                        {currentData?.market?.price || '---'}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-[11px] font-bold uppercase mb-1" style={{ color: '#ffffff', opacity: 0.8 }}>
                        {t('listApi.riskLevel')}
                      </div>
                      <div style={{ color: '#ff4d4f', fontWeight: '900', fontSize: '18px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        {translateRisk(currentData?.trade?.risk_usd?.level)}
                        <span style={{ fontSize: '12px', opacity: 0.7 }}>({currentData?.trade?.risk_usd?.percent_account || 0}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderRadius: '8px', backgroundColor: '#0f0f0f', border: '1px solid #222' }}>
                      <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7 }}>
                        {t('listApi.predictedPrice', 'Mục tiêu giá')}
                      </span>
                      <span style={{ color: '#22c55e', fontWeight: '900', fontSize: '18px' }}>
                        {currentData?.trade?.target_price || '---'}
                      </span>
                    </div>

                    <Popover
                      content={
                        <div className="stoploss-popover-content">
                          <div className="popover-header">
                            {t('listApi.stoplossDetail')}
                          </div>
                          <div className="popover-body">
                            <div className="popover-item">
                              <span className="label">{t('listApi.stoplossShort')}</span>
                              <span className="value">{currentData?.market?.atr?.suggested_stoploss?.['1x_atr'] || '---'}</span>
                            </div>
                            <div className="popover-item">
                              <span className="label">{t('listApi.stoplossStandard')}</span>
                              <span className="value active">{currentData?.market?.atr?.suggested_stoploss?.['1_5x_atr'] || '---'}</span>
                            </div>
                            <div className="popover-item">
                              <span className="label">{t('listApi.stoplossWide')}</span>
                              <span className="value">{currentData?.market?.atr?.suggested_stoploss?.['2x_atr'] || '---'}</span>
                            </div>
                          </div>
                        </div>
                      }
                      trigger="click"
                      overlayClassName="premium-popover"
                      overlayInnerStyle={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        padding: 0,
                        boxShadow: 'none'
                      }}
                      color="transparent"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderRadius: '8px', backgroundColor: '#0f0f0f', border: '1px solid #222', cursor: 'pointer' }} className="hover:border-red-500 transition-colors">
                        <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7 }}>
                          {t('listApi.stoploss')}
                        </span>
                        <span style={{ color: '#ff4d4f', fontWeight: '900', fontSize: '18px' }}>
                          {currentData?.trade?.stoploss || '---'}
                        </span>
                      </div>
                    </Popover>


                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#0f0f0f', border: '1px solid #222' }}>
                      <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', maxWidth: '140px', lineHeight: '1.2' }}>
                        {t('listApi.positionSizeFull')}
                      </span>
                      <span style={{ color: '#ff4d4f', fontWeight: '900', fontSize: '20px' }}>
                        {currentData?.trade?.position_size || '0'}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Col>

      </Row>


      {/* FOOTER DETAIL */}


      {/* PROFESSIONAL MARKET DYNAMICS SECTION */}
      <div className="market-dynamics-container">
        <div className="dynamics-header">
          <div className="bar"></div>
          <h3>{t('listApi.tradingImplication')}</h3>
        </div>

        <div className="flex flex-col gap-4">
          {/* Logic Guidance Boxes */}
          <div className="logic-grid">
            <div className="logic-box-premium high group cursor-default">
              <div className="logic-indicator group-hover:scale-125 transition-transform duration-500">👉</div>
              <div className="flex items-center gap-4 relative z-10 flex-1">
                <span className="text-[10px] text-yellow-500 font-black uppercase tracking-[1px] bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 whitespace-nowrap">
                  {t('listApi.highVolatility')}
                </span>
                <div className="logic-label">
                  {t('listApi.atr_logic_high')}
                </div>
              </div>
            </div>
            <div className="logic-box-premium low group cursor-default">
              <div className="logic-indicator group-hover:scale-125 transition-transform duration-500">🚀</div>
              <div className="flex items-center gap-4 relative z-10 flex-1">
                <span className="text-[10px] text-blue-400 font-black uppercase tracking-[1px] bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20 whitespace-nowrap">
                  {t('listApi.lowVolatility')}
                </span>
                <div className="logic-label">
                  {t('listApi.atr_logic_low')}
                </div>
              </div>
            </div>
          </div>

          {/* Intelligence Narrative - Full Width for better space usage */}
          {translatedImplication && (
            <div className="intelligence-box-premium group relative">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-2xl">🧠</span>
              </div>
              <div className="intel-title-mini flex items-center gap-2 mb-3">
                <div className="w-1 h-3 bg-yellow-500"></div>
                {t('listApi.whaleTradingIntelligence')}
              </div>
              <div className="text-[13px] text-white/80 leading-[1.6] custom-scrollbar overflow-y-auto max-h-[350px] pr-4 intelligence-narrative"
                dangerouslySetInnerHTML={{ __html: highlightText(translatedImplication) }}
              />
            </div>
          )}
        </div>
      </div>


      {/* MARKET INTELLIGENCE FEED - PREMIUM CYBERPUNK STYLE */}
      <div className="mt-8 mb-12 px-4 md:px-8">
        {/* Section Header */}
        <div className="flex flex-col mb-8 relative">
          <div className="absolute -left-10 -top-10 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full"></div>
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-600/10 blur-[80px] rounded-full"></div>

          <div className="flex items-center gap-5 z-10">
            <div className="relative">
              <div className="w-1.5 h-12 bg-gradient-to-b from-[#ffd700] via-[#ff00e5] to-[#00f2ff] rounded-full shadow-[0_0_15px_rgba(255,0,229,0.5)]"></div>
              <div className="absolute top-0 left-0 w-1.5 h-12 bg-white blur-[2px] opacity-50"></div>
            </div>
            <div>
              <h2 className="premium-yellow-title text-2xl md:text-3xl m-0 leading-tight">
                {t('listApi.marketIntelligence', 'Phân tích Thị trường')}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-[1px] w-12 bg-gradient-to-r from-[#ffd700] to-transparent"></div>
                <span className="text-[10px] text-[#00f2ff] font-bold uppercase tracking-[4px] opacity-70">{t('listApi.realTimeInsights', 'Real-time Advanced Insights')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="intelligence-main-grid">
          {/* COLUMN 1: COMEX INVENTORY */}
          <div className="intelligence-column">
            <div className="premium-intel-card group h-full" style={{ '--accent-color': '#3b82f6' }}>
              <div className="card-glow"></div>

              <div className="flex items-center justify-between mb-8 z-10 relative">
                <div className="flex items-center gap-4">
                  <div className="icon-wrapper bg-blue-500/10 border border-blue-500/20">
                    <span className="text-2xl">📦</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white font-black uppercase tracking-[2px] opacity-70">{t('listApi.inventory', 'Kho lưu trữ')}</span>
                    <span className="premium-yellow-title card-title-yellow">{t('listApi.comexStats', 'Chỉ số Comex')}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 z-10 relative">
                <div className="stats-box group/item">
                  <div className="text-[9px] text-white uppercase font-black tracking-widest mb-1 opacity-80">{t('listApi.oneDayChange', 'Biến động 1D')}</div>
                  <div className="text-2xl font-black" style={{ color: '#ffd700' }}>
                    {currentData?.comex_analysis?.change_1d > 0 ? '+' : ''}{currentData?.comex_analysis?.change_1d || '0'}%
                  </div>
                  <div className="stats-box-bar bg-blue-500/20"></div>
                </div>
                <div className="stats-box group/item">
                  <div className="text-[9px] text-white uppercase font-black tracking-widest mb-1 opacity-80">{t('listApi.fiveDayChange', 'Biến động 5D')}</div>
                  <div className="text-2xl font-black" style={{ color: '#ffd700' }}>
                    {currentData?.comex_analysis?.change_5d > 0 ? '+' : ''}{currentData?.comex_analysis?.change_5d || '0'}%
                  </div>
                  <div className="stats-box-bar bg-blue-500/20"></div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="analysis-box bg-blue-500/5 border-blue-500/10 group-hover:border-blue-500/30">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700] shadow-[0_0_8px_#ffd700]"></div>
                    <span className="text-[10px] text-[#ffd700] uppercase font-black tracking-[2px]">{t('listApi.detailedAnalysis', 'Phân tích chi tiết')}</span>
                  </div>
                  <div
                    className="text-[13px] leading-[1.8] text-white/90 font-medium tracking-tight custom-scrollbar overflow-y-auto max-h-[160px] pr-2"
                    dangerouslySetInnerHTML={{ __html: highlightText(translatedComexExplain) }}
                  />
                </div>

                {translatedVolAnalysis && (
                  <div className="logic-box bg-white/5 border-white/5 group-hover:border-blue-500/20">
                    <div className="text-[9px] text-[#ffd700] uppercase font-black mb-3 tracking-widest flex items-center gap-2">
                      <div className="w-3 h-[1px] bg-blue-500/30"></div> {t('listApi.volumeAnalysis', 'Phân tích khối lượng')}
                    </div>
                    <div
                      className="text-[12px] text-white/80 italic leading-relaxed font-medium"
                      dangerouslySetInnerHTML={{ __html: highlightText(translatedVolAnalysis) }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 2: ASIA MARKET & YIELD (CN) - MOVED TO MIDDLE */}
          <div className="intelligence-column">
            <div className="premium-intel-card group h-full" style={{ '--accent-color': '#eab308' }}>
              <div className="card-glow"></div>

              <div className="flex items-center justify-between mb-8 z-10 relative">
                <div className="flex items-center gap-4">
                  <div className="icon-wrapper bg-yellow-500/10 border border-yellow-500/20">
                    <span className="text-2xl">🇨🇳</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white font-black uppercase tracking-[2px] opacity-70">{t('listApi.asiaMarket', 'Thị trường Châu Á')}</span>
                    <span className="premium-yellow-title card-title-yellow">{t('listApi.sgeBehavior', 'Hành vi SGE')}</span>
                  </div>
                </div>
                <div className="status-badge bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                  {translateStatus(currentData?.sge_analysis?.behavior?.label)}
                </div>
              </div>

              <div className="pulse-box bg-yellow-500/5 border-yellow-500/20 group-hover:bg-yellow-500/10 transition-all mb-6">
                <div className="text-[9px] text-[#ffd700] uppercase font-black mb-3 tracking-widest">{t('listApi.sentimentPulse', 'Nhịp đập tâm lý')}</div>
                <div
                  className="text-[16px] font-black text-white leading-snug drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
                  dangerouslySetInnerHTML={{ __html: highlightText(translatedSgeBehavior) }}
                />
              </div>

              <div className="impact-box bg-white/5 border-white/5 group-hover:border-yellow-500/20 mt-auto">
                <div className="text-[9px] text-[#ffd700] uppercase font-black mb-3 tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#ffd700] rotate-45"></div> {t('listApi.yieldImpact', 'Tác động lợi suất')}
                </div>
                <div
                  className="text-[12px] text-white leading-relaxed italic font-medium"
                  dangerouslySetInnerHTML={{ __html: highlightText(translatedInterestRateAnalysis) }}
                />
              </div>
            </div>
          </div>

          {/* COLUMN 3: SMART MONEY & SQUEEZE - MOVED TO END */}
          <div className="intelligence-column">
            <div className="premium-intel-card group h-full" style={{ '--accent-color': '#ff00e5' }}>
              <div className="card-glow"></div>

              <div className="flex items-center justify-between mb-8 z-10 relative">
                <div className="flex items-center gap-4">
                  <div className="icon-wrapper bg-purple-500/10 border border-purple-500/20">
                    <span className="text-2xl">🐳</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white font-black uppercase tracking-[2px] opacity-70">{t('listApi.flowTracker', 'Theo dõi dòng tiền')}</span>
                    <span className="premium-yellow-title card-title-yellow">{t('listApi.smartMoney', 'Dòng tiền thông minh')}</span>
                  </div>
                </div>
                <div className="status-badge bg-purple-500/10 text-purple-400 border-purple-500/30">
                  {translateStatus(currentData?.slv_smart_money?.flow)}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-6 z-10 relative">
                {['1d', '1w', '1m', '3m'].map(p => {
                  const val = currentData?.slv_smart_money?.changes?.[p] || 0;
                  return (
                    <div key={p} className="stats-box-mini">
                      <div className="text-[8px] text-white uppercase font-black mb-1 opacity-70">{p}</div>
                      <div className="text-[11px] font-black" style={{ color: '#ffd700' }}>
                        {val > 0 ? '+' : ''}{val}%
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="logic-box bg-white/5 border-white/5 group-hover:border-purple-500/20 mb-6">
                <div className="text-[9px] text-[#ffd700] uppercase font-black mb-3 tracking-widest flex items-center gap-2">
                  <div className="w-3 h-[1px] bg-purple-500/30"></div> {t('listApi.smartMoneyLogic', 'Logic dòng tiền')}
                </div>
                <div
                  className="text-[12px] text-white italic leading-relaxed font-medium custom-scrollbar overflow-y-auto max-h-[120px] pr-2"
                  dangerouslySetInnerHTML={{ __html: highlightText(translatedSmartMoneyExplain) }}
                />
              </div>

              <div className="squeeze-card bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/20 group-hover:from-purple-500/20 mb-6">
                <div className="flex flex-col">
                  <span className="text-[9px] text-[#ffd700] uppercase font-black tracking-[2px] mb-1">{t('listApi.squeezeRisk', 'Rủi ro ép vị thế')}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black drop-shadow-[0_0_15px_rgba(255,0,229,0.3)]" style={{ color: '#ffd700' }}>
                      {currentData?.squeeze_probability?.value || '0'}%
                    </span>
                    <span className="text-[10px] text-white/40 font-bold uppercase">{t('listApi.probability', 'Xác suất')}</span>
                  </div>
                </div>
                <div className="squeeze-visual border-purple-500/30">
                  <div className="squeeze-dot bg-[#ff00e5] shadow-[0_0_10px_#ff00e5]"></div>
                </div>
              </div>

              {translatedSqueezeExplain && (
                <div className="analysis-box bg-purple-500/5 border-purple-500/10 group-hover:border-purple-500/30">
                  <div className="text-[11px] text-white/90 leading-relaxed italic"
                    dangerouslySetInnerHTML={{ __html: highlightText(translatedSqueezeExplain) }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
