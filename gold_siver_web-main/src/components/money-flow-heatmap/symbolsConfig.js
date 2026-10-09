// symbolsConfig.js — Đầy đủ tất cả mã từ cophieu.json, map sang Yahoo Finance format

const s = (sym, w = 1) => ({ symbol: sym, weight: w });
const arr = (syms, w = 1) => syms.map(sym => s(sym, w));
const sectorColors = [
  "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#14b8a6", "#06b6d4",
  "#84cc16", "#a855f7", "#f97316", "#64748b", "#3b82f6", "#ec4899"
];

const GROUP_LABELS = {
  Agriculture_Fisheries: "N\u00f4ng l\u00e2m th\u1ee7y s\u1ea3n",
  Mining: "Khai kho\u00e1ng",
  Construction: "X\u00e2y d\u1ef1ng",
  Foods: "Th\u1ef1c ph\u1ea9m",
  Textiles_Apparel: "D\u1ec7t may",
  Pulp_Paper: "Gi\u1ea5y",
  Chemicals: "H\u00f3a ch\u1ea5t",
  Pharmaceuticals: "D\u01b0\u1ee3c ph\u1ea9m",
  Oil_Coal: "D\u1ea7u kh\u00ed & than",
  Rubber_Products: "Cao su",
  Glass_Ceramics: "K\u00ednh & g\u1ed1m s\u1ee9",
  Steel: "Th\u00e9p",
  NonFerrous_Metals: "Kim lo\u1ea1i m\u00e0u",
  Metal_Products: "S\u1ea3n ph\u1ea9m kim lo\u1ea1i",
  Machinery: "M\u00e1y m\u00f3c",
  Electric_Equipment: "Thi\u1ebft b\u1ecb \u0111i\u1ec7n",
  Transportation_Equipment: "Thi\u1ebft b\u1ecb v\u1eadn t\u1ea3i",
  Precision_Instruments: "Thi\u1ebft b\u1ecb ch\u00ednh x\u00e1c",
  Other_Products: "S\u1ea3n ph\u1ea9m kh\u00e1c",
  Electric_Gas: "\u0110i\u1ec7n & gas",
  Land_Transport: "V\u1eadn t\u1ea3i \u0111\u01b0\u1eddng b\u1ed9",
  Marine_Transport: "V\u1eadn t\u1ea3i bi\u1ec3n",
  Air_Transport: "H\u00e0ng kh\u00f4ng",
  Warehousing_Logistics: "Kho v\u1eadn",
  Information_Communication: "CNTT & vi\u1ec5n th\u00f4ng",
  Wholesale_Trading: "B\u00e1n bu\u00f4n",
  Retail: "B\u00e1n l\u1ebb",
  Banks: "Ng\u00e2n h\u00e0ng",
  Securities: "Ch\u1ee9ng kho\u00e1n",
  Insurance: "B\u1ea3o hi\u1ec3m",
  Other_Financing: "T\u00e0i ch\u00ednh kh\u00e1c",
  Real_Estate: "B\u1ea5t \u0111\u1ed9ng s\u1ea3n",
  Services: "D\u1ecbch v\u1ee5",
  AI_Semiconductor: "AI & b\u00e1n d\u1eabn",
  Japan_Big_Tech: "Big Tech Nh\u1eadt",
  Energy: "N\u0103ng l\u01b0\u1ee3ng",
  Robotics_Automation: "Robot & t\u1ef1 \u0111\u1ed9ng h\u00f3a",
  DataCenter_AI_Infrastructure: "H\u1ea1 t\u1ea7ng AI & data center",
  Japan_Mag7: "Nh\u1eadt Mag7",
  Semiconductors_AI: "B\u00e1n d\u1eabn & AI",
  Big_Tech_Internet: "Big Tech & Internet",
  Electronics: "\u0110i\u1ec7n t\u1eed",
  Automobiles: "\u00d4 t\u00f4",
  EV_Batteries: "Xe \u0111i\u1ec7n & pin",
  Steel_Materials: "Th\u00e9p & v\u1eadt li\u1ec7u",
  Shipbuilding: "\u0110\u00f3ng t\u00e0u",
  Energy_Oil_Gas: "N\u0103ng l\u01b0\u1ee3ng & d\u1ea7u kh\u00ed",
  Utilities: "Ti\u1ec7n \u00edch",
  Telecom: "Vi\u1ec5n th\u00f4ng",
  Financials: "T\u00e0i ch\u00ednh",
  Retail_Ecommerce: "B\u00e1n l\u1ebb & TM\u0110T",
  Consumer_Brands: "Th\u01b0\u01a1ng hi\u1ec7u ti\u00eau d\u00f9ng",
  Food_Beverage: "Th\u1ef1c ph\u1ea9m & \u0111\u1ed3 u\u1ed1ng",
  Healthcare_Biotech: "Y t\u1ebf & c\u00f4ng ngh\u1ec7 sinh h\u1ecdc",
  Gaming: "Game",
  Entertainment_KPOP: "Gi\u1ea3i tr\u00ed & KPOP",
  Real_Estate_REIT: "B\u0110S & REIT",
  Transportation_Logistics: "V\u1eadn t\u1ea3i & logistics",
  Airlines: "H\u00e0ng kh\u00f4ng",
  Defense_Aerospace: "Qu\u1ed1c ph\u00f2ng & h\u00e0ng kh\u00f4ng v\u0169 tr\u1ee5",
  Korea_Mag7: "H\u00e0n Qu\u1ed1c Mag7",
  China_Indices: "Ch\u1ec9 s\u1ed1 Trung Qu\u1ed1c",
  China_Big_Tech: "Big Tech Trung Qu\u1ed1c",
  EV_Auto: "Xe \u0111i\u1ec7n & \u00f4 t\u00f4",
  Banks_Insurance: "Ng\u00e2n h\u00e0ng & b\u1ea3o hi\u1ec3m",
  Energy_Materials: "N\u0103ng l\u01b0\u1ee3ng & v\u1eadt li\u1ec7u",
  Consumer_Retail: "Ti\u00eau d\u00f9ng & b\u00e1n l\u1ebb",
};

const prettyGroupName = (name) => GROUP_LABELS[name] || name.replace(/_/g, " ");
const groupedHeatmapData = (name, groups) => ({
  name,
  children: Object.entries(groups).map(([groupName, symbols], index) => {
    const label = prettyGroupName(groupName);
    return {
      name: label,
      color: sectorColors[index % sectorColors.length],
      children: [
        { name: label, children: arr(symbols, 1) },
      ],
    };
  }),
});

export const commodityHeatmapData = {
  name: "H\u00e0ng h\u00f3a",
  children: [
    {
      name: "Kim lo\u1ea1i qu\u00fd",
      color: "#f59e0b",
      children: [
        { name: "Gold", children: [s("GC=F", 2.8), s("MGC=F", 1.1)] },
        { name: "Silver", children: [s("SI=F", 2.4), s("SIL=F", 1.1)] },
        { name: "Platinum Group", children: [s("PL=F", 1.5), s("PA=F", 1.4)] },
      ],
    },
    {
      name: "Kim lo\u1ea1i c\u00f4ng nghi\u1ec7p",
      color: "#14b8a6",
      children: [
        { name: "Copper", children: [s("HG=F", 2.2), s("MHG=F", 1.1)] },
        { name: "Metals ETF", children: [s("DBB", 1.2), s("CPER", 1.1), s("PICK", 1.0)] },
      ],
    },
    {
      name: "N\u0103ng l\u01b0\u1ee3ng",
      color: "#ef4444",
      children: [
        { name: "Crude Oil", children: [s("CL=F", 2.4), s("MCL=F", 1.1), s("BZ=F", 1.7)] },
        { name: "Natural Gas", children: [s("NG=F", 1.8)] },
        { name: "Fuel", children: [s("RB=F", 1.3), s("HO=F", 1.3)] },
      ],
    },
    {
      name: "Ng\u0169 c\u1ed1c",
      color: "#84cc16",
      children: [
        { name: "Soy", children: [s("ZS=F", 1.6), s("ZL=F", 1.2), s("ZM=F", 1.2)] },
        { name: "Corn", children: [s("ZC=F", 1.5)] },
        { name: "Wheat", children: [s("ZW=F", 1.4), s("KE=F", 1.1)] },
        { name: "Rice & Oats", children: [s("ZR=F", 1.0), s("ZO=F", 1.0)] },
      ],
    },
    {
      name: "Softs",
      color: "#a855f7",
      children: [
        { name: "Coffee", children: [s("KC=F", 1.6)] },
        { name: "Cocoa", children: [s("CC=F", 1.5)] },
        { name: "Cotton", children: [s("CT=F", 1.2)] },
        { name: "Sugar", children: [s("SB=F", 1.3)] },
        { name: "Orange Juice", children: [s("OJ=F", 1.1)] },
      ],
    },
    {
      name: "Ch\u0103n nu\u00f4i",
      color: "#f97316",
      children: [
        { name: "Cattle", children: [s("LE=F", 1.4), s("GF=F", 1.1)] },
        { name: "Hogs", children: [s("HE=F", 1.2)] },
      ],
    },
  ],
};

const japanStockGroups = {
  Agriculture_Fisheries: ["1332.T", "1333.T", "1377.T"],
  Mining: ["1605.T", "1662.T", "1518.T"],
  Construction: ["1801.T", "1812.T", "1802.T", "1803.T"],
  Foods: ["2502.T", "2802.T", "2801.T", "2871.T"],
  Textiles_Apparel: ["3402.T", "3401.T", "3105.T"],
  Pulp_Paper: ["3861.T", "3863.T", "3880.T"],
  Chemicals: ["4063.T", "4005.T", "4188.T", "4452.T", "4901.T"],
  Pharmaceuticals: ["4502.T", "4519.T", "4568.T", "4523.T"],
  Oil_Coal: ["1605.T", "1662.T", "5019.T", "5020.T", "5021.T"],
  Rubber_Products: ["5108.T", "5110.T", "5101.T"],
  Glass_Ceramics: ["5201.T", "5332.T", "5214.T", "5333.T"],
  Steel: ["5401.T", "5411.T", "5406.T"],
  NonFerrous_Metals: ["5713.T", "5706.T", "5802.T"],
  Metal_Products: ["5929.T", "5938.T", "5947.T"],
  Machinery: ["6301.T", "6305.T", "6367.T", "6954.T", "7011.T"],
  Electric_Equipment: ["6501.T", "6503.T", "6758.T", "6701.T", "6702.T"],
  Transportation_Equipment: ["7203.T", "7267.T", "7201.T", "7269.T", "7270.T"],
  Precision_Instruments: ["7741.T", "7733.T", "7735.T", "7762.T"],
  Other_Products: ["7912.T", "7832.T", "7951.T", "7974.T"],
  Electric_Gas: ["9501.T", "9502.T", "9503.T", "9531.T", "9532.T"],
  Land_Transport: ["9020.T", "9022.T", "9021.T", "9005.T"],
  Marine_Transport: ["9101.T", "9104.T", "9107.T"],
  Air_Transport: ["9201.T", "9202.T"],
  Warehousing_Logistics: ["9064.T", "9301.T", "9364.T"],
  Information_Communication: ["9432.T", "9433.T", "9984.T", "4689.T", "4755.T"],
  Wholesale_Trading: ["8001.T", "8002.T", "8015.T", "8053.T", "8058.T"],
  Retail: ["9983.T", "3382.T", "3092.T", "8267.T"],
  Banks: ["8306.T", "8316.T", "8411.T", "8308.T"],
  Securities: ["8604.T", "8601.T", "8616.T"],
  Insurance: ["8766.T", "8750.T", "8630.T"],
  Other_Financing: ["8591.T", "8585.T", "8253.T"],
  Real_Estate: ["8801.T", "8802.T", "8830.T", "3289.T"],
  Services: ["6098.T", "4661.T", "2413.T", "9735.T"],
  AI_Semiconductor: ["8035.T", "6857.T", "6920.T", "6526.T", "6146.T", "4063.T", "6954.T", "6861.T"],
  Japan_Big_Tech: ["9984.T", "9432.T", "4689.T", "6758.T", "6501.T", "6701.T", "6702.T", "4755.T", "4385.T"],
  Energy: ["1605.T", "1662.T", "5019.T", "5020.T", "5021.T", "9513.T", "9501.T", "9502.T", "9503.T", "9531.T", "9532.T"],
  Robotics_Automation: ["6954.T", "6861.T", "6506.T", "6273.T", "6141.T"],
  DataCenter_AI_Infrastructure: ["9984.T", "9432.T", "6501.T", "6701.T"],
  Japan_Mag7: ["9984.T", "8035.T", "6857.T", "6758.T", "6501.T", "8306.T", "7203.T"],
};

const koreaStockGroups = {
  Semiconductors_AI: ["005930.KS", "000660.KS", "042700.KS", "036200.KQ", "058470.KQ"],
  Big_Tech_Internet: ["035420.KS", "035720.KS", "251270.KS", "323410.KS", "377300.KS"],
  Electronics: ["005930.KS", "066570.KS", "009150.KS", "267260.KS"],
  Automobiles: ["005380.KS", "000270.KS", "012330.KS", "161390.KS"],
  EV_Batteries: ["373220.KS", "006400.KS", "051910.KS", "096770.KS", "247540.KQ"],
  Chemicals: ["051910.KS", "011170.KS", "298020.KS", "009830.KS"],
  Steel_Materials: ["005490.KS", "004020.KS", "010130.KS", "001430.KS"],
  Shipbuilding: ["329180.KS", "009540.KS", "010140.KS", "042660.KS"],
  Energy_Oil_Gas: ["096770.KS", "267250.KS", "078930.KS", "015760.KS"],
  Utilities: ["015760.KS", "017670.KS", "071320.KS"],
  Telecom: ["017670.KS", "030200.KS", "032640.KS"],
  Banks: ["105560.KS", "055550.KS", "316140.KS", "138930.KS"],
  Financials: ["086790.KS", "024110.KS", "282330.KS", "003550.KS"],
  Insurance: ["032830.KS", "000810.KS", "316140.KS"],
  Retail_Ecommerce: ["139480.KS", "023530.KS", "282330.KS", "383220.KS"],
  Consumer_Brands: ["051900.KS", "090430.KS", "161890.KS", "005387.KS"],
  Food_Beverage: ["097950.KS", "271560.KS", "280360.KS", "001800.KS"],
  Healthcare_Biotech: ["068270.KS", "207940.KS", "326030.KS", "196170.KQ", "145020.KQ"],
  Pharmaceuticals: ["128940.KS", "069620.KS", "000100.KS", "326030.KS"],
  Gaming: ["036570.KS", "251270.KS", "112040.KQ", "263750.KQ"],
  Entertainment_KPOP: ["352820.KS", "041510.KQ", "122870.KQ", "035900.KQ"],
  Construction: ["000720.KS", "028260.KS", "047040.KS", "006360.KS"],
  Real_Estate_REIT: ["365550.KS", "330590.KS", "348950.KS"],
  Transportation_Logistics: ["003490.KS", "086280.KS", "180640.KS", "272450.KS"],
  Airlines: ["003490.KS", "020560.KS", "272450.KS"],
  Defense_Aerospace: ["047810.KS", "012450.KS", "272210.KS", "079550.KQ"],
  Robotics_Automation: ["454910.KS", "108490.KQ", "064350.KQ"],
  DataCenter_AI_Infrastructure: ["005930.KS", "000660.KS", "035420.KS", "017670.KS", "030200.KS"],
  Korea_Mag7: ["005930.KS", "000660.KS", "373220.KS", "035420.KS", "005380.KS", "068270.KS", "207940.KS"],
};

const chinaStockGroups = {
  China_Indices: ["000001.SS", "399001.SZ", "^HSI", "^HSCE"],
  China_Big_Tech: ["BABA", "JD", "PDD", "BIDU", "TCEHY", "NTES", "TCOM"],
  EV_Auto: ["BYDDY", "NIO", "LI", "XPEV", "9866.HK", "2015.HK"],
  Banks_Insurance: ["1398.HK", "3988.HK", "0939.HK", "2318.HK", "2628.HK"],
  Energy_Materials: ["0857.HK", "0883.HK", "1088.HK", "2899.HK", "1772.HK"],
  Consumer_Retail: ["3690.HK", "9618.HK", "9988.HK", "2319.HK", "2331.HK"],
};

export const japanStocksHeatmapData = groupedHeatmapData("C\u1ed5 phi\u1ebfu Nh\u1eadt", japanStockGroups);
export const koreaStocksHeatmapData = groupedHeatmapData("C\u1ed5 phi\u1ebfu H\u00e0n", koreaStockGroups);
export const chinaStocksHeatmapData = groupedHeatmapData("C\u1ed5 phi\u1ebfu Trung Qu\u1ed1c", chinaStockGroups);

export const heatmapData = {
  name: "Thị Trường Toàn Cầu",
  children: [

    // ===== 1. AI & TECH =====
    {
      name: "AI Tech",
      color: "#8b5cf6",
      children: [
        { name: "Big Tech AI", children: arr(["NVDA", "META", "GOOGL", "MSFT", "AMZN"], 2.5) },
        { name: "Chip & Semi", children: arr(["TSM", "ASML", "INTC", "AMD", "AMAT"], 2.0) },
        { name: "Data Center", children: arr(["DELL", "HPQ", "CSCO", "QCOM", "INTU"], 1.5) },
        { name: "AI Software", children: arr(["ADBE", "CRM", "ORCL", "SAP", "NOW", "PLTR", "SNOW"], 1.3) },
        { name: "AI Auto", children: arr(["TSLA", "GM", "F", "NIO", "LI", "RIVN"], 1.2) },
        { name: "AI Healthcare", children: arr(["UNH", "JNJ", "PFE", "MRK", "ABT"], 1.3) },
        { name: "AI Retail", children: arr(["BABA", "WMT", "COST", "HD"], 1.2) },
        { name: "Semi Mfg", children: arr(["TXN", "ADI"], 1.2) },
      ]
    },

    // ===== 2. TÀI CHÍNH & BẢO HIỂM =====
    {
      name: "Tài chính & BH",
      color: "#10b981",
      children: [
        { name: "Big Banks", children: arr(["JPM", "BAC", "WFC", "C", "USB"], 2.0) },
        { name: "Investment", children: arr(["GS", "MS", "BLK", "SCHW", "TROW", "BK"], 1.8) },
        { name: "Payment", children: arr(["V", "MA", "AXP", "PYPL"], 1.8) },
        { name: "P&C Insurance", children: arr(["PGR", "CB", "TRV", "ALL"], 1.3) },
        { name: "Life Insurance", children: arr(["MET", "PRU", "AFL"], 1.2) },
        { name: "Diversified Ins", children: arr(["AIG", "HIG"], 1.1) },
        { name: "Ins Brokers", children: arr(["AON", "AJG"], 1.1) },
        { name: "Fin ETF", children: arr(["XLF", "VFH", "IAK", "KIE"], 1.0) },
      ]
    },

    // ===== 3. BẤT ĐỘNG SẢN MỸ =====
    {
      name: "Bất động sản Mỹ",
      color: "#f59e0b",
      children: [
        { name: "Industrial REIT", children: arr(["PLD"], 1.5) },
        { name: "Retail REIT", children: arr(["SPG", "O", "FRT", "KIM"], 1.3) },
        { name: "Residential REIT", children: arr(["AVB", "EQR", "MAA", "ESS"], 1.2) },
        { name: "Office REIT", children: arr(["BXP", "VNO", "SLG"], 1.1) },
        { name: "Hotel REIT", children: arr(["MAR", "HST", "PK"], 1.1) },
        { name: "Data Center REIT", children: arr(["EQIX", "DLR"], 1.4) },
        { name: "Healthcare REIT", children: arr(["WELL", "VTR", "OHI"], 1.2) },
        { name: "Storage REIT", children: arr(["PSA", "EXR"], 1.2) },
        { name: "Diversified REIT", children: arr(["ARE", "LXP"], 1.1) },
        { name: "RE Services", children: arr(["CBRE", "JLL", "Z"], 1.1) },
        { name: "Homebuilders", children: arr(["DHI", "LEN", "PHM", "NVR", "TOL"], 1.2) },
        { name: "Mortgage REIT", children: arr(["NLY", "AGNC", "STWD"], 1.0) },
        { name: "RE ETF", children: arr(["VNQ", "IYR", "XLRE"], 1.0) },
      ]
    },

    // ===== 4. NĂNG LƯỢNG =====
    {
      name: "Năng lượng",
      color: "#ef4444",
      children: [
        { name: "Oil Integrated", children: arr(["XOM", "CVX", "BP", "SHEL"], 2.0) },
        { name: "E&P Upstream", children: arr(["COP", "EOG", "DVN"], 1.5) },
        { name: "Oilfield Svc", children: arr(["SLB", "HAL", "BKR"], 1.3) },
        { name: "Midstream", children: arr(["KMI", "WMB", "EPD", "MPC"], 1.2) },
        { name: "Refining", children: arr(["VLO", "PSX"], 1.2) },
        { name: "LNG & Gas", children: arr(["LNG", "EQT"], 1.2) },
        { name: "Renewable", children: arr(["NEE", "ENPH", "FSLR"], 1.3) },
        { name: "Nuclear", children: arr(["CCJ"], 1.1) },
        { name: "Energy ETF", children: arr(["XLE", "VDE", "OIH"], 1.0) },
      ]
    },

    // ===== 5. SẢN XUẤT CÔNG NGHIỆP =====
    {
      name: "Sản xuất CN",
      color: "#84cc16",
      children: [
        { name: "Aerospace", children: arr(["BA", "LMT", "RTX", "NOC", "GD"], 1.5) },
        { name: "Machinery", children: arr(["CAT", "DE", "ITW", "ETN"], 1.4) },
        { name: "Electrical", children: arr(["GE", "HON", "EMR", "ROK", "AME"], 1.3) },
        { name: "Auto Mfg", children: arr(["RIVN"], 1.1) },
        { name: "Chemicals", children: arr(["LIN", "APD", "SHW", "DOW"], 1.2) },
        { name: "Metals Mining", children: arr(["NUE", "FCX", "AA", "CLF"], 1.2) },
        { name: "Construction", children: arr(["VMC", "MLM"], 1.1) },
        { name: "Conglomerates", children: arr(["MMM"], 1.1) },
        { name: "Industrial ETF", children: arr(["XLI", "VIS", "ITA"], 1.0) },
      ]
    },

    // ===== 6. THỊ TRƯỜNG COIN =====
    {
      name: "Thị trường Coin",
      color: "#6366f1",
      children: [
        { name: "Layer 1", children: arr(["BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "ADA-USD", "AVAX-USD", "DOT-USD"], 2.5) },
        { name: "Layer 2", children: arr(["MATIC-USD", "ARB11841-USD", "OP-USD"], 1.5) },
        { name: "DeFi", children: arr(["AAVE-USD", "LINK-USD", "MKR-USD"], 1.3) },
        { name: "AI Crypto", children: arr(["FET-USD", "RNDR-USD"], 1.2) },
        { name: "Gaming", children: arr(["AXS-USD", "SAND-USD", "MANA-USD", "GALA-USD"], 1.1) },
        { name: "Storage", children: arr(["FIL-USD"], 1.1) },
        { name: "Meme", children: arr(["DOGE-USD", "SHIB-USD", "PEPE24478-USD", "WIF-USD"], 1.0) },
      ]
    },

    // ===== 7. KIM LOẠI & MỎ =====
    {
      name: "Kim loại & Mỏ",
      color: "#14b8a6",
      children: [
        { name: "Spot/Futures", children: [s("GC=F", 2.5), s("SI=F", 2.0), s("HG=F", 1.5), s("PL=F", 1.2)] },
        { name: "Gold ETF", children: arr(["GLD", "IAU", "SGOL"], 1.5) },
        { name: "Silver ETF", children: arr(["SLV", "SIVR"], 1.3) },
        { name: "Copper ETF", children: arr(["CPER", "COPX"], 1.2) },
        { name: "Broad Metals", children: arr(["DBB", "PICK", "PPLT"], 1.1) },
        { name: "Gold Miners", children: arr(["NEM", "GOLD", "AEM", "KGC"], 1.5) },
        { name: "Silver Miners", children: arr(["PAAS", "WPM", "HL"], 1.2) },
        { name: "Diversified", children: arr(["BHP", "RIO", "VALE", "FCX", "SCCO"], 1.5) },
        { name: "Mining ETF", children: arr(["GDX", "GDXJ", "SIL", "SILJ"], 1.2) },
      ]
    },

    // ===== 8. VN STOCKS =====
    {
      name: "VN Stocks",
      color: "#dc2626",
      children: [
        { name: "Bank & Vin", children: ["VCB.HM", "BID.HM", "VIC.HM", "VHM.HM"].map(s => ({ symbol: s, weight: 1.8 })) },
        { name: "Sản xuất & CK", children: ["HPG.HM", "VNM.HM", "SSI.HM", "VND.HM"].map(s => ({ symbol: s, weight: 1.5 })) }
      ]
    },

    // ===== 9. LÃI SUẤT & TIỀN TỆ =====
    {
      name: "Lãi suất & Tiền tệ",
      color: "#6b7280",
      children: [
        { name: "US Bonds", children: [s("^IRX", 1.2), s("^FVX", 1.3), s("^TNX", 1.5), s("^TYX", 1.4)] },
        { name: "DXY", children: [s("DX-Y.NYB", 1.5)] },
        { name: "Major FX", children: arr(["EURUSD=X", "USDJPY=X", "GBPUSD=X", "USDCHF=X", "USDCAD=X", "AUDUSD=X", "NZDUSD=X"], 1.2) },
        { name: "Asia FX", children: arr(["USDCNH=X", "USDKRW=X", "USDINR=X", "USDSGD=X"], 1.1) },
        { name: "EM FX", children: arr(["USDBRL=X", "USDZAR=X", "USDTRY=X", "USDMXN=X"], 1.1) },
      ]
    }
  ],
  // Nhóm ẩn để subscribe cho Ticker (Mining Stocks)
  miningSymbols: [
    'SILV.L', 'IAUP.L', 'AUCO.L', 'UBUD.DE', 'GDX.L', 'ESGO.L', 'M9SD.DE', 'GDXJ.L', 'WMIN.DE'
  ],
  stockSymbols: [
    'SPY', '^VNINDEX.VN', '^N225', '^KS11', '000001.SS', '^STOXX50E', '^TWII', '^NSEI', '^STI', '^JKSE', 'TASE.TA', '^XDB'
  ],
  etfSymbols: [
    'GLD', 'SLV', 'GDX', 'GDXJ', 'SIL', 'SILJ', 'IAU', 'PPLT', 'PALL'
  ]
};

export const heatmapTabs = [
  { id: "overview", label: "T\u1ed5ng quan", icon: "ALL", data: heatmapData },
  { id: "commodities", label: "H\u00e0ng h\u00f3a", icon: "CMD", data: commodityHeatmapData },
  { id: "japan-stocks", label: "C\u1ed5 phi\u1ebfu Nh\u1eadt", icon: "JP", data: japanStocksHeatmapData },
  { id: "korea-stocks", label: "C\u1ed5 phi\u1ebfu H\u00e0n", icon: "KR", data: koreaStocksHeatmapData },
  { id: "china-stocks", label: "Trung Qu\u1ed1c", icon: "CN", data: chinaStocksHeatmapData },
];

export const allHeatmapData = {
  name: "Tat ca nhom tai san",
  children: [
    ...heatmapData.children,
    ...commodityHeatmapData.children,
    ...japanStocksHeatmapData.children,
    ...koreaStocksHeatmapData.children,
    ...chinaStocksHeatmapData.children,
  ],
  miningSymbols: heatmapData.miningSymbols,
  stockSymbols: heatmapData.stockSymbols,
  etfSymbols: heatmapData.etfSymbols,
};
