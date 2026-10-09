import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import useRealTimeData from "../../hooks/useRealTimeData";
import "./MetalStatusBars.css";

const MetalStatusBars = () => {
  const { t } = useTranslation();
  const { liveData } = useRealTimeData();
  const [data, setData] = useState({
    GOLD: {
      height: 0,
      color: "#FFD700",
      pct: "0.0000",
      side: "up",
      status: "",
    },
    SILVER: {
      height: 0,
      color: "#E0E0E0",
      pct: "0.0000",
      side: "up",
      status: "",
    },
  });

  const [isVisible, setIsVisible] = useState(true);
  const [isDisintegrating, setIsDisintegrating] = useState(false);
  const [showBars, setShowBars] = useState(false);
  const [tooltip, setTooltip] = useState({
    visible: false,
    text: "",
    x: 0,
    y: 0,
    color: "",
  });
  const [notification, setNotification] = useState(null);

  const lastAudioTime = useRef({ GOLD: 0, SILVER: 0 });
  const lastPrices = useRef({ GOLD: null, SILVER: null });

  useEffect(() => {
    const handleScroll = () => setShowBars(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const triggerNotification = (type, side) => {
    const threshold = type === "GOLD" ? "5%" : "10%";
    const metalName = type === "GOLD" ? t("MetalStatusBars.gold") : t("MetalStatusBars.silver");
    const metalColor = type === "GOLD" ? "#FFD700" : "#E0E0E0";
    const isUp = side === "up";

    setNotification({
      label: t("MetalStatusBars.strongMove", { metal: metalName }),
      name: isUp
        ? t("MetalStatusBars.sellAdvice")
        : t("MetalStatusBars.buyAdvice"),
      message: t("MetalStatusBars.directionMessage", {
        metal: metalName,
        direction: isUp ? t("MetalStatusBars.up") : t("MetalStatusBars.down"),
        threshold,
      }),
      color: metalColor,
      pct: parseFloat(data[type].pct),
      side: side,
      type: type,
    });

    setTimeout(() => setNotification(null), 8000);
  };

  const getStatus = (type, ratioValue) => {
    const threshold = type === "GOLD" ? 5 : 10;
    const absRatio = Math.abs(ratioValue);
    const height = Math.min((absRatio / threshold) * 100, 100);
    let side = ratioValue >= 0 ? "up" : "down";
    let status =
      absRatio >= threshold
        ? ratioValue > 0
          ? "CRITICAL_UP"
          : "CRITICAL_DOWN"
        : "";

    if (status && Date.now() - lastAudioTime.current[type] > 60000) {
      const audioUrl =
        ratioValue > 0 ? "/ban_tang_10_phantram.mp3" : "/qua_ban.mp3";
      new Audio(audioUrl).play().catch(() => {});
      lastAudioTime.current[type] = Date.now();
      triggerNotification(type, side);
    }
    return {
      height,
      color: type === "GOLD" ? "#FFD700" : "#E0E0E0",
      pct: absRatio.toFixed(4),
      side,
      status,
    };
  };

  const testData = (type, value) => {
    setData((prev) => ({ ...prev, [type]: getStatus(type, value) }));
  };

  useEffect(() => {
    if (!liveData) return;

    const currentGold = liveData.vnGold?.buy || 0;
    const currentSilver = liveData.vnSilver?.buy || 0;

    let goldChangePct = 0;
    let silverChangePct = 0;

    if (
      lastPrices.current.GOLD !== null &&
      currentGold !== lastPrices.current.GOLD
    ) {
      goldChangePct =
        ((currentGold - lastPrices.current.GOLD) / lastPrices.current.GOLD) *
        100;
    }
    if (
      lastPrices.current.SILVER !== null &&
      currentSilver !== lastPrices.current.SILVER
    ) {
      silverChangePct =
        ((currentSilver - lastPrices.current.SILVER) /
          lastPrices.current.SILVER) *
        100;
    }

    lastPrices.current = { GOLD: currentGold, SILVER: currentSilver };

    setData({
      GOLD: getStatus("GOLD", goldChangePct),
      SILVER: getStatus("SILVER", silverChangePct),
    });
  }, [liveData]);

  if (!isVisible) return null;

  return (
    <>
      {notification && (
        <div
          className={`etf-notification ${notification.type === "GOLD" ? "gold-notification" : "silver-notification"}`}
          style={{
            bottom: "20px",
            left: "20px",
            opacity: 1,
            transform: "translateY(0)",
            pointerEvents: "auto",
          }}
        >
          <div className="notification-inner">
            <button
              className="notification-close"
              onClick={() => setNotification(null)}
            >
              ×
            </button>
            <div
              className="notification-label"
              style={{ textAlign: "left", color: notification.color }}
            >
              {notification.label}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{ fontSize: "12px", fontWeight: "700", color: "#fff" }}
                >
                  {notification.name}
                </span>
                <span style={{ fontSize: "9px", color: "#9ca3af" }}>
                  {notification.message}
                </span>
              </div>
              <span
                className={`notification-pct ${notification.side === "up" ? "pos" : "neg"}`}
              >
                {notification.side === "up" ? "+" : "-"}
                {notification.pct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {tooltip.visible && (
        <div
          className="mouse-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            borderColor: tooltip.color,
            color: tooltip.color,
          }}
        >
          {tooltip.text}
        </div>
      )}

      {["GOLD", "SILVER"].map((key) => (
        <div
          key={key}
          className={`sparkle-container ${key === "GOLD" ? "gold-pos" : "silver-pos"} ${isDisintegrating ? "disintegrate" : ""} ${showBars ? "visible-bar" : "hidden-bar"}`}
        >
          <button
            className="btn-close-clean"
            onClick={() => setIsDisintegrating(true)}
          >
            ×
          </button>
          <div className="pct-label-clean" style={{ color: data[key].color }}>
            {data[key].side === "down" ? "-" : ""}
            {data[key].pct}%
          </div>
          <div
            className="sparkle-rail"
            onMouseMove={(e) =>
              setTooltip({
                visible: true,
                text: t("MetalStatusBars.tooltip", {
                  direction: data[key].side === "up" ? t("MetalStatusBars.up") : t("MetalStatusBars.down"),
                  metal: key === "GOLD" ? t("MetalStatusBars.gold") : t("MetalStatusBars.silver"),
                }),
                x: e.clientX + (key === "GOLD" ? 25 : -220),
                y: e.clientY + 5,
                color: data[key].color,
              })
            }
            onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
          >
            <div className="mid-line-center"></div>
            <div
              className={`sparkle-fill ${data[key].side} ${data[key].status}`}
              style={{
                height: `${data[key].height}%`,
                backgroundColor: data[key].color,
              }}
            >
              <div className="firework-head">
                {[1, 2, 3, 4, 5].map((p) => (
                  <div key={p} className={`spark-particle p${p}`}></div>
                ))}
              </div>
            </div>
          </div>
          <div className="metal-label-text">
            {key === "GOLD" ? "VÀNG" : "BẠC"}
          </div>
          <div className="test-btns-under">
            <button onClick={() => testData(key, key === "GOLD" ? 6 : 11)}>
              Test Tăng
            </button>
            <button onClick={() => testData(key, key === "GOLD" ? -6 : -11)}>
              Test Giảm
            </button>
          </div>
        </div>
      ))}
    </>
  );
};

export default MetalStatusBars;
