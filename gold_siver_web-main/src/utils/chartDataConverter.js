/**
 * Converts data from the standard OHLCV format to a format suitable for TradingViewChart.
 * @param {Array} apexData - Data in format { x: timestamp, y: [o,h,l,c], volume: v }
 * @returns {Array} Data in format { time: timestamp, o, h, l, c, volume }
 */
export const convertApexToTradingView = (apexData) => {
    if (!apexData) return [];
    return apexData.map(d => ({
        time: d.x,
        o: d.y[0],
        h: d.y[1],
        l: d.y[2],
        c: d.y[3],
        volume: d.volume
    }));
};
