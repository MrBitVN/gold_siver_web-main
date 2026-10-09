import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';

const XAG_API = 'https://api_gold.thinkdiff.us/volume_data_xagusd_phantich';
const XAU_API = 'https://api_gold.thinkdiff.us/volume_data_xauusd_phantich';

const fallbackTradeData = [
    { year: 2000, export: 14.4, import: 15.6 }, 
    { year: 2002, export: 16.6, import: 18.8 }, 
    { year: 2005, export: 32.4, import: 36.8 }, 
    { year: 2007, export: 48.6, import: 60.6 }, 
    { year: 2010, export: 71.3, import: 84.8 }, 
    { year: 2012, export: 114.9, import: 114.3 }, 
    { year: 2015, export: 162.4, import: 165.6 }, 
    { year: 2018, export: 243.3, import: 236.7 }, 
    { year: 2021, export: 336.3, import: 332.3 }, 
    { year: 2024, export: 375.0, import: 350.0 }, 
];

const fallbackVolumeData = [35000, 42000, 50000, 45000, 38000, 55000, 62000, 58000, 68000, 72000];
const fallbackCategories = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5', 'Tuần 6', 'Tuần 7', 'Tuần 8', 'Tuần 9', 'Tuần 10'];

const GrowthBarChart = ({ apiEndpoint }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState(fallbackCategories);
    const [xauPrices, setXauPrices] = useState(fallbackTradeData.map(d => d.export).slice(0, 10));
    const [xagPrices, setXagPrices] = useState(fallbackTradeData.map(d => d.import).slice(0, 10));
    const [volumeValues, setVolumeValues] = useState(fallbackVolumeData);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const [xauRes, xagRes] = await Promise.all([
                    fetch(XAU_API),
                    fetch(XAG_API)
                ]);

                if (!xauRes.ok || !xagRes.ok) {
                    throw new Error(`HTTP error: XAU ${xauRes.status}, XAG ${xagRes.status}`);
                }

                const xauData = await xauRes.json();
                const xagData = await xagRes.json();

                const DATA_COUNT = 10;
                const xauSliced = xauData.slice(0, DATA_COUNT);
                const xagSliced = xagData.slice(0, DATA_COUNT);

                // Mapping dữ liệu, fallback field nếu API khác tên
                const newCategories = xauSliced.map(d => d.date || d.time || 'N/A');
                const newXauPrices = xauSliced.map(d => d.close ?? d.price ?? d.value ?? 0);
                const newXagPrices = xagSliced.map(d => d.close ?? d.price ?? d.value ?? 0);
                const newVolumeValues = xauSliced.map(d => d.volume ?? 0);

                setCategories(newCategories);
                setXauPrices(newXauPrices);
                setXagPrices(newXagPrices);
                setVolumeValues(newVolumeValues);

            } catch (err) {
                console.error( err);

                // Fallback
                setCategories(fallbackCategories);
                setXauPrices(fallbackTradeData.map(d => d.export).slice(0, 10));
                setXagPrices(fallbackTradeData.map(d => d.import).slice(0, 10));
                setVolumeValues(fallbackVolumeData);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [apiEndpoint]);

    const series = [
        { name: 'XAU (Vàng)', type: 'column', data: xauPrices, color: '#FFD700', yaxisIndex: 0 },
        { name: 'XAG (Bạc)', type: 'column', data: xagPrices, color: '#708090', yaxisIndex: 0 },
        { name: 'Volume', type: 'column', data: volumeValues, color: '#007FFF', yaxisIndex: 1 },
    ];

    const options = {
        chart: { height: 400, type: 'bar', stacked: false, toolbar: { show: true }, background: '#fff' },
        title: { text: 'Giá XAU/XAG (Tỉ USD) và Volume qua các tuần', align: 'left', style: { fontSize: '18px', fontWeight: 700, color: '#333' } },
        plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 4, dataLabels: { position: 'top' } } },
        dataLabels: { enabled: true, formatter: (val, opts) => opts.seriesIndex === 2 ? (val/1000).toFixed(0)+'K' : val.toFixed(1), style: { fontSize: '10px', colors: ['#333'] } },
        stroke: { show: true, width: 2, colors: ['#f8f8f8'] },
        xaxis: { categories, title: { text: 'Tuần/Thời điểm', style: { fontWeight: 600 } }, labels: { style: { colors: '#666', fontSize: '12px' } } },
        yaxis: [
            { title: { text: 'Giá trị (tỉ USD)', style: { fontWeight: 600 } }, labels: { formatter: val => val.toFixed(0), style: { colors: '#666' } }, tickAmount: 5, min: 0, max: 400 },
            { opposite: true, title: { text: 'Volume (Khối lượng)', style: { fontWeight: 600, color: '#007FFF' } }, labels: { formatter: val => (val/1000).toFixed(0)+'K', style: { colors: '#007FFF' } }, min: 0, max: 80000, tickAmount: 5 }
        ],
        grid: { borderColor: '#f0f0f0', strokeDashArray: 3 },
        tooltip: { theme: 'dark', y: { formatter: (val, { seriesIndex }) => seriesIndex===2 ? (val/1000).toFixed(1)+'K Volume' : val.toFixed(1)+' tỉ USD' } },
        legend: { position: 'top', horizontalAlign: 'right', fontSize: '13px', markers: { radius: 6 } },
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải dữ liệu biểu đồ...</div>;

    return (
        <div style={{ marginTop: '30px', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', border: '1px solid #ddd', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px', color: '#333' }}>
                Biểu Đồ Giá XAU (Vàng), XAG (Bạc) và Volume
            </h3>
            {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</p>}
            {xauPrices.length > 0 ? <Chart options={options} series={series} type="bar" height={400} /> : <div style={{ textAlign: 'center', padding: '50px' }}>Không có dữ liệu để hiển thị.</div>}
        </div>
    );
};

export default GrowthBarChart;
