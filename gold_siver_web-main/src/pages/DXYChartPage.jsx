import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries
} from "lightweight-charts";

const DXYChartPage = () => {
  const chartContainerRef = useRef();
  const tooltipRef = useRef();

  const chartInstance = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const [chartData, setChartData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [filteredData, setFilteredData] = useState([]);
  const [dxyInfo, setDxyInfo] = useState(null);

  const [showMA50, setShowMA50] = useState(true);
  const [showMA100, setShowMA100] = useState(true);
  const [showMA150, setShowMA150] = useState(true);
  const [showMA200, setShowMA200] = useState(true);
  const ma50SeriesRef = useRef(null);
  const ma100SeriesRef = useRef(null);
  const ma150SeriesRef = useRef(null);
  const ma200SeriesRef = useRef(null);

  // ================= FETCH DATA =================
  useEffect(() => {
    fetch(`https://api_gold.thinkdiff.us/DXY_NYB_yahoo_data`)
      .then(res => res.json())
      .then(res => {
        const list = res.data.reverse();
        const seen = new Set();
        const processed = list
          .map(item => {
            const time = Math.floor(
              new Date(item.datetime.replace(" ", "T")).getTime() / 1000
            );
            return {
              time,
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.close,
              volume: item.volume
            };
          })
          .filter(item => {
            if (seen.has(item.time)) return false;
            seen.add(item.time);
            return true;
          })
          .sort((a, b) => a.time - b.time);

        setChartData(processed);
      })
      .catch(err => console.error("Error fetching DXY data:", err));
  }, []);

  const timePeriods = [
    { label: "1D", days: 1 },
    { label: "5D", days: 5 },
    { label: "1M", days: 30 },
    { label: "6M", days: 180 },
    { label: "1Y", days: 365 },
    { label: "5Y", days: 365 * 5 },
    { label: "All", days: "all" }
  ];

  useEffect(() => {
    if (!chartData.length) return;
    let filtered;
    if (selectedPeriod === "all") {
      filtered = chartData;
    } else {
      const lastTime = chartData[chartData.length - 1].time;
      const cutoff = lastTime - selectedPeriod * 86400;
      filtered = chartData.filter(d => d.time >= cutoff);
    }
    setFilteredData(filtered);
    if (filtered.length) {
      const last = filtered[filtered.length - 1];
      const first = filtered[0];
      setDxyInfo({
        previousClose: chartData[chartData.length - 2]?.close || last.close,
        open: last.open,
        volume: last.volume,
        avgVolume: Math.round(
          filtered.reduce((sum, d) => sum + d.volume, 0) / filtered.length
        ),
        dayRange: `${last.low.toFixed(2)} - ${last.high.toFixed(2)}`,
        fiftyTwoWeekLow: Math.min(...chartData.map(d => d.low)),
        fiftyTwoWeekHigh: Math.max(...chartData.map(d => d.high)),
        ytdReturn: ((last.close - first.open) / first.open) * 100,
        bid: last.close.toFixed(2),
        ask: last.close.toFixed(2)
      });
    }
  }, [chartData, selectedPeriod]);

  useEffect(() => {
    if (!filteredData.length) return;

    candlestickSeriesRef.current.setData(filteredData);

    volumeSeriesRef.current.setData(
      filteredData.map(d => ({
        time: d.time,
        value: d.volume,
        color:
          d.close >= d.open
            ? "rgba(0,176,96,0.5)"
            : "rgba(255,70,72,0.5)"
      }))
    );

    const ma50 = calculateMA(filteredData, 50);
    const ma100 = calculateMA(filteredData, 100);
    const ma150 = calculateMA(filteredData, 150);
    const ma200 = calculateMA(filteredData, 200);

    if (showMA50) ma50SeriesRef.current.setData(ma50);
    else ma50SeriesRef.current.setData([]);

    if (showMA100) ma100SeriesRef.current.setData(ma100);
    else ma100SeriesRef.current.setData([]);

    if (showMA150) ma150SeriesRef.current.setData(ma150);
    else ma150SeriesRef.current.setData([]);

    if (showMA200) ma200SeriesRef.current.setData(ma200);
    else ma200SeriesRef.current.setData([]);

    chartInstance.current.timeScale().fitContent();
  }, [filteredData, showMA50, showMA100, showMA150, showMA200]);

  // ================= CREATE CHART =================
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: {
        background: { type: ColorType.Solid, color: "#000" },
        textColor: "#d1d4dc"
      },
      grid: {
        vertLines: { color: "#111" },
        horzLines: { color: "#222" }
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false
      }
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00b060",
      downColor: "#ff4648",
      borderVisible: false,
      wickUpColor: "#00b060",
      wickDownColor: "#ff4648"
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: ""
    });

    ma50SeriesRef.current = chart.addSeries(LineSeries, {
      color: "#f5c542",
      lineWidth: 2
    });

    ma100SeriesRef.current = chart.addSeries(LineSeries, {
      color: "#42a5f5",
      lineWidth: 2
    });

    ma150SeriesRef.current = chart.addSeries(LineSeries, {
      color: "#ab47bc",
      lineWidth: 2
    });

    ma200SeriesRef.current = chart.addSeries(LineSeries, {
      color: "#ff7043",
      lineWidth: 2
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 }
    });

    // tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!param.point || !param.time || !tooltipRef.current) {
        tooltipRef.current.style.display = "none";
        return;
      }

      const ma50 = param.seriesData.get(ma50SeriesRef.current);
      const ma100 = param.seriesData.get(ma100SeriesRef.current);
      const ma150 = param.seriesData.get(ma150SeriesRef.current);
      const ma200 = param.seriesData.get(ma200SeriesRef.current);
      const candle = param.seriesData.get(candlestickSeries);
      const vol = param.seriesData.get(volumeSeries);

      if (!candle) return;

      const date = new Date(param.time * 1000).toLocaleString("vi-VN");

      tooltipRef.current.style.display = "block";

      tooltipRef.current.innerHTML = `
        <div style="color:#ffff00;font-weight:bold">DXY (US Dollar Index)</div>
        <div style="font-size:11px;margin-bottom:6px">${date}</div>
        <div>O: ${candle.open.toFixed(2)}</div>
        <div>H: ${candle.high.toFixed(2)}</div>
        <div>L: ${candle.low.toFixed(2)}</div>
        <div>C: ${candle.close.toFixed(2)}</div>
        <div style="color:#00ff80">Vol: ${vol?.value ?? 0}</div>
        ${ma50 ? `<div style="color:#f5c542">MA50: ${ma50.value.toFixed(2)}</div>` : ""}
        ${ma100 ? `<div style="color:#42a5f5">MA100: ${ma100.value.toFixed(2)}</div>` : ""}
        ${ma150 ? `<div style="color:#ab47bc">MA150: ${ma150.value.toFixed(2)}</div>` : ""}
        ${ma200 ? `<div style="color:#ff7043">MA200: ${ma200.value.toFixed(2)}</div>` : ""}
      `;

      tooltipRef.current.style.left = `${param.point.x + 15}px`;
      tooltipRef.current.style.top = `${param.point.y + 15}px`;
    });

    chartInstance.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () =>
      chart.applyOptions({ width: chartContainerRef.current.clientWidth });

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!chartData.length) return;
    candlestickSeriesRef.current.setData([]);
    volumeSeriesRef.current.setData([]);

    candlestickSeriesRef.current.setData(chartData);
    volumeSeriesRef.current.setData(
      chartData.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open
          ? "rgba(0,176,96,0.5)"
          : "rgba(255,70,72,0.5)"
      }))
    );

    chartInstance.current.timeScale().fitContent();
  }, [chartData]);

  const timePercent = [
    { label: "1D", days: 1 },
    { label: "2D", days: 2 },
    { label: "3D", days: 3 },
    { label: "1W", days: 7 },
    { label: "2W", days: 14 },
    { label: "3W", days: 21 },
    { label: "1M", days: 30 },
    { label: "2M", days: 60 },
    { label: "3M", days: 90 },
    { label: "6M", days: 180 },
    { label: "1Y", days: 365 },
  ];

  const calculateChange = (days) => {
    if (!chartData || chartData.length < 2) return null;

    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - days * 86400;

    const periodData = chartData.filter(d => d.time >= cutoff);

    if (periodData.length < 2) return null;

    const first = periodData[0].close;
    const last = periodData[periodData.length - 1].close;

    return ((last - first) / first) * 100;
  };

  const periodChanges = timePercent.map(p => ({
    label: p.label,
    change: calculateChange(p.days)
  }));

  const calculateMA = (data, period) => {
    const result = [];

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) continue;

      let sum = 0;

      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }

      result.push({
        time: data[i].time,
        value: sum / period
      });
    }

    return result;
  };

  return (
    <div style={{ background: '#131722', padding: '20px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#26a69a', margin: 0 }}>DXY (US Dollar Index) - Biểu đồ Nến</h2>
      </div>
      <div style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
        gap: "8px",
        marginBottom: "15px",
        padding: "10px",
        background: "#0a0a0a",
        border: "1px solid #222",
        borderRadius: "8px"
      }}>
        {periodChanges.map(p => {
          const isPositive = p.change >= 0;
          return (
            <div key={p.label} style={{
              minWidth: "90px",
              padding: "8px",
              background: "#0a0a0a",
              border: `1px solid ${isPositive ? "#00b060" : "#ff4648"}`,
              borderRadius: "6px",
              textAlign: "center"
            }}>
              <div style={{
                fontSize: "12px",
                color: "#aaa",
                fontWeight: "600"
              }}>
                {p.label}
              </div>
              <div style={{
                fontSize: "14px",
                fontWeight: "700",
                color: isPositive ? "#00ff80" : "#ff4d4d",
                marginTop: "3px"
              }}>
                {p.change === null
                  ? "--"
                  : `${isPositive ? "+" : ""}${p.change.toFixed(3)}%`}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingBottom: "10px" }}>
        {timePeriods.map((p) => (
          <button
            key={p.label}
            onClick={() => setSelectedPeriod(p.days)}
            style={{
              padding: "5px 10px",
              borderRadius: "4px",
              border: "1px solid #333",
              background: selectedPeriod === p.days ? "#26a69a" : "#1a1a1a",
              color: "#fff",
              cursor: "pointer"
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
        <button
          onClick={() => setShowMA50(!showMA50)}
          style={{
            padding: "5px 10px",
            borderRadius: "4px",
            border: "1px solid #333",
            background: showMA50 ? "#f5c542" : "#1a1a1a",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          MA50
        </button>
        <button
          onClick={() => setShowMA100(!showMA100)}
          style={{
            padding: "5px 10px",
            borderRadius: "4px",
            border: "1px solid #333",
            background: showMA100 ? "#42a5f5" : "#1a1a1a",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          MA100
        </button>
        <button
          onClick={() => setShowMA150(!showMA150)}
          style={{
            padding: "5px 10px",
            borderRadius: "4px",
            border: "1px solid #333",
            background: showMA150 ? "#ab47bc" : "#1a1a1a",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          MA150
        </button>
        <button
          onClick={() => setShowMA200(!showMA200)}
          style={{
            padding: "5px 10px",
            borderRadius: "4px",
            border: "1px solid #333",
            background: showMA200 ? "#ff7043" : "#1a1a1a",
            color: "#fff",
            cursor: "pointer"
          }}
        >
          MA200
        </button>
      </div>
      <div style={{ position: 'relative', width: '100%' }}>
        <div ref={chartContainerRef} style={{ width: '100%', height: '600px', border: '1px solid #242733' }} />
        <div ref={tooltipRef} style={tooltipStyle} />
      </div>

      {/* DXY Info Section */}
      {dxyInfo && (
        <div style={{
          marginTop: "25px",
          padding: "15px",
          backgroundColor: "#0a0a0a",
          borderRadius: "8px",
          border: "1px solid #222",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}>
            {/* Previous Close */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#999", fontSize: "13px" }}>Previous Close</span>
              <span style={{ color: "#fff", fontWeight: "600" }}>{dxyInfo.previousClose.toFixed(2)}</span>
            </div>

            {/* Day's Range */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#999", fontSize: "13px" }}>Day's Range</span>
              <span style={{ color: "#fff", fontWeight: "600" }}>{dxyInfo.dayRange}</span>
            </div>

            {/* 52 Week Range */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#999", fontSize: "13px" }}>52 Week Range</span>
              <span style={{ color: "#fff", fontWeight: "600" }}>{dxyInfo.fiftyTwoWeekLow.toFixed(2)} - {dxyInfo.fiftyTwoWeekHigh.toFixed(2)}</span>
            </div>

            {/* YTD Daily Total Return */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#999", fontSize: "13px" }}>YTD Daily Total Return</span>
              <span style={{ color: dxyInfo.ytdReturn >= 0 ? "#00ff80" : "#ff4d4d", fontWeight: "600" }}>
                {dxyInfo.ytdReturn >= 0 ? "+" : ""}{dxyInfo.ytdReturn.toFixed(2)}%
              </span>
            </div>

            {/* Open */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#999", fontSize: "13px" }}>Open</span>
              <span style={{ color: "#fff", fontWeight: "600" }}>{dxyInfo.open.toFixed(2)}</span>
            </div>

            {/* Bid */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#999", fontSize: "13px" }}>Bid</span>
              <span style={{ color: "#fff", fontWeight: "600" }}>{dxyInfo.bid}</span>
            </div>

            {/* Volume */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#999", fontSize: "13px" }}>Volume</span>
              <span style={{ color: "#fff", fontWeight: "600" }}>{dxyInfo.volume.toLocaleString()}</span>
            </div>

            {/* Ask */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#999", fontSize: "13px" }}>Ask</span>
              <span style={{ color: "#fff", fontWeight: "600" }}>{dxyInfo.ask}</span>
            </div>

            {/* Avg. Volume */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#999", fontSize: "13px" }}>Avg. Volume</span>
              <span style={{ color: "#fff", fontWeight: "600" }}>{dxyInfo.avgVolume.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const tooltipStyle = {
  width: "160px",
  position: "absolute",
  display: "none",
  padding: "10px",
  zIndex: 1000,
  pointerEvents: "none",
  borderRadius: "4px",
  background: "rgba(25,27,34,0.95)",
  border: "1px solid #64656a",
  color: "white"
};

export default DXYChartPage;
