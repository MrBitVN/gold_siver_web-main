import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Bar } from 'react-chartjs-2';
import { useTranslation } from "react-i18next";

// Register Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const XAG_BASE_API = 'https://api_gold.thinkdiff.us/volume_data_xagusd_phantich';
const XAU_BASE_API = 'https://api_gold.thinkdiff.us/volume_data_xauusd_phantich';

const buildApiUrl = (baseApi, dateStr) =>
  dateStr ? `${baseApi}/${dateStr}` : baseApi;

const formatDate = (date) => {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const y = date.getFullYear();
  return `${m}_${d}_${y}`;
};

const GrowthChart = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [xagGrowth, setXagGrowth] = useState([]);
  const [xauGrowth, setXauGrowth] = useState([]);
  const [xagVolume, setXagVolume] = useState([]);
  const [xauVolume, setXauVolume] = useState([]);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 9));

  const fetchedDates = useRef(new Set());

  const fetchDataByDate = async (date) => {
    const dateStr = formatDate(date);
    if (fetchedDates.current.has(dateStr)) return;
    fetchedDates.current.add(dateStr);

    setLoading(true);
    setError(null);

    try {
      const [xagRes, xauRes] = await Promise.all([
        fetch(buildApiUrl(XAG_BASE_API, dateStr)),
        fetch(buildApiUrl(XAU_BASE_API, dateStr)),
      ]);

      if (!xagRes.ok || !xauRes.ok) {
        throw new Error(t("GrowthChart.fetchError"));
      }

      const xagRaw = await xagRes.json();
      const xauRaw = await xauRes.json();

      const xagWeeks = xagRaw?.data?.phantich_cactuan ?? [];
      const xauWeeks = xauRaw?.data?.phantich_cactuan ?? [];

      const newCategories = xagWeeks.map(
        (w, i) =>
          w?.phantu_cuoituan?.timestamp?.split(' ')[0] || t("GrowthChart.week", { index: i + 1 })
      );

      setCategories((prev) => [...prev, ...newCategories]);
      setXagGrowth((prev) => [...prev, ...xagWeeks.map(w => w?.ti_le_tang_truong ?? 0)]);
      setXauGrowth((prev) => [...prev, ...xauWeeks.map(w => w?.ti_le_tang_truong ?? 0)]);
      setXagVolume((prev) => [...prev, ...xagWeeks.map(w => w?.volume_trungbinh ?? 0)]);
      setXauVolume((prev) => [...prev, ...xauWeeks.map(w => w?.volume_trungbinh ?? 0)]);
    } catch (err) {
      setError(err.message || t("GrowthChart.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataByDate(currentDate);
  }, [currentDate]);

  const handleLoadNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    if (next > new Date()) return;
    setCurrentDate(next);
  };

  /* ===================== DATA ===================== */

  const growthData = {
    labels: categories,
    datasets: [
      {
        label: t("GrowthChart.xauGrowth"),
        data: xauGrowth,
        backgroundColor: '#FFD700', // VÀNG
      },
      {
        label: t("GrowthChart.xagGrowth"),
        data: xagGrowth,
        backgroundColor: '#C0C0C0', // Bạc
      },
    ],
  };

  const volumeDataXAU = {
    labels: categories,
    datasets: [
      {
        label: t("GrowthChart.xauVolume"),
        data: xauVolume,
        backgroundColor: '#FFD700', // VÀNG
      },
    ],
  };

  const volumeDataXAG = {
    labels: categories,
    datasets: [
      {
        label: t("GrowthChart.xagVolume"),
        data: xagVolume,
        backgroundColor: '#C0C0C0', // Bạc
      },
    ],
  };

  /* ===================== OPTIONS ===================== */

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#f8f8f8' },
      },
      title: {
        display: true,
        color: '#f8f8f8',
        font: { size: 16 },
      },
      zoom: {
        pan: { enabled: true, mode: 'x', modifierKey: 'ctrl' },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#f8f8f8' },
        grid: { color: '#333' },
      },
      y: {
        ticks: { color: '#00bfff' },
        grid: { color: '#333' },
      },
    },
  };

  const growthOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: { ...commonOptions.plugins.title, text: t("GrowthChart.growthTitle") },
    },
  };

  const volumeOptionsXAU = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: { ...commonOptions.plugins.title, text: t("GrowthChart.volumeXauTitle") },
    },
  };

  const volumeOptionsXAG = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: { ...commonOptions.plugins.title, text: t("GrowthChart.volumeXagTitle") },
    },
  };

  return (
    <>
      <div
        style={{
          marginTop: 20,
          padding: 15,
          borderRadius: 6,
          backgroundColor: '#000',
          border: '1px solid #333',
        }}
      >
        <h3 style={{ color: '#f8f8f8', borderBottom: '1px solid #333', paddingBottom: 8 }}>
          {t("GrowthChart.header")}
        </h3>

        {error && (
          <p style={{ color: '#ff4500', textAlign: 'center' }}>{error}</p>
        )}

        {(xagGrowth.length || xauGrowth.length) > 0 ? (
          <div style={{ height: 350 }}>
            <Bar data={growthData} options={growthOptions} />
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#f8f8f8' }}>
            {t("GrowthChart.noData")}
          </p>
        )}

        <div style={{ textAlign: 'center', marginTop: 15 }}>
          <button
            onClick={handleLoadNextDay}
            disabled={loading}
            style={{
              padding: '8px 18px',
              backgroundColor: '#00bfff',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {loading ? t("GrowthChart.loading") : t("GrowthChart.loadMore")}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        {xauVolume.length > 0 && (
          <div style={{ height: 300 }}>
            <Bar data={volumeDataXAU} options={volumeOptionsXAU} />
          </div>
        )}

        {xagVolume.length > 0 && (
          <div style={{ height: 300, marginTop: 20 }}>
            <Bar data={volumeDataXAG} options={volumeOptionsXAG} />
          </div>
        )}
      </div>
    </>
  );
};

export default GrowthChart;
