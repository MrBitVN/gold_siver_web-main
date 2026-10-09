import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import './AnnotatedBarChart.css';

/**
 * Biểu đồ cột với các ghi chú và chú thích
 * Tương tự hình vẽ: Giá trị XNK, hàng hóa Việt Nam giai đoạn 2000-2020
 */
const AnnotatedBarChart = ({ data = null, title = "Biểu đồ Phân Tích Dữ Liệu" }) => {
  // Dữ liệu mẫu nếu không có dữ liệu đầu vào
  const sampleData = {
    years: ['2000', '2002', '2005', '2007'],
    xuatKhau: [5, 8, 25, 45],
    nhapKhau: [8, 10, 20, 40],
    nhapSieu: [0, 2, -5, -10],
  };

  const chartData = data || sampleData;

  const options = {
    chart: {
      type: 'bar',
      stacked: false,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      animations: {
        enabled: true,
        speed: 800,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 4,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => {
        return val ? val.toFixed(0) : '';
      },
      style: {
        fontSize: '12px',
        fontWeight: 600,
      },
      offsetY: -25,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: chartData.years,
      title: {
        text: 'Năm',
        style: {
          color: '#000',
          fontSize: '14px',
          fontWeight: 'bold',
        },
      },
      labels: {
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Giá trị (tỉ đôla Mỹ)',
        style: {
          color: '#000',
          fontSize: '14px',
          fontWeight: 'bold',
        },
      },
      labels: {
        style: {
          fontSize: '12px',
        },
      },
    },
    fill: {
      opacity: 0.85,
      type: 'solid',
    },
    colors: ['#1f77b4', '#d62728', '#90EE90'],
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      floating: true,
      offsetY: 0,
      offsetX: -20,
      style: {
        fontSize: '12px',
        fontWeight: 600,
      },
    },
    grid: {
      borderColor: '#e7e7e7',
      strokeDashArray: 4,
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      style: {
        fontSize: '12px',
      },
    },
  };

  const series = [
    {
      name: 'Xuất khẩu',
      data: chartData.xuatKhau,
    },
    {
      name: 'Nhập khẩu',
      data: chartData.nhapKhau,
    },
    {
      name: 'Nhập siêu',
      data: chartData.nhapSieu,
    },
  ];

  return (
    <div className="annotated-bar-chart-container">
      <h2 className="chart-title">{title}</h2>
      
      {/* Legend thủ công */}
      <div className="custom-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#1f77b4' }}></span>
          <span className="legend-label">Xuất khẩu</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#d62728' }}></span>
          <span className="legend-label">Nhập khẩu</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#90EE90' }}></span>
          <span className="legend-label">Nhập siêu</span>
        </div>
      </div>

      {/* Biểu đồ */}
      <div className="chart-wrapper">
        <Chart
          options={options}
          series={series}
          type="bar"
          height={400}
        />
      </div>

      {/* Ghi chú */}
      <div className="chart-notes">
        <div className="note-item">
          <span className="note-label">📌 Thiếu số liệu:</span>
          <span className="note-text">Dữ liệu không khả dụng cho các năm được chỉ định</span>
        </div>
        <div className="note-item">
          <span className="note-label">📌 Sai khoảng cách năm:</span>
          <span className="note-text">Khoảng cách giữa các năm có thể không đều nhau</span>
        </div>
        <div className="note-item">
          <span className="note-label">📌 Thiếu các mốc cơ bản:</span>
          <span className="note-text">Một số giá trị tham chiếu có thể chưa được cập nhật</span>
        </div>
      </div>
    </div>
  );
};

export default AnnotatedBarChart;
