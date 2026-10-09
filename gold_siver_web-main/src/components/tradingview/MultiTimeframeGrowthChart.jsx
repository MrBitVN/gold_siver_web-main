import React, { useState, useEffect } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import Chart from "react-apexcharts";
import "./TableComparisonDataWeek.css";
import { useTranslation } from "react-i18next";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const PAGE_SIZE = 10;

const formatLabelDate = (dateStr) => {
    if (!dateStr) return "-";

    const d = new Date(dateStr);

    return `${d.getDate()}/${d.getMonth() + 1}`;
};

const MultiTimeframeGrowthChart = () => {

    const { t, i18n } = useTranslation();

    const [apiContent, setApiContent] = useState(null);

    const [isLoading, setIsLoading] = useState(true);

    const [timeframe, setTimeframe] = useState("day");

    const [selectedRange, setSelectedRange] = useState(-1);
    // -1 = tất cả

    const [chartType, setChartType] = useState("bar");

    const [candleMetal, setCandleMetal] = useState("silver");

    useEffect(() => {

        fetch(
            "https://api_gold.thinkdiff.us/tinh_tile_phat_trien_tung_ngay_tuan_thang"
        )
            .then((res) => res.json())
            .then((json) => {

                if (json.status === "success") {

                    setApiContent(
                        json.tinh_tile_phat_trien_tung_ngay_tuan_thang
                    );
                }

                setIsLoading(false);

            })
            .catch(() => setIsLoading(false));

    }, []);

    if (isLoading) {

        return (
            <div className="no-data-message">
                <p>
                    {t("MultiTimeframeGrowthChart.loading")}
                </p>
            </div>
        );
    }

    if (!apiContent) {

        return (
            <div className="no-data-message">
                <p>
                    {t("MultiTimeframeGrowthChart.noData")}
                </p>
            </div>
        );
    }

    let goldRaw = [];
    let silverRaw = [];
    let title = "";

    if (timeframe === "day") {

        goldRaw = apiContent.data_vang_1ngay_trave;

        silverRaw = apiContent.data_bac_1ngay_trave;

        title = t("MultiTimeframeGrowthChart.dayTitle");

    } else if (timeframe === "week") {

        goldRaw = apiContent.data_vang_7ngay_trave;

        silverRaw = apiContent.data_bac_7ngay_trave;

        title = t("MultiTimeframeGrowthChart.weekTitle");

    } else {

        goldRaw = apiContent.data_vang_1thang_trave;

        silverRaw = apiContent.data_bac_1thang_trave;

        title = t("MultiTimeframeGrowthChart.monthTitle");
    }

    const sortedGold = [...goldRaw].sort(
        (a, b) =>
            new Date(a.time_dautien) -
            new Date(b.time_dautien)
    );

    const sortedSilver = [...silverRaw].sort(
        (a, b) =>
            new Date(a.time_dautien) -
            new Date(b.time_dautien)
    );

    const totalPages = Math.ceil(
        sortedGold.length / PAGE_SIZE
    );

    let gData = [];
    let sData = [];

    if (selectedRange === -1) {

        gData = sortedGold;

        sData = sortedSilver;

    } else {

        const start =
            selectedRange * PAGE_SIZE;

        const end =
            start + PAGE_SIZE;

        gData =
            sortedGold.slice(start, end);

        sData =
            sortedSilver.slice(start, end);
    }

    const chartDataBar = {

        labels: gData.map((item) =>
            formatLabelDate(
                item.time_dautien
            )
        ),

        datasets: [
            {
                label:
                    t(
                        "MultiTimeframeGrowthChart.gold"
                    ) +
                    " (XAU/USD)",

                data: gData.map(
                    (i) =>
                        i.ti_le_tang_truong
                ),

                backgroundColor:
                    "#f1c40f",

                borderRadius: 4,
            },

            {
                label:
                    t(
                        "MultiTimeframeGrowthChart.silver"
                    ) +
                    " (XAG/USD)",

                data: sData.map(
                    (i) =>
                        i.ti_le_tang_truong
                ),

                backgroundColor:
                    "#c0c0c0",

                borderRadius: 4,
            },
        ],
    };

    const selectedCandleData =
        candleMetal === "gold"
            ? gData
            : sData;

    const candleSeries = [
        {
            name:
                candleMetal ===
                    "gold"
                    ? t(
                        "MultiTimeframeGrowthChart.gold"
                    )
                    : t(
                        "MultiTimeframeGrowthChart.silver"
                    ),

            data:
                selectedCandleData.map(
                    (i) => {

                        const open =
                            i.open ??
                            i.ti_le_tang_truong;

                        const high =
                            i.high ??
                            i.ti_le_tang_truong;

                        const low =
                            i.low ??
                            i.ti_le_tang_truong;

                        const close =
                            i.close ??
                            i.ti_le_tang_truong;

                        return {

                            x:
                                formatLabelDate(
                                    i.time_dautien
                                ),

                            y: [
                                open,
                                high,
                                low,
                                close,
                            ],
                        };
                    }
                ),
        },
    ];

    return (

        <div
            className="analysis-page"
            style={{
                padding: "20px",
                backgroundColor:
                    "#0f172a",
                minHeight:
                    "100vh",
            }}
        >

            <div
                style={{
                    display:
                        "flex",
                    justifyContent:
                        "space-between",
                    alignItems:
                        "center",
                    marginBottom:
                        "20px",
                    flexWrap:
                        "wrap",
                    gap: "10px",
                }}
            >

                <h2
                    style={{
                        color:
                            "#f1c40f",
                        margin: 0,
                    }}
                >
                    {
                        t(
                            "MultiTimeframeGrowthChart.title"
                        )
                    }
                </h2>

                <div
                    style={{
                        display:
                            "flex",
                        gap: "8px",
                    }}
                >

                    {[
                        "day",
                        "week",
                        "month",
                    ].map(
                        (
                            tf
                        ) => (

                            <button
                                key={
                                    tf
                                }
                                onClick={() => {

                                    setTimeframe(
                                        tf
                                    );

                                    setSelectedRange(
                                        -1
                                    );
                                }}
                                className={`view-toggle-btn ${timeframe === tf
                                    ? "active"
                                    : ""
                                    }`}
                            >

                                {
                                    tf
                                }

                            </button>
                        )
                    )}

                </div>

            </div>

            <div className="chart-container">

                <div className="chart-header">

                    <h3 className="chart-title">
                        {title}
                    </h3>

                   <div className="range-scroll">

    <button
        className={`range-btn ${
            selectedRange === -1
                ? "active"
                : ""
        }`}
        onClick={() =>
            setSelectedRange(-1)
        }
    >
        Tất cả
    </button>

    {Array.from({
        length: totalPages,
    }).map((_, index) => {

        const startIndex =
            index * PAGE_SIZE;

        const endIndex =
            Math.min(
                startIndex +
                    PAGE_SIZE -
                    1,
                sortedGold.length -
                    1
            );

        const startDate =
            sortedGold[
                startIndex
            ]?.time_dautien;

        const endDate =
            sortedGold[
                endIndex
            ]?.time_dautien;

        return (

            <button
                key={index}
                className={`range-btn ${
                    selectedRange ===
                    index
                        ? "active"
                        : ""
                }`}
                onClick={() =>
                    setSelectedRange(
                        index
                    )
                }
            >

                {formatLabelDate(
                    startDate
                )}

                -

                {formatLabelDate(
                    endDate
                )}

            </button>
        );
    })}

</div>

                    <div
                        style={{
                            display:
                                "flex",
                            gap: "10px",
                        }}
                    >

                        <button
                            className="filter-btn"
                            onClick={() =>
                                setChartType(
                                    chartType ===
                                        "bar"
                                        ? "candle"
                                        : "bar"
                                )
                            }
                        >

                            {chartType ===
                                "bar"
                                ? "Candle"
                                : "Bar"}

                        </button>

                        {chartType ===
                            "candle" && (

                                <>

                                    <button
                                        className="filter-btn"
                                        onClick={() =>
                                            setCandleMetal(
                                                "gold"
                                            )
                                        }
                                    >
                                        Vàng
                                    </button>

                                    <button
                                        className="filter-btn"
                                        onClick={() =>
                                            setCandleMetal(
                                                "silver"
                                            )
                                        }
                                    >
                                        Bạc
                                    </button>

                                </>
                            )}

                    </div>

                </div>

                <div
                    className="chart-wrapper"
                    style={{
                        height:
                            "400px",
                    }}
                >

                    {chartType ===
                        "bar" ? (

<Bar

    data={chartDataBar}

    plugins={[

        {
            id: "valueLabel",

            afterDraw: (chart) => {

                const { ctx } = chart;

                ctx.save();

                ctx.font = "bold 10px Arial";

                ctx.textAlign = "center";

                chart.data.datasets.forEach(

                    (
                        dataset,
                        datasetIndex
                    ) => {

                        const meta =
                            chart.getDatasetMeta(
                                datasetIndex
                            );

                        meta.data.forEach(

                            (
                                bar,
                                index
                            ) => {

                                const value =
                                    dataset.data[
                                    index
                                    ];

                                if (
                                    value === undefined
                                ) {
                                    return;
                                }

                                ctx.fillStyle =
                                    value >= 0
                                        ? "#2ecc71"
                                        : "#e74c3c";

                                ctx.fillText(

                                    `${Number(
                                        value
                                    ).toFixed(
                                        2
                                    )}%`,

                                    bar.x,

                                    value >= 0
                                        ? bar.y - 8
                                        : bar.y + 14
                                );
                            }
                        );
                    }
                );

                ctx.restore();
            },
        },

    ]}

    options={{

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

            legend: {

                labels: {
                    color: "#fff",
                },
            },

            tooltip: {
                enabled: true,
            },
        },

        scales: {

            x: {

                ticks: {

                    color: "#94a3b8",

                    maxRotation: 0,

                    minRotation: 0,
                },

                grid: {
                    display: false,
                },
            },

            y: {

                ticks: {
                    color: "#94a3b8",
                },

                beginAtZero: true,
            },
        },
    }}
/>

                    ) : (

                        <Chart

                            type="candlestick"

                            height="100%"

                            series={
                                candleSeries
                            }

                            options={{

                                chart: {
                                    toolbar: {
                                        show: false,
                                    },
                                },

                                theme: {
                                    mode: "dark",
                                },

                                tooltip: {

                                    custom:
                                        ({
                                            dataPointIndex,
                                        }) => {

                                            const data =
                                                selectedCandleData[
                                                dataPointIndex
                                                ];

                                            const open =
                                                data.open ??
                                                data.ti_le_tang_truong;

                                            const high =
                                                data.high ??
                                                data.ti_le_tang_truong;

                                            const low =
                                                data.low ??
                                                data.ti_le_tang_truong;

                                            const close =
                                                data.close ??
                                                data.ti_le_tang_truong;

                                            return `
                                            <div style="padding:10px">
                                                <div>
                                                    ${new Date(
                                                data.time_dautien
                                            ).toLocaleDateString(
                                                i18n.language === "vi"
                                                    ? "vi-VN"
                                                    : "en-US"
                                            )}
                                                </div>

                                                <div>
                                                    Open: ${open.toFixed(
                                                2
                                            )}
                                                </div>

                                                <div>
                                                    High: ${high.toFixed(
                                                2
                                            )}
                                                </div>

                                                <div>
                                                    Low: ${low.toFixed(
                                                2
                                            )}
                                                </div>

                                                <div>
                                                    Close: ${close.toFixed(
                                                2
                                            )}
                                                </div>
                                            </div>
                                            `;
                                        },
                                },
                            }}
                        />
                    )}

                </div>

            </div>

        </div>
    );
};

export default MultiTimeframeGrowthChart;