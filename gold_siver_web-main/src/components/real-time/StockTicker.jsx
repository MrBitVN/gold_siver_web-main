import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { globalYahooStocks } from "./YahooFinanceSocket";
import { heatmapData } from "../money-flow-heatmap/symbolsConfig";

const StockTicker = ({ type = "stock" }) => {
  const [dataMap, setDataMap] = useState({});

  // Danh sách cấu hình hiển thị
  const config = type === "etf" ? [
    { label: "Vàng ETF", symbol: "GLD" },
    { label: "Bạc ETF", symbol: "SLV" },
    { label: "Khai thác Vàng", symbol: "GDX" },
    { label: "Khai thác Bạc", symbol: "SIL" },
    { label: "Khai thác Vàng Jr", symbol: "GDXJ" },
    { label: "Khai thác Bạc Jr", symbol: "SILJ" },
    { label: "Vàng IAU", symbol: "IAU" },
    { label: "Bạch kim", symbol: "PPLT" },
    { label: "Palladium", symbol: "PALL" }
  ] : [
    { label: "Mỹ (S&P 500)", symbol: "SPY" },
    { label: "Việt Nam", symbol: "^VNINDEX.VN" },
    { label: "Nhật Bản", symbol: "^N225" },
    { label: "Hàn Quốc", symbol: "^KS11" },
    { label: "Trung Quốc", symbol: "000001.SS" },
    { label: "Châu Âu", symbol: "^STOXX50E" },
    { label: "Đài Loan", symbol: "^TWII" },
    { label: "Ấn Độ", symbol: "^NSEI" },
    { label: "Singapore", symbol: "^STI" },
    { label: "Indonesia", symbol: "^JKSE" },
    { label: "Israel", symbol: "TASE.TA" },
    { label: "Anh", symbol: "^XDB" },
  ];

  const getCountryCode = (id) => {
    const map = { "^VNINDEX.VN": "vn", "SPY": "us", "^N225": "jp", "^KS11": "kr", "^TWII": "tw", "^STI": "sg", "^JKSE": "id", "TASE.TA": "il" };
    if (map[id]) return map[id];
    if (id.endsWith(".SS") || id.endsWith(".SZ")) return 'cn';
    if (id.endsWith(".T")) return 'jp';
    return 'us';
  };

  useEffect(() => {
    // 1. Khởi tạo dữ liệu từ bộ nhớ đệm
    const initial = {};
    config.forEach(item => {
      if (globalYahooStocks[item.symbol]) {
        initial[item.symbol] = globalYahooStocks[item.symbol];
      }
    });
    setDataMap(initial);

    // 2. Lắng nghe cập nhật
    const handleUpdate = (e) => {
      const decoded = e.detail;
      const symbol = decoded.symbol || decoded.id;
      if (config.some(c => c.symbol === symbol)) {
        setDataMap(prev => ({ ...prev, [symbol]: decoded }));
      }
    };

    window.addEventListener('yahooPriceAlert', handleUpdate);
    return () => window.removeEventListener('yahooPriceAlert', handleUpdate);
  }, [type]);
  const displayData = config.map(c => ({
    ...c,
    data: dataMap[c.symbol]
  }));

  const Content = () => (
    <div className="ticker-group" style={{ display: 'flex', alignItems: 'center' }}>
      <span className="group-label stock-label" style={{ 
        color: type === 'etf' ? "#38bdf8" : "#3b82f6", 
        marginRight: '20px',
        fontWeight: 'bold'
      }}>
        {type.toUpperCase()}
      </span>
      {displayData.map((item) => {
          const data = item.data;
          const isPos = (data?.changePercent || 0) >= 0;
          const price = data?.price;
          const changePercent = data?.changePercent;

          return (
            <div className="ticker-item" key={item.symbol}>
              <img 
                src={`https://flagcdn.com/w40/${getCountryCode(data?.id || item.symbol)}.png`} 
                style={{ width: '18px', marginRight: '8px' }} 
                alt="" 
              />
              <Link to={`/etf/${(data?.id || item.symbol).replace('^', '')}`} className="stock-link" style={{ textDecoration: "none", color: "inherit" }}>
                <span className="item-label" style={{fontWeight:'bold'}}>{(data?.id || item.symbol).replace('^','')}</span>
                <span className="stock-note" style={{marginLeft:'4px', fontSize:'0.8em', opacity:0.7}}>({item.label})</span>
              </Link>
              <span className="price-val" style={{marginLeft:'8px'}}>
                {price != null ? price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "---"}
              </span>
              <span className={isPos ? "positive" : "negative"} style={{marginLeft:'5px'}}>
                 {changePercent != null ? `${isPos ? "+" : ""}${changePercent.toFixed(2)}%` : "0.00%"}
              </span>
            </div>
          );
        })}
    </div>
  );

  return (
    <div className="ticker-row marquee-row" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px' }}>
      <div className="marquee-wrapper marquee-slow">
        <Content />
        <Content />
      </div>
    </div>
  );
};

export default StockTicker;