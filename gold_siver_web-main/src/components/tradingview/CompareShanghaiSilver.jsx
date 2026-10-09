import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import "./CompareShanghaiGoldSilver.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CompareShanghaiGoldSilver = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [goldChartData, setGoldChartData] = useState(null);
  const [silverChartData, setSilverChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          'https://api_gold.thinkdiff.us/compare_shanghai_comex_silver'
        );

        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu');
        }

        const result = await response.json();

        const goldData = result.data?.gold?.data || [];
        const silverData = result.data?.silver?.data || [];

        // ===== GOLD =====
        const goldLabels = goldData.map(i => i.date);
        const goldShanghai = goldData.map(i => i.shanghai);
        const goldWestern = goldData.map(i => i.western);

        setGoldChartData({
          labels: goldLabels,
          datasets: [
            {
              label: 'Shanghai Gold',
              data: goldShanghai,
              borderColor: '#f4c430',
              backgroundColor: 'rgba(244,196,48,0.3)',
              tension: 0.3,
            },
            {
              label: 'Western Gold',
              data: goldWestern,
              borderColor: '#1e90ff',
              backgroundColor: 'rgba(30,144,255,0.3)',
              tension: 0.3,
            },
          ],
        });

        // ===== SILVER =====
        const silverLabels = silverData.map(i => i.date);
        const silverShanghai = silverData.map(i => i.shanghai);
        const silverWestern = silverData.map(i => i.western);

        setSilverChartData({
          labels: silverLabels,
          datasets: [
            {
              label: 'Shanghai Silver',
              data: silverShanghai,
              borderColor: '#c0c0c0',
              backgroundColor: 'rgba(192,192,192,0.3)',
              tension: 0.3,
            },
            {
              label: 'Western Silver',
              data: silverWestern,
              borderColor: '#1e90ff',
              backgroundColor: 'rgba(30,144,255,0.3)',
              tension: 0.3,
            },
          ],
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const baseOptions = () => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    },
  });

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>Lỗi: {error}</div>;
//Xóa 2 biểu đồ Shang hai so sánh giá vàng và bạc tại mỹ
  return (
    <div style={{ width: '900px', margin: '0 auto' }}>
      <h2>So sánh giá vàng và bạc tại Shanghai Và Ở Mỹ</h2>
      <div style={{ height: 400 }}>
        {goldChartData && (
          <Line
            data={goldChartData}
            options={baseOptions('Compare Shanghai vs Western GOLD')}
          />
        )}
        </div>
        <div style={{ height: 40 }} />

      <div style={{ height: 400 }}>
        {silverChartData && (
          <Line
            data={silverChartData}
            options={baseOptions('Compare Shanghai vs Western SILVER')}
          />
        )}
      </div>
      
    </div>
  );
};

export default CompareShanghaiGoldSilver;

// thêm biểu đồ khoảng cách giá vàng và bạc giữa shanghai và western
// và nut đổi giữa hai biểu đồ vàng và bạc
