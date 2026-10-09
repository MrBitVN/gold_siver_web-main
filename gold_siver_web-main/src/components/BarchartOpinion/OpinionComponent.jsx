import { useEffect, useState } from "react";
import "./OpinionComponent.css";


export default function OpinionComponent() {
  const [dataCurrentTime, setDataCurrentTime] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "https://api_gold.thinkdiff.us/phantich_xau_xag_fomo_rsi"
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const result = await res.json();

        // Lấy đúng chiso_barchart từ structure mới
        const barChart = result?.data?.chiso_barchart || null;

        if (barChart) {
          setDataCurrentTime(barChart);
        } else {
          console.warn("Không tìm thấy chiso_barchart trong response");
          setDataCurrentTime(null);
        }
      } catch (error) {
        console.error("Lỗi khi fetch phantich_xau_xag_fomo_rsi:", error);
        setDataCurrentTime(null);
      }
    };

    fetchData();
  }, []);

  const dataTable = dataCurrentTime?.averages
    ?.filter(item => item)
    .map(item => {
      const name = item.split("Volume:")[0].trim();
      const afterVolume = item.split("Volume:")[1] || "";
      const volume = afterVolume.split("Average:")[0]?.trim();
      const signal = afterVolume.split("Average:")[1]?.trim();
      return { name, volume, signal };
    });

  // SỬA PHẦN NÀY ĐỂ HIỆN SỐ % TO MÀU VÀNG
  const ArcGauge = ({ value, label }) => {
    const safeValue = value && !isNaN(value) ? value : 0;
    const maxAngle = 180;
    const fillAngle = (safeValue / 100) * maxAngle;
    const finalAngle = (180 - fillAngle) * (Math.PI / 180);
    const R = 80; const Cx = 100; const Cy = 100;
    const Ex = Cx + R * Math.cos(finalAngle);
    const Ey = Cy - R * Math.sin(finalAngle);

    return (
      <div className="arc-wrapper" style={{ textAlign: 'center' }}>
        <svg width="180" height="110" viewBox="0 0 200 120">
          <path d="M20 100 A80 80 0 0 1 180 100" stroke="#383838" strokeWidth="20" fill="none" strokeLinecap="round" />
          <path d={`M20 100 A80 80 0 0 1 ${Ex} ${Ey}`} stroke="#0f9d58" strokeWidth="20" fill="none" strokeLinecap="round" />
        </svg>
        {/* Số % hiển thị to, màu vàng giống ảnh image_a3957a.png */}
        <h2 style={{ color: '#eab308', fontSize: '28px', margin: '10px 0 5px 0', fontWeight: 'bold' }}>
          {safeValue}
        </h2>
        {/* Nhãn chữ trắng bên dưới */}
        <p style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', margin: 0, letterSpacing: '1px' }}>
          {label.toUpperCase()}
        </p>
      </div>
    );
  };

  return (
    <div className="barchart-container">
      <h2 className="title" style={{ color: '#eab308' }}>Overall Average:</h2>

      <div className="contain-below">
        <div className="gauge-grid" style={{ display: 'flex', gap: '30px', justifyContent: 'center' }}>
          <div className="gauge-block">
            <p className="gauge-title" style={{ color: '#fff', marginBottom: '15px' }}>Current Strength</p>
            <ArcGauge value={dataCurrentTime?.gia_tri_current_strength} label="STRENGTH" />
          </div>
          <div className="gauge-block">
            <p className="gauge-title" style={{ color: '#fff', marginBottom: '15px' }}>Current Direction</p>
            <ArcGauge value={dataCurrentTime?.gia_tri_current_direction} label="DIRECTION" />
          </div>
        </div>

        <div className="opinion-card">
          <div className="opinion-header">Barchart Opinion</div>

          <table className="opinion-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>INDICATOR</th>
                <th style={{ textAlign: 'center' }}>Opinion</th>
                <th style={{ textAlign: 'right' }}>Volume</th>
              </tr>
            </thead>
            <tbody>
              {dataTable?.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ textAlign: 'left' }}>{item.name}</td>
                  <td style={{ textAlign: 'center' }}>{item.signal}</td>
                  <td style={{ textAlign: 'right' }}>{item.volume}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="opinion-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
            <h4 style={{ margin: 0 }}>
              20-Day Average Volume: <span style={{ color: '#eab308' }}>{dataCurrentTime?.gia_tri_20_day_average_volume?.toLocaleString("en-US")}</span>
            </h4>
            <p style={{ margin: 0, color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}>
              Average: {dataCurrentTime?.overall?.percent} {dataCurrentTime?.overall?.signal}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}