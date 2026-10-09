import React from "react";
import DataEUR, { useETFMiningNotification } from "./spdr-gold/DataEUR";
import ETFMiningNotification from "./spdr-gold/ETFMiningNotification";
import "./MiningStock.css";

const MiningStock = ({ showTitle = true, notificationHook = null }) => {
  // Chỉ tạo hook khi showTitle=true (HomePage độc lập)
  // Khi showTitle=false (RealTimeTicker), không tạo hook để tránh duplicate
  const notification = showTitle ? (notificationHook || useETFMiningNotification()) : null;

  return (
    <>
      {showTitle && (
        <h2 className="title-shark-global">
          Cổ phiếu khai thác mỏ
        </h2>
      )}
      {showTitle && (
        <div className="mining-stock-container">
          <div className="mining-stock-item">
            <DataEUR notificationHook={notification} />
          </div>
        </div>
      )}
      {/* Render notification component when hook exists */}
      {showTitle && notification && (
        <ETFMiningNotification
          gainNotification={notification.gainNotification}
          lossNotification={notification.lossNotification}
          onGainClose={() => notification.setGainNotification(null)}
          onLossClose={() => notification.setLossNotification(null)}
        />
      )}
      {!showTitle && <DataEUR notificationHook={null} />}
    </>
  );
};

// Export hook để HomePage sử dụng
export { useETFMiningNotification };
export default MiningStock;
