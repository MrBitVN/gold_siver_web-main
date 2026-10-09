import React, { useState, useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';

const XAG_API = 'https://api_gold.thinkdiff.us/view_full_data_json/10_12_2025/10_12_2025_9_40.json';

const XAGVolumeOnlyChart = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [closePrices, setClosePrices] = useState([]);
  const [volumes, setVolumes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(XAG_API);
        if (!res.ok) throw new Error(`HTTP lỗi: ${res.status}`);
        const json = await res.json();

        const ticks = json?.data?.XAGUSD;

        if (!Array.isArray(ticks) || ticks.length === 0) {
          setError('Không có dữ liệu giá XAG');
          return;
        }

        const newCategories = ticks.map(item => item.timestamp);
        const newClose = ticks.map(item => Number(item.close_price ?? 0));
        const newVolumes = ticks.map(item => Number(item.volume ?? 0));

        setCategories(newCategories);
        setClosePrices(newClose);
        setVolumes(newVolumes);

      } catch (err) {
        console.error( err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const avgVolume = useMemo(() => volumes.length ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 0, [volumes]);
  const volumeColors = useMemo(() => volumes.map(v => v > avgVolume ? "#39ff14" : "#ff4500"), [volumes, avgVolume]);

  const series = [
    { name: 'Giá XAG', type: 'line', data: closePrices, color: '#00BFFF', yaxisIndex: 0 },
    { name: 'Volume XAG', type: 'column', data: volumes, yaxisIndex: 1 },
  ];

  const minPrice = closePrices.length ? Math.min(...closePrices) * 0.9 : 0;
  const maxPrice = closePrices.length ? Math.max(...closePrices) * 1.1 : 100;

  const options = {
    chart: { height: 450, type: 'line', stacked: false, toolbar: { show: true }, background: '#000', foreColor: '#f8f8f8' },
    title: { text: 'Biểu đồ Giá Bạc (XAG) và Volume', align: 'left', style: { fontSize: '18px', fontWeight: 700, color: '#f8f8f8' } },
    stroke: { show: true, width: [3, 0], colors: ['#00BFFF', 'transparent'] },
    fill: { opacity: [1, 0.95], type: ['solid', 'solid'] },
    plotOptions: { bar: { horizontal: false, columnWidth: '90%', borderRadius: 0, distributed: true } },
    dataLabels: { enabled: false },
    xaxis: { categories, title: { text: 'Thời điểm', style: { fontWeight: 600 } }, labels: { rotate: -45, style: { colors: '#999', fontSize: '12px' } } },
    yaxis: [
      { title: { text: 'Giá XAG (USD/oz)', style: { fontWeight: 600 } }, labels: { formatter: val => val.toFixed(2), style: { colors: '#00BFFF' } }, tickAmount: 5, min: minPrice, max: maxPrice },
      { opposite: true, title: { text: 'Volume (Khối lượng)', style: { fontWeight: 600, color: '#39ff14' } }, labels: { formatter: val => (val / 1000).toFixed(0) + 'K', style: { colors: '#39ff14' } }, min: 0, tickAmount: 5 }
    ],
    grid: { borderColor: '#333', strokeDashArray: 3 },
    tooltip: { theme: 'dark', y: { formatter: (val, { seriesIndex }) => seriesIndex === 1 ? val.toLocaleString() + ' Volume' : val.toFixed(2) + ' USD/oz' } },
    legend: { position: 'top', horizontalAlign: 'left', fontSize: '13px', markers: { radius: 6 }, labels: { colors: ['#f8f8f8'] } },
    colors: ['#00BFFF', ...volumeColors]
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px', color: '#f8f8f8', backgroundColor: '#000' }}>Đang tải dữ liệu biểu đồ...</div>;

  return (
    <div style={{ marginTop: '30px', padding: '20px', borderRadius: '8px', backgroundColor: '#000', border: '1px solid #333', boxShadow: '0 1px 3px rgba(255,255,255,0.05)' }}>
      <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '10px', color: '#f8f8f8' }}>
        Biểu Đồ Giá Bạc (XAG) và Volume
      </h3>
      {error && <p style={{ color: '#ff4500', textAlign: 'center', marginBottom: '10px' }}>{error}</p>}
      {closePrices.length > 0 ? <Chart options={options} series={series} type="line" height={450} /> : <div style={{ textAlign: 'center', padding: '50px', color: '#f8f8f8' }}>Không có dữ liệu để hiển thị.</div>}
    </div>
  );
};

export default XAGVolumeOnlyChart;
