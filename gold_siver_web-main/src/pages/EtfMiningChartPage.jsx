import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Highcharts from "highcharts/highstock";
import HighchartsReact from "highcharts-react-official";

const miningETFList = {
    iShares_Gold_Producers_UCITS: {
        name: "iShares Gold Producers UCITS ETF",
        description:
            "iShares Gold Producers UCITS ETF là một quỹ hoán đổi danh mục (ETF) đầu tư vào các công ty khai thác vàng hàng đầu thế giới. Quỹ theo dõi chỉ số các doanh nghiệp khai thác vàng lớn, giúp nhà đầu tư tiếp cận ngành khai thác kim loại quý.",
        features: {
            muc_tieu: "Đầu tư vào các công ty khai thác vàng.",
            loai_hinh: "Quỹ ETF (Exchange Traded Fund).",
            tai_san:
                "Bao gồm các công ty khai thác, thăm dò và sản xuất vàng trên toàn cầu.",
            ma_giao_dich: "SPGP (niêm yết trên nhiều sàn châu Âu)."
        }
    },

    Global_X_Silver_Miners: {
        name: "Global X Silver Miners ETF",
        description:
            "Global X Silver Miners ETF (mã: SIL) là một quỹ hoán đổi danh mục (ETF) đầu tư vào các công ty khai thác bạc hàng đầu thế giới. Quỹ theo dõi chỉ số Solactive Global Silver Miners và bao gồm các doanh nghiệp tham gia khai thác, tinh chế hoặc thăm dò bạc, giúp nhà đầu tư tiếp cận ngành công nghiệp này.",
        features: {
            muc_tieu: "Đầu tư vào các công ty khai thác bạc.",
            loai_hinh: "Quỹ ETF (Exchange Traded Fund).",
            tai_san:
                "Bao gồm các công ty khai thác, tinh chế hoặc thăm dò bạc.",
            ma_giao_dich: "SIL (niêm yết trên sàn NYSE Arca)."
        }
    },

    Market_Access_NYSE_Arca_Gold_Bugs_UCITS: {
        name: "Market Access NYSE Arca Gold BUGS UCITS ETF",
        description:
            "Market Access NYSE Arca Gold BUGS UCITS ETF là quỹ ETF theo dõi chỉ số NYSE Arca Gold BUGS Index, bao gồm các công ty khai thác vàng lớn không thực hiện hedge giá vàng.",
        features: {
            muc_tieu: "Theo dõi hiệu suất các công ty khai thác vàng lớn.",
            loai_hinh: "Quỹ ETF (Exchange Traded Fund).",
            tai_san:
                "Bao gồm các công ty khai thác vàng quốc tế trong chỉ số Gold BUGS.",
            ma_giao_dich: "HUI Index ETF (niêm yết tại châu Âu)."
        }
    },

    UBS_Solactive_Global_Pure_Gold_Miners: {
        name: "UBS Solactive Global Pure Gold Miners ETF",
        description:
            "UBS Solactive Global Pure Gold Miners ETF là quỹ ETF đầu tư vào các công ty khai thác vàng thuần túy trên toàn cầu. Quỹ theo dõi chỉ số Solactive Global Pure Gold Miners.",
        features: {
            muc_tieu: "Đầu tư vào các công ty khai thác vàng thuần.",
            loai_hinh: "Quỹ ETF (Exchange Traded Fund).",
            tai_san:
                "Bao gồm các công ty khai thác vàng có tỷ trọng doanh thu lớn từ vàng.",
            ma_giao_dich: "UBS Gold Miners UCITS ETF."
        }
    },

    VanEck_Gold_Miners_UCITS_ETF: {
        name: "VanEck Gold Miners UCITS ETF",
        description:
            "VanEck Gold Miners UCITS ETF là một quỹ ETF theo dõi hiệu suất của các công ty khai thác vàng lớn toàn cầu. Đây là phiên bản UCITS của quỹ nổi tiếng Gold Miners ETF.",
        features: {
            muc_tieu: "Đầu tư vào các công ty khai thác vàng lớn.",
            loai_hinh: "Quỹ ETF (Exchange Traded Fund).",
            tai_san:
                "Bao gồm các tập đoàn khai thác vàng lớn trên thế giới.",
            ma_giao_dich: "GDX UCITS (niêm yết trên nhiều sàn châu Âu)."
        }
    },

    VanEck_Junior_Gold_Miners_UCITS: {
        name: "VanEck Junior Gold Miners UCITS ETF",
        description:
            "VanEck Junior Gold Miners UCITS ETF là một quỹ hoán đổi danh mục (ETF) đầu tư vào các công ty khai thác vàng quy mô nhỏ và trung bình trên toàn cầu. Quỹ theo dõi chỉ số MVIS Global Junior Gold Miners và bao gồm các doanh nghiệp hoạt động trong lĩnh vực thăm dò, phát triển và khai thác vàng, giúp nhà đầu tư tiếp cận phân khúc tăng trưởng cao của ngành khai thác vàng.",
        features: {
            muc_tieu:
                "Đầu tư vào các công ty khai thác vàng quy mô nhỏ và trung bình (junior miners).",
            loai_hinh: "Quỹ ETF (Exchange Traded Fund).",
            tai_san:
                "Bao gồm các công ty thăm dò, phát triển và khai thác vàng trên toàn cầu.",
            ma_giao_dich:
                "GDXJ (phiên bản UCITS niêm yết trên các sàn giao dịch châu Âu như LSE và Xetra)."
        }
    },

    HANetf_AuAg_ESG_Gold_Mining_UCITS: {
        name: "HANetf AuAg ESG Gold Mining UCITS ETF",
        description:
            "HANetf AuAg ESG Gold Mining UCITS ETF là quỹ ETF đầu tư vào các công ty khai thác vàng tuân thủ tiêu chuẩn ESG (môi trường, xã hội và quản trị).",
        features: {
            muc_tieu: "Đầu tư vào các công ty khai thác vàng theo tiêu chí ESG.",
            loai_hinh: "Quỹ ETF (Exchange Traded Fund).",
            tai_san:
                "Bao gồm các công ty khai thác vàng đáp ứng tiêu chuẩn bền vững.",
            ma_giao_dich: "ESGO ETF."
        }
    },

    VanEck_SP_Global_Mining_UCITS_ETF_A: {
        name: "VanEck S&P Global Mining UCITS ETF",
        description:
            "VanEck S&P Global Mining UCITS ETF là quỹ ETF đầu tư vào các công ty khai thác khoáng sản toàn cầu, bao gồm vàng, bạc và các kim loại công nghiệp.",
        features: {
            muc_tieu: "Đầu tư vào ngành khai thác khoáng sản toàn cầu.",
            loai_hinh: "Quỹ ETF (Exchange Traded Fund).",
            tai_san:
                "Bao gồm các công ty khai thác kim loại và khoáng sản trên toàn thế giới.",
            ma_giao_dich: "SPGP Mining ETF."
        }
    },

    LG_Gold_Mining_UCITS_ETF: {
        name: "LG Gold Mining UCITS ETF",
        description:
            "LG Gold Mining UCITS ETF là quỹ ETF đầu tư vào các công ty khai thác vàng toàn cầu, giúp nhà đầu tư tiếp cận ngành khai thác vàng thông qua danh mục cổ phiếu đa dạng.",
        features: {
            muc_tieu: "Đầu tư vào các công ty khai thác vàng.",
            loai_hinh: "Quỹ ETF (Exchange Traded Fund).",
            tai_san:
                "Bao gồm các doanh nghiệp khai thác vàng trên nhiều thị trường.",
            ma_giao_dich: "LG Gold Mining ETF."
        }
    }
};

const getEtfBySymbol = (symbol) => {
    if (!symbol) return null;

    const search = symbol.toLowerCase();

    const entry = Object.entries(miningETFList).find(([key, etf]) => {
        const keyMatch = key.toLowerCase() === search;

        const code = etf.features.ma_giao_dich
            ?.split(" ")[0]
            ?.toLowerCase();

        const symbolMatch = code === search;

        return keyMatch || symbolMatch;
    });

    return entry ? entry[1] : null;
};

const EtfMiningChartPage = () => {
    const { symbol } = useParams();
    const [options, setOptions] = useState(null);
    const [chartType, setChartType] = useState("area");
    const [loading, setLoading] = useState(true);
    const [lineData, setLineData] = useState([]);
    const etfInfo = getEtfBySymbol(symbol);

    // Fetch dữ liệu từ API
    useEffect(() => {
        if (!symbol) return;

        setLoading(true);

        fetch(`https://api_gold.thinkdiff.us/${symbol}`)
            .then((res) => res.json())
            .then((res) => {
                const series = res.data?.series || [];

                // Parse dữ liệu từ series
                const data = series
                    .filter(item => item.value?.raw !== null && item.value?.raw !== undefined)
                    .map((item) => ({
                        x: new Date(item.date).getTime(),
                        y: Number(item.value.raw),
                        date: item.date
                    }));

                // Sắp xếp theo thời gian
                data.sort((a, b) => a.x - b.x);
                setLineData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Fetch chart error:", err);
                setLoading(false);
            });
    }, [symbol]);

    // Tính tỉ lệ tăng trưởng
    const calculateGrowth = (data) => {
        if (!data || data.length < 2) return {};

        const currentPrice = data[data.length - 1].y;

        const getDateDaysAgo = (days) => {
            const now = data[data.length - 1].x;
            const targetTime = now - (days * 24 * 60 * 60 * 1000);

            let closest = data[0];
            let minDiff = Infinity;

            data.forEach(d => {
                const diff = Math.abs(d.x - targetTime);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = d;
                }
            });

            return closest;
        };

        const timePeriods = [
            { label: "1D", days: 1 },
            { label: "2D", days: 2 },
            { label: "3D", days: 3 },
            { label: "1W", days: 7 },
            { label: "2W", days: 14 },
            { label: "3W", days: 21 },
            { label: "1M", days: 30 },
            { label: "2M", days: 60 },
            { label: "3M", days: 90 },
            { label: "6M", days: 180 },
            { label: "1Y", days: 365 },
        ];

        const growth = {};

        timePeriods.forEach(period => {
            const past = getDateDaysAgo(period.days);
            const rate = ((currentPrice - past.y) / past.y) * 100;
            growth[period.label] = rate;
        });

        return growth;
    };
    const growthData = calculateGrowth(lineData);
    const GrowthBox = ({ label, rate }) => {
        const isPositive = rate >= 0;


        return (
            <div style={{
                flex: "1 1 auto",
                minWidth: "70px",
                padding: "10px",
                backgroundColor: isPositive
                    ? "rgba(0,180,96,0.2)"
                    : "rgba(255,70,72,0.2)",
                border: `2px solid ${isPositive ? "#00b060" : "#ff4648"}`,
                borderRadius: "6px",
                textAlign: "center",
            }}>
                <div style={{ fontSize: "14px", color: "#999", fontWeight: "600" }}>
                    {label}
                </div>

                <div style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: isPositive ? "#00ff80" : "#ff4d4d",
                    marginTop: "4px"
                }}>
                    {isPositive ? "+" : ""}{rate.toFixed(2)}%
                </div>
            </div>
        );
    };

    // Update chart khi chartType hoặc lineData thay đổi
    useEffect(() => {
        if (lineData.length === 0) return;

        Highcharts.setOptions({
            time: {
                useUTC: false
            }
        });

        setOptions({
            chart: {
                backgroundColor: "#000",
                height: 800,
                marginRight: 80,
            },

            rangeSelector: {
                selected: 1,
                inputEnabled: false,
                buttons: [
                    {
                        type: 'day',
                        count: 1,
                        text: '1D'
                    },
                    {
                        type: 'day',
                        count: 5,
                        text: '5D'
                    },
                    {
                        type: 'month',
                        count: 1,
                        text: '1M'
                    },
                    {
                        type: 'month',
                        count: 6,
                        text: '6M'
                    },
                    {
                        type: 'year',
                        count: 1,
                        text: '1Y'
                    },
                    {
                        type: 'year',
                        count: 5,
                        text: '5Y'
                    },
                    {
                        type: 'all',
                        text: 'All'
                    }
                ],
                buttonTheme: {
                    fill: "#111",
                    stroke: "#333",
                    style: { color: "#999" },
                    states: {
                        select: {
                            fill: "#00b060",
                            stroke: "#00ff80",
                            style: { color: "#fff" }
                        }
                    }
                }
            },

            title: {
                useHTML: true,
                text: `
                <div style="
                    text-align:left;
                    max-width:950px;
                    white-space:normal;
                    word-wrap:break-word;
                    line-height:1.6;
                ">
                    <h2 style="
                        color:#fff;
                        margin:0 0 10px 0;
                        font-size:20px;
                        font-weight:700;
                    ">
                        ${symbol} - Biểu đồ giá ETF khai thác mỏ
                    </h2>

                    ${etfInfo ? `
                    <div style="
                        margin-top:10px;
                        padding:15px;
                        background:#0a0a0a;
                        border:1px solid #222;
                        border-radius:8px;
                        color:#ddd;
                        font-size:16px;
                        line-height:1.6;
                        word-break:break-word;
                    ">

                        <p style="
                            margin-bottom:10px;
                            font-size:14px;
                        ">
                            ${etfInfo.description}
                        </p>

                        <div style="
                            font-size:14px;
                            color:#aaa;
                        ">
                            <p><b>Mục tiêu:</b> ${etfInfo.features.muc_tieu}</p>
                            <p><b>Loại hình:</b> ${etfInfo.features.loai_hinh}</p>
                            <p><b>Tài sản:</b> ${etfInfo.features.tai_san}</p>
                            <p><b>Mã giao dịch:</b> ${etfInfo.features.ma_giao_dich}</p>
                        </div>

                    </div>
                    ` : ""}
                </div>
                `
            },

            xAxis: {
                crosshair: {
                    width: 1,
                    color: "#888",
                    dashStyle: "Dash",
                    snap: true
                },
                gridLineColor: "#111",
                lineColor: "#333",
                labels: { enabled: false }
            },

            yAxis: {
                title: { text: "Giá", style: { color: "#00ff80" } },
                opposite: true,
                offset: 40,
                labels: { style: { color: "#00ff80" } },
                gridLineColor: "#222",
                min: null,
                startOnTick: false,
                endOnTick: false,
                crosshair: {
                    width: 1,
                    color: "#888",
                    dashStyle: "Dash",
                    snap: false
                }
            },

            tooltip: {
                shared: true,
                crosshairs: true,
                followPointer: true,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                borderColor: "none",
                borderRadius: 5,
                style: { color: "#fff" },
                formatter: function () {
                    const date = Highcharts.dateFormat(
                        "%d/%m/%Y",
                        this.x
                    );

                    if (this.points) {
                        const point = this.points[0];
                        return `
                    <b>${date}</b><br/>
                    <div style="font-weight: bold; color: #02f2c2;">Giá:</div>
                    <p style="font-weight: bold; color: #ffd700;">${point.y.toFixed(2)}</p>
                `;
                    }

                    return `<b>${date}</b>`;
                }
            },

            plotOptions: {
                series: {
                    softThreshold: false
                },
                line: {
                    color: "#ff4648",
                    lineWidth: 2,
                },
                area: {
                    color: "#ff4648",
                    lineColor: "#ff4648",
                    fillOpacity: 0.3,
                    lineWidth: 2,
                }
            },

            series: [
                {
                    type: chartType,
                    name: symbol,
                    data: lineData,
                    marker: {
                        enabled: false,
                        radius: 2,
                        states: {
                            hover: { radius: 4 }
                        }
                    }
                }
            ],

            credits: { enabled: false }   
        });
    }, [lineData, chartType, symbol]);

    return ( 
        <div style={{ background: "#000", padding: "10px", marginRight: "20px" }}>
            {/* Growth Stats */}
            <div style={{
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#0a0a0a",
                borderRadius: "8px",
                border: "1px solid #222",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
            }}>
                {Object.entries(growthData).map(([label, rate]) => (
                    <GrowthBox key={label} label={label} rate={rate} />
                ))}
            </div>
            <div style={{ marginBottom: "15px", display: "flex", gap: "8px" }}>
                <button
                    onClick={() => setChartType("line")}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: chartType === "line" ? "#00b060" : "#111",
                        color: chartType === "line" ? "#fff" : "#999",
                        border: "1px solid #333",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: chartType === "line" ? "bold" : "normal",
                        transition: "all 0.3s"
                    }}
                >
                    Line
                </button>

                <button
                    onClick={() => setChartType("area")}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: chartType === "area" ? "#00b060" : "#111",
                        color: chartType === "area" ? "#fff" : "#999",
                        border: "1px solid #333",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: chartType === "area" ? "bold" : "normal",
                        transition: "all 0.3s"
                    }}
                >
                    Area
                </button>
            </div>

            {loading && (
                <div style={{ color: "#fff", padding: "20px", textAlign: "center" }}>
                    Loading...
                </div>
            )}

            {!loading && options && (
                <HighchartsReact
                    highcharts={Highcharts}
                    constructorType={"stockChart"}
                    options={options}
                />
            )}
        </div>
    );
};

export default EtfMiningChartPage;
