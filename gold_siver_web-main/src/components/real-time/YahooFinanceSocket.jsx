import React, { useEffect } from 'react';
import protobuf from 'protobufjs';
import schemaJSON from './schema.json';
import { allHeatmapData as heatmapData } from '../money-flow-heatmap/symbolsConfig';

// --- BIẾN TOÀN CỤC HOẠT ĐỘNG NHƯ BỘ ĐỆM (CACHE) ---
let cachedStocks = {};
try {
  const saved = localStorage.getItem("cached_yahoo_stocks");
  if (saved) {
    cachedStocks = JSON.parse(saved);
  }
} catch (e) {
  console.warn("[YahooSocket] Lỗi đọc cache từ localStorage:", e);
}

export const globalYahooStocks = cachedStocks;

// Hàm lưu cache
const saveCacheToStorage = () => {
  try {
    localStorage.setItem("cached_yahoo_stocks", JSON.stringify(globalYahooStocks));
  } catch (e) {}
};

// --- THROTTLING MAP FOR FALLBACK WRAPPER API ---
const lastWrapperFetchTimes = {};

// --- TIMEOUT FETCH HELPER (Hỗ trợ xử lý fallback 401, 522, timeout) ---
const fetchWithTimeout = async (url, options = {}, timeout = 6000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    if (!response.ok) {
      if (response.status === 401 || response.status === 522) {
        console.warn(`[YahooSocket] HTTP Error ${response.status} cho URL: ${url}`);
      }
      throw new Error(`HTTP Error ${response.status}`);
    }
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Fallback Wrapper API: https://api_gold.thinkdiff.us/api/stock/{symbol}
const fetchWrapperPrice = async (symbol) => {
  let cleanSymbol = symbol;
  try {
    cleanSymbol = decodeURIComponent(symbol);
  } catch (e) {}

  // Throttle tối đa một lần mỗi 30 giây cho mỗi mã để tránh spam mạng
  const now = Date.now();
  if (lastWrapperFetchTimes[cleanSymbol] && now - lastWrapperFetchTimes[cleanSymbol] < 30000) {
    return null;
  }
  lastWrapperFetchTimes[cleanSymbol] = now;

  try {
    let apiSymbol = cleanSymbol;
    if (apiSymbol.endsWith('.HM')) {
      apiSymbol = apiSymbol.replace('.HM', '.VN'); // Map '.HM' -> '.VN' (e.g. VCB.HM -> VCB.VN)
    }

    // Không URL encode apiSymbol để tránh lỗi router của Backend (mã đã được làm sạch)
    const url = `https://api_gold.thinkdiff.us/api/stock/${apiSymbol}`;
    const response = await fetchWithTimeout(url, {}, 6000);
    const json = await response.json();
    if (json && json.status === "success" && json.data) {
      const data = json.data;
      const price = data.regularMarketPrice;
      const prevClose = data.previousClose;
      const changePercentage = data.changePercentage;

      const existing = globalYahooStocks[cleanSymbol] || {};
      const tickerData = {
        ...existing,
        id: cleanSymbol,
        symbol: cleanSymbol,
        price: price,
        previousClose: prevClose,
        changePercent: changePercentage,
        time: new Date().toLocaleTimeString()
      };
      
      // Lưu song song cả hai dạng .VN và .HM để các component đối chiếu chính xác
      globalYahooStocks[cleanSymbol] = tickerData;
      if (cleanSymbol.endsWith('.VN')) {
        const hmSym = cleanSymbol.replace('.VN', '.HM');
        globalYahooStocks[hmSym] = tickerData;
      } else if (cleanSymbol.endsWith('.HM')) {
        const vnSym = cleanSymbol.replace('.HM', '.VN');
        globalYahooStocks[vnSym] = tickerData;
      }

      saveCacheToStorage();
      window.dispatchEvent(new CustomEvent('yahooPriceAlert', { detail: tickerData }));
      console.log(`[YahooSocket] Wrapper fallback successfully fetched for ${cleanSymbol}: price=${price}, changePercent=${changePercentage}%`);
      return tickerData;
    }
  } catch (err) {
    console.error(`[YahooSocket] Error calling wrapper fallback API for ${cleanSymbol}:`, err.message);
  }
  return null;
};

// Fetch snapshot giá hiện tại qua nhiều proxy
const fetchInitialPrices = async (symbols) => {
  if (!symbols || !Array.isArray(symbols)) return;

  // Giải mã URL encode cho tất cả symbols để tránh mismatch
  const decodedSymbols = symbols.map(s => {
    try {
      return decodeURIComponent(s);
    } catch (e) {
      return s;
    }
  });

  const symbolsToRefresh = decodedSymbols;

  if (symbolsToRefresh.length > 0) {
    // 1. Thử gọi qua local Node proxy server chạy song song trên cổng 3005 (Hiệu năng cực cao)
    try {
      const chunkArray = (array, size) => {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
          result.push(array.slice(i, i + size));
        }
        return result;
      };

      const localChunks = chunkArray(symbolsToRefresh, 100);
      let allLocalSuccess = true;

      for (const chunk of localChunks) {
        const requestChunk = chunk.map(sym => sym.endsWith('.HM') ? sym.replace('.HM', '.VN') : sym);
        const symbolsStr = requestChunk.join(',');
        const response = await fetchWithTimeout(`http://localhost:3005/api/stock-data?symbols=${encodeURIComponent(symbolsStr)}`, {}, 6000);
        const items = await response.json();
        if (Array.isArray(items)) {
          items.forEach(item => {
            let sym = item.symbol;
            try {
              sym = decodeURIComponent(sym);
            } catch (e) {}

            const price = item.regularMarketPrice;
            const prevClose = item.regularMarketPreviousClose || item.previousClose || item.chartPreviousClose;

            if (price != null) {
              let calculatedPercent = item.regularMarketChangePercent;
              if ((calculatedPercent === undefined || calculatedPercent === null) && prevClose && prevClose > 0) {
                calculatedPercent = ((price - prevClose) / prevClose) * 100;
              }
              calculatedPercent = calculatedPercent || 0;

              const tickerData = {
                ...item,
                id: sym,
                symbol: sym,
                price: price,
                previousClose: prevClose,
                changePercent: calculatedPercent,
                time: new Date().toLocaleTimeString()
              };

              // Lưu song song cả hai dạng .VN và .HM để các component đối chiếu chính xác
              globalYahooStocks[sym] = tickerData;
              if (sym.endsWith('.VN')) {
                const hmSym = sym.replace('.VN', '.HM');
                globalYahooStocks[hmSym] = tickerData;
              } else if (sym.endsWith('.HM')) {
                const vnSym = sym.replace('.HM', '.VN');
                globalYahooStocks[vnSym] = tickerData;
              }

              window.dispatchEvent(new CustomEvent('yahooPriceAlert', { detail: tickerData }));
            }
          });
        } else {
          allLocalSuccess = false;
          break;
        }
      }

      if (allLocalSuccess) {
        console.log(`[YahooSocket] Successfully refreshed ${symbolsToRefresh.length} prices via local Node proxy.`);
        saveCacheToStorage();
      } else {
        throw new Error("Local proxy batch fetch failed or incomplete");
      }
    } catch (localErr) {
      console.warn("[YahooSocket] Local proxy batch fetch failed, falling back to public CORS proxies...", localErr.message);

      // 2. Fallback sang CORS proxies công cộng (Chậm hơn, dùng khi không chạy server cục bộ)
      const fields = ["regularMarketPrice", "regularMarketChangePercent", "regularMarketPreviousClose", "previousClose", "chartPreviousClose", "regularMarketChange", "regularMarketVolume", "shortName"].join(',');
      
      const chunkArray = (array, size) => {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
          result.push(array.slice(i, i + size));
        }
        return result;
      };
      
      const chunks = chunkArray(symbolsToRefresh, 25);

      for (const chunk of chunks) {
        const symbolsStr = chunk.join(',');
        const yahooUrl = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolsStr)}&fields=${fields}`;

        const proxies = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}&_=${Date.now()}`,
          `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`
        ];

        let success = false;
        for (const pUrl of proxies) {
          if (success) break;
          try {
            const response = await fetchWithTimeout(pUrl, {}, 6000);
            const data = await response.json();
            const result = data.contents ? JSON.parse(data.contents) : data;

            if (result?.quoteResponse?.result) {
              result.quoteResponse.result.forEach(item => {
                let sym = item.symbol;
                try {
                  sym = decodeURIComponent(sym);
                } catch (e) {}

                const price = item.regularMarketPrice;
                const prevClose = item.regularMarketPreviousClose || item.previousClose || item.chartPreviousClose;

                if (price != null) {
                  let calculatedPercent = item.regularMarketChangePercent;
                  if ((calculatedPercent === undefined || calculatedPercent === null) && prevClose && prevClose > 0) {
                    calculatedPercent = ((price - prevClose) / prevClose) * 100;
                  }
                  calculatedPercent = calculatedPercent || 0;

                  const tickerData = {
                    ...item,
                    id: sym,
                    symbol: sym,
                    price: price,
                    previousClose: prevClose,
                    changePercent: calculatedPercent,
                    time: new Date().toLocaleTimeString()
                  };

                  // Lưu song song cả hai dạng .VN và .HM để các component đối chiếu chính xác
                  globalYahooStocks[sym] = tickerData;
                  if (sym.endsWith('.VN')) {
                    const hmSym = sym.replace('.VN', '.HM');
                    globalYahooStocks[hmSym] = tickerData;
                  } else if (sym.endsWith('.HM')) {
                    const vnSym = sym.replace('.HM', '.VN');
                    globalYahooStocks[vnSym] = tickerData;
                  }
                }
              });
              success = true;
              saveCacheToStorage();
            }
          } catch (e) { }
        }
      }
    }
  }

  // 3. Fallback Wrapper API cho mã chưa có giá, hoặc mã Việt Nam (.VN/.HM) cần làm mới liên tục.
  // Không fallback chỉ vì changePercent = 0: với futures/hàng hóa, 0% có thể là dữ liệu đúng từ Yahoo.
  const wrapperQueue = decodedSymbols.filter(s => {
    const stock = globalYahooStocks[s];
    if (!stock || stock.price === 0) return true;
    if (s.endsWith('.VN') || s.endsWith('.HM')) return true; // Luôn làm mới mã VN từ API
    if (stock.changePercent === undefined || stock.changePercent === null) return true;
    return false;
  });

  if (wrapperQueue.length > 0) {
    console.log(`[YahooSocket] Fallback: calling wrapper API for ${wrapperQueue.length} symbols concurrently in batches...`);
    const chunkArray = (array, size) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };
    const wrapperChunks = chunkArray(wrapperQueue, 15);
    for (const chunk of wrapperChunks) {
      await Promise.all(chunk.map(sym => fetchWrapperPrice(sym).catch(() => null)));
    }
  }
};

const YahooFinanceSocket = () => {
  useEffect(() => {
    const root = protobuf.Root.fromJSON(schemaJSON);
    const Yaticker = root.lookupType("Yaticker");

    const activeSymbolsSet = new Set();
    const traverse = (node) => {
      if (!node) return;
      if (node.symbol) {
        try {
          activeSymbolsSet.add(decodeURIComponent(node.symbol));
        } catch (e) {
          activeSymbolsSet.add(node.symbol);
        }
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(traverse);
      }
    };
    traverse(heatmapData);
    if (heatmapData) {
      const extraArrays = ['allSymbols', 'miningSymbols', 'stockSymbols', 'etfSymbols'];
      extraArrays.forEach(key => {
        if (heatmapData[key] && Array.isArray(heatmapData[key])) {
          heatmapData[key].forEach(s => {
            try {
              activeSymbolsSet.add(decodeURIComponent(s));
            } catch (e) {
              activeSymbolsSet.add(s);
            }
          });
        }
      });
    }
    const finalSymbolsList = Array.from(activeSymbolsSet);

    // 1. Tải snapshot tức thì
    fetchInitialPrices(finalSymbolsList);
    const snapInterval = setInterval(() => fetchInitialPrices(finalSymbolsList), 60000);

    // 2. Sockets (50 symbols/socket)
    const socketMap = new Map();
    
    const chunkArray = (array, size) => {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    };

    const startSocket = (chunk, idx) => {
      if (socketMap.has(idx)) return;
      const ws = new WebSocket('wss://streamer.finance.yahoo.com/?version=2');
      socketMap.set(idx, ws);

      ws.onopen = () => {
        console.log(`[Socket #${idx + 1}] Connected with ${chunk.length} symbols`);
        ws.send(JSON.stringify({ subscribe: chunk }));
      };

      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          if (raw.message) {
            const decoded = Yaticker.decode(Uint8Array.from(window.atob(raw.message), c => c.charCodeAt(0)));
            let sym = decoded.id;
            try {
              sym = decodeURIComponent(sym);
            } catch (e) {}

            const existing = globalYahooStocks[sym] || {};
            const prevClose = decoded.previousClose || existing.previousClose;

            let calculatedPercent = decoded.changePercent;
            if ((calculatedPercent === undefined || calculatedPercent === null) && decoded.price && prevClose && prevClose > 0) {
              calculatedPercent = ((decoded.price - prevClose) / prevClose) * 100;
            }

            const updated = {
              ...existing,
              ...decoded,
              price: decoded.price,
              previousClose: prevClose,
              changePercent: calculatedPercent,
              time: new Date().toLocaleTimeString()
            };
            
            // Lưu song song cả hai dạng .VN và .HM để các component đối chiếu chính xác
            globalYahooStocks[sym] = updated;
            if (sym.endsWith('.VN')) {
              const hmSym = sym.replace('.VN', '.HM');
              globalYahooStocks[hmSym] = updated;
            } else if (sym.endsWith('.HM')) {
              const vnSym = sym.replace('.HM', '.VN');
              globalYahooStocks[vnSym] = updated;
            }
            
            saveCacheToStorage();
            window.dispatchEvent(new CustomEvent('yahooPriceAlert', { detail: updated }));

            if (calculatedPercent === undefined || calculatedPercent === null) {
              fetchWrapperPrice(sym);
            }
          }
        } catch (err) {}
      };

      ws.onclose = () => {
        socketMap.delete(idx);
        setTimeout(() => startSocket(chunk, idx), 5000);
      };
    };

    const socketChunks = chunkArray(finalSymbolsList, 50);
    console.log(`📡 Kích hoạt ${socketChunks.length} luồng dữ liệu (mỗi luồng 50 mã)...`);
    socketChunks.forEach((c, i) => startSocket(c, i));

    return () => clearInterval(snapInterval);
  }, []);

  return null;
};

export const setCompareDays = async (days) => {
  console.log(`[Yahoo] Đang chuyển chế độ so sánh sang ${days} ngày...`);
  return true;
};

export default YahooFinanceSocket;
