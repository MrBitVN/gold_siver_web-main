import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter, Cell } from 'recharts';
import axios from 'axios';
import { logUserInfo } from '../../utils/logUserInfo';
import { useTranslation } from "react-i18next";
const OrderFlowAnalysis = () => {
  const { t, i18n } = useTranslation();
  const { type, day, month, year } = useParams();
  const navigate = useNavigate();
  const isFirstRun = useRef(true);

  const [scatterData, setScatterData] = useState([]);
  const [candleData, setCandleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateTime, setUpdateTime] = useState("");
  const [maxVol, setMaxVol] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // State lưu danh sách tất cả các mức giá active để làm trục Y
  const [priceMap, setPriceMap] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [activeTab, setActiveTab] = useState("silver")
  const themeColor = activeTab === 'gold' ? '#FFD700' : '#C0C0C0';
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(() => {
    if (day && month && year) return new Date(year, month - 1, day);
    return today;
  });

  useEffect(() => {
    logUserInfo("Trang OrderFlow Map Index");
  }, []);

  // const updateURL = (newTab, newDate, replace = false) => {
  //   const d = newDate.getDate();
  //   const m = newDate.getMonth() + 1;
  //   const y = newDate.getFullYear();
  //   navigate(`/orderflowanalysis/${newTab}/${d}/${m}/${y}`, { replace });
  // };

  const formatDateStr = (date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}_${m}_${date.getFullYear()}`;
  };

  const formatDateDisplay = (date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}/${m}`;
  };

  useEffect(() => {
    if (!day && isFirstRun.current) {
      setCurrentDate(today);
      // updateURL(activeTab, today, true);
    } else if (day && month && year) {
      const targetDate = new Date(year, month - 1, day);
      if (formatDateStr(targetDate) !== formatDateStr(currentDate)) {
        setCurrentDate(targetDate);
      }
    }
    isFirstRun.current = false;
  }, [day, month, year, type]);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        const datesToCheck = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(currentDate);
          d.setDate(d.getDate() - i);
          datesToCheck.push(d);
        }

        const requests = datesToCheck.map(date =>
          axios.get(`https://api_gold.thinkdiff.us/tile_mua_ban_check_giao_dich/${formatDateStr(date)}`)
            .catch(() => null)
        );

        const responses = await Promise.all(requests);

        // 1. Thu thập TẤT CẢ các mức giá có volume vào một mảng tạm
        let allPricesRaw = new Set();
        let rawDataByDay = [];

        responses.forEach((res, index) => {
          const root = res?.data?.tile_mua_ban_check_giao_dich;
          if (index === 6 && root?.time_update) setUpdateTime(root.time_update);

          const listBan = activeTab === 'gold' ? root?.list_tongtien_ban_gold : root?.list_tongtien_ban;
          const listMua = activeTab === 'gold' ? root?.list_tongtien_mua_gold : root?.list_tongtien_mua;

          // Lưu tạm để xử lý sau khi có full list giá
          rawDataByDay.push({
            dateObj: datesToCheck[index],
            listBan: listBan || [],
            listMua: listMua || []
          });

          if (listBan) {
            listBan.forEach(item => {
              const price = Number(item.gia);
              const qty = Number(item.so_luong) || 0;
              if (price > 0 && qty > 0) allPricesRaw.add(price);
            });
          }
        });

        // 2. Tạo danh sách giá chuẩn (Sorted Unique Prices)
        // Đây chính là xương sống của trục Y
        const sortedPrices = Array.from(allPricesRaw).sort((a, b) => a - b);
        setPriceMap(sortedPrices);

        let scatters = [];
        let candles = [];
        let globalMaxVolSinglePrice = 0;

        // 3. Map dữ liệu vào danh sách giá chuẩn (Index Mapping)
        rawDataByDay.forEach((dayData, index) => {
          const displayDate = formatDateDisplay(dayData.dateObj);
          const { listBan, listMua } = dayData;

          const candleBase = { x: index, date: displayDate, low: 0, high: 0, range: [0, 0] };

          if (listBan.length === 0) {
            candles.push(candleBase);
            return;
          }

          let dayMinIndex = Infinity;
          let dayMaxIndex = -Infinity;

          listBan.forEach((item, idx) => {
            const price = Number(item.gia);
            const sellQty = Number(item?.so_luong) || 0;
            const buyQty = Number(listMua?.[idx]?.so_luong) || 0;
            const totalVol = sellQty + buyQty;

            if (totalVol > 0) {
              if (buyQty > globalMaxVolSinglePrice) globalMaxVolSinglePrice = buyQty;
              if (sellQty > globalMaxVolSinglePrice) globalMaxVolSinglePrice = sellQty;

              // QUAN TRỌNG: Tìm vị trí (index) của giá này trong danh sách sortedPrices
              const priceIndex = sortedPrices.indexOf(price);

              if (priceIndex !== -1) {
                if (priceIndex < dayMinIndex) dayMinIndex = priceIndex;
                if (priceIndex > dayMaxIndex) dayMaxIndex = priceIndex;

                scatters.push({
                  x: index,
                  y: priceIndex, // Trục Y bây giờ là số thứ tự (0, 1, 2...)
                  displayPrice: price, // Lưu giá thật để hiển thị tooltip
                  buy: buyQty, sell: sellQty,
                  date: displayDate,
                });
              }
            }
          });

          if (dayMinIndex !== Infinity) {
            candles.push({
              ...candleBase,
              // Range cũng dùng index
              range: [dayMinIndex, dayMaxIndex]
            });
          } else {
            candles.push(candleBase);
          }
        });

        setMaxVol(globalMaxVolSinglePrice > 0 ? globalMaxVolSinglePrice : 1);
        setScatterData(scatters);
        setCandleData(candles);
        setLoading(false);

      } catch (err) {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentDate, activeTab]);

  // const handleTabChange = (newTab) => updateURL(newTab, currentDate);
  const handleDateChange = (step) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + step);
    setCurrentDate(newDate);
    // updateURL(activeTab, newDate);
  };

  // --- CUSTOM SHAPES ---

  const FootprintBar = (props) => {
    const { cx, cy, payload } = props;
    const { buy, sell } = payload;

    // Giảm barHeight xuống để không bị dính
    const barHeight = isMobile ? 12 : 20;
    const maxBarWidth = isMobile ? 25 : 65;
    const hitBoxWidth = maxBarWidth * 3.5;
    const hitBoxHeight = barHeight + 4;

    const buyWidth = buy > 0 ? (buy / maxVol) * maxBarWidth : 0;
    const sellWidth = sell > 0 ? (sell / maxVol) * maxBarWidth : 0;

    const total = buy + sell;
    const buyPercent = total > 0 ? Math.round((buy / total) * 100) : 0;
    const sellPercent = total > 0 ? Math.round((sell / total) * 100) : 0;
    const fontSize = isMobile ? 9 : 11;

    return (
      <g>
        <rect x={cx - hitBoxWidth / 2} y={cy - hitBoxHeight / 2} width={hitBoxWidth} height={hitBoxHeight} fill="transparent" />

        {buy > 0 && sell > 0 && (
          <rect x={cx - buyWidth} y={cy - barHeight / 2} width={buyWidth} height={barHeight} fill="#00e676" opacity={0.9} rx={3} style={{ pointerEvents: 'none' }} />
        )}
        {buy > 0 && sell > 0 && (
          <text x={cx - buyWidth - 4} y={cy + fontSize / 3} textAnchor="end" fill="#00e676" fontSize={fontSize} fontWeight="bold" style={{ pointerEvents: 'none' }}>{buyPercent}%</text>
        )}

        {buy > 0 && sell > 0 && (
          <rect x={cx} y={cy - barHeight / 2} width={sellWidth} height={barHeight} fill="#ff1744" opacity={0.9} rx={3} style={{ pointerEvents: 'none' }} />
        )}
        {buy > 0 && sell > 0 && (
          <text x={cx + sellWidth + 4} y={cy + fontSize / 3} textAnchor="start" fill="#ff1744" fontSize={fontSize} fontWeight="bold" style={{ pointerEvents: 'none' }}>{sellPercent}%</text>
        )}
        <line x1={cx} y1={cy - barHeight / 2} x2={cx} y2={cy + barHeight / 2} stroke="#444" strokeWidth={1} style={{ pointerEvents: 'none' }} />
      </g>
    );
  };

  const BlockBackground = (props) => {
    const { x, y, width, height } = props;
    return (
      <rect x={x - 10} y={y} width={width + 20} height={height} fill="#222" opacity={0.4} rx={4} style={{ pointerEvents: 'none' }} />
    );
  };

  const containerStyle = {
    backgroundColor: '#0E0E0E',
    padding: isMobile ? '8px' : '10px',
    borderRadius: '6px',
    width: '100%',
    margin: 'auto',
    overflowX: 'auto',
    overflowY: 'hidden',
    marginTop: '20px',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: isMobile ? 'space-around' : 'space-between',
    marginBottom: isMobile ? '8px' : '10px',
    alignItems: 'center',
    gap: isMobile ? '8px' : '12px',
    flexWrap: isMobile ? 'wrap' : 'nowrap',
    minWidth: 0
  };

  const chartContainerStyle = {
    width: isMobile ? 'calc(100vw - 20px)' : '100%',
    minWidth: isMobile ? '100%' : 'auto',
    height: activeTab == "silver" ? (isMobile ? '400px' : '550px') : (isMobile ? '280px' : '330px'),
    overflowX: isMobile ? 'auto' : 'visible',
    overflowY: 'hidden',
    WebkitOverflowScrolling: 'touch'
  };

  if (!loading && scatterData.length === 0 && candleData.length === 0) {
    return null;
  }

  return (
    <div style={containerStyle}>

      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', gap: isMobile ? '3px' : '5px', flex: isMobile ? '0 0 auto' : '1' }}>
          <button onClick={() => setActiveTab('gold')} style={tabBtn(activeTab === 'gold', '#FFD700', isMobile)}>GOLD</button>
          <button onClick={() => setActiveTab('silver')} style={tabBtn(activeTab === 'silver', '#C0C0C0', isMobile)}>SILVER</button>
        </div>
        <div style={{ textAlign: "center", flex: isMobile ? '0 0 auto' : '1', minWidth: 0 }}>
          <h3 style={{ cursor: 'pointer', margin: '0', fontSize: isMobile ? '12px' : '16px' }}>{t("OrderFlowAnalysis.title")}</h3>
          <div style={{ color: themeColor, fontSize: isMobile ? '9px' : '11px', fontFamily: 'monospace' }}>{updateTime && `Update: ${updateTime}`}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '3px' : '5px', background: '#1a1a1a', padding: isMobile ? '3px 8px' : '4px 10px', borderRadius: '20px', flex: isMobile ? '0 0 auto' : '1' }}>
          <button onClick={() => handleDateChange(-1)} style={navBtn}>❮</button>
          <span style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: 'bold', color: themeColor, whiteSpace: 'nowrap' }}>{formatDateStr(currentDate).replaceAll('_', '/')}</span>
          <button onClick={() => handleDateChange(1)} style={navBtn}>❯</button>
        </div>
      </div>

      <div style={chartContainerStyle}>
        <div style={{ width: isMobile ? '1200px' : '100%', height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 10, right: isMobile ? 20 : 10, bottom: 0, left: isMobile ? 50 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />

              <XAxis
                dataKey="x" type="number" domain={['dataMin', 'dataMax']} tickCount={isMobile ? 5 : 7} interval={0}
                tickFormatter={(idx) => candleData[idx]?.date || ''}
                tick={{ fill: '#888', fontSize: isMobile ? 8 : 10, fontWeight: 'bold' }}
                axisLine={{ stroke: '#333' }} tickLine={false}
                padding={{ left: isMobile ? 50 : 200, right: isMobile ? 20 : 80 }}
              />

              {/* QUAN TRỌNG: YAxis vẫn để là NUMBER, nhưng formatter sẽ hiển thị GIÁ THẬT */}
              <YAxis
                dataKey="y"
                type="number"
                // Domain từ 0 đến index cuối cùng của mảng giá
                domain={[0, priceMap.length > 0 ? priceMap.length - 1 : 'auto']}
                // Tick count hiển thị hợp lý
                tickCount={priceMap.length > 20 ? 15 : priceMap.length}
                // Formatter: Biến đổi Index (0,1,2) thành Giá (2000, 2005...)
                tickFormatter={(index) => priceMap[index] || ""}
                interval={0}
                tick={{ fill: themeColor, fontSize: isMobile ? 8 : 10 }}
                axisLine={false} tickLine={false}
                width={isMobile ? 40 : 50}
                padding={{ top: 20, bottom: 20 }}
                allowDataOverflow={true}
              />

              {/* <Tooltip
              shared={false} isAnimationActive={false} cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  if (d.buy !== undefined && d.sell !== undefined) {
                    const delta = d.buy - d.sell;
                    const total = d.buy + d.sell;
                    const buyPct = total > 0 ? Math.round((d.buy / total) * 100) : 0;
                    const sellPct = total > 0 ? Math.round((d.sell / total) * 100) : 0;

                    // LẤY GIÁ THẬT TỪ displayPrice CHỨ KHÔNG LẤY d.y (vì d.y là index)
                    const priceToShow = d.displayPrice;

                    return (
                      <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.95)', border: '1px solid #666', padding: '10px', borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 1000, pointerEvents: 'none'
                      }}>
                        <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{d.date}</div>
                        <div style={{ fontSize: '14px', color: '#fff', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '5px' }}>
                          Giá: <span style={{ color: themeColor }}>{priceToShow}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '140px' }}>
                            <span style={{ color: '#ccc' }}>Buy:</span>
                            <span style={{ color: '#00e676', fontWeight: 'bold' }}>{d.buy.toLocaleString()} ({buyPct}%)</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '140px' }}>
                            <span style={{ color: '#ccc' }}>Sell:</span>
                            <span style={{ color: '#ff1744', fontWeight: 'bold' }}>{d.sell.toLocaleString()} ({sellPct}%)</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #444' }}>
                            <span style={{ color: '#aaa' }}>Delta:</span>
                            <span style={{ color: delta > 0 ? '#00e676' : '#ff1744', fontWeight: 'bold' }}>
                              {delta > 0 ? '+' : ''}{delta.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              }}
            /> */}

              <Bar data={candleData} dataKey="range" barSize={isMobile ? 40 : 80} shape={<BlockBackground />} isAnimationActive={false} />
              <Scatter data={scatterData} shape={<FootprintBar />} isAnimationActive={false} />

            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? '10px' : '20px', marginTop: '8px', fontSize: isMobile ? '9px' : '10px', color: '#666', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '10px', height: '10px', background: '#222', opacity: 0.5 }}></span> <span style={{ whiteSpace: 'nowrap' }}>{t("OrderFlowAnalysis.range")}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', background: '#00e676' }}></span> <span style={{ whiteSpace: 'nowrap' }}>{t("OrderFlowAnalysis.buy")} Vol & %</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', background: '#ff1744' }}></span> <span style={{ whiteSpace: 'nowrap' }}>{t("OrderFlowAnalysis.sell")} Vol & %</span></div>
      </div>
    </div>
  );
};

const tabBtn = (active, color, isMobile) => ({
  background: active ? color : '#1a1a1a',
  border: 'none',
  padding: isMobile ? '4px 8px' : '6px 15px',
  color: active ? '#000' : '#888',
  cursor: 'pointer',
  fontWeight: 'bold',
  borderRadius: '4px',
  fontSize: isMobile ? '10px' : '11px',
  whiteSpace: 'nowrap'
});
const navBtn = {
  background: 'none',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '12px',
  padding: '0 4px',
  lineHeight: '1'
};

export default OrderFlowAnalysis;