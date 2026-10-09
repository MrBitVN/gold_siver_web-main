import React, { useMemo, useRef, useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-date-fns";
import { subMonths, subYears, startOfYear } from "date-fns";

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  zoomPlugin
);

export default function GlobalShark({ data = [], zoomable = true, time }) {
  const chartRef = useRef(null);

  const [range, setRange] = useState(time);
  const [xRange, setXRange] = useState({ min: null, max: null });


  const sortedData = useMemo(() => {
    return data
      .filter(series => series?.data && Array.isArray(series.data))
      .map(series => ({
        name: series.name,
        data: [...series.data].sort((a, b) => new Date(a.x) - new Date(b.x))
      }));
  }, [data]);


  // Ngày cuối cùng của series đầu tiên
  const lastDate = useMemo(() => {
    const lastSeries = sortedData[0];
    if (!lastSeries?.length) return new Date();
    return new Date(lastSeries[lastSeries.length - 1].x);
  }, [sortedData]);

  // Khi mount hoặc range thay đổi, set xRange
  useEffect(() => {
    if (!sortedData.length) return;

    const last = lastDate;
    let from;

    if (range === "1M") from = subMonths(last, 1);
    else if (range === "3M") from = subMonths(last, 3);
    else if (range === "1Y") from = subYears(last, 1);
    else if (range === "YTD") from = startOfYear(last);
    else if (range === "ALL") from = new Date("2016-07-01");

    setXRange({ min: from.getTime(), max: last.getTime() });

    // zoom chart nếu ref tồn tại
    if (chartRef.current && zoomable) {
      chartRef.current.chartInstance?.zoomScale("x", { min: from.getTime(), max: last.getTime() });
    }
  }, [range, sortedData, lastDate, zoomable]);

  // Chart data
  const chartData = useMemo(() => ({
    datasets: sortedData.map((series, i) => ({
      label: series.name,
      data: series.data,
      parsing: false,
      borderColor: [
        "#E63946", // Red - đỏ hẳn, vivid red
        "#F4A261", // Orange - cam đất
        "#E9C46A", // Yellow - vàng nhạt
        "#2A9D8F", // Teal xanh ngọc
        "#1D3557", // Navy xanh đậm
        "#457B9D", // Sky Blue xanh trời
        "#9D4EDD", // Purple tím đậm
        "#F72585", // Pink hồng neon
        "#6C757D", // Grey xám trung tính
      ]
      [i % 9],
      pointRadius: 0,
      fill: false,
      borderWidth: 1.8,
      spanGaps: true,
    }))
  }), [sortedData]);


  // Chart options
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    transitions: { zoom: { animation: false }, pan: { animation: false } },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: true,
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}`,
          labelColor: ctx => ({
            borderColor: ctx.dataset.borderColor,
            backgroundColor: ctx.dataset.borderColor
          })
        }
      },
      decimation: { enabled: true, algorithm: "min-max", samples: 500 },
      zoom: zoomable ? {
        limits: { x: { min: new Date("2016-07-01").getTime() } },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
        pan: { enabled: true, mode: "x" }
      } : undefined
    },
    scales: {
      x: {
        type: "time",
        min: xRange.min,
        max: xRange.max,
        ticks: { maxTicksLimit: 10 }
      },
      y: {
        ticks: { callback: v => `${v}` }
      }
    }
  }), [xRange, zoomable]);

  const resetZoom = () => chartRef.current?.resetZoom();


  return (
    <div style={{ width: "100%", marginTop: 20, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 480, width: "98%", marginBottom: '30px', cursor: 'pointer ' }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>

      {zoomable && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, margin: 'auto' }}>
          {["1M", "3M", "1Y", "YTD", "ALL"].map(r => (
            <button
              key={r}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
                background: range === r ? "#ff8800" : "#eee",
              }}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
          <button
            onClick={resetZoom}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              background: "#444",
              color: "white",
              border: "1px solid #666",
            }}
          >
            Reset Zoom
          </button>
        </div>
      )}
    </div>
  );
}
