import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from "react-i18next";
// URL WebSocket
const SOCKET_URL = "wss://api-ui.hyperliquid.xyz/ws";

function formatNumberShort(value) {
    if (value === null || value === undefined) return "0";
    const abs = Math.abs(value);
    if (abs >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2).replace(/\.0$/, "") + "B";
    if (abs >= 1_000_000) return (value / 1_000_000).toFixed(2).replace(/\.0$/, "") + "M";
    if (abs >= 1_000) return (value / 1_000).toFixed(2).replace(/\.0$/, "") + "K";
    return value.toString();
}

const OrderBook = ({ type = "SILVER" }) => {
    const { t } = useTranslation();
    const [bids, setBids] = useState([]);
    const [asks, setAsks] = useState([]);
    const [spread, setSpread] = useState({ val: 0, percent: 0 });
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [showNoti, setShowNoti] = useState(false);
    const historyRef = useRef([]);
    const [showOverlay, setShowOverlay] = useState(false);
    const pauseHistoryRef = useRef(false);

    const COIN_ID = `xyz:${type}`;
    const rawDataRef = useRef({ bids: [], asks: [] });

    useEffect(() => {
        const notiInterval = setInterval(() => {
            setShowNoti(true);
            setTimeout(() => {
                setShowNoti(false);
            }, 5000);
        }, 30000);

        return () => clearInterval(notiInterval);
    }, []);

    useEffect(() => {
        const ws = new WebSocket(SOCKET_URL);
        ws.onopen = () => {
            const msg = {
                method: "subscribe",
                subscription: {
                    type: "l2Book",
                    coin: COIN_ID,
                    nSigFigs: null
                }
            };
            ws.send(JSON.stringify(msg));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const data = message.data;

            if (data && data.levels) {
                rawDataRef.current = {
                    bids: data.levels[0],
                    asks: data.levels[1]
                };
                if (!pauseHistoryRef.current) {
                    historyRef.current.push({
                        coin: data.coin,
                        levels: data.levels,
                        time: data.time || Date.now()
                    });
                    if (historyRef.current.length > 50) {
                        historyRef.current.shift();
                    }
                }
            }
        };

        const interval = setInterval(() => {
            processOrderBook();
        }, 200);

        return () => {
            ws.close();
            clearInterval(interval);
        };
    }, [COIN_ID]);

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedSeconds(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    function formatElapsedTime(totalSeconds) {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return [
            h.toString().padStart(2, "0"),
            m.toString().padStart(2, "0"),
            s.toString().padStart(2, "0")
        ].join(":");
    }

    const processOrderBook = () => {
        const rawBids = rawDataRef.current.bids;
        const rawAsks = rawDataRef.current.asks;
        if (rawBids.length === 0 || rawAsks.length === 0) return;

        let askTotal = 0;
        const processedAsks = rawAsks.slice(0, 15).map(item => {
            const size = parseFloat(item.sz);
            askTotal += size;
            return { price: parseFloat(item.px), size: size, total: askTotal };
        }).reverse();

        let bidTotal = 0;
        const processedBids = rawBids.slice(0, 15).map(item => {
            const size = parseFloat(item.sz);
            bidTotal += size;
            return { price: parseFloat(item.px), size: size, total: bidTotal };
        });

        const bestBid = parseFloat(rawBids[0].px);
        const bestAsk = parseFloat(rawAsks[0].px);
        const spreadVal = bestAsk - bestBid;
        const spreadPercent = (spreadVal / bestAsk) * 100;

        setAsks(processedAsks);
        setBids(processedBids);
        setSpread({ val: spreadVal, percent: spreadPercent });
    };

    const allToltalBids = useRef(0);
    const allToltalAsks = useRef(0);

    const { maxTotal, buyPercent, sellPercent, a, b } = useMemo(() => {
        const maxBidVol = bids.length > 0 ? bids[bids.length - 1].total : 0;
        const maxAskVol = asks.length > 0 ? asks[0].total : 0;

        allToltalBids.current = allToltalBids.current + bids.reduce((sum, item) => sum + (item?.total || 0), 0);
        allToltalAsks.current = allToltalAsks.current + asks.reduce((sum, item) => sum + (item?.total || 0), 0);

        const grandTotal = allToltalBids.current + allToltalAsks.current;
        let bPercent = 50;
        if (grandTotal > 0) {
            bPercent = (allToltalBids.current / grandTotal) * 100;
        }

        return {
            maxTotal: Math.max(maxBidVol, maxAskVol),
            buyPercent: bPercent,
            sellPercent: 100 - bPercent,
            a: allToltalBids.current,
            b: allToltalAsks.current
        };
    }, [bids, asks]);

    const typeLabel = type === "GOLD" ? "Vàng" : "Bạc";

    return (
        <div style={styles.container} onClick={() => { setShowOverlay(true); pauseHistoryRef.current = true; }}>
            <style>
                {`
                @keyframes vanishIn {
                    0% { opacity: 0; transform: translate(-50%, 0) scale(2); filter: blur(10px); }
                    100% { opacity: 1; transform: translate(-50%, 0) scale(1); filter: blur(0); }
                }
                @media (max-width: 600px) {
                    .noti-gold { left: 30% !important; }
                    .noti-silver { left: 70% !important; }
                }
                `}
            </style>

            {showNoti && (
                <div
                    className={type === "GOLD" ? "noti-gold" : "noti-silver"}
                    style={{
                        ...styles.notification,
                        left: type === "GOLD" ? "45%" : "55%",
                        borderColor: buyPercent > 50 ? "#3b82f6" : "#ef4444"
                    }}
                >
                    <div style={{ fontWeight: 'bold' }}>
                        {typeLabel}: {buyPercent.toFixed(1)}%
                    </div>
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, color: type === "SILVER" ? "#95a5a6" : "#f1c40f" }}>
                    {type === "GOLD"
                        ? t("orderBook.metal.gold")
                        : t("orderBook.metal.silver")}
                </h2>
                <span style={{ fontSize: "11px", color: "#848E9C" }}>
                    ⏱ {t("orderBook.elapsedTime")}: {formatElapsedTime(elapsedSeconds)}
                </span>
            </div>

            <div style={styles.ratioContainer}>
                <div style={styles.ratioLabel}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#3b82f6' }}>Buy {buyPercent.toFixed(1)}% </span>
                        <span style={{ color: '#3b82f6' }}>{t("orderBook.total")}: {formatNumberShort(a)}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ color: '#ef4444' }}>Sell {sellPercent.toFixed(1)}% </span>
                        <span style={{ color: '#ef4444' }}>{t("orderBook.total")}: {formatNumberShort(b)}</span>
                    </div>
                </div>
                <div style={styles.ratioBarBg}>
                    <div style={{ ...styles.ratioFill, width: `${buyPercent}%`, backgroundColor: '#3b82f6' }} />
                    <div style={{ ...styles.ratioFill, width: `${sellPercent}%`, backgroundColor: '#ef4444' }} />
                </div>
            </div>

            <div style={styles.header}>
                <div style={styles.colLeft}>Price</div>
                <div style={styles.colRight}>Size ({type})</div>
                <div style={styles.colRight}>Total ({type})</div>
            </div>

            <div style={styles.listContainer}>
                {asks.map((item, idx) => (
                    <OrderRow key={`ask-${idx}`} item={item} maxTotal={maxTotal} type="ask" />
                ))}
            </div>

            <div style={styles.spreadRow}>
                <span style={{ color: '#888' }}>{t("orderBook.spread")}</span>
                <span style={{ fontWeight: 'bold' }}>{spread.val.toFixed(2)}</span>
                <span style={{ color: '#888' }}>{spread.percent.toFixed(3)}%</span>
            </div>

            <div style={styles.listContainer}>
                {bids.map((item, idx) => (
                    <OrderRow key={`bid-${idx}`} item={item} maxTotal={maxTotal} type="bid" />
                ))}
            </div>

            {showOverlay && (
                <DataOverlay
                    data={historyRef.current}
                    onClose={() => {
                        pauseHistoryRef.current = false;
                        setShowOverlay(false);
                    }}
                    type={type}
                />
            )}
        </div>
    );
};

// ... (Các component phụ OrderRow, DataOverlay và processLevels, formatDateTime giữ nguyên) ...

const OrderRow = ({ item, maxTotal, type }) => {
    const isAsk = type === 'ask';
    const color = isAsk ? '#FF5353' : '#00C076';
    const bg = isAsk ? 'rgba(255, 83, 83, 0.15)' : 'rgba(0, 192, 118, 0.15)';
    const widthPercent = maxTotal > 0 ? Math.min((item.total / maxTotal) * 100, 100) : 0;

    return (
        <div style={styles.row}>
            <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0,
                width: `${widthPercent}%`, backgroundColor: bg, zIndex: 0,
                transition: 'width 0.2s ease-out'
            }} />
            <span style={{ ...styles.cellLeft, color: color }}>{item.price.toFixed(2)}</span>
            <span style={styles.cellRight}>{item.size.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span style={styles.cellRight}>{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
    );
};

function processLevels(levels, limit = 15) {
    const [rawBids, rawAsks] = levels;
    let bidTotal = 0;
    const bids = rawBids.slice(0, limit).map(item => {
        bidTotal += Number(item.sz);
        return { price: Number(item.px), size: Number(item.sz), total: bidTotal };
    });
    let askTotal = 0;
    const asks = rawAsks.slice(0, limit).map(item => {
        askTotal += Number(item.sz);
        return { price: Number(item.px), size: Number(item.sz), total: askTotal };
    }).reverse();
    const maxTotal = Math.max(bids[bids.length - 1]?.total || 0, asks[0]?.total || 0);
    return { bids, asks, maxTotal };
}

function formatDateTime(ts) {
    const d = new Date(ts);
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ss = d.getSeconds().toString().padStart(2, "0");
    const ms = d.getMilliseconds().toString().padStart(3, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    const MM = (d.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${hh}:${mm}:${ss}:${ms} ${dd}/${MM}/${yyyy}`;
}

const DataOverlay = ({ data, onClose, type }) => {
    return (
        <div style={overlayStyles.backdrop} onClick={onClose}>
            <div style={overlayStyles.panel} onClick={(e) => e.stopPropagation()}>
                <div style={overlayStyles.header}>
                    <h2>History {` ${type}`}</h2>
                    <button style={overlayStyles.closeBtn} onClick={onClose}>✖</button>
                </div>
                <div style={overlayStyles.content}>
                    {data.map((item, idx) => {
                        const { bids, asks, maxTotal } = processLevels(item.levels);
                        return (
                            <div key={idx} style={overlayStyles.snapshot}>
                                <div style={overlayStyles.time}>{formatDateTime(item.time)}</div>
                                <div style={styles.header}>
                                    <div style={styles.colLeft}>Price</div>
                                    <div style={styles.colRight}>Size ({type})</div>
                                    <div style={styles.colRight}>Total ({type})</div>
                                </div>
                                <div style={styles.listContainer}>
                                    {asks.map((row, i) => (
                                        <OrderRow key={`ask-${idx}-${i}`} item={row} maxTotal={maxTotal} type="ask" />
                                    ))}
                                </div>
                                <div style={styles.listContainer}>
                                    {bids.map((row, i) => (
                                        <OrderRow key={`bid-${idx}-${i}`} item={row} maxTotal={maxTotal} type="bid" />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const overlayStyles = {
    backdrop: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" },
    panel: { width: "90%", maxWidth: "800px", maxHeight: "90vh", backgroundColor: "#161A25", borderRadius: "6px", overflow: "hidden", display: "flex", flexDirection: "column" },
    header: { display: "flex", justifyContent: "space-between", padding: "10px", borderBottom: "1px solid #2B3139", fontWeight: "bold" },
    content: { overflowY: "auto", padding: "10px" },
    snapshot: { marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #2B3139" },
    time: { fontSize: "11px", color: "#9CA3AF", marginBottom: "6px" },
    closeBtn: { background: "transparent", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer" }
};

const styles = {
    container: {
        width: '520px',
        backgroundColor: '#161A25',
        color: '#F0F3FA',
        fontFamily: 'Consolas, monospace',
        fontSize: '12px',
        padding: '8px',
        borderRadius: '4px',
        position: 'relative'
    },
    notification: {
        position: 'fixed',
        top: '20px', // Đưa lên phía trên màn hình
        transform: 'translateX(-50%)', // Chỉ căn giữa ngang
        width: 'auto',
        minWidth: '100px',
        padding: '10px 15px',
        backgroundColor: '#1e232f',
        color: '#fff',
        borderRadius: '8px',
        borderLeft: '5px solid',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        zIndex: 10000,
        fontSize: '14px',
        textAlign: 'center',
        animation: 'vanishIn 0.5s ease-out forwards',
        whiteSpace: 'nowrap'
    },
    ratioContainer: { marginBottom: '10px' },
    ratioLabel: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold' },
    ratioBarBg: { display: 'flex', height: '6px', width: '100%', backgroundColor: '#2a2e39', borderRadius: '3px', overflow: 'hidden' },
    ratioFill: { height: '100%', transition: 'width 0.3s ease-in-out' },
    header: { display: 'flex', color: '#848E9C', marginBottom: '8px', padding: '0 4px' },
    colLeft: { flex: 1, textAlign: 'left' },
    colRight: { flex: 1, textAlign: 'right' },
    listContainer: { display: 'flex', flexDirection: 'column' },
    row: { display: 'flex', position: 'relative', height: '20px', alignItems: 'center', cursor: 'pointer', padding: '0 4px', marginBottom: '1px' },
    cellLeft: { flex: 1, textAlign: 'left', zIndex: 1, position: 'relative' },
    cellRight: { flex: 1, textAlign: 'right', zIndex: 1, position: 'relative', color: '#EAECEF' },
    spreadRow: {
        display: 'flex', justifyContent: 'space-between', padding: '8px 4px', fontSize: '13px',
        borderTop: '1px solid #2B3139', borderBottom: '1px solid #2B3139', margin: '4px 0'
    },
};

export default OrderBook;