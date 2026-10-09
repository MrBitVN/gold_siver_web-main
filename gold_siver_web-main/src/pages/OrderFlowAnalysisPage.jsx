import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList, Cell } from 'recharts';
import axios from 'axios';
import { logUserInfo } from '../utils/logUserInfo';
import { useTranslation } from 'react-i18next';

const OrderFlowAnalysisPage = () => {
    const { t } = useTranslation();
    const { type, day, month, year } = useParams();
    const navigate = useNavigate();

    const retryCount = useRef(0);
    const isFirstRun = useRef(true);
    const [data, setData] = useState({ gold: [], silver: [] });
    const [loading, setLoading] = useState(true);
    const [updateTime, setUpdateTime] = useState("");

    // State để nhận diện mobile cho việc tinh chỉnh CSS
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const activeTab = type || 'silver';
    const themeColor = activeTab === 'gold' ? '#FFD700' : '#C0C0C0';
    const today = new Date();

    const [currentDate, setCurrentDate] = useState(() => {
        if (day && month && year) return new Date(year, month - 1, day);
        return today;
    });

    useEffect(() => {
        logUserInfo("Trang OrderFlowAnalysisPage Timeline");
    }, []);

    const updateURL = (newTab, newDate, replace = false) => {
        const d = newDate.getDate();
        const m = newDate.getMonth() + 1;
        const y = newDate.getFullYear();
        navigate(`/orderflowanalysis/${newTab}/${d}/${m}/${y}`, { replace });
    };

    const formatDateStr = (date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        return `${d}_${m}_${date.getFullYear()}`;
    };

    useEffect(() => {
        if (!day && isFirstRun.current) {
            setCurrentDate(today);
            updateURL(activeTab, today, true);
        } else if (day && month && year) {
            const targetDate = new Date(year, month - 1, day);
            if (formatDateStr(targetDate) !== formatDateStr(currentDate)) {
                setCurrentDate(targetDate);
            }
        }
        isFirstRun.current = false;
    }, [day, month, year, type]);

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            try {
                const response = await axios.get(`https://api_gold.thinkdiff.us/tile_mua_ban_check_giao_dich/${formatDateStr(currentDate)}`);

                const findTimeUpdate = (obj) => {
                    if (!obj || typeof obj !== 'object') return null;
                    if (obj.hasOwnProperty('time_update')) return obj.time_update;
                    for (let key in obj) {
                        let found = findTimeUpdate(obj[key]);
                        if (found) return found;
                    }
                    return null;
                };

                const timeFound = findTimeUpdate(response.data);
                const root = response?.data?.tile_mua_ban_check_giao_dich;

                if (!root || (root.list_tongtien_ban?.length === 0 && root.list_tongtien_mua?.length === 0)) {
                    if (retryCount.current < 7) {
                        retryCount.current += 1;
                        const prevDate = new Date(currentDate);
                        prevDate.setDate(prevDate.getDate() - 1);
                        setCurrentDate(prevDate);
                        updateURL(activeTab, prevDate, true);
                        return;
                    } else {
                        setUpdateTime("Hết dữ liệu 7 ngày.");
                        setData({ gold: [], silver: [] });
                        setLoading(false);
                        return;
                    }
                }

                retryCount.current = 0;
                setUpdateTime(timeFound || "");

                const process = (ban, mua) => {
                    if (!ban) return [];
                    const processed = ban.map((item, idx) => {
                        const sellQty = Number(item?.so_luong) || 0;
                        const buyQty = Number(mua?.[idx]?.so_luong) || 0;
                        const rowTotal = sellQty + buyQty;
                        return {
                            gia: item.gia,
                            sell: sellQty, buy: -buyQty,
                            sellQty, buyQty,
                            sellPercent: rowTotal > 0 ? ((sellQty / rowTotal) * 100).toFixed(2) : "0.00",
                            buyPercent: rowTotal > 0 ? ((buyQty / rowTotal) * 100).toFixed(2) : "0.00",
                            total: rowTotal, isMaxSell: false, isMaxBuy: false
                        };
                    }).filter(i => i.sell !== 0 || i.buy !== 0);

                    const totalVolumeAll = processed.reduce((acc, curr) => acc + curr.total, 0);
                    return processed.map(item => ({
                        ...item,
                        percent: totalVolumeAll > 0 ? ((item.total / totalVolumeAll) * 100).toFixed(2) : "0.00"
                    }));
                };

                const findMax = (list) => {
                    if (!list || !list.length) return [];
                    const maxS = [...list].sort((a, b) => b.sell - a.sell)[0];
                    const maxB = [...list].sort((a, b) => a.buy - b.buy)[0];
                    return list.map(i => ({
                        ...i,
                        isMaxSell: i.sell > 0 && i.gia === maxS?.gia,
                        isMaxBuy: i.buy < 0 && i.gia === maxB?.gia
                    }));
                };

                setData({
                    gold: findMax(process(root.list_tongtien_ban_gold, root.list_tongtien_mua_gold)),
                    silver: findMax(process(root.list_tongtien_ban, root.list_tongtien_mua))
                });
                setLoading(false);

            } catch (err) {
                if (retryCount.current < 7) {
                    retryCount.current += 1;
                    const prevDate = new Date(currentDate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    setCurrentDate(prevDate);
                    updateURL(activeTab, prevDate, true);
                } else {
                    setLoading(false);
                    setUpdateTime("Lỗi kết nối.");
                }
            }
        };
        fetchData();
    }, [currentDate]);

    const currentData = activeTab === 'gold' ? data.gold : data.silver;

    const handleTabChange = (newTab) => {
        retryCount.current = 0;
        updateURL(newTab, currentDate);
    };

    const handleDateChange = (step) => {
        retryCount.current = 0;
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + step);
        setCurrentDate(newDate);
        updateURL(activeTab, newDate);
    };

    const CustomXAxisTick = (props) => {
        const { x, y, payload } = props;
        return (
            <g transform={`translate(${x},${y})`}>
                <text x={0} y={0} dy={16} textAnchor="middle" fill="#ffffff" fontSize={isMobile ? 9 : 11} fontWeight="bold">
                    {`${payload.value} USD`}
                </text>
            </g>
        );
    };

    const renderMaxLabel = (props, type) => {
        const { x, y, width, index } = props;
        const item = currentData[index];
        if (!item || (type === 'sell' ? !item.isMaxSell : !item.isMaxBuy)) return null;
        const color = type === 'sell' ? '#ff4d4d' : '#09ff00';
        return (
            <g>
                <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={type === 'sell' ? y - 15 : y + 15} stroke={color} strokeWidth={3} />
                <text x={x + width / 2} y={type === 'sell' ? y - 25 : y + 35} fill={color} fontSize={isMobile ? 10 : 12} fontWeight="bold" textAnchor="middle" stroke="#000" strokeWidth={0.5} paintOrder="stroke">
                    {type === 'sell' ? 'MAX SELL' : 'MAX BUY'}
                </text>
            </g>
        );
    };

    const renderQtyPercentLabel = (props, type) => {
        const { x, y, width, index } = props;
        const item = currentData[index];
        if (!item) return null;
        return (
            <text x={x + width / 2} y={type === 'sell' ? y - 5 : y + 15} fill={type === 'sell' ? '#ff4d4d' : '#09ff00'} fontSize={isMobile ? 8 : 10} textAnchor="middle" fontWeight="bold">
                {type === 'sell' ? `${item.sellPercent}%` : `${item.buyPercent}%`}
            </text>
        );
    };

    return (
        <div style={{ backgroundColor: '#050505', padding: isMobile ? '8px' : '15px', borderRadius: '12px', width: '98%', margin: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center', gap: isMobile ? '12px' : '0' }}>

                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '8px' : '15px', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
                    {/* Nút Gold Silver nhỏ lại trên mobile */}
                    <div style={{ display: 'flex', gap: '5px', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                        <button onClick={() => handleTabChange('gold')} style={tabBtn(activeTab === 'gold', '#FFD700', isMobile)}>GOLD</button>
                        <button onClick={() => handleTabChange('silver')} style={tabBtn(activeTab === 'silver', '#C0C0C0', isMobile)}>SILVER</button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', justifyContent: 'center' }}>
                        <span style={{ color: '#ffffff', fontSize: isMobile ? '9px' : '11px', fontWeight: 'bold' }}>{t('OrderFlowAnalysisPage.lastUpdate')}</span>
                        <span style={{ color: themeColor, fontSize: isMobile ? '10px' : '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            {updateTime || (loading ? "SCANNING..." : "N/A")}
                        </span>
                    </div>
                </div>

                {/* Phần chuyển ngày nhỏ lại trên mobile */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '8px' : '15px',
                    background: '#111',
                    padding: isMobile ? '4px 12px' : '6px 20px',
                    borderRadius: '30px'
                }}>
                    <button onClick={() => handleDateChange(-1)} style={{ ...navBtn, fontSize: isMobile ? '14px' : '18px' }}>❮</button>
                    <span style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 'bold', color: themeColor }}>
                        {formatDateStr(currentDate).replaceAll('_', '/')}
                    </span>
                    <button onClick={() => handleDateChange(1)} style={{ ...navBtn, fontSize: isMobile ? '14px' : '18px' }}>❯</button>
                </div>
            </div>

            <div style={{ width: '100%', height: isMobile ? '400px' : '520px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentData} stackOffset="sign" margin={{ top: 80, bottom: 50, left: 10, right: 10 }} barCategoryGap="0%">
                        <CartesianGrid strokeDasharray="0" stroke="#111" vertical={false} />
                        <XAxis dataKey="gia" tick={<CustomXAxisTick />} axisLine={{ stroke: '#333' }} tickLine={false} interval={0} />
                        <YAxis stroke={themeColor} fontSize={isMobile ? 9 : 11} tickFormatter={(v) => Math.abs(v).toLocaleString()} axisLine={false} tickLine={false} />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div style={{ backgroundColor: '#000', border: `1px solid ${themeColor}`, padding: '10px', borderRadius: '8px' }}>
                                            <p style={{ margin: '0 0 5px', fontSize: '12px', color: themeColor }}>{t('OrderFlowAnalysisPage.price')}: {d.gia} USD</p>
                                            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                                <div style={{ color: '#ff4d4d' }}>{t('OrderFlowAnalysisPage.sell')}: {d.sellQty.toLocaleString()} ({d.sellPercent}%)</div>
                                                <div style={{ color: '#09ff00' }}>{t('OrderFlowAnalysisPage.buy')}: {d.buyQty.toLocaleString()} ({d.buyPercent}%)</div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <ReferenceLine y={0} stroke="#333" strokeWidth={1} />
                        <Bar dataKey="sell" stackId="s">
                            {currentData.map((entry, index) => <Cell key={index} fill="#ff4d4d" />)}
                            <LabelList content={(props) => renderMaxLabel(props, 'sell')} />
                            <LabelList content={(props) => renderQtyPercentLabel(props, 'sell')} />
                        </Bar>
                        <Bar dataKey="buy" stackId="s">
                            {currentData.map((entry, index) => <Cell key={index} fill="#09ff00" />)}
                            <LabelList content={(props) => renderMaxLabel(props, 'buy')} />
                            <LabelList content={(props) => renderQtyPercentLabel(props, 'buy')} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// Hàm style nút bấm có thêm tham số mobile để thu nhỏ
const tabBtn = (active, color, isMobile) => ({
    background: active ? color : '#111',
    border: 'none',
    padding: isMobile ? '6px 12px' : '8px 18px',
    color: active ? '#000' : '#888',
    cursor: 'pointer',
    fontWeight: 'bold',
    borderRadius: '4px',
    fontSize: isMobile ? '10px' : '12px',
    transition: 'all 0.2s',
    flex: isMobile ? 1 : 'none'
});

const navBtn = { background: 'none', border: 'none', color: '#fff', cursor: 'pointer' };

export default OrderFlowAnalysisPage;