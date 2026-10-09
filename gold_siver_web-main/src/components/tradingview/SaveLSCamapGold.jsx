// SaveLSCamap.jsx
import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  TimeScale,
  zoomPlugin
);

const SaveLSCamap = ({ type = 'gold' }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');

  const API_URL = `https://api_gold.thinkdiff.us/save_all_data_ca_map/${type}`;

  // Lọc các trường cần thiết
  const extractFields = (item) => ({
    tong_short_unrealizedPnl: item.tong_short_unrealizedPnl,
    tongso_long: item.tongso_long,
    tongso_short: item.tongso_short,
    value_long: item.tong_long_camap_tren1m,
    value_short: item.tong_short_camap_tren1m,
    tong_long_unrealizedPnl: item.tong_long_unrealizedPnl,
    date_time: item.date_time,
    price: item.price
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Error fetching API data');

        const json = await res.json();
        setData(json.data_pro?.map(extractFields) || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type]);

  useEffect(() => {
    const fetchDays = async () => {
      try {
        const res = await fetch('https://api_gold.thinkdiff.us/all_day_ca_map');
        const json = await res.json();

        setDays(json.data || []);
      } catch (err) {
        console.error('Error fetching days:', err);
      }
    };

    fetchDays();
  }, []);

  const filterByDay = (data) => {
    if (!selectedDay) return data;

    return data.filter((item) => {
      if (!item.date_time) return false;

      const d = new Date(item.date_time);
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();

      const formatted = `${day}_${month}_${year}`; // giống dirname

      return formatted === selectedDay;
    });
  };

  const prepareCombinedChartData = (data) => {
    const labels = data.map((item) => {
      if (!item.date_time) return 'N/A';
      const date = new Date(item.date_time);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    });

    const longValues = data.map((item) => item.value_long || 0);
    const shortValues = data.map((item) => item.value_short || 0);
    const longProfit = data.map((item) => item.tong_long_unrealizedPnl || 0);
    const shortProfit = data.map((item) => item.tong_short_unrealizedPnl || 0);
    const totalVolumes = data.map((item) => (item.value_long || 0) + (item.value_short || 0));

    return {
      labels,
      datasets: [
        {
          label: 'Long',
          data: longValues,
          backgroundColor: '#2cfc03',
          stack: 'stack1',
          originalValues: longValues,
          totalVolumes,
        },
        {
          label: 'Short',
          data: shortValues,
          backgroundColor: '#FF4444',
          stack: 'stack1',
          originalValues: shortValues,
          totalVolumes,
        },
        {
          type: 'line',
          label: 'Tổng lợi nhuận Long',
          data: longProfit,
          borderColor: '#00FFCC',
          backgroundColor: 'rgba(0,255,204,0.2)',
          fill: false,
          tension: 0.2,
          yAxisID: 'y1',
        },
        {
          type: 'line',
          label: 'Tổng lợi nhuận Short',
          data: shortProfit,
          borderColor: '#FFAA00',
          backgroundColor: 'rgba(255,170,0,0.2)',
          fill: false,
          tension: 0.2,
          yAxisID: 'y1',
        },
      ],
    };
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true },
      y1: { stacked: false, beginAtZero: false, position: 'right', grid: { drawOnChartArea: false } },
    },
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.dataset.originalValues?.[context.dataIndex] || context.parsed.y;
            return `${label}: ${value.toLocaleString()} Ounce`;
          },
          afterBody: function (context) {
            if (context.length > 0) {
              const dataIndex = context[0].dataIndex;
              const dataset = context[0].dataset;
              const totalVolume = dataset.totalVolumes?.[dataIndex];
              const tongsoLong = data[dataIndex]?.tongso_long || 0;
              const tongsoShort = data[dataIndex]?.tongso_short || 0;

              let lines = [];
              if (tongsoLong) lines.push(`Total Long orders: ${tongsoLong.toLocaleString()} Number user Long`);
              if (tongsoShort) lines.push(`Total Short orders: ${tongsoShort.toLocaleString()} Number user Short`);
              if (totalVolume) lines.push(`Total volume: ${totalVolume.toLocaleString()}`);
              return lines;
            }
            return '';
          },
        },
      },
      zoom: { pan: { enabled: true, mode: 'xy' }, zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'xy' } },
    },
  };


  // giá
  const preparePriceChartData = (data) => {
  const labels = data.map((item) => {
    if (!item.date_time) return 'N/A';

    const date = new Date(item.date_time);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  });

  const priceData = data.map((item) =>
    item.price !== undefined && item.price !== null
      ? item.price
      : null
  );

  // ✅ thêm 2 line mới
  const longOrders = data.map((item) => item.tongso_long || 0);
  const shortOrders = data.map((item) => item.tongso_short || 0);

  return {
    labels,
    datasets: [
      {
        label: 'Giá',
        data: priceData,
        borderColor: '#0066FF',
        backgroundColor: 'rgba(0,102,255,0.2)',
        fill: true,
        tension: 0.3,
        spanGaps: true,
        yAxisID: 'y',
      },
      {
        label: 'Số lượng Long',
        data: longOrders,
        borderColor: '#00FF00',
        backgroundColor: 'rgba(0,255,0,0.2)',
        tension: 0.3,
        fill: false,
        yAxisID: 'y1',
      },
      {
        label: 'Số lượng Short',
        data: shortOrders,
        borderColor: '#FF0000',
        backgroundColor: 'rgba(255,0,0,0.2)',
        tension: 0.3,
        fill: false,
        yAxisID: 'y1',
      },
    ],
  };
};

  const priceOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y;

          if (label === 'Giá') {
            return `Giá: ${value?.toLocaleString()}`;
          }

          return `${label}: ${value?.toLocaleString()}`;
        },
        afterBody: function (context) {
          if (context.length > 0) {
            const dataIndex = context[0].dataIndex;
            const item = priceDataOnly[dataIndex];

            const tongsoLong = item?.tongso_long || 0;
            const tongsoShort = item?.tongso_short || 0;

            let lines = [];

            if (tongsoLong)
              lines.push(
                `Total Long orders: ${tongsoLong.toLocaleString()} Number user Long`
              );

            if (tongsoShort)
              lines.push(
                `Total Short orders: ${tongsoShort.toLocaleString()} Number user Short`
              );

            return lines;
          }
          return '';
        },
      },
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      beginAtZero: false,
      position: 'left',
      title: { display: true, text: 'Giá' },
    },
    y1: {
      beginAtZero: true,
      position: 'right',
      grid: { drawOnChartArea: false },
      title: { display: true, text: 'Số lượng lệnh' },
    },
  },
};

  const filterHasPrice = (data) => {
    return data.filter(
      (item) => item.price !== undefined && item.price !== null
    );
  };

  const filteredData = filterByDay(data);
  const priceDataOnly = filterHasPrice(filteredData);


  if (loading) return <div>Loading {type} data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ height: '500px', marginBottom: '100px' }}>
      <h2>{type.charAt(0).toUpperCase() + type.slice(1)}: Cá Mập</h2>
      <div style={{ marginBottom: '10px', textAlign: "center" }}>
        <label>Chọn ngày: </label>

        <select
          style={{ color: "#fff" }}
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
        >
          <option value="">-- Tất cả --</option>

          {days.map((d, index) => (
            <option key={index} value={d.dirname}>
              {d.dirname.replaceAll('_', '/')}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSelectedDay('')}
          style={{ marginLeft: '10px' }}
        >
          Reset
        </button>
      </div>
      <div style={{ height: '300px', marginBottom: '50px', width: '99%', }}>
        <h3>Biểu đồ giá</h3>
        <Chart
          type="line"
          data={preparePriceChartData(priceDataOnly)}
          options={priceOptions}
        />
      </div>
      <div style={{ height: "500px" }}>
        <Chart type="bar" data={prepareCombinedChartData(filteredData)} options={options} />
      </div>
    </div>
  );
};

export default SaveLSCamap;