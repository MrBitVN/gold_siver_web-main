import express from 'express';
import cors from 'cors';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

const app = express();
const PORT = 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint để fetch dữ liệu cổ phiếu từ Yahoo Finance
app.get('/api/stock-data', async (req, res) => {
    try {
        const { symbols } = req.query;

        if (!symbols) {
            return res.status(400).json({ error: 'Symbols parameter is required' });
        }

        // Convert symbols string to array
        const symbolsArray = symbols.split(',').map(s => s.trim());

        // Fetch data cho tất cả symbols trong 1 request
        let dataArray = [];
        try {
            dataArray = await yahooFinance.quote(symbolsArray, {}, { validateResult: false });
            if (!Array.isArray(dataArray)) {
                dataArray = [dataArray]; // Nếu chỉ có 1 symbol, nó trả về object
            }
        } catch (error) {
            console.error('Error fetching batch, retrying in parallel:', error.message);
            // Retry song song từng cái một để tránh nghẽn luồng và trả về kết quả cực nhanh
            const promises = symbolsArray.map(async (sym) => {
                try {
                    const single = await yahooFinance.quote(sym, {}, { validateResult: false });
                    if (single && single.symbol) {
                        dataArray.push(single);
                    }
                } catch (e) {
                    // bỏ qua symbol lỗi
                }
            });
            await Promise.all(promises);
        }

        const dataMap = {};
        dataArray.forEach(data => {
            if (data && data.symbol) {
                dataMap[data.symbol] = data;
            }
        });

        const missingSymbols = symbolsArray.filter(symbol => !dataMap[symbol]);
        if (missingSymbols.length > 0) {
            const retryResults = await Promise.all(missingSymbols.map(async (symbol) => {
                try {
                    const single = await yahooFinance.quote(symbol, {}, { validateResult: false });
                    return single && single.symbol ? { requestedSymbol: symbol, data: single } : null;
                } catch (e) {
                    return null;
                }
            }));

            retryResults.forEach(result => {
                if (result?.data) {
                    dataMap[result.requestedSymbol] = {
                        ...result.data,
                        symbol: result.requestedSymbol,
                    };
                }
            });
        }

        // Tạo kết quả trả về, dùng fallback cho các symbol không lấy được
        const results = symbolsArray.map(symbol => {
            const data = dataMap[symbol];
            if (data) {
                // Ưu tiên: regularMarket > postMarket > preMarket
                const changePercent =
                    data.regularMarketChangePercent ||
                    data.postMarketChangePercent ||
                    data.preMarketChangePercent ||
                    0;
                const price =
                    data.regularMarketPrice ||
                    data.postMarketPrice ||
                    data.preMarketPrice ||
                    0;

                return {
                    ...data,
                    symbol,
                    regularMarketPrice: price,
                    regularMarketChange: data.regularMarketChange || 0,
                    regularMarketChangePercent: changePercent,
                    postMarketChangePercent: data.postMarketChangePercent || null,
                    preMarketChangePercent: data.preMarketChangePercent || null,
                    currency: data.currency || 'USD',
                    marketCap: data.marketCap || 0,
                    regularMarketVolume: data.regularMarketVolume || 0,
                    marketState: data.marketState || 'CLOSED',
                    shortName: data.shortName || symbol,
                };
            } else {
                return {
                    symbol,
                    regularMarketPrice: 0,
                    regularMarketChange: 0,
                    regularMarketChangePercent: 0,
                    currency: 'USD',
                    marketCap: 0,
                    regularMarketVolume: 0,
                    marketState: 'CLOSED',
                };
            }
        });

        res.json(results);
    } catch (error) {
        console.error('Error in /api/stock-data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint để lấy thông tin chi tiết cổ phiếu (bao gồm summaryDetail, defaultKeyStatistics, assetProfile, price)
app.get('/api/stock-details', async (req, res) => {
    try {
        const { symbol } = req.query;

        if (!symbol) {
            return res.status(400).json({ error: 'Symbol parameter is required' });
        }

        // Fetch quoteSummary từ yahooFinance
        let summary = null;
        try {
            summary = await yahooFinance.quoteSummary(symbol, {
                modules: ['summaryDetail', 'defaultKeyStatistics', 'assetProfile', 'fundProfile', 'price']
            });
        } catch (summaryError) {
            console.warn(`quoteSummary failed for ${symbol}, trying quote + search fallback:`, summaryError.message);
            
            // Fallback: Lấy dữ liệu cơ bản bằng quote và search
            const quoteData = await yahooFinance.quote(symbol).catch(() => null);
            const searchData = await yahooFinance.search(symbol).catch(() => null);
            
            if (quoteData) {
                // Giả lập cấu trúc quoteSummary để frontend không bị lỗi
                summary = {
                    price: {
                        regularMarketPrice: { raw: quoteData.regularMarketPrice },
                        regularMarketChangePercent: { raw: (quoteData.regularMarketChangePercent || 0) / 100 },
                        regularMarketOpen: { raw: quoteData.regularMarketOpen },
                        regularMarketDayLow: { raw: quoteData.regularMarketDayLow },
                        regularMarketDayHigh: { raw: quoteData.regularMarketDayHigh },
                        regularMarketVolume: { raw: quoteData.regularMarketVolume },
                        marketCap: { raw: quoteData.marketCap },
                        longName: quoteData.longName || quoteData.shortName || symbol,
                        shortName: quoteData.shortName || symbol,
                    },
                    summaryDetail: {
                        regularMarketOpen: { raw: quoteData.regularMarketOpen },
                        regularMarketDayLow: { raw: quoteData.regularMarketDayLow },
                        regularMarketDayHigh: { raw: quoteData.regularMarketDayHigh },
                        volume: { raw: quoteData.regularMarketVolume },
                        marketCap: { raw: quoteData.marketCap },
                    }
                };
                
                if (searchData && searchData.quotes && searchData.quotes.length > 0) {
                    const found = searchData.quotes.find(q => q.symbol === symbol) || searchData.quotes[0];
                    summary.searchProfile = found;
                }
            }
        }

        if (!summary) {
            return res.status(404).json({ error: `Could not fetch data for symbol ${symbol}` });
        }

        res.json(summary);
    } catch (error) {
        console.error(`Error in /api/stock-details for ${req.query.symbol}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint để proxy tin tức CNFOL không bị chặn CORS và load cực nhanh
app.get('/api/cnfol-news', async (req, res) => {
    try {
        const targetUrl = `https://app.cnfol.com/dataapi/index.php/kuaixundata/golddata?num1=0&num2=15&strlen=25&cstrlen=200&_=${Date.now()}`;
        const response = await fetch(targetUrl);
        if (!response.ok) {
            throw new Error(`CNFOL responded with status ${response.status}`);
        }
        const text = await response.text();
        res.send(text);
    } catch (error) {
        console.error('Error fetching CNFOL news:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`Stock data API server running on http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log(`  GET /api/stock-data?symbols=NVDA,TSLA,GLD - Fetch stock data`);
    console.log(`  GET /health - Health check`);
});

