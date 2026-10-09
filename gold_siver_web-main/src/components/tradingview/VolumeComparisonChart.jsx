import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useTranslation } from "react-i18next";
import i18n from "i18next";

// Chỉ đăng ký các thành phần cơ bản toàn cục
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  zoomPlugin
);

const formatDateForChart = (dateStr, isMobile) => {
  const options = {
    // month: '2-digit',
    // day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  // Desktop: thêm năm
  if (!isMobile) {
    options.year = 'numeric';
    options.month = '2-digit';
    options.day = '2-digit'
  }

  return new Date(dateStr).toLocaleString(i18n.language, options);
};

const getBarColors = (data, avgVolume) =>
  data.map(d => Number(d.volume) >= avgVolume ? '#00FF3C' : '#FF3333');

const VolumeChart = ({ data, title, avgVolume, enableZoom = true }) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!data) return <p>{t("VolumeCompare.loading")}</p>;

  const sortedData = [...data].reverse();
  const priceData = sortedData.map(d =>
    title === 'XAU'
      ? Number(d.y[3]) / 0.02835
      : Number(d.y[3])
  );
  const titlePrice = title === 'XAU'
  ? t("VolumeCompare.xauPriceAxis")
  : t("VolumeCompare.xagPriceAxis");
  const minPrice = Math.min(...priceData);
  // const labels = sortedData.map(d => formatDate(d.x));
  const labels = sortedData.map(d => formatDateForChart(d.x, isMobile));
  const backgroundColors = getBarColors(sortedData, avgVolume);
  const volumes = sortedData.map(d => Number(d.volume));


  // --- LOGIC: CHỈ ĐIỀN GIÁ TRỊ ĐỈNH ĐỂ HIỆN TEXT 1 LẦN ---
  const getSegmentedArc = (volArray, avg, type) => {
    let result = new Array(volArray.length).fill(NaN);
    let countArr = new Array(volArray.length).fill(0);
    let i = 0;

    while (i < volArray.length) {
      // type === 'low': nến đỏ (vol < avg), type === 'high': nến xanh (vol >= avg)
      const condition = type === 'low' ? volArray[i] < avg : volArray[i] >= avg;

      if (condition) {
        let start = i;
        while (i < volArray.length && (type === 'low' ? volArray[i] < avg : volArray[i] >= avg)) {
          i++;
        }
        let end = i - 1;
        let count = i - start;

        if (count > 5) {
          let mid = Math.floor((start + end) / 2);
          let peakValue = Math.max(...volArray.slice(start, end + 1)) * 1.3;

          for (let j = start; j <= end; j++) {
            if (j === mid) result[j] = peakValue;
            else if (j === start || j === end) result[j] = volArray[j] * 1.05;
            else result[j] = peakValue * 0.95;
            countArr[j] = count;
          }
        }
      } else {
        result[i] = NaN;
        i++;
      }
    }
    return { result, countArr };
  };

  // const warningArcData = getStrictSegmentedData(volumes, avgVolume);
  const { result: redArcData, countArr: redwarningCounts } = getSegmentedArc(volumes, avgVolume, 'low');
  const { result: greenArcData, countArr: greenwarningCounts } = getSegmentedArc(volumes, avgVolume, 'high');
  const priceColor = title === 'XAU' ? '#FFD700' : '#C0C0C0';

  const chartData = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: t("VolumeCompare.volume", { type: title }),
        data: volumes,
        backgroundColor: backgroundColors,
        datalabels: { display: false },
        yAxisID: 'y',
      },
      {
        type: 'line',
        label: t("VolumeCompare.price", { type: title }),
        data: sortedData.map(d => title === 'XAU' ? Number(d.y[3]) / 0.02835 : Number(d.y[3])),
        borderColor: priceColor,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2,
        yAxisID: 'yPrice',
        datalabels: { display: false },
      },
      // CUNG CHO CỤM ĐỎ
      {
        type: 'line',
        label: t("VolumeCompare.warning"),
        data: redArcData,
        borderColor: '#FF3333',
        borderWidth: 2,
        pointRadius: 0,
        spanGaps: false,
        tension: 0.4,
        datalabels: {
          display: (ctx) => {
            const v = ctx.dataset.data;
            const i = ctx.dataIndex;
            return (!isNaN(v[i]) && v[i] > v[i - 1] && v[i] > v[i + 1]);
          },
          formatter: (value, ctx) => {
            const idx = ctx.dataIndex;
            const count = redwarningCounts[idx] || 0;
            return t("VolumeCompare.lowCluster", { count });
          },
          color: '#FF3333',
          align: 'top',
          font: { weight: 'bold', size: 10 }
        }
      },
      //CUNG CHO CỤM XANH
      {
        type: 'line',
        label: t("VolumeCompare.warning"),
        data: greenArcData,
        borderColor: '#00FF3C',
        borderWidth: 2,
        pointRadius: 0,
        spanGaps: false,
        tension: 0.4,
        datalabels: {
          display: (ctx) => {
            const v = ctx.dataset.data;
            const i = ctx.dataIndex;
            return (!isNaN(v[i]) && v[i] > v[i - 1] && v[i] > v[i + 1]);
          },
          formatter: (value, ctx) => {
            const idx = ctx.dataIndex;
            const count = greenwarningCounts[idx] || 0;
            return t("VolumeCompare.highCluster", { count });
          },
          color: '#00FF3C',
          align: 'top',
          font: { weight: 'bold', size: 10 }
        }
      },
    ],
  };

  // mau xanh volume bung no

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: {
        type: 'linear',
        display: !isMobile,
        position: 'left',
        title: { display: true, text: t("VolumeCompare.volumeAxis") }
      },
      yPrice: {
        type: 'linear',
        display: !isMobile,
        position: 'left',
        title: { display: true, text: titlePrice },
        grid: { drawOnChartArea: false },
        min: minPrice * 0.995
      },
      x: {
        title: {
          display: true,
          text: t("VolumeCompare.date")
        },
      },
    },
    plugins: {
      legend: { display: true },
      datalabels: { display: false }, // Tắt mặc định cho toàn bộ biểu đồ
      tooltip: {
        callbacks: {
          label: (context) => {
            if (context.dataset.label === 'Cảnh báo') return null;
            const value = context.raw ?? 0;
            return `${context.dataset.label}: ${value.toLocaleString(i18n.language)}`;
          },
        },
      },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: {
          wheel: { enabled: enableZoom },
          pinch: { enabled: enableZoom },
          mode: 'x'
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '450px', marginBottom: '40px' }}>
      <Chart
        type="bar"
        data={chartData}
        options={options}
        plugins={[ChartDataLabels]} // Chỉ kích hoạt plugin cho biểu đồ này
      />
    </div>
  );
};

const VolumeComparisonChart = ({ dataXau, dataXag, avgVolumeXau, avgVolumeXag, enableZoom = true }) => {
  const { t } = useTranslation();
  const avgXau = avgVolumeXau ?? (dataXau?.length ? Number(dataXau[0].volume_trungbinh) : 0);
  const avgXag = avgVolumeXag ?? (dataXag?.length ? Number(dataXag[0].volume_trungbinh) : 0);

  return (
    <div style={{ marginTop: '50px' }}>
      <div>
        <h3 style={{ color: '#FFD700' }}>{t("VolumeCompare.titleXau")}</h3>
        <VolumeChart
          data={dataXau}
          title="XAU"
          avgVolume={avgXau}
          enableZoom={enableZoom}
          colorScheme={{ bar: '#FFD700', line: '#FFD700' }}
        />
      </div>
      <div>
        <h3 style={{ color: '#C0C0C0' }}>{t("VolumeCompare.titleXag")}</h3>
        <VolumeChart
          data={dataXag}
          title="XAG"
          avgVolume={avgXag}
          enableZoom={enableZoom}
          colorScheme={{ bar: '#C0C0C0', line: '#C0C0C0' }}
        />
      </div>
    </div>
  );
};

export default VolumeComparisonChart;