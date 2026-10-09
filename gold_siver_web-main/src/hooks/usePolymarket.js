import { useState, useEffect } from 'react';

export const usePolymarket = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await fetch('https://api_gold.thinkdiff.us/polymarket_data_gold_silver');
      if (!res.ok) throw new Error('Failed to fetch polymarket data');
      const json = await res.json();
      
      const processed = json.map(item => {
        let totalVolume = 0;
        let mainMarket = null;
        if (item.markets && item.markets.length > 0) {
            totalVolume = item.markets.reduce((sum, m) => sum + (m.volume || 0), 0);
            mainMarket = item.markets.reduce((prev, curr) => (prev.volume > curr.volume) ? prev : curr);
        }
        return { ...item, totalVolume, mainMarket };
      });
      
      setData(processed);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Lỗi kết nối API');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
};
