import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTranslation } from "react-i18next";
const Thresholds = {
  XAU: { day: 5, day2: 7, week: 10, week2: 12, month: 15, month2: 20 },
  XAG: { day: 10, day2: 12, week: 15, week2: 20, month: 30, month2: 40 }
};

const isUSHoliday = (date) => {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayOfWeek = d.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return true;
  if (month === 1 && day === 1) return true;
  if (month === 12 && day === 25) return true;
  return false;
};

const PriceDisplay = ({ price, isMobile }) => {
  return (
    <div style={{
      fontSize: isMobile ? '20px' : '28px',
      fontWeight: '900',
      fontFamily: 'monospace',
      color: '#fff'
    }}>
      ${price ? price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "---"}
    </div>
  );
};

const StatusCircle = ({ label, currentVal, targetData, threshold, colorTheme, isMobile }) => {
  if (!currentVal || !targetData) return <div style={{ flex: 1 }}></div>;

  const targetVal = targetData.close;
  const diff = ((currentVal - targetVal) / targetVal) * 100;
  const isAlert = Math.abs(diff) >= threshold;
  const { t, i18n } = useTranslation();
  // LOGIC MỚI: Xác định màu sắc dựa trên hướng giá
  const isBuy = diff < 0; // Giá hiện tại thấp hơn giá mục tiêu => MUA
  const alertColor = isBuy ? '#22c55e' : '#ff4d4d'; // Xanh lá cho Mua, Đỏ cho Bán
  const statusColor = isAlert ? alertColor : colorTheme;

  const chartData = [
    { value: Math.abs(diff) },
    { value: Math.max(0.01, threshold - Math.abs(diff)) }
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: isMobile ? 'row' : 'column',
      alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'center',
      padding: '10px', borderRadius: '12px',
      // Đổi nền nhẹ theo màu cảnh báo
      background: isAlert ? (isBuy ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 77, 77, 0.12)') : 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${isAlert ? alertColor : 'rgba(255,255,255,0.05)'}`,
      flex: 1
    }}>
      <div style={{ textAlign: isMobile ? 'left' : 'center' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{label}</span>
        <div style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 'bold' }}>{targetVal.toLocaleString()}</div>
      </div>

      <div style={{ width: isMobile ? 55 : 70, height: isMobile ? 55 : 70, position: 'relative' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={isMobile ? 20 : 26}
              outerRadius={isMobile ? 24 : 30}
              dataKey="value"
              startAngle={90}
              endAngle={450}
              stroke="none"
              isAnimationActive={true}
            >
              <Cell fill={statusColor} />
              <Cell fill="#1e293b" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Đổi màu số % hiển thị bên trong vòng tròn */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '9px', fontWeight: '900',
          color: isAlert ? alertColor : '#fff',
        }}>
          {diff > 0 ? '+' : ''}{diff.toFixed(2)}%
        </div>
      </div>
      {!isMobile && (
        <p style={{
          fontSize: '9px', fontWeight: '900', marginTop: '6px',
          color: isAlert ? alertColor : '#475569',
          margin: '4px 0 0 0'
        }}>
          {isAlert ? (isBuy ? t("GoldSilverDashBoard.buy") : t("GoldSilverDashBoard.sell")) : t("GoldSilverDashBoard.stable")}
        </p>
      )}
    </div>
  );
};
const GoldSilverDashBoard = () => {
  const [historical, setHistorical] = useState({ xau: null, xag: null });
  const [realTime, setRealTime] = useState({ XAU: 0, XAG: 0 });
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { t, i18n } = useTranslation();
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    handleResize();

    fetch('https://api_gold.thinkdiff.us/gia_vang_bac_1thang_1tuan_1ngay')
      .then(res => res.json())
      .then(json => {
        const process = (list) => {
          if (!list || list.length === 0) return null;

          // Lọc bỏ ngày lễ/cuối tuần
          const days = list.filter(item => !isUSHoliday(item.date));

          // --- THAY ĐỔI LOGIC TẠI ĐÂY ---

          // 1. Lấy mốc gần nhất có dữ liệu (ví dụ 3/3) làm mốc so sánh chính
          const yesterday = days[0];

          // 2. Mốc 2 ngày trước (ngày 2/3)
          const day2 = days[1];

          // 3. Mốc 1 tuần: Lấy ngày Thứ 6 gần nhất (không tính ngày index 0 nếu nó là Thứ 6)
          // Hoặc fallback về ngày thứ 5 trong danh sách nếu không tìm thấy Thứ 6
          const lastWeek = days.find((item, idx) => (new Date(item.date).getDay() === 5 && idx >= 0)) || days[4];

          // 4. Mốc 2 tuần: Tìm ngày Thứ 6 tiếp theo sau mốc 1 tuần
          const week2 = days.filter((item, idx) => (new Date(item.date).getDay() === 5))[1] || days[9];

          // 5. Mốc 1 tháng: Tìm ngày đầu tiên của tháng hiện tại (trong dữ liệu)
          const lastMonth = [...days].reverse().find(item =>
            new Date(item.date).getMonth() === new Date(days[0].date).getMonth()
          );

          // 6. Mốc 2 tháng: Lấy phần tử cuối cùng của mảng dữ liệu (thường là ~30-60 ngày trước)
          const month2 = days[days.length - 1];

          return { yesterday, lastWeek, lastMonth, day2, week2, month2 };
        };
        setHistorical({ xau: process(json?.xau), xag: process(json?.xag) });
        setLoading(false);
      })
      .catch((err) => {
        console.warn("GoldSilverDashBoard fetch error:", err);
        setHistorical({ xau: null, xag: null });
        setLoading(false);
      });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const ws = new WebSocket("wss://api-ui.hyperliquid.xyz/ws");

    ws.onopen = () => {
      ["cash:GOLD", "cash:SILVER"].forEach((coin) => {
        ws.send(JSON.stringify({
          method: "subscribe",
          subscription: { type: "activeAssetCtx", coin }
        }));
      });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.channel !== "activeAssetCtx") return;

        const coin = msg.data?.coin;
        const price = parseFloat(msg.data?.ctx?.markPx);

        let nXAU = 0, nXAG = 0;

        if (coin === "cash:GOLD") nXAU = price;
        if (coin === "cash:SILVER") nXAG = price;

        if (nXAU || nXAG) {
          setRealTime(prev => ({
            XAU: nXAU || prev.XAU,
            XAG: nXAG || prev.XAG
          }));
        }

      } catch (e) { }
    };

    return () => ws.close();
  }, []);

  const renderPanel = (symbol, histData, currentPrice, thresholds, themeColor, title) => (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '16px', borderRadius: '16px', borderTop: `4px solid ${themeColor}`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)', flex: 1
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: themeColor, fontSize: '13px', fontWeight: '900', margin: 0 }}>{title}</h2>
        <PriceDisplay price={currentPrice} isMobile={isMobile} />
      </div>

      {/* HÀNG 1 */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', marginBottom: '10px' }}>
        <StatusCircle label={t("GoldSilverDashBoard.day1")} currentVal={currentPrice} targetData={histData?.yesterday} threshold={thresholds.day} colorTheme={themeColor} isMobile={isMobile} />
        <StatusCircle label={t("GoldSilverDashBoard.week1")} currentVal={currentPrice} targetData={histData?.lastWeek} threshold={thresholds.week} colorTheme={themeColor} isMobile={isMobile} />
        <StatusCircle label={t("GoldSilverDashBoard.month1")} currentVal={currentPrice} targetData={histData?.lastMonth} threshold={thresholds.month} colorTheme={themeColor} isMobile={isMobile} />
      </div>

      {/* HÀNG 2 */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
        <StatusCircle label={t("GoldSilverDashBoard.day2")} currentVal={currentPrice} targetData={histData?.day2} threshold={thresholds.day2} colorTheme={themeColor} isMobile={isMobile} />
        <StatusCircle label={t("GoldSilverDashBoard.week2")} currentVal={currentPrice} targetData={histData?.week2} threshold={thresholds.week2} colorTheme={themeColor} isMobile={isMobile} />
        <StatusCircle label={t("GoldSilverDashBoard.month2")} currentVal={currentPrice} targetData={histData?.month2} threshold={thresholds.month2} colorTheme={themeColor} isMobile={isMobile} />
      </div>
    </div>
  );

  if (loading || (!historical.xau && !historical.xag)) return null;

  return (
    <div style={{ backgroundColor: '#020617', padding: '10px 0', minHeight: 'fit-content' }}>
      <div style={{
        maxWidth: '100%',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '15px',
        padding: '0 10px'
      }}>
        {renderPanel('XAU', historical.xau, realTime.XAU, Thresholds.XAU, "#eab308", t("GoldSilverDashBoard.goldWorld"))}
        {renderPanel('XAG', historical.xag, realTime.XAG, Thresholds.XAG, "#94a3b8", t("GoldSilverDashBoard.silverWorld"))}
      </div>
    </div>
  );
};

export default GoldSilverDashBoard;