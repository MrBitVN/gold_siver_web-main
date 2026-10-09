import { useEffect, useMemo, useState } from "react";
import _ from 'lodash'
import { useTranslation } from "react-i18next";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip,
    Legend,
    TimeScale,
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip,
    Legend,
    TimeScale
);

function ReservesComexChart({ type = "gold", title }) {
    const { t } = useTranslation();
    
    const timeRange = [
        t('ComexInventoryChart.sevenDays', '7 ngày'), 
        t('ComexInventoryChart.thirtyDays', '30 ngày'), 
        t('ComexInventoryChart.ninetyDays', '90 ngày'), 
        t('ComexInventoryChart.oneYear', '1 năm')
    ];

    const [dataChart, setDataChart] = useState([])
    const [timeRangeState, setTimeRangeState] = useState(timeRange[0])

    // Update state if language changes
    useEffect(() => {
        setTimeRangeState(timeRange[0]);
    }, [t]);

    useEffect(() => {
        const fetchDataChart = async (urlAPI) => {
            try {
                const res = await fetch(urlAPI);
                const data = await res.json();
                if (data && data?.status === "success") {
                    setDataChart(data?.data);
                }
            } catch (error) {
                console.error(error);
            }
        }
        if (type === "gold") {
            fetchDataChart("https://api_gold.thinkdiff.us/comex_gold_data")
        }
        if (type === "silver") {
            fetchDataChart("https://api_gold.thinkdiff.us/comex_silver_data")
        }
    }, [])

    const filterData = useMemo(() => {
        let cloneData = []
        if (timeRangeState === timeRange[0]) {
            cloneData = dataChart?.slice(-7)
        }
        else if (timeRangeState === timeRange[1]) {
            cloneData = dataChart?.slice(-30)
        }
        else if (timeRangeState === timeRange[2]) {
            cloneData = dataChart?.slice(-90)
        }
        else if (timeRangeState === timeRange[3]) {
            cloneData = dataChart?.slice(-365)
        }
        else {
            cloneData = _.cloneDeep(dataChart)
        }
        return cloneData

    }, [timeRangeState, dataChart, t])

    const data = {
        labels: filterData?.map(item => item?.date),
        datasets: [
            {
                type: "line",
                label: t('ComexInventoryChart.reservesTon', 'Dự trữ(tấn)'),
                data: filterData?.map(item => item?.value),
                borderColor: type === "gold" ? '#FDE047' : '#c9c3c3',
                backgroundColor: type === "gold" ? '#FDE047' : '#c9c3c3',
                tension: 0.3,
                pointRadius: 2,
            }
        ]
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { mode: "index", intersect: false },
        },
        scales: {
            x: {
                border: {
                    color: "#c9c3c3", // đường trục X
                },
                grid: {
                    color: "rgba(255,255,255,0.05)", // lưới dọc
                },
                ticks: {
                    callback: function (value, index) {
                        const label = this.getLabelForValue(value);
                        if (!label) return "";
                        const parts = label.split("-");
                        if (parts.length < 3) return label;
                        const [, month, day] = parts;
                        return `${day}/${month}`;
                    },
                },
            },
            y: {
                beginAtZero: false,
                border: {
                    color: "#c9c3c3", // đường trục X
                },
                grid: {
                    color: "rgba(255,255,255,0.05)", // lưới dọc
                },
                ticks: {
                    callback: function (value) {
                        return value >= 1_000_000
                            ? (value / 1_000_000).toFixed(1) + "M"
                            : value;
                    },
                },
            },
        },
    };

    const displayTitle = title || (type === "gold" ? t('ComexInventoryChart.goldReservesTitle', 'Biểu đồ dự trữ vàng của Comex') : t('ComexInventoryChart.silverReservesTitle', 'Biểu đồ dự trữ bạc của Comex'));

    return (
        <div>
            <h2 style={{ textAlign: 'center', color: type === "gold" ? '#FDE047' : '#c9c3c3' }}>{displayTitle}</h2>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', padding: '20px', }}>
                    {timeRange.map((item) => {
                        const isActive = timeRangeState === item;
                        return (
                            <button
                                key={item}
                                onClick={() => setTimeRangeState(item)}
                                style={{
                                    backgroundColor: isActive ? '#FDE047' : '#4B5563',
                                    color: isActive ? '#000000' : '#E5E7EB',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    fontWeight: isActive ? 'bold' : 'normal',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                            >
                                {item}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div style={{
                height: '400px',
                width: '100%',
                margin: '0 auto',
                position: 'relative',
                padding: '0 20px'
            }}>
                {dataChart.length > 0 ? (
                    <Chart type='line' data={data} options={options} />
                ) : (
                    <p style={{ textAlign: 'center', marginTop: '50px', color: '#9CA3AF' }}>{t('ComexInventoryChart.loading', 'Đang tải dữ liệu...')}</p>
                )}
            </div>
        </div>
    );
}

export default ReservesComexChart;