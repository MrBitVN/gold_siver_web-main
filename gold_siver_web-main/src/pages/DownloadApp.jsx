import React, { useEffect, useState } from "react";
import "./DownloadApp.css";
import { useTranslation } from "react-i18next";
const DownloadApp = () => {
  const { t } = useTranslation();
  const [device, setDevice] = useState("desktop");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent || navigator.vendor;

      if (/Android/i.test(ua)) return "android";
      if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
      if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "ios";

      return "desktop";
    };

    const detectedDevice = detectDevice();
    setDevice(detectedDevice);

    // const popupShown = localStorage.getItem("vang247_popup");

    if (detectedDevice !== "desktop") {
      setTimeout(() => {
        setShowPopup(true);
      }, 1200);
    }
  }, []);

  // const closePopup = () => {
  //   setShowPopup(false);
  //   localStorage.setItem("vang247_popup", "true");
  // };

  useEffect(() => {
    const userAgent = navigator.userAgent;

    console.log("USER AGENT:", userAgent);

    if (/android/i.test(userAgent)) {
      console.log("DETECTED ANDROID");
    }
  }, []);

  return (
    <div className="download-app-container">
      <div className="download-app-header">
        <h1>{t("download.title")}</h1>
        <p>{t("download.subtitle")}</p>
      </div>
      {/* {showPopup && device !== "desktop" && (
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
      )} */}
      {device !== "desktop" && (
        <div className="download-platforms">
          {/* Android Card */}
          {device === "android" && (
            <div className="platform-card android-card">
              <div className="platform-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" className="icon">
                  <path d="M17.6 11.48L19.54 6.2c.37-.78-.44-1.54-1.15-1.15L7.74 13.94c-.6.34-.77 1.13-.39 1.77l1.15 1.9c.26.43.83.64 1.31.33L17.6 11.48zM6.2 19.99c.33.57 1.13.63 1.56.12L18.5 3.62c.39-.53-.09-1.29-.67-1.15L3.06 17.5c-.48.12-.72.73-.46 1.27l3.1 5.16zm6.26-4.13l-4.6 3.86 1.46 2.41 3.14-5.27z" />
                </svg>
              </div>
              <h2>{t("download.android.title")}</h2>
              <p className="platform-description">
                {t("download.android.update", { date: "Mar 6, 2026" })}
              </p>
              <a
                href="https://play.google.com/store/apps/details?id=com.metal_invest.android_vang247"
                className="download-btn android-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18h14v2H5z" />
                </svg>
                {t("download.android.download")}
              </a>
              <p className="file-size">{t("download.android.size", { size: "~50MB" })}</p>
            </div>
          )}
          {/* iOS Card */}
          {device === "ios" && (
            <div className="platform-card ios-card">
              <div className="platform-icon">
                <svg viewBox="0 0 24 24" fill="#FFD93B" className="icon">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 
                0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3.5-7c.83 0 1.5-.67 
                1.5-1.5S9.33 10 8.5 10 7 10.67 7 11.5 7.67 13 8.5 13zm7 
                0c.83 0 1.5-.67 1.5-1.5S16.33 10 15.5 10 14 10.67 14 
                11.5 14.67 13 15.5 13zm-3.5 4c2.33 0 4.31-1.46 
                5.11-3.5H6.89C7.69 15.54 9.67 17 12 17z"/>
                </svg>
              </div>
              <h2>{t("download.ios.title")}</h2>
              <p className="platform-description">
                {t("download.ios.store")}
              </p>
              <a
                href="https://apps.apple.com/us/app/vang247-ai-trending-v%C3%A0ng-gold/id6756841725"
                className="download-btn ios-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18h14v2H5z" />
                </svg>
                {t("download.ios.download")}
              </a>
              <p className="file-size">{t("download.ios.size", { size: "~50MB" })}</p>
            </div>
          )}
        </div>
      )}
      {device === "desktop" && (
        <div className="download-platforms">
          {/* Android Card */}
          <div className="platform-card android-card">
            <div className="platform-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" className="icon">
                <path d="M17.6 11.48L19.54 6.2c.37-.78-.44-1.54-1.15-1.15L7.74 13.94c-.6.34-.77 1.13-.39 1.77l1.15 1.9c.26.43.83.64 1.31.33L17.6 11.48zM6.2 19.99c.33.57 1.13.63 1.56.12L18.5 3.62c.39-.53-.09-1.29-.67-1.15L3.06 17.5c-.48.12-.72.73-.46 1.27l3.1 5.16zm6.26-4.13l-4.6 3.86 1.46 2.41 3.14-5.27z" />
              </svg>
            </div>
            <h2>{t("download.android.title")}</h2>
            <p className="platform-description">
              {t("download.android.update", { date: "Mar 6, 2026" })}
            </p>
            <a
              href="https://play.google.com/store/apps/details?id=com.metal_invest.android_vang247"
              className="download-btn android-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18h14v2H5z" />
              </svg>
              {t("download.android.download")}
            </a>
            <p className="file-size">{t("download.android.size", { size: "~50MB" })}</p>
          </div>

          {/* iOS Card */}
          <div className="platform-card ios-card">
            <div className="platform-icon">
              <svg viewBox="0 0 24 24" fill="#FFD93B" className="icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 
                0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3.5-7c.83 0 1.5-.67 
                1.5-1.5S9.33 10 8.5 10 7 10.67 7 11.5 7.67 13 8.5 13zm7 
                0c.83 0 1.5-.67 1.5-1.5S16.33 10 15.5 10 14 10.67 14 
                11.5 14.67 13 15.5 13zm-3.5 4c2.33 0 4.31-1.46 
                5.11-3.5H6.89C7.69 15.54 9.67 17 12 17z"/>
              </svg>
            </div>
            <h2>{t("download.ios.title")}</h2>
            <p className="platform-description">
              {t("download.ios.store")}
            </p>
            <a
              href="https://apps.apple.com/us/app/vang247-ai-trending-v%C3%A0ng-gold/id6756841725"
              className="download-btn ios-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="btn-icon">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18h14v2H5z" />
              </svg>
              {t("download.ios.download")}
            </a>
            <p className="file-size">{t("download.ios.size", { size: "~50MB" })}</p>
          </div>
        </div>
      )}
      <div className="download-info">
        <div className="info-card">
          <h3>{t("download.features.title")}</h3>
          <ul>
            {t("download.features.items", { returnObjects: true }).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="info-card">
          <h3>{t("download.advantages.title")}</h3>
          <ul>
            {t("download.advantages.items", { returnObjects: true }).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="download-requirements">
        <h3>{t("download.requirements.title")}</h3>
        <div className="requirements-content">
          <div className="requirement">
            <strong>Android:</strong> {t("download.requirements.android")}
          </div>
          <div className="requirement">
            <strong>iOS:</strong> {t("download.requirements.ios")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadApp;
