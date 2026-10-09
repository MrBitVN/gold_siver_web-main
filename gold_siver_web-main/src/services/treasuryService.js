/**
 * Service to fetch real-time US Treasury Yield data
 * Connects directly to TradingView live scanner for symbols:
 * TVC:US01Y, TVC:US02Y, TVC:US05Y, TVC:US10Y, TVC:US30Y
 */

export const TV_TREASURY_SYMBOLS = {
  US1Y: 'TVC:US01Y',
  US2Y: 'TVC:US02Y',
  US5Y: 'TVC:US05Y',
  US10Y: 'TVC:US10Y',
  US30Y: 'TVC:US30Y',
};

export const TV_TREASURY_LINKS = {
  US1Y: 'https://www.tradingview.com/symbols/TVC-US01Y/',
  US2Y: 'https://www.tradingview.com/symbols/TVC-US02Y/',
  US5Y: 'https://www.tradingview.com/symbols/TVC-US05Y/',
  US10Y: 'https://www.tradingview.com/symbols/TVC-US10Y/',
  US30Y: 'https://www.tradingview.com/symbols/TVC-US30Y/',
};

export const fetchLiveTreasuryRates = async () => {
  try {
    const res = await fetch('https://scanner.tradingview.com/global/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbols: {
          tickers: [
            'TVC:US01Y',
            'TVC:US02Y',
            'TVC:US05Y',
            'TVC:US10Y',
            'TVC:US30Y',
          ],
        },
        columns: ['close', 'change', 'change_abs', 'open', 'high', 'low'],
      }),
    });

    if (!res.ok) {
      throw new Error(`TradingView scanner responded with HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json && Array.isArray(json.data)) {
      const live = {};
      const mapping = {
        'TVC:US01Y': 'US1Y',
        'TVC:US02Y': 'US2Y',
        'TVC:US05Y': 'US5Y',
        'TVC:US10Y': 'US10Y',
        'TVC:US30Y': 'US30Y',
      };

      json.data.forEach((item) => {
        const key = mapping[item.s];
        if (key && Array.isArray(item.d)) {
          const close = item.d[0];
          const changePct = item.d[1];
          const changeAbs = item.d[2];
          if (typeof close === 'number') {
            live[key] = {
              cur: close,
              change: changeAbs ?? 0,
              changePct: changePct ?? 0,
              updatedAt: new Date().toLocaleTimeString(),
            };
          }
        }
      });

      return live;
    }
  } catch (err) {
    console.warn('[TreasuryService] Live TradingView fetch failed:', err);
  }

  // Fallback: Yahoo Finance Chart API if scanner is blocked
  try {
    const yahooSymbols = {
      US1Y: '^IRX',
      US5Y: '^FVX',
      US10Y: '^TNX',
      US30Y: '^TYX',
    };
    const live = {};

    await Promise.all(
      Object.entries(yahooSymbols).map(async ([key, ySym]) => {
        try {
          const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySym)}`);
          if (!res.ok) return;
          const json = await res.json();
          const meta = json?.chart?.result?.[0]?.meta;
          if (meta && typeof meta.regularMarketPrice === 'number') {
            const cur = meta.regularMarketPrice;
            const prev = meta.chartPreviousClose || meta.previousClose || cur;
            const change = cur - prev;
            const changePct = prev > 0 ? (change / prev) * 100 : 0;
            live[key] = { cur, change, changePct, updatedAt: new Date().toLocaleTimeString() };
          }
        } catch (e) {}
      })
    );

    if (Object.keys(live).length > 0) {
      return live;
    }
  } catch (e) {
    console.warn('[TreasuryService] Fallback Yahoo fetch failed:', e);
  }

  return null;
};
