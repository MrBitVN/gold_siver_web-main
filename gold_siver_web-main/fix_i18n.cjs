const fs = require('fs');
let code = fs.readFileSync('src/config/i18n.js', 'utf8');

let lines = code.split('\n');
let startDel = -1;
let endDel = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('MoneyFlowHeatmap: {') && i < 20) {
    startDel = i;
  }
  if (startDel !== -1 && lines[i].includes("info: 'Thông tin mã cổ phiếu'")) {
    endDel = i + 1;
    break;
  }
}

if (startDel !== -1 && endDel !== -1) {
  lines.splice(startDel, endDel - startDel + 1);
}

code = lines.join('\n');

const viAdd = `
        volume: "Khối lượng",
        open: "Mở cửa",
        high: "Cao nhất",
        low: "Thấp nhất",
        info: "Thông tin mã cổ phiếu",
        companyIntro: "Giới thiệu công ty",
        compare: "So sánh:",
        compare1D: "So với hôm qua",
        compare5D: "So với 5 ngày trước",
        compare1M: "So với 1 tháng trước",
        compare3M: "So với 3 tháng trước",
        compare6M: "So với 6 tháng trước",
        compare1Y: "So với 1 năm trước",
        aiSummaryXLE: "XLE là Energy Select Sector SPDR Fund, một quỹ ETF theo dõi chỉ số Energy Select Sector Index. Quỹ này đầu tư vào các công ty trong lĩnh vực dầu khí, khí đốt và nhiên liệu tiêu dùng, cũng như thiết bị và dịch vụ năng lượng.",
        aiSummaryDefault: "Cổ phiếu/Tài sản {{longName}} ({{symbol}}) thuộc lĩnh vực {{sector}}. Đây là một trong những mã quan trọng trong rổ chỉ số market, đang có xu hướng {{trend}} trong phiên giao dịch hiện tại.",
        positiveTrend: "tích cực",
        negativeTrend: "điều chỉnh",`;

const enAdd = `
        volume: "Volume",
        open: "Open",
        high: "High",
        low: "Low",
        info: "Stock Information",
        companyIntro: "Company Introduction",
        compare: "Compare:",
        compare1D: "1D Ago",
        compare5D: "5D Ago",
        compare1M: "1M Ago",
        compare3M: "3M Ago",
        compare6M: "6M Ago",
        compare1Y: "1Y Ago",
        aiSummaryXLE: "XLE is the Energy Select Sector SPDR Fund, an ETF tracking the Energy Select Sector Index. It invests in oil, gas, consumable fuels, and energy equipment & services companies.",
        aiSummaryDefault: "The asset {{longName}} ({{symbol}}) is in the {{sector}} sector. It is a key constituent of the market index and is currently trending {{trend}} in this session.",
        positiveTrend: "positively",
        negativeTrend: "downward",`;

let occur = 0;
code = code.replace(/MoneyFlowHeatmap: \{/g, (match) => {
  occur++;
  if (occur === 1) { // vi block
    return match + viAdd;
  }
  if (occur === 2) { // ko or en block
    return match + enAdd;
  }
  return match;
});

fs.writeFileSync('src/config/i18n.js', code);
console.log('Fixed i18n successfully');
