/**
 * Chuyển mảng dữ liệu OHLCV từ API sang format ApexCharts
 * @param {Array} dataList - mảng object API
 * @returns {Array} mảng object {x, y, volume}
 */
export const formatCandlestickForApex = (dataList) => {
    return dataList.map(item => ({
        x: new Date(item.timestamp).getTime(),
        y: [
            parseFloat(item.open_price),
            parseFloat(item.high_price),
            parseFloat(item.low_price),
            parseFloat(item.close_price),
        ],
        volume: item.volume ? parseFloat(item.volume) : 0
    }));
};
