import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "./AnalysisGoldSilverTable.css";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend
);

const formatDateTime = (dt, lang = 'vi') => {
    if (dt === null || dt === undefined) return "—";
    try {
        const s = String(dt).trim().replace(" ", "T");
        const d = new Date(s);
        if (isNaN(d)) return String(dt);
        return d.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
    } catch {
        return String(dt);
    }
};

const formatDate = (dt, lang = 'vi') => {
    if (dt === null || dt === undefined) return "—";
    try {
        const s = String(dt).trim().replace(" ", "T");
        const d = new Date(s);
        if (isNaN(d)) return String(dt);
        return d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US');
    } catch {
        return String(dt);
    }
};

const formatVND = (v, lang = 'vi') =>
    Math.round(v).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US') + (lang === 'vi' ? " ₫" : " VND");

// Sắp xếp mảng tuần theo thời điểm bắt đầu (cũ -> mới)
const sortWeeksAsc = (weeks = []) => {
    if (!Array.isArray(weeks)) return [];
    const parseWeekStart = (w) => {
        if (!w) return 0;
        const ts = w?.dautuan?.datetime || w?.date || w?.datetime || w?.timestamp || w?.id_time || w?.thoigian || w?.cuoituan?.datetime;
        if (!ts) return 0;
        const s = String(ts).split(' ')[0];
        const d = new Date(s.replace(' ', 'T'));
        return isNaN(d) ? 0 : d.getTime();
    };
    return weeks.slice().map(wk => ({ wk, ts: parseWeekStart(wk) })).sort((a, b) => a.ts - b.ts).map(x => x.wk);
};

const renderTable = (title, type, data = [], showExtraColumns = false, getWeekOpenPrice = () => '—', getWeekClosePrice = () => '—', extractWeeks = () => [], getWeekDateRange = () => { }, getWeekProfit = () => { }, getWeekPercentage = () => { }, onToggle = () => { }, handleNameClick = () => { }, selectedVendor = null, onShowChart = () => { }) => {
    const { t } = i18n;
    const currentLang = i18n.language;
    if (!Array.isArray(data) || data.length === 0) return null;

    const displayData = selectedVendor ? data.filter(item => (item?.name_server || item?.name) === (selectedVendor?.name_server || selectedVendor?.name)) : data;

    return (
        <div className="analysis-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className={`analysis-title-${type === "gold" ? "gold" : "silver"}`}>
                    {title}
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className={`filter-btn ${showExtraColumns ? "active" : ""}`}
                        onClick={() => onToggle()}
                        aria-label={showExtraColumns ? t('common.show_less', 'Thu gọn') : t('common.show_all', 'Xem thêm')}
                        style={{ fontSize: '16px', fontWeight: '600', padding: '10px 16px' }}
                    >
                        {showExtraColumns ? t('common.show_less', 'Thu gọn') : t('common.show_all', 'Xem thêm')}
                    </button>
                    <button
                        className="filter-btn"
                        onClick={() => onShowChart()}
                        style={{ fontSize: '16px', fontWeight: '600', padding: '10px 16px' }}
                    >
                        📊 {t('common.bar', 'Biểu đồ')}
                    </button>
                </div>
            </div>

            <table className="analysis-table">
                <thead>
                    <tr>
                        <th>{t('AnalysisGoldSilverTable.vendor', 'Nhà vàng')}</th>
                        <th>{t('AnalysisGoldSilverTable.buyPrice', 'Giá mua')}</th>
                        <th>{t('AnalysisGoldSilverTable.sellPrice', 'Giá bán')}</th>
                        <th>{t('AnalysisGoldSilverTable.profit', 'Lợi nhuận')}</th>
                        <th>{t('AnalysisGoldSilverTable.percentage', 'Tỷ lệ (%)')}</th>
                    </tr>
                </thead>

                <tbody>
                    {displayData
                        .filter(
                            (item) =>
                                typeof item.loinhuan === "number" &&
                                typeof item.tilephantram_all === "number"
                        )
                        .map((item, idx) => {
                            const weeks = showExtraColumns ? extractWeeks(item) : [];
                            return (
                                <React.Fragment key={idx}>
                                    <tr data-vendor={item?.name_server || item?.name} title={`Ngày mua đầu: ${formatDateTime(item?.cuoi?.datetime)}\nNgày mua cuối: ${formatDateTime(item?.dau?.datetime)}`}>
                                        <td>
                                            <div>
                                                <b style={{ fontSize: '13px', cursor: 'pointer' }} onClick={() => handleNameClick(item)} role="button" tabIndex={0}>{item.name_server}</b>
                                                <br />
                                                <small style={{ color: 'var(--muted)', fontSize: '13px' }}>
                                                    {(() => {
                                                        const startDate = new Date(String(item?.dau?.datetime || '').replace(' ', 'T'));
                                                        const endDate = new Date(String(item?.cuoi?.datetime || '').replace(' ', 'T'));
                                                        const minDate = startDate < endDate ? startDate : endDate;
                                                        const maxDate = startDate < endDate ? endDate : startDate;
                                                        return `${formatDate(minDate, currentLang)} - ${formatDate(maxDate, currentLang)}`;
                                                    })()}
                                                </small>
                                            </div>
                                        </td>

                                        <td>
                                            <div style={{ fontSize: '14px' }}>
                                                <div style={{ marginBottom: '4px' }}>
                                                    <small style={{ color: 'var(--muted)', marginRight: 6, fontWeight: "bold" }}>{t('AnalysisGoldSilverTable.start', 'Đầu')}:</small>
                                                    <small>{(() => {
                                                        const startPrice = item?.cuoi?.buy || item?.cuoi?.gia || item?.cuoi?.price;
                                                        return startPrice ? formatVND(startPrice, currentLang) : '—';
                                                    })()}</small>
                                                </div>
                                                <div>
                                                    <small style={{ color: 'var(--muted)', marginRight: 6, fontWeight: "bold" }}>{t('AnalysisGoldSilverTable.end', 'Cuối')}:</small>
                                                    <small>{(() => {
                                                        const endPrice = item?.dau?.buy || item?.dau?.gia || item?.dau?.price;
                                                        return endPrice ? formatVND(endPrice, currentLang) : '—';
                                                    })()}</small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <div style={{ fontSize: '14px' }}>
                                                <div style={{ marginBottom: '4px' }}>
                                                    <small style={{ color: 'var(--muted)', marginRight: 6, fontWeight: "bold" }}>{t('AnalysisGoldSilverTable.start', 'Đầu')}:</small>
                                                    <small>{(() => {
                                                        const startSellPrice = item?.cuoi?.sell || item?.cuoi?.gia_ban || item?.cuoi?.price_sell;
                                                        return startSellPrice ? formatVND(startSellPrice) : '—';
                                                    })()}</small>
                                                </div>
                                                <div>
                                                    <small style={{ color: 'var(--muted)', marginRight: 6, fontWeight: "bold" }}>{t('AnalysisGoldSilverTable.end', 'Cuối')}:</small>
                                                    <small>{(() => {
                                                        const endSellPrice = item?.dau?.sell || item?.dau?.gia_ban || item?.dau?.price_sell;
                                                        return endSellPrice ? formatVND(endSellPrice) : '—';
                                                    })()}</small>
                                                </div>
                                            </div>
                                        </td>

                                        <td className={item.loinhuan >= 0 ? "text-up" : "text-down"}>
                                            {formatVND(item.loinhuan, currentLang)}
                                        </td>

                                        <td className={item.tilephantram_all >= 0 ? "text-up" : "text-down"}>
                                            {item.tilephantram_all.toFixed(2)}%
                                        </td>
                                    </tr>

                                    {showExtraColumns && weeks.length > 0 && sortWeeksAsc(weeks).map((w, weekIdx) => {
                                        const weekInfo = getWeekDateRange(w, weekIdx);
                                        const openPrice = getWeekOpenPrice(w);
                                        const closePrice = getWeekClosePrice(w);
                                        const profit = getWeekProfit(w);
                                        const percentage = getWeekPercentage(w);
                                        return (
                                            <tr key={`week-${weekIdx}`} style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                                <td style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                                    <small style={{ fontSize: '13px' }}>{weekInfo.label}</small>
                                                    <br />
                                                    <small style={{ fontSize: '13px' }}>{weekInfo.range}</small>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '13.5px' }}>
                                                        <div style={{ marginBottom: '4px' }}>
                                                            <small style={{ color: 'var(--muted)', marginRight: 6, fontWeight: "bold" }}>{t('AnalysisGoldSilverTable.weekStart', 'Đầu tuần')}:</small>
                                                            <small>{openPrice}</small>
                                                        </div>
                                                        <div>
                                                            <small style={{ color: 'var(--muted)', marginRight: 6, fontWeight: "bold" }}>{t('AnalysisGoldSilverTable.weekEnd', 'Cuối tuần')}:</small>
                                                            <small>{closePrice}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '13.5px' }}>
                                                        <div style={{ marginBottom: '4px' }}>
                                                            <small style={{ color: 'var(--muted)', marginRight: 6, fontWeight: "bold" }}>{t('AnalysisGoldSilverTable.weekStart', 'Đầu tuần')}:</small>
                                                            <small>{(() => {
                                                                if (!w) return '—';
                                                                if (w.dautuan) {
                                                                    if (typeof w.dautuan?.sell === 'number') return formatVND(w.dautuan.sell);
                                                                    if (typeof w.dautuan?.gia_ban === 'number') return formatVND(w.dautuan.gia_ban);
                                                                    if (typeof w.dautuan?.price_sell === 'number') return formatVND(w.dautuan.price_sell);
                                                                }
                                                                if (typeof w.sell_dau === 'number') return formatVND(w.sell_dau);
                                                                if (typeof w.gia_ban_dau === 'number') return formatVND(w.gia_ban_dau);
                                                                return '—';
                                                            })()}</small>
                                                        </div>
                                                        <div>
                                                            <small style={{ color: 'var(--muted)', marginRight: 6, fontWeight: "bold" }}>{t('AnalysisGoldSilverTable.weekEnd', 'Cuối tuần')}:</small>
                                                            <small>{(() => {
                                                                if (!w) return '—';
                                                                if (w.cuoituan) {
                                                                    if (typeof w.cuoituan?.sell === 'number') return formatVND(w.cuoituan.sell);
                                                                    if (typeof w.cuoituan?.gia_ban === 'number') return formatVND(w.cuoituan.gia_ban);
                                                                    if (typeof w.cuoituan?.price_sell === 'number') return formatVND(w.cuoituan.price_sell);
                                                                }
                                                                if (typeof w.sell_cuoi === 'number') return formatVND(w.sell_cuoi);
                                                                if (typeof w.gia_ban_cuoi === 'number') return formatVND(w.gia_ban_cuoi);
                                                                return '—';
                                                            })()}</small>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={profit.isPositive === true ? 'text-up' : profit.isPositive === false ? 'text-down' : ''}>
                                                    <small style={{ fontSize: '13px' }}>{profit.value}</small>
                                                </td>
                                                <td className={percentage.isPositive === true ? 'text-up' : percentage.isPositive === false ? 'text-down' : ''}>
                                                    <small style={{ fontSize: '13px' }}>{percentage.value}</small>
                                                </td>
                                            </tr>
                                        );
                                    })
                                    }
                                </React.Fragment>
                            );
                        })}
                </tbody>

            </table>
        </div>
    );
};


const ComparisonChart = ({ type, data, title }) => {
    const { t } = i18n;
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h3 style={{ color: type === "gold" ? "#f1c40f" : "#c0c0c0" }}>
                    {title}
                </h3>
                <p>{t('common.no_data', 'Không có dữ liệu')}</p>
            </div>
        );
    }

    const sortedData = [...data].sort((a, b) => b.loinhuan - a.loinhuan);

    const chartData = {
        labels: sortedData.map(item => item.name_server),
        datasets: [
            {
                type: "bar",
                label: `${t('AnalysisGoldSilverTable.profit')} (VND)`,
                data: sortedData.map(item => item.loinhuan || 0),
                backgroundColor: type === "gold" ? "#f1c40f" : "#c0c0c0",
                borderColor: type === "gold" ? "#f39c12" : "#95a5a6",
                borderWidth: 1,
                yAxisID: "y1"
            },
            {
                type: "line",
                label: `${t('AnalysisGoldSilverTable.percentage')} (%)`,
                data: sortedData.map(item => item.tilephantram_all || 0),
                borderColor: type === "gold" ? "#f39c12" : "#95a5a6",
                backgroundColor: type === "gold" ? "rgba(241, 196, 15, 0.1)" : "rgba(192, 192, 192, 0.1)",
                yAxisID: "y2",
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: type === "gold" ? "#f39c12" : "#95a5a6",
                pointBorderColor: "#fff"
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y1: {
                position: "left",
                title: {
                    display: true,
                    text: `${t('AnalysisGoldSilverTable.profit')} (VND)`,
                    color: "white"
                },
                ticks: {
                    color: "white",
                    callback: function(value) {
                        return Math.round(value / 1000000) + 'M';
                    }
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            y2: {
                position: "right",
                title: {
                    display: true,
                    text: `${t('AnalysisGoldSilverTable.percentage')} (%)`,
                    color: "white"
                },
                ticks: {
                    color: "white"
                },
                grid: {
                    display: false
                },
                min: 0,
                max: function(context) {
                    const maxValue = Math.max(...context.chart.data.datasets[1].data);
                    return maxValue * 1.5; // Tăng max để đường line hiển thị thấp hơn
                }
            },
            x: {
                ticks: {
                    color: "#e74c3c",
                    maxRotation: 30,  // xoay chữ 30 độ
                    minRotation: 30,  // đảm bảo chữ luôn xoay 45 độ
                    font: {
                        size: 10
                    },
                    maxTicksLimit: 20,
                    callback: function(value, index, values) {
                        // Hiển thị toàn bộ nhãn
                        return this.getLabelForValue(value);
                    }
                },
                grid: {
                    display: false
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: 'white',
                    font: { size: 12 },
                    usePointStyle: true
                }
            },
            tooltip: {
                mode: "index",
                intersect: false,
                callbacks: {
                    label: (ctx) => {
                        if (ctx.dataset.label?.includes(t('AnalysisGoldSilverTable.profit'))) {
                            return `${t('AnalysisGoldSilverTable.profit')}: ${formatVND(ctx.raw, i18n.language)}`;
                        }
                        return `${t('AnalysisGoldSilverTable.percentage')}: ${Number(ctx.raw).toFixed(2)}%`;
                    }
                }
            }
        }
    };

    return (
        <div style={{ marginBottom: '30px' }}>
            <h3 style={{ 
                color: type === "gold" ? "#f1c40f" : "#c0c0c0", 
                textAlign: 'center', 
                marginBottom: '10px'
            }}>
                {title}
            </h3>
            
            {/* Thông tin khoảng thời gian so sánh */}
            <div style={{ 
                textAlign: 'center', 
                marginBottom: '20px',
                color: '#e74c3c',
                fontSize: '14px',
                fontWeight: '600'
            }}>
                {t('common.comparison_period', 'Khoảng thời gian so sánh')}: {(() => {
                    if (sortedData.length > 0) {
                        const firstItem = sortedData[0];
                        const startDate = firstItem?.dau?.datetime;
                        const endDate = firstItem?.cuoi?.datetime;
                        
                        if (startDate && endDate) {
                            const start = new Date(startDate);
                            const end = new Date(endDate);
                            
                            // Xác định ngày cũ hơn và mới hơn
                            const earlierDate = start < end ? start : end;
                            const laterDate = start < end ? end : start;
                            
                            return `${formatDate(earlierDate, i18n.language)} - ${formatDate(laterDate, i18n.language)}`;
                        }
                    }
                    return t('common.unknown_time', 'Thời gian không xác định');
                })()}
            </div>

            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', height: '400px' }}>
                <Chart 
                    data={chartData} 
                    options={options}
                    plugins={[{
                        id: 'datalabels',
                        afterDraw: (chart) => {
                            const ctx = chart.ctx;
                            ctx.font = 'bold 11px Arial';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            
                            chart.data.datasets.forEach((dataset, i) => {
                                if (dataset.type === 'bar') { // Chỉ hiển thị label cho bar dataset
                                    const meta = chart.getDatasetMeta(i);
                                    meta.data.forEach((bar, index) => {
                                        // Lấy dữ liệu tỷ lệ % từ line dataset
                                        const lineDataset = chart.data.datasets.find(d => d.type === 'line');
                                        const percentage = lineDataset ? lineDataset.data[index] : 0;
                                        
                                        if (percentage !== 0) {
                                            const x = bar.x;
                                            const y = bar.y - 6;
                                            
                                            // Màu text theo loại (vàng hoặc bạc)
                                            ctx.fillStyle = type === "gold" ? '#f1c40f' : '#c0c0c0';
                                            ctx.fillText(percentage.toFixed(2) + '%', x, y);
                                        }
                                    });
                                }
                            });
                        }
                    }]}
                />
            </div>
        </div>
    );
};


const GoldSilverSummary = () => {
    const { t } = useTranslation();
    // Danh sách các nhà vàng cho phép hiển thị
    const ALLOWED_GOLD_SHOPS = [
        "VANG ANCARAT",
        "BAO TIN MANH HAI",
        "KIM NGÂN PHÚC HÀ NỘI",
        "VANG BTMC",
        "SINH DIỄN BẮC NINH",
        "Anh Minh Hồ Tùng Mậu HN",
        "Sacombank-SBJ GOLD",
        "VANG DOJI",
        "VANG PNJ",
        "BAO TIN LAN VY CẦU GIẤY HN",
        "Mi Hong 9999",
        "NGỌC THẨM ĐỒNG THÁP",
        "Phú Quý Vàng"
    ];

    const ALLOWED_SILVER_SHOPS = [
        "BAC ANCARAT",
        "KIM NGÂN PHÚC HÀ NỘI",
        "Kim Khánh Hà Nam",
        "Anh Minh Hồ Tùng Mậu HN",
        "Phú Quý Bạc",
        "Sacombank-SBJ Silver",
        "KIM TÍN CAO BẰNG"
    ];

    const [data, setData] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [showExtraColumnsGold, setShowExtraColumnsGold] = useState(false);
    const [showExtraColumnsSilver, setShowExtraColumnsSilver] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [showComparisonChart, setShowComparisonChart] = useState(true); // Mặc định hiển thị biểu đồ
    const [chartType, setChartType] = useState("gold");

    useEffect(() => {
        fetch("https://api_gold.thinkdiff.us/phantich_tangtruong_toanbo_vangbac")
            .then((res) => res.json())
            .then((json) => {
                const results = json?.data?.results;
                if (results) {
                    // Lưu dữ liệu gốc (không lọc)
                    setOriginalData(results);
                    
                    // Lọc dữ liệu theo danh sách được phép
                    const filteredResults = {
                        vang: (results.vang || []).filter(item => 
                            ALLOWED_GOLD_SHOPS.includes(item?.name_server || item?.name)
                        ),
                        bac: (results.bac || []).filter(item => 
                            ALLOWED_SILVER_SHOPS.includes(item?.name_server || item?.name)
                        )
                    };
                    setData(filteredResults);
                } else {
                    setData(null);
                    setOriginalData(null);
                }
            })
            .catch(() => {
                setData(null);
                setOriginalData(null);
            });
    }, []);

    // Sync chart view with URL params
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const sp = new URLSearchParams(location.search);
        const chartParam = sp.get('chart');
        
        if (chartParam === null) {
            // Không có param chart, hiển thị biểu đồ mặc định
            setShowComparisonChart(true);
        } else if (chartParam === 'combined') {
            // URL có chart param, hiển thị biểu đồ
            setShowComparisonChart(true);
        } else if (chartParam === 'table') {
            // URL có param table, hiển thị bảng
            setShowComparisonChart(false);
        } else {
            // Mặc định hiển thị biểu đồ
            setShowComparisonChart(true);
        }
    }, [location.search]);

    const handleShowChart = () => {
        const sp = new URLSearchParams(location.search);
        sp.set('chart', 'combined');
        navigate(`${location.pathname}?${sp.toString()}`, { replace: true });
        setShowComparisonChart(true);
    };

    const handleCloseChart = () => {
        const sp = new URLSearchParams(location.search);
        sp.set('chart', 'table');
        const qs = sp.toString();
        navigate(`${location.pathname}?${qs}`, { replace: true });
        setShowComparisonChart(false);
    };

    // modal state for vendor weekly details
    const [modalOpen, setModalOpen] = useState(false);
    const [modalWeeks, setModalWeeks] = useState([]);
    const [modalVendorName, setModalVendorName] = useState('');

    const extractWeeks = (item) => {
        if (!item) return [];
        const candidates = [
            item.cac_tuan,
            item.phan_tich_cactuan,
            item.phantich_cactuan,
            item.phan_tich?.cactuan,
            item.phantich?.cactuan,
            item.weeks,
            item.list_week,
            item.list_weeks,
            item.weekly,
            item.phantich
        ];
        for (const cand of candidates) {
            if (Array.isArray(cand) && cand.length) return cand;
        }
        return [];
    };

    const getWeekDate = (w) => {
        const ts = w?.cuoituan?.datetime || w?.phantu_cuoituan?.timestamp || w?.timestamp || w?.date || w?.datetime || w?.time || w?.id_time || w?.thoigian;
        if (!ts) return '—';
        const s = String(ts).split(' ')[0];
        try {
            const d = new Date(s.replace(' ', 'T'));
            if (isNaN(d)) return String(s);
            return d.toLocaleDateString('vi-VN');
        } catch { return String(s); }
    };

    const getWeekDateRange = (w, index) => {
        const startTs = w?.dautuan?.datetime;
        const endTs = w?.cuoituan?.datetime;

        let startDate = '—';
        let endDate = '—';

        if (startTs) {
            const s = String(startTs).split(' ')[0];
            try {
                const d = new Date(s.replace(' ', 'T'));
                if (!isNaN(d)) startDate = d.toLocaleDateString('vi-VN');
            } catch { }
        }

        if (endTs) {
            const s = String(endTs).split(' ')[0];
            try {
                const d = new Date(s.replace(' ', 'T'));
                if (!isNaN(d)) endDate = d.toLocaleDateString('vi-VN');
            } catch { }
        }

        return {
            label: (
                <span>
                    <strong>{t('common.week', 'Tuần')} {index + 1}</strong>
                </span>
            ),
            range: `${startDate}-${endDate}`
        };

    };

    const getWeekProfit = (w) => {
        if (!w) return { value: '—', isPositive: null };
        if (typeof w.loinhuan === 'number') return { value: formatVND(w.loinhuan), isPositive: w.loinhuan >= 0 };
        if (typeof w.loinhuan_vnd === 'number') return { value: formatVND(w.loinhuan_vnd), isPositive: w.loinhuan_vnd >= 0 };
        if (typeof w.loi_nhuan === 'number') return { value: formatVND(w.loi_nhuan), isPositive: w.loi_nhuan >= 0 };
        for (const key of Object.keys(w || {})) {
            if (key.includes('loinhuan') && typeof w[key] === 'number') {
                return { value: formatVND(w[key]), isPositive: w[key] >= 0 };
            }
        }
        return { value: '—', isPositive: null };
    };

    const getWeekPercentage = (w) => {
        if (!w) return { value: '—', isPositive: null };
        if (typeof w.tilephantram_1tuan === 'number') return { value: `${w.tilephantram_1tuan.toFixed(2)}%`, isPositive: w.tilephantram_1tuan >= 0 };
        if (typeof w.tilephantram === 'number') return { value: `${w.tilephantram.toFixed(2)}%`, isPositive: w.tilephantram >= 0 };
        if (typeof w.ti_le_tang_truong === 'number') return { value: `${w.ti_le_tang_truong.toFixed(2)}%`, isPositive: w.ti_le_tang_truong >= 0 };
        if (typeof w.tilephantram_all === 'number') return { value: `${w.tilephantram_all.toFixed(2)}%`, isPositive: w.tilephantram_all >= 0 };
        for (const key of Object.keys(w || {})) {
            if ((key.includes('tile') || key.includes('percent')) && typeof w[key] === 'number') {
                return { value: `${Number(w[key]).toFixed(2)}%`, isPositive: w[key] >= 0 };
            }
        }
        return { value: '—', isPositive: null };
    };

    const getWeekOpenPrice = (w) => {
        if (!w) return '—';
        // Tìm giá từ dautuan (đầu tuần)
        if (w.dautuan) {
            if (typeof w.dautuan?.buy === 'number') return formatVND(w.dautuan.buy);
            if (typeof w.dautuan?.gia === 'number') return formatVND(w.dautuan.gia);
            if (typeof w.dautuan?.price === 'number') return formatVND(w.dautuan.price);
            if (typeof w.dautuan?.gia_mua === 'number') return formatVND(w.dautuan.gia_mua);
        }
        if (typeof w.gia_dau === 'number') return formatVND(w.gia_dau);
        if (typeof w.gia_dau_tuan === 'number') return formatVND(w.gia_dau_tuan);
        if (typeof w.open_price === 'number') return formatVND(w.open_price);
        for (const key of Object.keys(w || {})) {
            if ((key.includes('gia_dau') || key.includes('open')) && typeof w[key] === 'number') {
                return formatVND(w[key]);
            }
        }
        return '—';
    };

    const getWeekClosePrice = (w) => {
        if (!w) return '—';
        // Tìm giá từ cuoituan (cuối tuần)
        if (w.cuoituan) {
            if (typeof w.cuoituan?.buy === 'number') return formatVND(w.cuoituan.buy);
            if (typeof w.cuoituan?.gia === 'number') return formatVND(w.cuoituan.gia);
            if (typeof w.cuoituan?.price === 'number') return formatVND(w.cuoituan.price);
            if (typeof w.cuoituan?.gia_mua === 'number') return formatVND(w.cuoituan.gia_mua);
        }
        if (typeof w.gia_cuoi === 'number') return formatVND(w.gia_cuoi);
        if (typeof w.gia_cuoi_tuan === 'number') return formatVND(w.gia_cuoi_tuan);
        if (typeof w.close_price === 'number') return formatVND(w.close_price);
        for (const key of Object.keys(w || {})) {
            if ((key.includes('gia_cuoi') || key.includes('close')) && typeof w[key] === 'number') {
                return formatVND(w[key]);
            }
        }
        return '—';
    };

    const handleNameClick = (item) => {
        // Show only this vendor's weekly data in modal
        setSelectedVendor(item);
    };

    // open modal if URL contains vendor param
    useEffect(() => {
        const sp = new URLSearchParams(location.search);
        const vendor = sp.get('vendor');
        if (vendor && data) {
            // try to find vendor in vang or bac
            const pool = (data.vang || []).concat(data.bac || []);
            const found = pool.find((it) => (it?.name_server || it?.name) === vendor);
            if (found) {
                let weeks = extractWeeks(found) || [];
                weeks = weeks.sort((a, b) => {
                    const dateA = new Date(String(a?.dautuan?.datetime || a?.date || '').replace(' ', 'T'));
                    const dateB = new Date(String(b?.dautuan?.datetime || b?.date || '').replace(' ', 'T'));
                    return dateA - dateB;
                });
                setModalVendorName(found?.name_server || found?.name || '');
                setModalWeeks(weeks);
                setModalOpen(true);
            }
        }
    }, [location.search, data]);

    // when modal closes, remove vendor param from URL
    useEffect(() => {
        if (!modalOpen) {
            const sp = new URLSearchParams(location.search);
            if (sp.has('vendor')) {
                sp.delete('vendor');
                const qs = sp.toString();
                navigate(`${location.pathname}${qs ? `?${qs}` : ''}`, { replace: true });
            }
        }
    }, [modalOpen]);

    if (!data) return <p>⏳ {t('common.loading', 'Đang tải...')}</p>;

    // If a vendor is selected, show modal-like view with only that vendor's data
    if (selectedVendor) {
        const vendorData = selectedVendor;
        const weeks = extractWeeks(vendorData) || [];

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
            }} onClick={() => setSelectedVendor(null)}>
                <div style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    padding: '20px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    maxWidth: '900px',
                    width: '100%',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ margin: 0 }}>{vendorData?.name_server || vendorData?.name}</h2>
                        <button onClick={() => setSelectedVendor(null)} style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: 'var(--text-muted)'
                        }}>✕</button>
                    </div>

                    <table className="analysis-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>{t('common.week', 'Tuần')}</th>
                                <th>{t('AnalysisGoldSilverTable.buyPrice', 'Giá mua')}</th>
                                <th>{t('AnalysisGoldSilverTable.sellPrice', 'Giá bán')}</th>
                                <th>{t('AnalysisGoldSilverTable.profit', 'Lợi nhuận')}</th>
                                <th>{t('AnalysisGoldSilverTable.percentage', 'Tỷ lệ (%)')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortWeeksAsc(weeks).map((w, weekIdx) => {
                                const weekInfo = getWeekDateRange(w, weekIdx);
                                const openPrice = getWeekOpenPrice(w);
                                const closePrice = getWeekClosePrice(w);
                                const profit = getWeekProfit(w);
                                const percentage = getWeekPercentage(w);
                                return (
                                    <tr key={`week-${weekIdx}`}>
                                        <td style={{ fontSize: '13px', color: 'var(--muted)' }}>
                                            <small style={{ fontSize: '13px' }}>{weekInfo.label}</small>
                                            <br />
                                            <small style={{ fontSize: '13px' }}>{weekInfo.range}</small>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '13.5px' }}>
                                                <div style={{ marginBottom: '4px' }}>
                                                    <small style={{ color: 'var(--muted)', marginRight: 6, fontWeight: 'bold' }}>{t('AnalysisGoldSilverTable.start', 'Đầu')}:</small>
                                                    <small>{openPrice}</small>
                                                </div>
                                                <div>
                                                    <small style={{ color: 'var(--muted)', marginRight: 6, fontWeight: 'bold' }}>{t('AnalysisGoldSilverTable.end', 'Cuối')}:</small>
                                                    <small>{closePrice}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '13.5px' }}>
                                                <div style={{ marginBottom: '4px' }}>
                                                    <small style={{ color: 'var(--muted)', marginRight: 6, fontWeight: 'bold' }}>{t('AnalysisGoldSilverTable.start', 'Đầu')}:</small>
                                                    <small>{(() => {
                                                        if (!w) return '—';
                                                        if (w.dautuan) {
                                                            if (typeof w.dautuan?.sell === 'number') return formatVND(w.dautuan.sell);
                                                            if (typeof w.dautuan?.gia_ban === 'number') return formatVND(w.dautuan.gia_ban);
                                                            if (typeof w.dautuan?.price_sell === 'number') return formatVND(w.dautuan.price_sell);
                                                        }
                                                        if (typeof w.sell_dau === 'number') return formatVND(w.sell_dau);
                                                        if (typeof w.gia_ban_dau === 'number') return formatVND(w.gia_ban_dau);
                                                        return '—';
                                                    })()}</small>
                                                </div>
                                                <div>
                                                    <small style={{ color: 'var(--muted)', marginRight: 6, fontWeight: 'bold' }}>{t('AnalysisGoldSilverTable.end', 'Cuối')}:</small>
                                                    <small>{(() => {
                                                        if (!w) return '—';
                                                        if (w.cuoituan) {
                                                            if (typeof w.cuoituan?.sell === 'number') return formatVND(w.cuoituan.sell);
                                                            if (typeof w.cuoituan?.gia_ban === 'number') return formatVND(w.cuoituan.gia_ban);
                                                            if (typeof w.cuoituan?.price_sell === 'number') return formatVND(w.cuoituan.price_sell);
                                                        }
                                                        if (typeof w.sell_cuoi === 'number') return formatVND(w.sell_cuoi);
                                                        if (typeof w.gia_ban_cuoi === 'number') return formatVND(w.gia_ban_cuoi);
                                                        return '—';
                                                    })()}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={profit.isPositive === true ? 'text-up' : profit.isPositive === false ? 'text-down' : ''}>
                                            <small style={{ fontSize: '13px' }}>{profit.value}</small>
                                        </td>
                                        <td className={percentage.isPositive === true ? 'text-up' : percentage.isPositive === false ? 'text-down' : ''}>
                                            <small style={{ fontSize: '13px' }}>{percentage.value}</small>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <>
            {showComparisonChart ? (
                <div className="analysis-block">
                    {/* Header với thông tin thời gian update */}
                    <div style={{ 
                        backgroundColor: 'rgba(241, 196, 15, 0.1)', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        marginBottom: '20px',
                        border: '1px solid rgba(241, 196, 15, 0.3)'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px'
                        }}>
                                    <div>
                                        <h3 style={{ 
                                            color: '#f1c40f', 
                                            margin: '0 0 5px 0',
                                            fontSize: '16px',
                                            fontWeight: 'bold'
                                        }}>
                                            📊 {t('header.title')}
                                        </h3>
                                        <p style={{ 
                                            color: '#94a3b8', 
                                            margin: 0,
                                            fontSize: '13px'
                                        }}>
                                            {t('header.lastUpdate')} {(() => {
                                                // Lấy thời gian update từ dữ liệu API
                                                if (data?.vang && data.vang.length > 0) {
                                                    const latestItem = data.vang[0];
                                                    const updateTime = latestItem?.cuoi?.datetime || latestItem?.dau?.datetime;
                                                    if (updateTime) {
                                                        return formatDateTime(updateTime, i18n.language);
                                                    }
                                                }
                                                if (data?.bac && data.bac.length > 0) {
                                                    const latestItem = data.bac[0];
                                                    const updateTime = latestItem?.cuoi?.datetime || latestItem?.dau?.datetime;
                                                    if (updateTime) {
                                                        return formatDateTime(updateTime, i18n.language);
                                                    }
                                                }
                                                return formatDateTime(new Date(), i18n.language);
                                            })()}
                                        </p>
                                    </div>
                            <div style={{ 
                                color: '#e74c3c', 
                                fontSize: '12px',
                                fontStyle: 'italic',
                                textAlign: 'right'
                            }}>
                                {t('common.last_update_hint', 'Thời gian update cuối cùng hiển thị ở đây')}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 className="analysis-title-gold">
                            📊 {t('AnalysisGoldSilverTable.growthChart', 'Biểu đồ Phân tích Tăng trưởng')}
                        </h2>
                        <button
                            className="filter-btn active"
                            onClick={() => handleCloseChart()}
                            style={{ fontSize: '16px', fontWeight: '600', padding: '10px 16px' }}
                        >
                            📊 {t('common.table', 'Xem bảng')}
                        </button>
                    </div>

                    {/* Biểu đồ Vàng */}
                    <ComparisonChart
                        type="gold"
                        data={data?.vang}
                        title={`💰 ${t('AnalysisGoldSilverTable.goldGrowthChart', 'Biểu đồ Tăng trưởng Vàng')}`}
                    />

                    {/* Biểu đồ Bạc */}
                    <ComparisonChart
                        type="silver"
                        data={data?.bac}
                        title={`🥈 ${t('AnalysisGoldSilverTable.silverGrowthChart', 'Biểu đồ Tăng trưởng Bạc')}`}
                    />
                </div>
            ) : (
                <>
                    {renderTable(t('AnalysisGoldSilverTable.goldGrowthTitle'), "gold", showExtraColumnsGold ? originalData?.vang : data?.vang, showExtraColumnsGold, getWeekOpenPrice, getWeekClosePrice, extractWeeks, getWeekDateRange, getWeekProfit, getWeekPercentage, () => {
                        setShowExtraColumnsGold(!showExtraColumnsGold);
                    }, handleNameClick, selectedVendor, () => {
                        handleShowChart();
                    })}
                    {renderTable(t('AnalysisGoldSilverTable.silverGrowthTitle'), "silver", showExtraColumnsSilver ? originalData?.bac : data?.bac, showExtraColumnsSilver, getWeekOpenPrice, getWeekClosePrice, extractWeeks, getWeekDateRange, getWeekProfit, getWeekPercentage, () => {
                        setShowExtraColumnsSilver(!showExtraColumnsSilver);
                    }, handleNameClick, selectedVendor, () => {
                        handleShowChart();
                    })}
                </>
            )}
        </>
    );
};

export default GoldSilverSummary;
