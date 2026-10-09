import React, { useEffect, useState } from "react";
import "./DownloadApp.css";

const AppDownloadPopup = () => {
  const [device, setDevice] = useState("desktop");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor;

    let detected = "desktop";

    if (/Android/i.test(ua)) detected = "android";
    else if (/iPhone|iPad|iPod/i.test(ua)) detected = "ios";
    else if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) detected = "ios";

    setDevice(detected);

    if (detected !== "desktop") {
      setTimeout(() => {
        setShowPopup(true);
      }, 1200);
    }
  }, []);

  const closePopup = () => {
    setShowPopup(false);
  };

  if (!showPopup || device === "desktop") return null;

  return (
    <div className="app-overlay">
      <div className="app-popup">
        <button className="popup-close" onClick={closePopup}>✕</button>

        <h2>Tải App Vàng247</h2>
        <p>Xem giá vàng nhanh hơn trên ứng dụng</p>

        {device === "android" && (
          <a
            href="https://play.google.com/store/apps/details?id=com.metal_invest.android_vang247"
            className="download-btn android-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            📱 Tải Google Play
          </a>
        )}

        {device === "ios" && (
          <a
            href="https://apps.apple.com/us/app/vang247-ai-trending-v%C3%A0ng-gold/id6756841725"
            className="download-btn ios-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            🍎 Tải App Store
          </a>
        )}
      </div>
    </div>
  );
};

export default AppDownloadPopup;