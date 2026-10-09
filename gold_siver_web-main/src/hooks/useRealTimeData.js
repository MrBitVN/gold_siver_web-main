import { useState, useEffect, useRef } from "react";

/**
 * Hook lấy dữ liệu realtime (WebSocket + Fallback API)
 */
const useRealTimeData = () => {
  const [liveData, setLiveData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [news, setNews] = useState([]);
  const [unreadNewsCount, setUnreadNewsCount] = useState(0);
  const [seenNewsIds, setSeenNewsIds] = useState(() => new Set());

  const pollIntervalRef = useRef(null);

  const fetchNewApiData = async () => {
    try {
      const response = await fetch(
        "https://api_gold.thinkdiff.us/vang_bac_noitieng",
      );
      const json = await response.json();

      if (json.status === "success" && json.data) {
        const newData = json.data;

        // --- ÁNH XẠ DỮ LIỆU ---
        const mapped = {
          thoigian: newData.thoigian,
          // 4 hàng dữ liệu chính theo yêu cầu
          vnGold: newData.vang || {},
          vnSilver: newData.bac || {},
          intlGold: newData.vang_quoc_te || {},
          intlSilver: newData.bac_quoc_te || {},
          // Cấu trúc cũ để không làm hỏng các helper
          goldNationWide: [
            {
              name: "999,9 TD",
              buy: newData.vang?.phuquy_gold?.vnd || 0,
              sell: newData.vang?.phuquy_gold?.vnd || 0,
              hanoi: {
                buy: newData.vang?.phuquy_gold?.vnd || 0,
                sell: newData.vang?.phuquy_gold?.vnd || 0,
              },
            },
            {
              name: "XAUUSD",
              buy: newData.vang_quoc_te?.bullionstar_gold?.usd || 0,
              sell: newData.vang_quoc_te?.bullionstar_gold?.usd || 0,
              hanoi: {
                buy: newData.vang_quoc_te?.bullionstar_gold?.usd || 0,
                sell: newData.vang_quoc_te?.bullionstar_gold?.usd || 0,
              },
            },
          ],
          sjcNationWide: [
            {
              name: "SJC TD",
              buy: newData.vang?.doji_gold?.vnd || 0,
              sell: newData.vang?.doji_gold?.vnd || 0,
              hanoi: {
                buy: newData.vang?.doji_gold?.vnd || 0,
                sell: newData.vang?.doji_gold?.vnd || 0,
              },
            },
          ],
          currencyNationWide: [
            {
              name: "USD",
              buy: newData.tygia_usd || 0,
              sell: newData.tygia_usd || 0,
              hanoi: {
                buy: newData.tygia_usd || 0,
                sell: newData.tygia_usd || 0,
              },
            },
            {
              name: "XAUUSD",
              buy: newData.vang_quoc_te?.bullionstar_gold?.usd || 0,
              sell: newData.vang_quoc_te?.bullionstar_gold?.usd || 0,
              hanoi: {
                buy: newData.vang_quoc_te?.bullionstar_gold?.usd || 0,
                sell: newData.vang_quoc_te?.bullionstar_gold?.usd || 0,
              },
            },
          ],
          silver_price: [
            {
              name: "XAGUSD",
              buy: newData.bac_quoc_te?.JMBullion_silver?.usd || 0,
              sell: newData.bac_quoc_te?.JMBullion_silver?.usd || 0,
              hanoi: {
                buy: newData.bac_quoc_te?.JMBullion_silver?.usd || 0,
                sell: newData.bac_quoc_te?.JMBullion_silver?.usd || 0,
              },
            },
          ],
          ContentNew: [],
        };

        setLiveData(mapped);
        setIsConnected(true);
      }
    } catch (err) {
      console.warn("❌ useRealTimeData error:", err);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchNewApiData();
    pollIntervalRef.current = setInterval(fetchNewApiData, 20000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const markNewsAsSeen = () => {
    const ids = news.map((n) => n.id || n.ID);
    setSeenNewsIds(new Set(ids));
    setUnreadNewsCount(0);
  };

  return {
    liveData,
    isConnected,
    news,
    unreadNewsCount,
    markNewsAsSeen,
  };
};

export default useRealTimeData;
