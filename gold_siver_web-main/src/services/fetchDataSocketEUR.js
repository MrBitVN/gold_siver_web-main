

const PROXIES = [
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
];

const YAHOO_BASE_URL = "https://query2.finance.yahoo.com/v6/finance/quote";

/**
 * Creates a "Socket-like" polling mechanism for a ticker.
 * @param {string} ticker Yahoo Finance ticker (e.g., 'SILV.L', 'GDX')
 * @param {function} onData Callback for when data is received
 * @param {function} onStatus Callback for connection status updates
 * @param {number} interval Polling interval in ms (default 5m)
 */
export function createYahooFinanceSocket(ticker, onData, onStatus, interval = 300000) {
    let isClosed = false;
    let timer = null;
    let failureCount = 0;
    const MAX_FAILURES = 3;

    const fetchData = async () => {
        if (isClosed) return;

        if (failureCount >= MAX_FAILURES) {
            console.warn(`Stopping polling for ${ticker} due to consistent failures.`);
            onStatus && onStatus("Failed (Stopped)");
            return;
        }

        onStatus && onStatus("Updating...");

        const targetUrl = `${YAHOO_BASE_URL}?symbols=${ticker}`;
        let success = false;

        for (const proxyFn of PROXIES) {
            try {
                const res = await fetch(proxyFn(targetUrl));
                if (!res.ok) continue;

                const rawData = await res.json();
                const result = rawData.quoteResponse?.result?.[0];

                if (result) {
                    const mappedData = {
                        dtdPrc: { raw: result.regularMarketChangePercent || 0 },
                        dtdAmt: { raw: result.regularMarketChange || 0 },
                        ask: { raw: result.regularMarketPrice || 0 },
                        symbol: result.symbol,
                        name: result.shortName || result.longName || result.symbol,
                        marketCap: result.marketCap || result.totalAssets,
                        volume: result.regularMarketVolume,
                        peRatio: result.trailingPE
                    };

                    onData && onData(mappedData);
                    onStatus && onStatus("Connected");
                    success = true;
                    failureCount = 0; // Reset failures on success
                    break;
                }
            } catch (err) {
                // Silently handle proxy errors
            }
        }

        if (!success && !isClosed) {
            failureCount++;
            onStatus && onStatus(`Error (${failureCount}/${MAX_FAILURES})`);
        }

        // Schedule next poll only if we haven't reached max failures and not closed
        if (!isClosed && failureCount < MAX_FAILURES) {
            timer = setTimeout(fetchData, interval);
        }
    };

    // Initial fetch
    fetchData();

    // Return a close function
    return () => {
        isClosed = true;
        if (timer) clearTimeout(timer);
        onStatus && onStatus("Closed");
    };

}

export const createJustETFSocket = createYahooFinanceSocket;

export async function fetchPerformanceChart() { return null; }
export async function fetchETFProfileHTML() { return "{}"; }
