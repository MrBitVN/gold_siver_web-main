import React, { useEffect, useState, useRef } from "react";
import { Bar, getElementAtEvent } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

import { fetchBlackMarketExchangeRates } from "../../services/blackMarketExchangeRateService";
import { useTranslation } from "react-i18next";
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const btnStyle = {
    padding: "8px 16px",
    background: "#172a45",
    color: "#fff",
    border: "1px solid #3498db",
    borderRadius: "4px",
    cursor: "pointer"
};
const thStyle = {
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #1e293b"
};
const tdStyle = {
    padding: "10px",
    borderBottom: "1px solid #1e293b"
};

function ReportComexChart() {
    const { t } = useTranslation();
    const [dataChart, setDataChart] = useState(null);
    const [fullData, setFullData] = useState([]);
    const [selectedDetails, setSelectedDetails] = useState(null);
    const [rateCNYtoVND, setRateCNYtoVND] = useState(null);
    const [rateUSDtoVND, setRateUSDtoVND] = useState(null);
    const [displayCurrency, setDisplayCurrency] = useState("USD");
    const [datasetIndex, setDatasetIndex] = useState(0);
    const [showOunce, setShowOunce] = useState(true);
    const [showBillion, setShowBillion] = useState(false);
    const [chartFilter, setChartFilter] = useState("all"); // "all" hoặc "hop_dong_tuong_lai"
    const [isLoading, setIsLoading] = useState(false);
    const chartRef = useRef();

    const [currentDate, setCurrentDate] = useState(() => {
        const date = new Date();
        return {
            month: date.getMonth() + 1,
            year: date.getFullYear()
        };
    });
    const handleMonthChange = (direction) => {
        setDataChart(null);
        setSelectedDetails(null);
        setCurrentDate(prev => {
            let newMonth = prev.month + direction;
            let newYear = prev.year;

            if (newMonth > 12) {
                newMonth = 1;
                newYear += 1;
            } else if (newMonth < 1) {
                newMonth = 12;
                newYear -= 1;
            }

            return { month: newMonth, year: newYear };
        });
    };

    const loadExchangeRates = async () => {
        const data = await fetchBlackMarketExchangeRates();
        if (!data) return;

        const cny = data.find(i => i.code === "CNY");
        const usd = data.find(i => i.code === "USD");

        if (cny) setRateCNYtoVND(cny.sell);
        if (usd) setRateUSDtoVND(usd.sell);
    };

    useEffect(() => {
        if (selectedDetails) {
            loadExchangeRates();
        }
    }, [selectedDetails]);

    useEffect(() => {
        setIsLoading(true);
        fetch(`https://api_gold.thinkdiff.us/cme_report_theo_thang/${currentDate.month}/${currentDate.year}`)
            .then(response => response.json())
            .then(res => {
                if (res.status === "success") {
                    setDataChart(res.ketqua);
                    setFullData(res.ketqua);
                } else {
                    setDataChart([]);
                    setFullData([]);
                }
            })
            .catch(error => {
                console.error("Lỗi:", error);
                setDataChart([]);
                setFullData([]);
            })
            .finally(() => setIsLoading(false));
    }, [currentDate.month, currentDate.year]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: "#fff" }
            },
            title: {
                display: false,
                text: 'Báo Cáo Lượng Mua Bán Sàn Comex'
            },
        },
        scales: {
            x: {
                stacked: true,
                ticks: { color: "#94a3b8" }
            },
            y: {
                stacked: true,
                ticks: { color: "#f1c40f" }
            },
        },
    };

    // Xử lý khi click vào cột biểu đồ
    const onChartClick = (event) => {
        const { current: chart } = chartRef;
        if (!chart) return;

        const element = getElementAtEvent(chart, event);
        if (element.length > 0) {
            const { index, datasetIndex } = element[0];
            const dayLabel = chart.data.labels[index];

            const dayData = fullData.find(item => {
                if (!item?.day) return false;
                const [, month, day] = item.day.split("-");
                return `${day}/${month}` === dayLabel;
            });

            if (dayData) {
                let combined = [];

                if (chartFilter === "hop_dong_tuong_lai") {
                    // Logic cho hợp đồng tương lai (5 datasets)
                    if (datasetIndex === 0) { // Vàng
                        combined = dayData.vang || [];
                        setDatasetIndex(0);
                    } else if (datasetIndex === 1) { // Bạc
                        combined = dayData.bac || [];
                        setDatasetIndex(1);
                    } else if (datasetIndex === 2) { // Bạch kim
                        combined = dayData.bach_kim || [];
                        setDatasetIndex(2);
                    } else if (datasetIndex === 3) { // Đồng
                        combined = dayData.dong || [];
                        setDatasetIndex(3);
                    } else { // Palladium
                        combined = dayData.palladium || [];
                        setDatasetIndex(4);
                    }
                } else {
                    // Logic cho tất cả (10 datasets - mua/bán)
                    if (datasetIndex <= 1) { // Vàng mua/bán
                        combined = dayData.vang || [];
                        setDatasetIndex(0);
                    } else if (datasetIndex <= 3) { // Bạc mua/bán
                        combined = dayData.bac || [];
                        setDatasetIndex(1);
                    } else if (datasetIndex <= 5) { // Bạch kim mua/bán
                        combined = dayData.bach_kim || [];
                        setDatasetIndex(2);
                    } else if (datasetIndex <= 7) { // Đồng mua/bán
                        combined = dayData.dong || [];
                        setDatasetIndex(3);
                    } else { // Palladium mua/bán
                        combined = dayData.palladium || [];
                        setDatasetIndex(4);
                    }
                }

                setSelectedDetails({
                    date: dayData.day,
                    contracts: combined
                });
            }
        }
    };

    // Chuyển đổi tiền tệ
    const convertMoney = (amountUSD) => {
        if (!amountUSD) return 0;

        if (displayCurrency === "USD") {
            return amountUSD;
        }

        if (displayCurrency === "VND") {
            if (!rateUSDtoVND) return 0;
            let result = amountUSD * rateUSDtoVND;
            // Nếu là vàng (datasetIndex 0), nhân thêm với 37.5
            if (datasetIndex === 0) result *= 37.5;
            return result;
        }

        if (displayCurrency === "CNY") {
            if (!rateCNYtoVND || !rateUSDtoVND) return 0;
            const vnd = amountUSD * rateUSDtoVND;
            return vnd / rateCNYtoVND;
        }

        return 0;
    };

    // Lọc hợp đồng theo loại
    const filterContracts = (contracts) => {
        return contracts; // Không filter, hiển thị tất cả
    };

const getMetalName = (datasetIndex) => {
    const metalKeys = {
        0: "gold",
        1: "silver",
        2: "platinum",
        3: "copper",
        4: "palladium"
    };
    return t(`reportComex.metal.${metalKeys[datasetIndex]}`) || "KIM LOẠI";
};

    const getColumnTitle = (baseTitle, datasetIndex, showOunce) => {
        if (datasetIndex === 0) { // vàng
            return (
                <>
                    {baseTitle} <br />
                    {showOunce ? "(Ounce)" : "(Giá / Lượng)"}
                </>
            );
        }
        if (datasetIndex === 1) { // bạc
            return (
                <>
                    {baseTitle} <br />
                    {showOunce ? "(Ounce)" : "(Giá / Kg)"}
                </>
            );
        }
        return baseTitle; // kim loại khác
    };

    // Chuyển đổi ra ounce
    const Ounce_IN_GRAM = 31.1034768;

    const calculateOuncePrice = (price, datasetIndex) => {
        if (!price) return 0;

        let priceInUSD = price;

        if (datasetIndex === 0) priceInUSD = price * Ounce_IN_GRAM;
        else if (datasetIndex === 1) priceInUSD = price * Ounce_IN_GRAM / 1000;

        // Khi showOunce, luôn về USD
        if (showOunce) return priceInUSD;

        // Nếu không showOunce thì chuyển đổi tiền tệ
        if (displayCurrency === "USD") return priceInUSD;
        if (displayCurrency === "VND") return rateUSDtoVND ? priceInUSD * rateUSDtoVND : 0;
        if (displayCurrency === "CNY") return (rateCNYtoVND && rateUSDtoVND) ? (priceInUSD * rateUSDtoVND) / rateCNYtoVND : 0;

        return priceInUSD;
    };

    // Tính tổng volume theo filter cho biểu đồ
    const calculateVolumeForChart = (metalData, contractType, chartFilter) => {
        if (!metalData || !Array.isArray(metalData)) return 0;

        let filteredData = metalData;

        // Lọc theo chartFilter trước
        if (chartFilter === "hop_dong_tuong_lai") {
            filteredData = metalData.filter(item => item.contract_type_vi === "hop_dong_tuong_lai");
        }

        // Sau đó lọc theo contractType (tang_gia/giam_gia)
        const item = filteredData.find(item => item.contract_type_vi === contractType);
        return item ? (Number(item.total_volume) || 0) : 0;
    };

    const labels = dataChart?.map(item => {
        if (!item?.day) return "";
        const [, month, day] = item.day.split("-");
        return `${day}/${month}`;
    });

    const data = {
        labels,
        datasets: chartFilter === "hop_dong_tuong_lai" ? [
            // Chỉ hiển thị hợp đồng tương lai
            {
                label: t("reportComex.metal.gold"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.vang, "hop_dong_tuong_lai", chartFilter)),
                backgroundColor: '#FCB100',
                stack: 'Stack 0',
            },
            {
                label: t("reportComex.metal.gold"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.bac, "hop_dong_tuong_lai", chartFilter)),
                backgroundColor: '#9CA3AF',
                stack: 'Stack 1',
            },
            {
                label: t("reportComex.metal.platinum"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.bach_kim, "hop_dong_tuong_lai", chartFilter)),
                backgroundColor: '#1c89f6ff',
                stack: 'Stack 2',
            },
            {
                label: t("reportComex.metal.copper"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.dong, "hop_dong_tuong_lai", chartFilter)),
                backgroundColor: '#FC7A00',
                stack: 'Stack 3',
            },
            {
                label: t("reportComex.metal.palladium"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.palladium, "hop_dong_tuong_lai", chartFilter)),
                backgroundColor: '#7C8792',
                stack: 'Stack 4',
            },
        ] : [
            // Hiển thị tất cả (mua/bán)
            {
                label: t("reportComex.metal.goldbuy"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.vang, "tang_gia", chartFilter)),
                backgroundColor: '#FCB100',
                stack: 'Stack 0',
            },
            {
                label: t("reportComex.metal.goldsell"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.vang, "giam_gia", chartFilter)),
                backgroundColor: '#F0C256',
                stack: 'Stack 0',
            },
            {
                label: t("reportComex.metal.silverbuy"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.bac, "tang_gia", chartFilter)),
                backgroundColor: '#9CA3AF',
                stack: 'Stack 1',
            },
            {
                label: t("reportComex.metal.silversell"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.bac, "giam_gia", chartFilter)),
                backgroundColor: '#E5E7EB',
                stack: 'Stack 1',
            },
            {
                label: t("reportComex.metal.platinumbuy"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.bach_kim, "tang_gia", chartFilter)),
                backgroundColor: '#1c89f6ff',
                stack: 'Stack 2',
            },
            {
                label: t("reportComex.metal.platinumsell"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.bach_kim, "giam_gia", chartFilter)),
                backgroundColor: '#7cbbfaff',
                stack: 'Stack 2',
            },
            {
                label: t("reportComex.metal.copperbuy"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.palladium, "tang_gia", chartFilter)),
                backgroundColor: '#FC7A00',
                stack: 'Stack 3',
            },
            {
                label: t("reportComex.metal.coppersell"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.dong, "giam_gia", chartFilter)),
                backgroundColor: '#F5AB67',
                stack: 'Stack 3',
            },
            {
                label: t("reportComex.metal.palladiumbuy"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.palladium, "tang_gia", chartFilter)),
                backgroundColor: '#7C8792',
                stack: 'Stack 4',
            },
            {
                label: t("reportComex.metal.palladiumsell"),
                data: dataChart?.map(item => calculateVolumeForChart(item?.palladium, "giam_gia", chartFilter)),
                backgroundColor: '#E6EBEF',
                stack: 'Stack 4',
            },
        ],
    };
    return (
        <div style={{ background: "#05111d", color: "#fff", padding: "20px", minHeight: "100vh" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
                <button onClick={() => handleMonthChange(-1)} style={btnStyle}>{t("reportComex.prev")}</button>
                <h2 style={{ color: "#f1c40f" }}>
                    {t("reportComex.title", {
                        month: currentDate.month,
                        year: currentDate.year
                    })}
                </h2>
                <button onClick={() => handleMonthChange(1)} style={btnStyle}>{t("reportComex.next")}</button>
            </div>

            {/* Tab filter cho biểu đồ */}
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "20px" }}>
                <button
                    onClick={() => setChartFilter("all")}
                    style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "1px solid #334155",
                        background: chartFilter === "all" ? "#3498db" : "#1e293b",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "14px"
                    }}
                >
                    {t("reportComex.filter.all")}
                </button>
                <button
                    onClick={() => setChartFilter("hop_dong_tuong_lai")}
                    style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "1px solid #334155",
                        background: chartFilter === "hop_dong_tuong_lai" ? "#3498db" : "#1e293b",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "14px"
                    }}
                >
                    {t("reportComex.filter.futures")}
                </button>
            </div>

            <div style={{ height: "400px", background: "#101929", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
                {isLoading ? (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#fff' }}>{t("reportComex.loading")}</div>
                ) : (!dataChart || dataChart.length === 0) ? (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#fff' }}>{t("reportComex.noData")}</div>
                ) : (
                    <Bar ref={chartRef} data={data} options={options} onClick={onChartClick} />
                )}
            </div>

            {/* BẢNG DỮ LIỆU CHI TIẾT */}
            {selectedDetails && (
                <div style={{ background: "#101929", padding: "20px", borderRadius: "8px", border: "1px solid #1e293b" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                        <h3 style={{ color: "#3498db", margin: 0 }}>
                            {t("reportComex.detail.title")}:{" "}
                            <span style={{ color: "red" }}>
                                {selectedDetails.date.split("-").reverse().join("/")}
                            </span>
                        </h3>
                        <div style={{
                            background: datasetIndex === 0 ? "#f1c40f" :
                                datasetIndex === 1 ? "#bdc3c7" :
                                    datasetIndex === 2 ? "#3498db" :
                                        datasetIndex === 3 ? "#e67e22" : "#9b59b6",
                            color: "#000",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "14px",
                            fontWeight: "bold"
                        }}>
                            {getMetalName(datasetIndex)}
                        </div>
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                        <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>
                            {t("reportComex.detail.description")}
                        </p>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                            <thead>
                                <tr style={{ background: "#172a45", color: "#94a3b8" }}>
                                    <th style={thStyle}>{t("reportComex.table.contractType")}</th>
                                    <th style={thStyle}>{t("reportComex.table.electronicVolume")}</th>
                                    <th style={thStyle}>{t("reportComex.table.floorVolume")}</th>
                                    <th style={thStyle}>{t("reportComex.table.offFloorVolume")}</th>
                                    <th style={thStyle}>{t("reportComex.table.totalVolume")}</th>
                                    <th style={thStyle}>{t("reportComex.table.openInterest")}</th>
                                    <th style={thStyle}>{t("reportComex.table.oiChange")}</th>
                                    <th style={thStyle}>{t("reportComex.table.reportDate")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedDetails.contracts.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: "1px solid #1e293b" }}>
                                        <td style={{ ...tdStyle, color: "#fff" }}>
                                            {item.contract_type_vi === "hop_dong_tuong_lai" ? t("reportComex.contractType.futures") :
                                                item.contract_type_vi === "quyen_chon" ? t("reportComex.contractType.option") :
                                                    item.contract_type_vi === "tang_gia" ? t("reportComex.contractType.call") :
                                                        item.contract_type_vi === "giam_gia" ? t("reportComex.contractType.put") :
                                                            item.contract_type_vi || "—"}
                                        </td>
                                        <td style={tdStyle}>{Number(item.electronic_volume || 0).toLocaleString()}</td>
                                        <td style={tdStyle}>{Number(item.floor_volume || 0).toLocaleString()}</td>
                                        <td style={tdStyle}>{Number(item.off_floor_volume || 0).toLocaleString()}</td>
                                        <td style={{ ...tdStyle, color: "#f1c40f", fontWeight: "bold" }}>
                                            {Number(item.total_volume || 0).toLocaleString()}
                                        </td>
                                        <td style={tdStyle}>{Number(item.open_interest || 0).toLocaleString()}</td>
                                        <td style={{
                                            ...tdStyle,
                                            color: (item.oi_change || 0) > 0 ? '#2ecc71' :
                                                (item.oi_change || 0) < 0 ? '#e74c3c' : '#94a3b8'
                                        }}>
                                            {item.oi_change ?
                                                ((item.oi_change > 0 ? '+' : '') + Number(item.oi_change).toLocaleString()) :
                                                "0"}
                                        </td>
                                        <td style={tdStyle}>
                                            {item.report_date ?
                                                new Date(item.report_date).toLocaleDateString('vi-VN') :
                                                "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReportComexChart;