import React, { useEffect, useMemo, useState } from "react";
import SingleLineChart from "../candlestick/SingleLineChart";

const API_ENDPOINTS = [
    "https://api_gold.thinkdiff.us/sacombank_vang_history",
    "https://api_gold.thinkdiff.us/sacombank_bac_history",
    "https://api_gold.thinkdiff.us/history_bac_phuquy",
    "https://api_gold.thinkdiff.us/phuquy_gold_history"
];

const fetchGoldData = async () => {
    const fetchPromises = API_ENDPOINTS.map(async (url) => {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;

            const data = await response.json();

            return data;
        } catch (error) {
            console.error(`Lỗi khi gọi API ${url}:`, error);
            return null; // Trả về null nếu có lỗi kết nối hoặc parse JSON
        }
    });

    const results = await Promise.all(fetchPromises);

    return {
        sjcGold: results[0], // vàng sacombank
        sjcSilver: results[1], // bạc sacombank
        bacPhuQuy: results[2],
        phuQuyGold: results[3]
    };
};

// hàm đưa bạc sacombank về dạng {buy,date,sell}
const formatSilverSacombank = (arr = []) => {

    if (!arr || arr.length === 0) return []

    const result = arr.map(item => {
        return {
            buy: item?.buy,
            sell: item?.sell,
            date: new Date(item?.date).toLocaleDateString("vi-VN")
        }
    })
    return result
}

// hàm đưa bạc phu quy về dạng {buy,date,sell}
const formatSilverPhuQuy = (arr = []) => {
    if (!arr || arr.length === 0) return []

    const result = arr.map(item => {
        return {
            buy: item?.buy * 0.00375,
            sell: item?.sell * 0.00375,
            date: new Date(item?.id_time).toLocaleDateString("vi-VN")
        }
    })
    return result
}

// hàm đưa vàng phu quy về dạng {buy,date,sell}
const formatGoldPhuQuy = (arr = []) => {
    if (!arr || arr.length === 0) return []

    const result = arr.map(item => {
        const nhan_tron_phu_quy_9999 = JSON.parse(item?.nhan_tron_phu_quy_9999)

        return {
            buy: nhan_tron_phu_quy_9999?.mua,
            sell: nhan_tron_phu_quy_9999?.ban,
            date: new Date(item?.update_time).toLocaleDateString('vi-VN', { timeZone: "UTC" })
        }
    })
    return result
}

// nếu trùng ngày thì lấy buy+sell lớn nhất
const filterBuySellMax = (data = []) => {
    if (!data || data.length === 0) return []

    const result = Object.values(
        data.reduce((acc, cur) => {
            const sum = cur.buy + cur.sell;

            if (!acc[cur.date] || sum > acc[cur.date].buy + acc[cur.date].sell) {
                acc[cur.date] = cur;
            }

            return acc;
        }, {})
    );
    return result
}

// tính tỉ lệ xau/xag
function calculateXauXagRatio(goldData, silverData) {
    // Hàm hỗ trợ chuyển đổi chuỗi 'dd/mm/yyyy' sang đối tượng Date
    const parseDate = (dateStr) => {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
    };

    return goldData.map(g => {
        if (!g.buy || !g.sell || !g.date) return null
        const gDate = parseDate(g.date);

        //  Tìm ngày khớp chính xác hoặc chênh lệch tối đa 1 ngày 
        const match = silverData.find(s => {
            if (!s.date || !s.buy || !s.sell) return false
            const sDate = parseDate(s.date);
            const diffTime = Math.abs(gDate - sDate);
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            return diffDays <= 1;
        });

        if (match && match.buy > 0 && match.sell > 0) {

            const ratio = ((g?.buy + g?.sell) / 2) / ((match?.buy + match?.sell) / 2)

            return {
                x: g.date,
                y: ratio
            };
        }
        return null;
    }).filter(item => item !== null); // Loại bỏ các ngày không tìm thấy dữ liệu bạc phù hợp
}

export default function LineXauXagChart() {
    const [fullChartData, setFullChartData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Quản lý popup
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupData, setPopupData] = useState([]);
    const [popupColor, setPopupColor] = useState('');
    const [popupTitle, setPopupTitle] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await fetchGoldData();
                const sjcGold = filterBuySellMax(data?.sjcGold?.data)
                const sjcSilver = filterBuySellMax(formatSilverSacombank(data?.sjcSilver?.data))
                const bacPhuQuy = filterBuySellMax(formatSilverPhuQuy(data?.bacPhuQuy?.list_phuquy))
                const phuQuyGold = filterBuySellMax(formatGoldPhuQuy(data?.phuQuyGold))

                setFullChartData({
                    dataChartSacombank: calculateXauXagRatio(sjcGold, sjcSilver),
                    dataChartPhuQuy: calculateXauXagRatio(phuQuyGold, bacPhuQuy)
                })

                setError(null);
            } catch (err) {
                console.error("Error loading candlestick data:", err);
                setError("Không thể tải dữ liệu biểu đồ. Vui lòng thử lại sau.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [setLoading, setFullChartData, setError]);

    // Hàm mở popup
    const openPopup = (data, title, color) => {
        setPopupData(data);
        setPopupTitle(title);
        setIsPopupOpen(true);
        setPopupColor(color);
    };
    return (
        <div style={{
            display: 'flex',
            gap: '10px',
            textAlign: 'center',
            width: '100%',
            flexWrap: 'wrap',
            justifyContent: 'center',
        }}>
            {!fullChartData &&
                <h2 style={{ color: 'white', textAlign: 'center', width: '100%', marginTop: '100px' }}>Đang tải....</h2>
            }

            {fullChartData && fullChartData?.dataChartPhuQuy &&
                <div onClick={() => openPopup(fullChartData?.dataChartPhuQuy, 'Biểu đồ xau/xag Phú Quý', '#22C55E')} style={{
                    width: 'calc(50% - 5px)',
                    minWidth: '280px',
                    maxWidth: '450px',
                    flex: '1 1 auto'
                }}>
                    <SingleLineChart buyData={fullChartData?.dataChartPhuQuy} title={'Biểu đồ xau/xag Phú Quý'} color={'#22C55E'} isZoom={isPopupOpen} />
                </div>
            }

            {fullChartData && fullChartData?.dataChartSacombank &&
                <div onClick={() => openPopup(fullChartData?.dataChartSacombank, 'Biểu đồ xau/xag Sacombank', '#EF4444')} style={{
                    width: 'calc(50% - 5px)',
                    minWidth: '280px',
                    maxWidth: '450px',
                    flex: '1 1 auto'
                }}>
                    <SingleLineChart buyData={fullChartData?.dataChartSacombank} title={'Biểu đồ xau/xag Sacombank'} color={'#EF4444'} isZoom={isPopupOpen} />
                </div>
            }

            {/* Popup */}
            {isPopupOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: 0, left: 0,
                        width: "100vw", height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 1000,
                        textAlign: "center",
                        padding: '10px'
                    }}
                    onClick={() => setIsPopupOpen(false)}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "1600px",
                            height: "90vh",
                            backgroundColor: "var(--background-dark)",
                            padding: "20px",
                            borderRadius: "10px",
                            overflow: "auto",
                            boxSizing: 'border-box'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <SingleLineChart buyData={popupData} title={popupTitle} color={popupColor} isZoom={isPopupOpen} />
                        <button
                            style={{
                                marginTop: "20px", padding: "6px 12px",
                                borderRadius: "6px", border: "none",
                                backgroundColor: "#EF4444", color: "#fff",
                                cursor: "pointer"
                            }}
                            onClick={() => setIsPopupOpen(false)}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
