// // SGEChart.js
// import React, { useEffect, useState } from "react";
// import { Bar } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Tooltip,
//   Legend
// } from "chart.js";

// ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// // Lưu ý: Đảm bảo Backend của bạn proxy tới https://api_gold.thinkdiff.us
// const BACKEND_URL = "http://localhost:5000/api/sge"; 

// const SGEChart = () => {
//   const [time, setTime] = useState({ year: 2025, month: 12 });
//   const [dataDays, setDataDays] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // ================= FETCH DATA THEO ĐỊNH DẠNG /YEAR/MONTH =================
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         // Gọi API theo cấu trúc: /2025/12
//         const res = await fetch(`${BACKEND_URL}/${time.year}/${time.month}`);
//         const data = await res.json();

//         // API trả về một mảng các ngày (như trong ảnh JSON của bạn)
//         setDataDays(Array.isArray(data) ? data : []);
//       } catch (err) {
//         console.error("Lỗi khi gọi API SGE:", err);
//         setDataDays([]);
//       }
//       setLoading(false);
//     };
//     fetchData();
//   }, [time.year, time.month]);

//   // ================= XỬ LÝ DỮ LIỆU BIỂU ĐỒ =================
//   const chartData = {
//     labels: dataDays.map(d => d.ngay), 
//     datasets: [
//       {
//         label: "Vàng (tong_vang)",
//         data: dataDays.map(d => d.tong_vang || 0),
//         backgroundColor: "#f5c542",
//       },
//       {
//         label: "Bạc (tong_bac)",
//         data: dataDays.map(d => d.tong_bac || 0),
//         backgroundColor: "#cfd2d6",
//       },
//       {
//         label: "Khác (tongkhac)",
//         data: dataDays.map(d => d.tongkhac || 0),
//         backgroundColor: "#5dade2",
//       }
//     ]
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: { labels: { color: "#fff" } },
//       tooltip: {
//         callbacks: {
//           label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString("vi-VN")}`
//         }
//       }
//     },
//     scales: {
//       x: { 
//         ticks: { color: "#fff" }, 
//         grid: { color: "rgba(255,255,255,0.1)" } 
//       },
//       y: { 
//         ticks: { 
//           color: "#fff",
//           callback: (v) => v >= 1e9 ? `${(v/1e9).toFixed(1)}B` : v.toLocaleString("vi-VN")
//         }, 
//         grid: { color: "rgba(255,255,255,0.1)" } 
//       }
//     }
//   };

//   const handlePrevMonth = () => {
//     setTime(prev => {
//       let m = prev.month - 1;
//       let y = prev.year;
//       if (m < 1) { m = 12; y--; }
//       return { year: y, month: m };
//     });
//   };

//   const handleNextMonth = () => {
//     setTime(prev => {
//       let m = prev.month + 1;
//       let y = prev.year;
//       if (m > 12) { m = 1; y++; }
//       return { year: y, month: m };
//     });
//   };

//   return (
//     <div style={{ background: "#071a2c", padding: 20, borderRadius: 12, height: 550 }}>
//       <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginBottom: 20, color: "#fff" }}>
//         <button onClick={handlePrevMonth} style={btnStyle}>◀ Tháng trước</button>
//         <b style={{ fontSize: "1.2rem" }}>THÁNG {time.month} / {time.year}</b>
//         <button onClick={handleNextMonth} style={btnStyle}>Tháng sau ▶</button>
//       </div>

//       <div style={{ height: 420 }}>
//         {loading ? (
//           <p style={{ color: "#fff", textAlign: "center" }}>Đang tải dữ liệu từ API...</p>
//         ) : dataDays.length > 0 ? (
//           <Bar data={chartData} options={options} />
//         ) : (
//           <p style={{ color: "#fff", textAlign: "center" }}>Không có dữ liệu cho tháng này.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// const btnStyle = {
//   padding: "5px 15px",
//   cursor: "pointer",
//   background: "transparent",
//   color: "#fff",
//   border: "1px solid #fff",
//   borderRadius: "4px"
// };

// export default SGEChart;

import { useLocation } from 'react-router-dom';
import './GlobalShark1Day.css'
import GlobalShark1DayChart from './GlobalShark1DayChart';

function ModalFullChartShark1Day({ setIsShowFullChart, chartSelect, navigate, setChartSelect }) {

  const location = useLocation()

  return (
    <div className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsShowFullChart(false)
          setChartSelect(null)
          navigate(location.pathname)
        }
      }}
    >
      <div className="modal-close" onClick={() => {
        setIsShowFullChart(false)
        setChartSelect(null)
        navigate(location.pathname)
      }}>X</div>
      <div style={{ width: '100%', height: '80vh' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>{chartSelect?.name}</h2>
        <GlobalShark1DayChart rawData={chartSelect?.data} isMini={false} />
      </div>
    </div>
  );
}

export default ModalFullChartShark1Day;
