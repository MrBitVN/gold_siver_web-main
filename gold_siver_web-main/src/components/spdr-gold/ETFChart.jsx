import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend } from "chart.js";
import { Chart } from "react-chartjs-2";
import { useLocation } from "react-router-dom";
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, zoomPlugin);
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import './ETFChart.css'

function ETFChart({ dataETF, urlParams }) {

    const navigate = useNavigate()
    const location = useLocation()
    const [weekOrMonth, setWeekOrMonth] = useState('weekly')

    const { day, month, year, hour, minute } = urlParams

    let data = null
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: { display: true },
                // Giữ khoảng cách cột cố định
                // ticks: {
                //     maxRotation: 0,
                //     autoSkip: true, // bỏ một số label để không chi chít
                //     maxTicksLimit: 10 // chỉ hiện 10 cột trên trục X
                // }
            },
            y1: {
                position: "left",
                grid: { drawOnChartArea: false },
            },
        },
        plugins: {
            tooltip: {
                enabled: true,
                mode: 'index',   // gộp tooltip theo index
                intersect: false,
                callbacks: {
                    label: function (context) {
                        // Format label hiển thị giá trị
                        const label = context.dataset.label || '';
                        const value = context.raw;
                        return `${label}: ${value.toFixed(2)}`;
                    }
                }
            },
            zoom: {
                pan: {
                    enabled: location.pathname.split('/')[1] === "quy-dau-tu" ? true : false,
                    mode: "x", // pan X và Y 
                    modifierKey: null
                },
                zoom: {
                    wheel: { enabled: location.pathname.split('/')[1] === "quy-dau-tu" ? true : false },
                    pinch: { enabled: location.pathname.split('/')[1] === "quy-dau-tu" ? true : false },
                    mode: "x" // chỉ zoom theo X
                }
            }
        }
    };

    if (weekOrMonth === 'weekly') {
        data = {
            labels: dataETF?.dataWeek?.data?.regions[0]?.dates.map(item => {
                const [y, m, d] = item.start_date.split("-");
                return `${d}/${m}/${y}`
            }),
            datasets: [
                {
                    type: "line",
                    fill: true,
                    label: "North AmericaEuproe",
                    data: dataETF?.dataWeek?.data?.regions[0]?.dates.map(item => item?.amount),
                    borderColor: "#21688A",
                    backgroundColor: "rgba(33, 104, 138, 0.3)", // vùng màu dưới line
                    tension: 0.4, // bo cong đường
                    yAxisID: "y1"
                },
                {
                    type: "line",
                    fill: true,
                    label: "Europe",
                    data: dataETF?.dataWeek?.data?.regions[1]?.dates.map(item => item?.amount),
                    borderColor: "#21D4A1",
                    backgroundColor: "rgba(33, 212, 161, 0.3)",
                    tension: 0.4, // bo cong đường
                    yAxisID: "y1"
                },
                {
                    type: "line",
                    fill: true,
                    label: "Asia",
                    data: dataETF?.dataWeek?.data?.regions[2]?.dates.map(item => item?.amount),
                    borderColor: "#FF69B4",                // màu line (hot pink)
                    backgroundColor: "rgba(255, 105, 180, 0.3)",
                    tension: 0.4, // bo cong đường
                    yAxisID: "y1"
                },
                {
                    type: "line",
                    fill: true,
                    label: "Other",
                    data: dataETF?.dataWeek?.data?.regions[3]?.dates.map(item => item?.amount),
                    borderColor: "#FFA500",                  // màu line cam (Orange)
                    backgroundColor: "rgba(255, 165, 0, 0.3)",
                    tension: 0.4, // bo cong đường
                    yAxisID: "y1"
                },
            ]
        };
    }

    if (weekOrMonth === 'monthly') {
        data = {
            labels: dataETF?.dataMonth?.data?.regions[0]?.dates.map(item => {
                const [y, m, d] = item.start_date.split("-");
                return `${d}/${m}/${y}`
            }),
            datasets: [
                {
                    type: "line",
                    fill: true,
                    label: "North AmericaEuproe",
                    data: dataETF?.dataMonth?.data?.regions[0]?.dates.map(item => item?.amount),
                    borderColor: "#21688A",
                    backgroundColor: "rgba(33, 104, 138, 0.3)", // vùng màu dưới line
                    tension: 0.4, // bo cong đường
                    yAxisID: "y1"
                },
                {
                    type: "line",
                    fill: true,
                    label: "Europe",
                    data: dataETF?.dataMonth?.data?.regions[1]?.dates.map(item => item?.amount),
                    borderColor: "#21D4A1",
                    backgroundColor: "rgba(33, 212, 161, 0.3)",
                    tension: 0.4, // bo cong đường
                    yAxisID: "y1"
                },
                {
                    type: "line",
                    fill: true,
                    label: "Asia",
                    data: dataETF?.dataMonth?.data?.regions[2]?.dates.map(item => item?.amount),
                    borderColor: "#FF69B4",                // màu line (hot pink)
                    backgroundColor: "rgba(255, 105, 180, 0.3)",
                    tension: 0.4, // bo cong đường
                    yAxisID: "y1"
                },
                {
                    type: "line",
                    fill: true,
                    label: "Other",
                    data: dataETF?.dataMonth?.data?.regions[3]?.dates.map(item => item?.amount),
                    borderColor: "#FFA500",                  // màu line cam (Orange)
                    backgroundColor: "rgba(255, 165, 0, 0.3)",
                    tension: 0.4, // bo cong đường
                    yAxisID: "y1"
                },
            ]
        };
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                {dataETF ?
                    <div style={{ width: '100%' }}>
                        <h4 style={{
                            fontSize: '1.8rem',
                            fontWeight: '700',
                            color: '#ffd700',
                            margin: '0 0 0.5rem 0',
                            textAlign: 'center',
                            marginTop: '40px',
                            cursor: 'pointer',
                            position: 'relative'
                        }} onClick={() => { navigate(`/quy-dau-tu/${day}/${month}/${year}/${hour}/${minute}`) }}>
                            Biểu đồ ETF theo khu vực
                            <div className="containt-select">
                                <span className={`select select-week ${weekOrMonth === 'weekly' ? 'active' : ''}`} onClick={() => { setWeekOrMonth('weekly') }}>Tuần</span>
                                <span className={`select select-month ${weekOrMonth === 'monthly' ? 'active' : ''}`} onClick={() => { setWeekOrMonth('monthly') }}>Tháng</span>
                            </div>
                        </h4>
                        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', overflowX: 'auto', height: '520px' }}>
                            <Chart data={data} options={options} />
                        </div>
                    </div> :
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Đang tải ETF theo khu vực</p>
                    </div>
                }
            </div>

        </>
    );
}

export default ETFChart;