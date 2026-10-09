import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import './GoldSignalNoti.css';
import { useTranslation } from "react-i18next";
import { saveToNotificationHistory } from "../tradingview/logger";

// 1. Logic lọc ngày nghỉ COMEX chuẩn xác
const isUSHoliday = (date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return true;
    if (month === 1 && day === 1) return true;
    if (month === 7 && day === 4) return true;
    if (month === 11 && day === 11) return true;
    if (month === 12 && day === 25) return true;
    const nthDayInMonth = Math.ceil(day / 7);
    if (month === 1 && dayOfWeek === 1 && nthDayInMonth === 3) return true;
    if (month === 2 && dayOfWeek === 1 && nthDayInMonth === 3) return true;
    if (month === 5 && dayOfWeek === 1 && d > new Date(d.getFullYear(), 4, 24)) return true;
    if (month === 9 && dayOfWeek === 1 && nthDayInMonth === 1) return true;
    if (month === 10 && dayOfWeek === 1 && nthDayInMonth === 2) return true;
    if (month === 11 && dayOfWeek === 4 && nthDayInMonth === 4) return true;
    return false;
};

const GoldSignalNoti = () => {
    const { t, i18n } = useTranslation();
    const [currentNotis, setCurrentNotis] = useState({ left: null, right: null });
    const [fading, setFading] = useState({ left: false, right: false });
    const apiDataCache = useRef(null);
    const audioRef = useRef(new Audio('https://vang247.xyz/beep.mp3'));
    const initialShowRef = useRef(true);
    const handleClose = useCallback(() => {
        setCurrentNotis({ left: null, right: null });
        setFading({ left: false, right: false });
    }, []);

    const calcChange = (cur, prev) => ((cur - prev) / prev) * 100;

    const processPriceAlerts = useCallback(() => {
        if (!apiDataCache.current) return;
        const { xau, xag } = apiDataCache.current;

        const checkAsset = (data, thresholdObj, assetName, color) => {
            // Lọc danh sách ngày giao dịch thực tế
            const tradingDays = data.filter(item => !isUSHoliday(item.date));
            if (tradingDays.length < 2) return null;

            const curP = tradingDays[0].close; // Giá đóng cửa hiện tại
            const currentMonth = new Date(tradingDays[0].date).getMonth();

            // --- LOGIC TARGET THEO YÊU CẦU ---

            // 1. Mốc Ngày: Phiên giao dịch liền trước
            const targetDay = tradingDays[1];

            // 2. Mốc Tuần: Thứ 6 tuần trước (Gần nhất nhưng không phải hôm nay)
            const lastFriday = tradingDays.find((item, idx) => {
                const d = new Date(item.date);
                return d.getDay() === 5 && idx > 0;
            }) || tradingDays[5];

            // 3. Mốc Tháng: Ngày đầu tiên (Mùng 1 hoặc mùng 2) có data của tháng hiện tại
            const firstDayOfMonth = [...tradingDays].reverse().find(item => {
                const d = new Date(item.date);
                return d.getMonth() === currentMonth;
            });

            const config = [
                { scope: 'day', target: targetDay, threshold: thresholdObj.d, label: 'oneDay' },
                { scope: 'week', target: lastFriday, threshold: thresholdObj.w, label: 'oneWeek' },
                { scope: 'month', target: firstDayOfMonth, threshold: thresholdObj.m, label: 'startMonth' }
            ];

            // Ưu tiên báo mốc dài nhất (Tháng -> Tuần -> Ngày)
            const reversedConfig = [...config].reverse();
            for (const c of reversedConfig) {
                if (!c.target) continue;
                const change = calcChange(curP, c.target.close);
                if (Math.abs(change) >= c.threshold) {
                    const notification = {
                        scope: t(`noti.${c.scope}`),
                        asset: assetName,
                        type: change > 0 ? t("noti.sell") : t("noti.buy"),
                        msg: `${change > 0 ? t("noti.increase") : t("noti.decrease")} ${Math.abs(change).toFixed(1)}%`,
                        isPos: change > 0,
                        curPrice: curP,
                        oldPrice: c.target.close,
                        label: t(`noti.${c.label}`),
                        color,
                        date: c.target.date
                    };

                    // --- THÊM ĐOẠN LOGIC LƯU LỊCH SỬ ---
                    const messageLog = `🔔 ${notification.asset} ${notification.type}: ${notification.msg} (so với ${notification.label} ${notification.oldPrice.toFixed(2)})`;
                    saveToNotificationHistory(messageLog, "PREDICTION_ALERT");

                    return notification;
                }
            }
            return null;
        };

        const leftNoti = checkAsset(xau, { d: 5, w: 10, m: 15 }, t("noti.gold"), '#eab308');
        const rightNoti = checkAsset(xag, { d: 10, w: 15, m: 30 }, t("noti.silver"), '#94a3b8');

        if (leftNoti || rightNoti) {
            const showDelay = initialShowRef.current ? 2500 : 0;
            setTimeout(() => {
                setCurrentNotis({ left: leftNoti, right: rightNoti });
                setFading({ left: false, right: false });

                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.log("Audio play blocked"));

                setTimeout(() => setFading({ left: true, right: true }), 10000);
                setTimeout(() => setCurrentNotis({ left: null, right: null }), 12000);
            }, showDelay);
            initialShowRef.current = false;
        }
    }, [t]);

    useEffect(() => {
        const fetchAndProcess = async () => {
            try {
                const res = await axios.get('https://api_gold.thinkdiff.us/gia_vang_bac_1thang_1tuan_1ngay');
                apiDataCache.current = res.data;
                processPriceAlerts();
            } catch (e) { console.error("API Error"); }
        };

        fetchAndProcess();
        const interval = setInterval(fetchAndProcess, 60000); // Check mỗi phút
        return () => clearInterval(interval);
    }, [processPriceAlerts]);

    return (
        <div className="gm-v5-center-screen-container">
            {currentNotis.left && (
                <div className={`noti-slot ${fading.left ? 'fade-out' : 'fade-in'}`}>
                    <NotiCard data={currentNotis.left} onClose={handleClose} />
                </div>
            )}
            {currentNotis.right && (
                <div className={`noti-slot ${fading.right ? 'fade-out' : 'fade-in'}`}>
                    <NotiCard data={currentNotis.right} onClose={handleClose} />
                </div>
            )}
        </div>
    );
};

const NotiCard = ({ data, onClose, t = useTranslation()[0] }) => (
    <div className={`noti-card-v5 ${data.isPos ? 'sell' : 'buy'}`} style={{ position: 'relative' }}>
        <button
            className="noti-close-btn"
            onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }}
            aria-label="Close notification"
            title={t("noti.close")}
            style={{
                position: 'absolute',
                right: 8,
                top: 8,
                border: 'none',
                background: 'transparent',
                color: '#fff',
                fontSize: 18,
                cursor: 'pointer',
                padding: 0,
                lineHeight: '1'
            }}
        >
            ×
        </button>
        <div className="noti-left">
            <div className="header-row-v5">
                <span className="badge-v5">[{data.scope}]</span>
                <span className="asset-v5" style={{ color: data.color }}>{data.asset}</span>
            </div>
            <div className="action-v5">{data.type}</div>
            <div className="msg-v5">{data.msg}</div>
        </div>

        <div className="divider-vertical" aria-hidden="true" />

        <div className="noti-right">
            <div className="compare-v5">
                <div className="p-item-v5">
                    <label>{t("noti.current")}:</label>
                    <span>{data.curPrice.toLocaleString()}</span>
                </div>
                <div className="p-item-v5">
                    <label>{data.label}:</label>
                    <span>{data.oldPrice.toLocaleString()}</span>
                </div>
            </div>
        </div>
    </div>
);

export default GoldSignalNoti;