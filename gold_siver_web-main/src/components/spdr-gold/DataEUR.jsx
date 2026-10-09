import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import './DataEUR.css';
import protobuf from "protobufjs";
import { globalYahooStocks } from '../real-time/YahooFinanceSocket';

export const useETFMiningNotification = () => {
  const [gainNotification, setGainNotification] = useState(null);
  const [lossNotification, setLossNotification] = useState(null);
  const audioRef = useRef(new Audio("/bipbip_khaithac_mo.mp3"));
  const lastNotiTimeRef = useRef(0);
  const dataEURRef = useRef({});

  const setupNotificationListener = () => {
    const showNotification = () => {
      const now = Date.now();
      if (now - lastNotiTimeRef.current < 30000) return;
      const etfList = Object.entries(dataEURRef.current).map(([etfName, data]) => ({
        name: etfName,
        changePercent: parseFloat(data.prc) || 0,
        changeAbsolute: parseFloat(data.amt) || 0,
      }));
      if (etfList.length === 0) return;
      const topGainer = etfList.reduce((max, item) => item.changePercent > max.changePercent ? item : max);
      const topLoser = etfList.reduce((min, item) => item.changePercent < min.changePercent ? item : min);
      const needAlertGain = topGainer.changePercent > 5;
      const needAlertLoss = topLoser.changePercent < -5;

      setLossNotification(null);
      setTimeout(() => {
        setGainNotification({ topGainer, needAlert: needAlertGain });
        if (needAlertGain) audioRef.current.play().catch(() => { });
        setTimeout(() => {
          setGainNotification(null);
          setTimeout(() => {
            setLossNotification({ topLoser, needAlert: needAlertLoss });
            if (needAlertLoss) audioRef.current.play().catch(() => { });
            setTimeout(() => setLossNotification(null), 10000);
          }, 300);
        }, 10000);
      }, 0);
      lastNotiTimeRef.current = now;
    };
    showNotification();
    const interval = setInterval(showNotification, 30000);
    return () => clearInterval(interval);
  };
  return { gainNotification, lossNotification, setGainNotification, setLossNotification, dataEURRef, setupNotificationListener };
};

const ETFSingleRow = ({ name, price, changeAbsolute, changePercent, isGridMode, slug }) => {
  const [flashClass, setFlashClass] = useState("");
  const [prevPrice, setPrevPrice] = useState(price);

  useEffect(() => {
    if (!prevPrice || !price) return;
    if (price > prevPrice) setFlashClass("shark-v3-up");
    else if (price < prevPrice) setFlashClass("shark-v3-down");
    const timer = setTimeout(() => setFlashClass(""), 1000);
    setPrevPrice(price);
    return () => clearTimeout(timer);
  }, [price, prevPrice]);

  const content = (
    <div className={`shark-v3-card ${flashClass} ${isGridMode ? 'mode-vertical' : 'mode-horizontal'}`}>
      <div className="shark-v3-info">
        <span className="shark-v3-name" style={{ color: name.toLowerCase().includes("gold") ? "#ffd700" : "#fff" }}>
          {isGridMode ? name : name.substring(0, 15)}
        </span>
      </div>
      <div className="shark-v3-data">
        <span className="shark-v3-price">€{price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        <span className={`shark-v3-pct ${changeAbsolute >= 0 ? "pos" : "neg"}`}>
          {changeAbsolute >= 0 ? "+" : ""}{changePercent?.toFixed(2)}%
        </span>
      </div>
    </div>
  );

  return slug ? (
    <Link to={`/etf-mining/${slug}`} style={{ textDecoration: "none", color: "inherit" }}>
      {content}
    </Link>
  ) : (
    content
  );
};

const DataEUR = ({ notificationHook = null }) => {
  const [dataEUR, setDataEUR] = useState({});

  // KIỂM TRA URL: Nếu chứa sharkglobalchart thì ép hiển thị Grid (Dọc)
  const isGridPage = window.location.hash.includes('sharkglobalchart');

  const tickerArray = [
    'SILV.L',   // Global X Silver Miners
    'IAUP.L',   // iShares Gold Producers
    'AUCO.L',   // L&G Gold Mining
    'UBUD.DE',  // UBS Pure Gold Miners
    'GDX.L',    // VanEck Gold Miners
    'ESGO.L',   // HANetf AuAg ESG
    'M9SD.DE',  // Market Access Gold Bugs
    'GDXJ.L',   // VanEck Junior Gold
    'WMIN.DE'   // VanEck S&P Global Mining
  ];
  const nameArray = ['Global X Silver Miners', 'iShares Gold Producers', 'L&G Gold Mining', 'UBS Pure Gold Miners', 'VanEck Gold Miners', 'HANetf AuAg ESG', 'Market Access Gold Bugs', 'VanEck Junior Gold', 'VanEck S&P Global Mining'];

  const apiSlug = [
    'global_x_silver_miners',
    'iShares_Gold_Producers_UCITS',
    'LG_Gold_Mining_UCITS_ETF',
    'UBS_Solactive_Global_Pure_Gold_Miners',
    'VanEck_Gold_Miners_UCITS_ETF',
    'HANetf_AuAg_ESG_Gold_Mining_UCITS',
    'Market_Access_NYSE_Arca_Gold_Bugs_UCITS',
    'VanEck_Junior_Gold_Miners_UCITS',
    'VanEck_SP_Global_Mining_UCITS_ETF_A',
  ];

  const apiSlugMap = {};
  nameArray.forEach((name, index) => {
    apiSlugMap[name] = apiSlug[index];
  });

  useEffect(() => {
    // 1. Khởi tạo dữ liệu từ bộ nhớ đệm toàn cục (nếu đã có)
    const initialData = {};
    tickerArray.forEach((symbol, idx) => {
      const globalData = globalYahooStocks[symbol];
      if (globalData) {
        initialData[nameArray[idx]] = {
          prc: globalData.changePercent,
          amt: globalData.change,
          ask: globalData.price
        };
      }
    });
    setDataEUR(initialData);

    // 2. Lắng nghe cập nhật từ Socket tập trung
    const handlePriceUpdate = (e) => {
      const decoded = e.detail;
      if (tickerArray.includes(decoded.symbol || decoded.id)) {
        const index = tickerArray.indexOf(decoded.symbol || decoded.id);
        const name = nameArray[index];
        const update = {
          prc: decoded.changePercent,
          amt: decoded.change,
          ask: decoded.price
        };

        setDataEUR(prev => ({ ...prev, [name]: update }));
        if (notificationHook) {
          notificationHook.dataEURRef.current[name] = update;
        }
      }
    };

    window.addEventListener('yahooPriceAlert', handlePriceUpdate);
    return () => window.removeEventListener('yahooPriceAlert', handlePriceUpdate);
  }, [notificationHook]);

  const displayData = Object.entries(dataEUR).map(([name, val]) => ({
    name, price: val.ask, changeAbsolute: val.amt, changePercent: val.prc, slug: apiSlugMap[name]
  }));

  return (
    <div className={isGridPage ? "shark-v3-main-container force-grid" : "shark-v3-main-container force-ticker"}>
      {displayData.map((item, index) => (
        <ETFSingleRow
          key={index}
          name={item.name}
          price={item.price}
          changeAbsolute={item.changeAbsolute}
          changePercent={item.changePercent}
          slug={item.slug}
          isGridMode={isGridPage}
        />
      ))}
    </div>
  );
};

export default DataEUR;