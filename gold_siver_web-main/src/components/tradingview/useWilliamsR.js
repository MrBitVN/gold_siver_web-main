import { useRef } from "react";

const useWilliamsR = (audioWRBuy, audioWRSell, onNotify) => {
  const lastWRAudioTime = useRef({ GOLD: 0, SILVER: 0 });

  const checkWRAlert = (wrVal, type) => {
    const now = Date.now();
    // 60 giây (1 phút) mới báo lại 1 lần cho mỗi loại
    if (now - lastWRAudioTime.current[type] > 60000) {
      if (wrVal >= 80) {
        audioWRSell.current?.play().catch(() => {});
        onNotify({
          id: `${type}-SELL-${now}`,
          type: type,
          action: "SELL",
          wrValue: wrVal.toFixed(2),
          bgColor: "#ff4d4d",
        });
        lastWRAudioTime.current[type] = now;
      } else if (wrVal <= 20) {
        audioWRBuy.current?.play().catch(() => {});
        onNotify({
          id: `${type}-BUY-${now}`,
          type: type,
          action: "BUY",
          wrValue: wrVal.toFixed(2),
          bgColor: "#00ff88",
        });
        lastWRAudioTime.current[type] = now;
      }
    }
  };

  return { checkWRAlert };
};

export default useWilliamsR;
