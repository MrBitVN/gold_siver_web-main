const ETF_MAP = {
    "vaneck-sandp-global-mining-ucits-etf-a": {
        name: "VanEck S&P Global Mining UCITS ETF A",
        slug: "vaneck-sandp-global-mining-ucits-etf-a",
        description: [
            "Quỹ ETF VanEck S&P Global Mining UCITS ETF A hướng đến mục tiêu theo dõi chỉ số S&P Global Mining. Chỉ số này theo dõi các công ty khai thác và kim loại lớn nhất trên toàn thế giới, bao gồm cả vàng, bạc, đồng, sắt và các kim loại quý khác.",
            "Tỷ lệ chi phí quản lý (TER) của quỹ ETF này là 0,50% mỗi năm. VanEck S&P Global Mining UCITS ETF A là quỹ ETF đa dạng trong ngành khai thác toàn cầu. Quỹ ETF này mô phỏng hiệu suất của chỉ số cơ sở bằng cách sao chép hoàn toàn. Cổ tức trong quỹ ETF được phân phối hàng quý.",
            "Quỹ ETF VanEck S&P Global Mining UCITS ETF A là một quỹ ETF có quy mô lớn với tổng tài sản quản lý khoảng 3.456 triệu Euro. Quỹ được ra mắt vào ngày 8 tháng 11 năm 2007 và có trụ sở tại Ireland."
        ],
        basics: [
            { key: "Mục lục", value: "S&P Global Mining" },
            { key: "Trọng tâm đầu tư", value: "Cổ phiếu, Toàn cầu, Vật liệu cơ bản, Đa dạng" },
            { key: "Quy mô quỹ", value: "3.456 triệu EUR" },
            { key: "Tỷ lệ chi phí tổng cộng", value: "0,50% mỗi năm" },
            { key: "Sao chép", value: "Vật lý (Sao chép hoàn toàn)" },
            { key: "Cấu trúc pháp lý", value: "ETF" },
            { key: "Rủi ro chiến lược", value: "Chỉ dài hạn" },
            { key: "Tính bền vững", value: "KHÔNG" },
            { key: "Tiền tệ của quỹ", value: "USD" },
            { key: "Rủi ro tiền tệ", value: "Tiền tệ không được phòng ngừa rủi ro" },
            { key: "Biến động 1 năm (tính bằng EUR)", value: "26,78%" },
            { key: "Ngày thành lập / Ngày niêm yết", value: "Ngày 8 tháng 11 năm 2007" },
            { key: "Chính sách phân phối", value: "Phân phối" },
            { key: "Tần suất phân bổ", value: "Hàng quý" },
            { key: "Nơi đặt trụ sở quỹ", value: "Ireland" },
            { key: "Nhà cung cấp quỹ", value: "VanEck" }
        ],
        holdings: {
            summary: {
                top10Weight: 54.23,
                totalHoldings: 89
            },
            topHoldings: [
                { name: "Tập đoàn BHP", weight: 8.90 },
                { name: "Rio Tinto", weight: 7.45 },
                { name: "Vale SA", weight: 6.78 },
                { name: "Tập đoàn Newmont", weight: 5.67 },
                { name: "Công ty Khai thác Mỏ Barrick", weight: 4.89 },
                { name: "Glencore", weight: 4.56 },
                { name: "Công ty Khai thác Mỏ Agnico Eagle", weight: 4.23 },
                { name: "Freeport-McMoRan", weight: 3.89 },
                { name: "Anglo American", weight: 3.67 },
                { name: "Teck Resources", weight: 4.19 }
            ],
            countries: [
                { name: "Úc", weight: 28.45 },
                { name: "Canada", weight: 24.67 },
                { name: "Hoa Kỳ", weight: 18.90 },
                { name: "Brazil", weight: 12.34 },
                { name: "Khác", weight: 15.64 }
            ],
            sectors: [
                { name: "Ngành Khai thác & Kim loại", weight: 78.90 },
                { name: "Năng lượng", weight: 12.34 },
                { name: "Khác", weight: 8.76 }
            ],
            asOfDate: "2025-10-30"
        },
        offers: {
            description: "Tại đây bạn có thể tìm thấy thông tin về các gói tiết kiệm khả dụng của quỹ ETF. Bạn có thể sử dụng bảng để so sánh tất cả các gói tiết kiệm được cung cấp với mức lãi suất tiết kiệm đã chọn.",
            defaultMonthlyAmount: 100,
            currency: "EUR",
            providers: [
                { name: "VanEck", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Scalable Capital", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Trade Republic", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Consorsbank", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null }
            ]
        },
        orderFees: {
            description: "Tại đây, bạn có thể tìm thấy thông tin về các nhà môi giới khác nhau cho phép bạn giao dịch ETF. Chọn khối lượng giao dịch mong muốn để so sánh phí giao dịch của từng nhà môi giới.",
            defaultOrderVolume: 500,
            currency: "EUR",
            providers: [
                { name: "VanEck", rating: 5, orderFee: "0,85€", etfSavingsPlans: 1789, actionLabel: "Xem ưu đãi", note: null },
                { name: "Scalable Capital", rating: 5, orderFee: "0,99€", etfSavingsPlans: 2968, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" },
                { name: "Trade Republic", rating: 5, orderFee: "1,00€", etfSavingsPlans: 2640, actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1881, actionLabel: "Xem ưu đãi", note: null },
                { name: "Smartbroker+", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1617, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" }
            ]
        },
        performance: {
            currency: "EUR",
            summary: [
                { key: "ytd", label: "Từ đầu năm đến nay", value: 98.45 },
                { key: "1m", label: "1 tháng", value: 6.78 },
                { key: "3m", label: "3 tháng", value: 16.89 },
                { key: "6m", label: "6 tháng", value: 38.90 },
                { key: "1y", label: "1 năm", value: 89.67 },
                { key: "3y", label: "3 năm", value: 145.23 },
                { key: "5y", label: "5 năm", value: 123.45 },
                { key: "max", label: "Kể từ khi thành lập (MAX)", value: 67.89 },
                { key: "2024", label: "2024", value: 14.56 },
                { key: "2023", label: "2023", value: 3.45 },
                { key: "2022", label: "2022", value: -9.78 },
                { key: "2021", label: "2021", value: 1.23 }
            ],
            heatmap: {
                months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                data: {
                    2025: [6.5, -1.8, 7.2, -2.9, 4.8, 7.4, -0.3, 16.2, 18.9, -6.1, 12.8, 2.4],
                    2024: [-10.2, -10.8, 16.1, 9.1, 8.8, -9.6, 5.7, -8.3, 5.4, 11.5, -3.9, -9.9],
                    2023: [3.8, -12.2, 10.6, -5.4, -7.4, -6.3, 4.1, -3.9, -8.5, -1.3, 9.2, 1.9],
                    2022: [1.7, -2.4, 4.1, -2.9, 1.3, -3.9, 2.4, -4.7, 1.5, 2.8, -2.1, 2.4],
                    2021: [1.4, -2.7, 3.5, -2.3, 1.9, -3.4, 1.0, -4.2, 2.3, 2.4, -1.5, 1.7]
                }
            },
            scale: { min: -20, max: 20, unit: "%" }
        },
        risk: {
            title: "Tổng quan rủi ro",
            overview: [
                { key: "volatility_1y", label: "Độ biến động 1 năm", value: 26.78, unit: "%" },
                { key: "volatility_3y", label: "Độ biến động 3 năm", value: 23.45, unit: "%" },
                { key: "volatility_5y", label: "Độ biến động 5 năm", value: 24.67, unit: "%" },
                { key: "return_risk_1y", label: "Lợi nhuận trên rủi ro 1 năm", value: 3.35, unit: "" },
                { key: "return_risk_3y", label: "Lợi nhuận trên rủi ro 3 năm", value: 1.32, unit: "" },
                { key: "return_risk_5y", label: "Lợi nhuận trên rủi ro 5 năm", value: 0.67, unit: "" },
                { key: "max_drawdown_1y", label: "Mức sụt giảm tối đa 1 năm", value: -19.78, unit: "%" },
                { key: "max_drawdown_3y", label: "Mức sụt giảm tối đa 3 năm", value: -27.89, unit: "%" },
                { key: "max_drawdown_5y", label: "Mức sụt giảm tối đa 5 năm", value: -41.23, unit: "%" },
                { key: "max_drawdown_since_inception", label: "Mức sụt giảm tối đa kể từ khi thành lập", value: -72.45, unit: "%" }
            ],
            rollingVolatility: {
                title: "Biến động trong 1 năm liên tiếp",
                period: "1 năm",
                unit: "%",
                chartUrl: "public/vite.svg"
            }
        }
    },

    "global-x-silver-miners-ucits-etf": {
        name: "Global X Silver Miners UCITS ETF",
        slug: "global-x-silver-miners-ucits-etf",
        description: ["Quỹ ETF Global X Silver Miners UCITS USD Accumulating hướng đến mục tiêu theo dõi chỉ số Solactive Global Silver Miners. Chỉ số Solactive Global Silver Miners theo dõi các công ty trên toàn thế giới tham gia vào hoạt động thăm dò, khai thác và/hoặc tinh chế bạc.", "Tỷ lệ chi phí tổng cộng ( TER ) của ETF này là 0,65% mỗi năm . Global X Silver Miners UCITS ETF USD Accumulating là ETF duy nhất theo dõi chỉ số Solactive Global Silver Miners. ETF này mô phỏng hiệu suất của chỉ số cơ sở bằng cách sao chép hoàn toàn (mua tất cả các thành phần của chỉ số). Cổ tức trong ETF được tích lũy và tái đầu tư vào ETF.", "Quỹ ETF Global X Silver Miners UCITS USD Accumulating là một quỹ ETF rất lớn với tổng tài sản quản lý lên đến 1.008 triệu Euro . Quỹ ETF này được ra mắt vào ngày 4 tháng 5 năm 2022 và có trụ sở tại Ireland ."],
        basics: [
            {
                key: "Mục lục",
                value: "Công ty khai thác bạc toàn cầu Solactive"
            },
            {
                key: "Trọng tâm đầu tư",
                value: "Cổ phiếu, Toàn cầu, Vật liệu cơ bản"
            },
            {
                key: "Quy mô quỹ",
                value: "1.014 triệu EUR"
            },
            {
                key: "Tỷ lệ chi phí tổng cộng",
                value: "0,65% mỗi năm"
            },
            {
                key: "Sao chép",
                value: "Vật lý (Sao chép hoàn toàn)"
            },
            {
                key: "Cấu trúc pháp lý",
                value: "ETF"
            },
            {
                key: "Rủi ro chiến lược",
                value: "Chỉ dài hạn"
            },
            {
                key: "Tính bền vững",
                value: "KHÔNG"
            },
            {
                key: "Tiền tệ của quỹ",
                value: "USD"
            },
            {
                key: "Rủi ro tiền tệ",
                value: "Tiền tệ không được phòng ngừa rủi ro"
            },
            {
                key: "Biến động 1 năm (tính bằng EUR)",
                value: "38,09%"
            },
            {
                key: "Ngày thành lập / Ngày niêm yết",
                value: "Ngày 4 tháng 5 năm 2022"
            },
            {
                key: "Chính sách phân phối",
                value: "Tích lũy"
            },
            {
                key: "Tần suất phân bổ",
                value: "-"
            },
            {
                key: "Nơi đặt trụ sở quỹ",
                value: "Ireland"
            },
            {
                key: "Nhà cung cấp quỹ",
                value: "Global X"
            }
        ],

        holdings: {
            summary: {
                top10Weight: 74.88,          // %
                totalHoldings: 32,
            },

            topHoldings: [
                {
                    name: "Tập đoàn Pan American Silver",
                    weight: 12.01,
                },
                {
                    name: "Công ty Khai thác Mỏ Coeur",
                    weight: 11.13,
                },
                {
                    name: "Công ty Kim loại Quý Wheaton",
                    weight: 10.96,
                },
                {
                    name: "Tập đoàn Industrias Peñoles",
                    weight: 7.64,
                },
                {
                    name: "Công ty Khai thác Mỏ Hecla",
                    weight: 7.61,
                },
                {
                    name: "Công ty Kẽm Hàn Quốc",
                    weight: 6.45,
                },
                {
                    name: "Công ty First Majestic Silver",
                    weight: 5.64,
                },
                {
                    name: "Công ty Fresnillo",
                    weight: 5.19,
                },
                {
                    name: "Công ty Khai thác Mỏ SSR",
                    weight: 4.56,
                },
                {
                    name: "Công ty Minas Buenaventura SAA",
                    weight: 3.69,
                },
            ],

            countries: [
                { name: "Canada", weight: 38.62 },
                { name: "Hoa Kỳ", weight: 23.37 },
                { name: "Mexico", weight: 12.83 },
                { name: "Hàn Quốc", weight: 6.45 },
                { name: "Khác", weight: 18.73 },
            ],

            sectors: [
                { name: "Ngành Khai thác & Kim loại", weight: 83.34 },
                { name: "Khác", weight: 16.66 },
            ],

            asOfDate: "2025-10-30",
        },
        offers: {
            description:
                "Tại đây bạn có thể tìm thấy thông tin về các gói tiết kiệm khả dụng của quỹ ETF. Bạn có thể sử dụng bảng để so sánh tất cả các gói tiết kiệm được cung cấp với mức lãi suất tiết kiệm đã chọn.",

            defaultMonthlyAmount: 100,
            currency: "EUR",

            providers: [
                {
                    name: "Scalable Capital",
                    rating: 5, // số sao
                    executionFee: "0,00€",
                    accountFee: "0,00€",
                    actionLabel: "Xem ưu đãi",
                    note: null,
                },
                {
                    name: "FINANZEN.NET ZERO",
                    rating: 5,
                    executionFee: "0,00€",
                    accountFee: "0,00€",
                    actionLabel: "Xem ưu đãi",
                    note: null,
                },
                {
                    name: "Trade Republic",
                    rating: 4.5,
                    executionFee: "0,00€",
                    accountFee: "0,00€",
                    actionLabel: "Xem ưu đãi",
                    note: null,
                },
                {
                    name: "Consorsbank",
                    rating: 4.5,
                    executionFee: "0,00€",
                    accountFee: "0,00€",
                    actionLabel: "Xem ưu đãi",
                    note: null,
                },
                {
                    name: "flatex",
                    rating: 4.5,
                    executionFee: "0,00€",
                    accountFee: "0,00€",
                    actionLabel: "Xem ưu đãi",
                    note: "Có điều kiện áp dụng",
                },
            ],
        },
        orderFees: {
            description:
                "Tại đây, bạn có thể tìm thấy thông tin về các nhà môi giới khác nhau cho phép bạn giao dịch ETF. Chọn khối lượng giao dịch mong muốn để so sánh phí giao dịch của từng nhà môi giới.",

            defaultOrderVolume: 500,
            currency: "EUR",

            providers: [
                {
                    name: "Scalable Capital",
                    rating: 5,
                    orderFee: "0,99€",
                    etfSavingsPlans: 2968,
                    actionLabel: "Xem ưu đãi",
                    note: "Có điều kiện áp dụng",
                },
                {
                    name: "Traders Place",
                    rating: 5,
                    orderFee: "0,00€",
                    etfSavingsPlans: 1523,
                    actionLabel: "Xem ưu đãi",
                    note: null,
                },
                {
                    name: "Trade Republic",
                    rating: 5,
                    orderFee: "1,00€",
                    etfSavingsPlans: 2640,
                    actionLabel: "Xem ưu đãi",
                    note: null,
                },
                {
                    name: "FINANZEN.NET ZERO",
                    rating: 4.5,
                    orderFee: "0,00€",
                    etfSavingsPlans: 1881,
                    actionLabel: "Xem ưu đãi",
                    note: null,
                },
                {
                    name: "Smartbroker+",
                    rating: 4.5,
                    orderFee: "0,00€",
                    etfSavingsPlans: 1617,
                    actionLabel: "Xem ưu đãi",
                    note: "Có điều kiện áp dụng",
                },
            ],
        },
        performance: {
            currency: "EUR",

            summary: [
                { key: "ytd", label: "Từ đầu năm đến nay", value: 131.33 },
                { key: "1m", label: "1 tháng", value: 21.57 },
                { key: "3m", label: "3 tháng", value: 29.27 },
                { key: "6m", label: "6 tháng", value: 68.17 },
                { key: "1y", label: "1 năm", value: 114.94 },
                { key: "3y", label: "3 năm", value: 169.82 },
                { key: "5y", label: "5 năm", value: null },
                { key: "max", label: "Kể từ khi thành lập (MAX)", value: 135.11 },
                { key: "2024", label: "2024", value: 20.57 },
                { key: "2023", label: "2023", value: -3.34 },
                { key: "2022", label: "2022", value: null },
                { key: "2021", label: "2021", value: null }
            ],

            heatmap: {
                months: [
                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                ],
                data: {
                    2025: [8.1, -1.0, 9.1, -2.1, 6.5, 9.1, 1.1, 20.8, 23.4, -4.9, 16.5, 3.8],
                    2024: [-9.2, -9.8, 19.1, 12.1, 11.6, -8.6, 7.6, -7.3, 7.3, 14.2, -2.9, -8.9],
                    2023: [5.4, -10.8, 12.4, -4.4, -6.4, -5.3, 5.7, -2.9, -7.5, -0.3, 10.9, 2.9],
                    2022: [0, 0, 0, 0, -6.9, -12.5, 3.8, -7.6, -4.6, 2.2, 8.5, 3.8]
                }
            },

            scale: {
                min: -25,
                max: 25,
                unit: "%"
            }
        },
        risk: {
            title: "Tổng quan rủi ro",

            overview: [
                {
                    key: "volatility_1y",
                    label: "Độ biến động 1 năm",
                    value: 38.75,
                    unit: "%"
                },
                {
                    key: "volatility_3y",
                    label: "Độ biến động 3 năm",
                    value: 34.38,
                    unit: "%"
                },
                {
                    key: "volatility_5y",
                    label: "Độ biến động 5 năm",
                    value: null,
                    unit: "%"
                },
                {
                    key: "return_risk_1y",
                    label: "Lợi nhuận trên rủi ro 1 năm",
                    value: 3.63,
                    unit: ""
                },
                {
                    key: "return_risk_3y",
                    label: "Lợi nhuận trên rủi ro 3 năm",
                    value: 1.28,
                    unit: ""
                },
                {
                    key: "return_risk_5y",
                    label: "Lợi nhuận trên rủi ro 5 năm",
                    value: null,
                    unit: ""
                },
                {
                    key: "max_drawdown_1y",
                    label: "Mức sụt giảm tối đa 1 năm",
                    value: -22.73,
                    unit: "%"
                },
                {
                    key: "max_drawdown_3y",
                    label: "Mức sụt giảm tối đa 3 năm",
                    value: -31.16,
                    unit: "%"
                },
                {
                    key: "max_drawdown_5y",
                    label: "Mức sụt giảm tối đa 5 năm",
                    value: null,
                    unit: "%"
                },
                {
                    key: "max_drawdown_since_inception",
                    label: "Mức sụt giảm tối đa kể từ khi thành lập",
                    value: -32.10,
                    unit: "%"
                }
            ],

            rollingVolatility: {
                title: "Biến động trong 1 năm liên tiếp",
                period: "1 năm",
                unit: "%",
                chartUrl: "public/bieu-do-global-x-silver.jpg"
            }
        }




    },

    "market-access-nyse-arca-gold-bugs-ucits-etf": {
        name: "Market Access NYSE Arca Gold Bugs UCITS ETF",
        slug: "market-access-nyse-arca-gold-bugs-ucits-etf",
        description: [
            "Quỹ ETF Market Access NYSE Arca Gold Bugs UCITS hướng đến mục tiêu theo dõi chỉ số NYSE Arca Gold BUGS. Chỉ số này theo dõi các công ty khai thác vàng không thực hiện phòng ngừa rủi ro giá vàng trong tương lai, tập trung vào những công ty có tiềm năng tăng trưởng cao nhất khi giá vàng tăng.",
            "Tỷ lệ chi phí quản lý (TER) của quỹ ETF này là 0,65% mỗi năm. Market Access NYSE Arca Gold Bugs UCITS ETF là quỹ ETF chuyên biệt theo dõi các công ty khai thác vàng 'không phòng ngừa rủi ro'. Quỹ ETF này mô phỏng hiệu suất của chỉ số cơ sở bằng cách sao chép hoàn toàn. Cổ tức trong quỹ ETF được tích lũy và tái đầu tư.",
            "Quỹ ETF Market Access NYSE Arca Gold Bugs UCITS là một quỹ ETF có quy mô trung bình với tổng tài sản quản lý khoảng 892 triệu Euro. Quỹ được ra mắt vào ngày 28 tháng 4 năm 2008 và có trụ sở tại Ireland."
        ],
        basics: [
            { key: "Mục lục", value: "NYSE Arca Gold BUGS" },
            { key: "Trọng tâm đầu tư", value: "Cổ phiếu, Toàn cầu, Vật liệu cơ bản" },
            { key: "Quy mô quỹ", value: "892 triệu EUR" },
            { key: "Tỷ lệ chi phí tổng cộng", value: "0,65% mỗi năm" },
            { key: "Sao chép", value: "Vật lý (Sao chép hoàn toàn)" },
            { key: "Cấu trúc pháp lý", value: "ETF" },
            { key: "Rủi ro chiến lược", value: "Chỉ dài hạn" },
            { key: "Tính bền vững", value: "KHÔNG" },
            { key: "Tiền tệ của quỹ", value: "USD" },
            { key: "Rủi ro tiền tệ", value: "Tiền tệ không được phòng ngừa rủi ro" },
            { key: "Biến động 1 năm (tính bằng EUR)", value: "35,67%" },
            { key: "Ngày thành lập / Ngày niêm yết", value: "Ngày 28 tháng 4 năm 2008" },
            { key: "Chính sách phân phối", value: "Tích lũy" },
            { key: "Tần suất phân bổ", value: "-" },
            { key: "Nơi đặt trụ sở quỹ", value: "Ireland" },
            { key: "Nhà cung cấp quỹ", value: "Market Access" }
        ],
        holdings: {
            summary: {
                top10Weight: 73.45,
                totalHoldings: 28
            },
            topHoldings: [
                { name: "Tập đoàn Newmont", weight: 15.23 },
                { name: "Công ty Khai thác Mỏ Barrick", weight: 12.67 },
                { name: "Công ty Khai thác Mỏ Agnico Eagle", weight: 10.45 },
                { name: "Franco-Nevada", weight: 8.89 },
                { name: "Công ty Gold Fields", weight: 7.23 },
                { name: "Anglogold Ashanti", weight: 6.78 },
                { name: "Công ty Kinross Gold", weight: 5.34 },
                { name: "Công ty Tài nguyên Sao Bắc", weight: 3.67 },
                { name: "Công ty Alamos Gold", weight: 2.89 },
                { name: "Công ty B2Gold", weight: 0.30 }
            ],
            countries: [
                { name: "Canada", weight: 48.90 },
                { name: "Hoa Kỳ", weight: 22.67 },
                { name: "Úc", weight: 14.78 },
                { name: "Nam Phi", weight: 8.45 },
                { name: "Khác", weight: 5.20 }
            ],
            sectors: [
                { name: "Ngành Khai thác & Kim loại", weight: 95.67 },
                { name: "Khác", weight: 4.33 }
            ],
            asOfDate: "2025-10-30"
        },
        offers: {
            description: "Tại đây bạn có thể tìm thấy thông tin về các gói tiết kiệm khả dụng của quỹ ETF. Bạn có thể sử dụng bảng để so sánh tất cả các gói tiết kiệm được cung cấp với mức lãi suất tiết kiệm đã chọn.",
            defaultMonthlyAmount: 100,
            currency: "EUR",
            providers: [
                { name: "Scalable Capital", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Trade Republic", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Consorsbank", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "flatex", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" }
            ]
        },
        orderFees: {
            description: "Tại đây, bạn có thể tìm thấy thông tin về các nhà môi giới khác nhau cho phép bạn giao dịch ETF. Chọn khối lượng giao dịch mong muốn để so sánh phí giao dịch của từng nhà môi giới.",
            defaultOrderVolume: 500,
            currency: "EUR",
            providers: [
                { name: "Scalable Capital", rating: 5, orderFee: "0,99€", etfSavingsPlans: 2968, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" },
                { name: "Trade Republic", rating: 5, orderFee: "1,00€", etfSavingsPlans: 2640, actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1881, actionLabel: "Xem ưu đãi", note: null },
                { name: "Smartbroker+", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1617, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" },
                { name: "Traders Place", rating: 5, orderFee: "0,00€", etfSavingsPlans: 1523, actionLabel: "Xem ưu đãi", note: null }
            ]
        },
        performance: {
            currency: "EUR",
            summary: [
                { key: "ytd", label: "Từ đầu năm đến nay", value: 128.90 },
                { key: "1m", label: "1 tháng", value: 12.78 },
                { key: "3m", label: "3 tháng", value: 28.45 },
                { key: "6m", label: "6 tháng", value: 62.34 },
                { key: "1y", label: "1 năm", value: 123.67 },
                { key: "3y", label: "3 năm", value: 201.45 },
                { key: "5y", label: "5 năm", value: 178.90 },
                { key: "max", label: "Kể từ khi thành lập (MAX)", value: 67.89 },
                { key: "2024", label: "2024", value: 23.45 },
                { key: "2023", label: "2023", value: 9.78 },
                { key: "2022", label: "2022", value: -3.45 },
                { key: "2021", label: "2021", value: 0.67 }
            ],
            heatmap: {
                months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                data: {
                    2025: [9.8, -0.2, 10.5, -0.8, 7.9, 10.8, 2.1, 22.8, 26.7, -3.2, 18.9, 5.3],
                    2024: [-7.8, -8.4, 20.8, 13.8, 13.3, -7.2, 9.1, -5.9, 8.8, 16.5, -1.5, -7.5],
                    2023: [6.9, -9.4, 14.1, -2.9, -4.9, -3.8, 6.5, -1.5, -6.1, 1.0, 12.4, 4.4],
                    2022: [2.7, -1.4, 5.1, -1.8, 2.3, -2.9, 3.4, -3.7, 2.5, 3.8, -1.1, 2.9],
                    2021: [2.4, -1.7, 4.5, -1.3, 2.9, -2.4, 1.9, -3.2, 3.3, 3.4, -0.5, 2.3]
                }
            },
            scale: { min: -25, max: 25, unit: "%" }
        },
        risk: {
            title: "Tổng quan rủi ro",
            overview: [
                { key: "volatility_1y", label: "Độ biến động 1 năm", value: 35.67, unit: "%" },
                { key: "volatility_3y", label: "Độ biến động 3 năm", value: 31.23, unit: "%" },
                { key: "volatility_5y", label: "Độ biến động 5 năm", value: 32.45, unit: "%" },
                { key: "return_risk_1y", label: "Lợi nhuận trên rủi ro 1 năm", value: 3.47, unit: "" },
                { key: "return_risk_3y", label: "Lợi nhuận trên rủi ro 3 năm", value: 1.78, unit: "" },
                { key: "return_risk_5y", label: "Lợi nhuận trên rủi ro 5 năm", value: 0.98, unit: "" },
                { key: "max_drawdown_1y", label: "Mức sụt giảm tối đa 1 năm", value: -13.45, unit: "%" },
                { key: "max_drawdown_3y", label: "Mức sụt giảm tối đa 3 năm", value: -19.78, unit: "%" },
                { key: "max_drawdown_5y", label: "Mức sụt giảm tối đa 5 năm", value: -32.67, unit: "%" },
                { key: "max_drawdown_since_inception", label: "Mức sụt giảm tối đa kể từ khi thành lập", value: -81.23, unit: "%" }
            ],
            rollingVolatility: {
                title: "Biến động trong 1 năm liên tiếp",
                period: "1 năm",
                unit: "%",
                chartUrl: "public/z7284465822618_c08e61ba2a0f4605080528caa7c46c54.jpg"
            }
        }
    },

    "ubs-solactive-global-pure-gold-miners-ucits-etf-usd": {
        name: "UBS Solactive Global Pure Gold Miners UCITS ETF USD",
        slug: "ubs-solactive-global-pure-gold-miners-ucits-etf-usd",
        description: [
            "Quỹ ETF UBS Solactive Global Pure Gold Miners UCITS USD hướng đến mục tiêu theo dõi chỉ số Solactive Global Pure Gold Miners. Chỉ số này theo dõi các công ty niêm yết lớn nhất chuyên về hoạt động khai thác vàng thuần túy trên toàn thế giới.",
            "Tỷ lệ chi phí quản lý (TER) của quỹ ETF này là 0,28% mỗi năm. UBS Solactive Global Pure Gold Miners UCITS ETF USD là một trong những quỹ ETF có chi phí thấp nhất theo dõi chỉ số vàng. Quỹ ETF này mô phỏng hiệu suất của chỉ số cơ sở bằng cách sao chép tối ưu hóa. Cổ tức trong quỹ ETF được phân phối hàng quý.",
            "Quỹ ETF UBS Solactive Global Pure Gold Miners UCITS USD là một quỹ ETF có quy mô lớn với tổng tài sản quản lý khoảng 2.156 triệu Euro. Quỹ được ra mắt vào ngày 18 tháng 1 năm 2018 và có trụ sở tại Ireland."
        ],
        basics: [
            { key: "Mục lục", value: "Solactive Global Pure Gold Miners" },
            { key: "Trọng tâm đầu tư", value: "Cổ phiếu, Toàn cầu, Vật liệu cơ bản" },
            { key: "Quy mô quỹ", value: "2.156 triệu EUR" },
            { key: "Tỷ lệ chi phí tổng cộng", value: "0,28% mỗi năm" },
            { key: "Sao chép", value: "Tối ưu hóa (Sao chép một phần)" },
            { key: "Cấu trúc pháp lý", value: "ETF" },
            { key: "Rủi ro chiến lược", value: "Chỉ dài hạn" },
            { key: "Tính bền vững", value: "KHÔNG" },
            { key: "Tiền tệ của quỹ", value: "USD" },
            { key: "Rủi ro tiền tệ", value: "Tiền tệ không được phòng ngừa rủi ro" },
            { key: "Biến động 1 năm (tính bằng EUR)", value: "31,22%" },
            { key: "Ngày thành lập / Ngày niêm yết", value: "Ngày 18 tháng 1 năm 2018" },
            { key: "Chính sách phân phối", value: "Phân phối" },
            { key: "Tần suất phân bổ", value: "Hàng quý" },
            { key: "Nơi đặt trụ sở quỹ", value: "Ireland" },
            { key: "Nhà cung cấp quỹ", value: "UBS" }
        ],
        holdings: {
            summary: {
                top10Weight: 68.92,
                totalHoldings: 45
            },
            topHoldings: [
                { name: "Tập đoàn Newmont", weight: 12.45 },
                { name: "Công ty Khai thác Mỏ Barrick", weight: 10.78 },
                { name: "Công ty Khai thác Mỏ Agnico Eagle", weight: 9.34 },
                { name: "Công ty Kim loại Quý Wheaton", weight: 7.89 },
                { name: "Franco-Nevada", weight: 6.78 },
                { name: "Công ty Gold Fields", weight: 5.92 },
                { name: "Anglogold Ashanti", weight: 5.23 },
                { name: "Công ty Kinross Gold", weight: 4.89 },
                { name: "Tập đoàn Khai thác Mỏ Zijin", weight: 3.12 },
                { name: "Công ty Tài nguyên Sao Bắc", weight: 2.52 }
            ],
            countries: [
                { name: "Canada", weight: 43.78 },
                { name: "Hoa Kỳ", weight: 18.45 },
                { name: "Úc", weight: 12.67 },
                { name: "Trung Quốc", weight: 7.23 },
                { name: "Khác", weight: 17.87 }
            ],
            sectors: [
                { name: "Ngành Khai thác & Kim loại", weight: 89.45 },
                { name: "Khác", weight: 10.55 }
            ],
            asOfDate: "2025-10-30"
        },
        offers: {
            description: "Tại đây bạn có thể tìm thấy thông tin về các gói tiết kiệm khả dụng của quỹ ETF. Bạn có thể sử dụng bảng để so sánh tất cả các gói tiết kiệm được cung cấp với mức lãi suất tiết kiệm đã chọn.",
            defaultMonthlyAmount: 100,
            currency: "EUR",
            providers: [
                { name: "UBS", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Scalable Capital", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Trade Republic", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Consorsbank", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null }
            ]
        },
        orderFees: {
            description: "Tại đây, bạn có thể tìm thấy thông tin về các nhà môi giới khác nhau cho phép bạn giao dịch ETF. Chọn khối lượng giao dịch mong muốn để so sánh phí giao dịch của từng nhà môi giới.",
            defaultOrderVolume: 500,
            currency: "EUR",
            providers: [
                { name: "UBS", rating: 5, orderFee: "0,90€", etfSavingsPlans: 1245, actionLabel: "Xem ưu đãi", note: null },
                { name: "Scalable Capital", rating: 5, orderFee: "0,99€", etfSavingsPlans: 2968, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" },
                { name: "Trade Republic", rating: 5, orderFee: "1,00€", etfSavingsPlans: 2640, actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1881, actionLabel: "Xem ưu đãi", note: null },
                { name: "Smartbroker+", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1617, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" }
            ]
        },
        performance: {
            currency: "EUR",
            summary: [
                { key: "ytd", label: "Từ đầu năm đến nay", value: 122.78 },
                { key: "1m", label: "1 tháng", value: 10.45 },
                { key: "3m", label: "3 tháng", value: 24.67 },
                { key: "6m", label: "6 tháng", value: 55.89 },
                { key: "1y", label: "1 năm", value: 115.23 },
                { key: "3y", label: "3 năm", value: 189.45 },
                { key: "5y", label: "5 năm", value: 156.78 },
                { key: "max", label: "Kể từ khi thành lập (MAX)", value: 98.34 },
                { key: "2024", label: "2024", value: 19.78 },
                { key: "2023", label: "2023", value: 7.45 },
                { key: "2022", label: "2022", value: -5.67 },
                { key: "2021", label: "2021", value: -1.23 }
            ],
            heatmap: {
                months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                data: {
                    2025: [8.5, -0.7, 9.3, -1.5, 6.8, 9.5, 1.3, 20.2, 23.8, -4.2, 16.8, 4.1],
                    2024: [-8.6, -9.2, 19.4, 12.4, 11.9, -8.0, 7.9, -6.7, 7.6, 14.5, -2.3, -8.3],
                    2023: [5.7, -10.2, 12.7, -3.8, -5.8, -4.7, 5.7, -2.3, -6.9, 0.2, 11.2, 3.2],
                    2022: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    2021: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                }
            },
            scale: { min: -25, max: 25, unit: "%" }
        },
        risk: {
            title: "Tổng quan rủi ro",
            overview: [
                { key: "volatility_1y", label: "Độ biến động 1 năm", value: 31.22, unit: "%" },
                { key: "volatility_3y", label: "Độ biến động 3 năm", value: 27.45, unit: "%" },
                { key: "volatility_5y", label: "Độ biến động 5 năm", value: 28.67, unit: "%" },
                { key: "return_risk_1y", label: "Lợi nhuận trên rủi ro 1 năm", value: 3.69, unit: "" },
                { key: "return_risk_3y", label: "Lợi nhuận trên rủi ro 3 năm", value: 1.58, unit: "" },
                { key: "return_risk_5y", label: "Lợi nhuận trên rủi ro 5 năm", value: 0.78, unit: "" },
                { key: "max_drawdown_1y", label: "Mức sụt giảm tối đa 1 năm", value: -15.89, unit: "%" },
                { key: "max_drawdown_3y", label: "Mức sụt giảm tối đa 3 năm", value: -22.45, unit: "%" },
                { key: "max_drawdown_5y", label: "Mức sụt giảm tối đa 5 năm", value: -36.78, unit: "%" },
                { key: "max_drawdown_since_inception", label: "Mức sụt giảm tối đa kể từ khi thành lập", value: -68.45, unit: "%" }
            ],
            rollingVolatility: {
                title: "Biến động trong 1 năm liên tiếp",
                period: "1 năm",
                unit: "%",
                chartUrl: "public/xagxauvolume.jpg"
            }
        }
    },

    "landg-gold-mining-ucits-etf": {
        name: "L&G Gold Mining UCITS ETF",
        slug: "landg-gold-mining-ucits-etf",
        description: [
            "Quỹ ETF L&G Gold Mining UCITS hướng đến mục tiêu theo dõi chỉ số Solactive Gold Miners. Chỉ số này theo dõi các công ty niêm yết lớn nhất tham gia vào hoạt động thăm dò, khai thác và sản xuất vàng trên toàn thế giới.",
            "Tỷ lệ chi phí quản lý (TER) của quỹ ETF này là 0,65% mỗi năm. L&G Gold Mining UCITS ETF là một trong những quỹ ETF theo dõi chỉ số Solactive Gold Miners. Quỹ ETF này mô phỏng hiệu suất của chỉ số cơ sở bằng cách sao chép hoàn toàn các thành phần chỉ số. Cổ tức trong quỹ ETF được tích lũy và tái đầu tư.",
            "Quỹ ETF L&G Gold Mining UCITS là một quỹ ETF có quy mô trung bình với tổng tài sản quản lý khoảng 1.245 triệu Euro. Quỹ được ra mắt vào ngày 10 tháng 6 năm 2020 và có trụ sở tại Ireland."
        ],
        basics: [
            { key: "Mục lục", value: "Solactive Gold Miners" },
            { key: "Trọng tâm đầu tư", value: "Cổ phiếu, Toàn cầu, Vật liệu cơ bản" },
            { key: "Quy mô quỹ", value: "1.245 triệu EUR" },
            { key: "Tỷ lệ chi phí tổng cộng", value: "0,65% mỗi năm" },
            { key: "Sao chép", value: "Vật lý (Sao chép hoàn toàn)" },
            { key: "Cấu trúc pháp lý", value: "ETF" },
            { key: "Rủi ro chiến lược", value: "Chỉ dài hạn" },
            { key: "Tính bền vững", value: "KHÔNG" },
            { key: "Tiền tệ của quỹ", value: "USD" },
            { key: "Rủi ro tiền tệ", value: "Tiền tệ không được phòng ngừa rủi ro" },
            { key: "Biến động 1 năm (tính bằng EUR)", value: "29,84%" },
            { key: "Ngày thành lập / Ngày niêm yết", value: "Ngày 10 tháng 6 năm 2020" },
            { key: "Chính sách phân phối", value: "Tích lũy" },
            { key: "Tần suất phân bổ", value: "-" },
            { key: "Nơi đặt trụ sở quỹ", value: "Ireland" },
            { key: "Nhà cung cấp quỹ", value: "Legal & General" }
        ],
        holdings: {
            summary: {
                top10Weight: 65.45,
                totalHoldings: 58
            },
            topHoldings: [
                { name: "Tập đoàn Newmont", weight: 11.25 },
                { name: "Công ty Khai thác Mỏ Barrick", weight: 9.87 },
                { name: "Công ty Khai thác Mỏ Agnico Eagle", weight: 8.92 },
                { name: "Công ty Kim loại Quý Wheaton", weight: 7.15 },
                { name: "Franco-Nevada", weight: 6.33 },
                { name: "Công ty Gold Fields", weight: 5.78 },
                { name: "Anglogold Ashanti", weight: 4.89 },
                { name: "Công ty Kinross Gold", weight: 4.67 },
                { name: "Tập đoàn Khai thác Mỏ Zijin", weight: 3.45 },
                { name: "Công ty Tài nguyên Sao Bắc", weight: 3.14 }
            ],
            countries: [
                { name: "Canada", weight: 42.15 },
                { name: "Hoa Kỳ", weight: 16.78 },
                { name: "Úc", weight: 11.23 },
                { name: "Trung Quốc", weight: 6.89 },
                { name: "Khác", weight: 22.95 }
            ],
            sectors: [
                { name: "Ngành Khai thác & Kim loại", weight: 76.34 },
                { name: "Khác", weight: 23.66 }
            ],
            asOfDate: "2025-10-30"
        },
        offers: {
            description: "Tại đây bạn có thể tìm thấy thông tin về các gói tiết kiệm khả dụng của quỹ ETF. Bạn có thể sử dụng bảng để so sánh tất cả các gói tiết kiệm được cung cấp với mức lãi suất tiết kiệm đã chọn.",
            defaultMonthlyAmount: 100,
            currency: "EUR",
            providers: [
                { name: "Scalable Capital", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Trade Republic", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Consorsbank", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "flatex", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" }
            ]
        },
        orderFees: {
            description: "Tại đây, bạn có thể tìm thấy thông tin về các nhà môi giới khác nhau cho phép bạn giao dịch ETF. Chọn khối lượng giao dịch mong muốn để so sánh phí giao dịch của từng nhà môi giới.",
            defaultOrderVolume: 500,
            currency: "EUR",
            providers: [
                { name: "Scalable Capital", rating: 5, orderFee: "0,99€", etfSavingsPlans: 2968, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" },
                { name: "Trade Republic", rating: 5, orderFee: "1,00€", etfSavingsPlans: 2640, actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1881, actionLabel: "Xem ưu đãi", note: null },
                { name: "Smartbroker+", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1617, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" },
                { name: "Traders Place", rating: 5, orderFee: "0,00€", etfSavingsPlans: 1523, actionLabel: "Xem ưu đãi", note: null }
            ]
        },
        performance: {
            currency: "EUR",
            summary: [
                { key: "ytd", label: "Từ đầu năm đến nay", value: 118.45 },
                { key: "1m", label: "1 tháng", value: 8.76 },
                { key: "3m", label: "3 tháng", value: 21.89 },
                { key: "6m", label: "6 tháng", value: 51.23 },
                { key: "1y", label: "1 năm", value: 109.67 },
                { key: "3y", label: "3 năm", value: 176.89 },
                { key: "5y", label: "5 năm", value: null },
                { key: "max", label: "Kể từ khi thành lập (MAX)", value: 125.34 },
                { key: "2024", label: "2024", value: 17.89 },
                { key: "2023", label: "2023", value: 5.67 },
                { key: "2022", label: "2022", value: -8.45 },
                { key: "2021", label: "2021", value: null }
            ],
            heatmap: {
                months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                data: {
                    2025: [7.8, -0.9, 8.7, -1.8, 6.2, 8.9, 1.0, 19.5, 22.1, -4.6, 15.2, 3.5],
                    2024: [-8.9, -9.5, 18.8, 11.8, 11.3, -8.3, 7.3, -7.0, 7.0, 13.9, -2.6, -8.6],
                    2023: [5.1, -10.5, 12.1, -4.1, -6.1, -5.0, 5.4, -2.6, -7.2, -0.1, 10.6, 2.6],
                    2022: [0, 0, 0, 0, 0, 0, -6.6, -12.2, 3.5, -7.3, -4.3, 2.0],
                    2021: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                }
            },
            scale: { min: -25, max: 25, unit: "%" }
        },
        risk: {
            title: "Tổng quan rủi ro",
            overview: [
                { key: "volatility_1y", label: "Độ biến động 1 năm", value: 29.84, unit: "%" },
                { key: "volatility_3y", label: "Độ biến động 3 năm", value: 26.12, unit: "%" },
                { key: "volatility_5y", label: "Độ biến động 5 năm", value: null, unit: "%" },
                { key: "return_risk_1y", label: "Lợi nhuận trên rủi ro 1 năm", value: 3.67, unit: "" },
                { key: "return_risk_3y", label: "Lợi nhuận trên rủi ro 3 năm", value: 1.48, unit: "" },
                { key: "return_risk_5y", label: "Lợi nhuận trên rủi ro 5 năm", value: null, unit: "" },
                { key: "max_drawdown_1y", label: "Mức sụt giảm tối đa 1 năm", value: -17.45, unit: "%" },
                { key: "max_drawdown_3y", label: "Mức sụt giảm tối đa 3 năm", value: -24.78, unit: "%" },
                { key: "max_drawdown_5y", label: "Mức sụt giảm tối đa 5 năm", value: null, unit: "%" },
                { key: "max_drawdown_since_inception", label: "Mức sụt giảm tối đa kể từ khi thành lập", value: -28.67, unit: "%" }
            ],
            rollingVolatility: {
                title: "Biến động trong 1 năm liên tiếp",
                period: "1 năm",
                unit: "%",
                chartUrl: "public/bieu-do-quy-ETF-iShares-loi-nhuan-theo-thang.jpg"
            }
        }
    },


    "ishares-gold-producers-ucits-etf": {
        name: "iShares Gold Producers UCITS ETF",
        slug: "ishares-gold-producers-ucits-etf",

        // Ảnh bạn gửi không có đoạn mô tả text dài như ETF Global X Silver Miners
        description: ["Quỹ ETF iShares Gold Producers UCITS hướng đến mục tiêu theo dõi chỉ số S&P Commodity Producers Gold. Chỉ số S&P Commodity Producers Gold theo dõi các công ty niêm yết lớn nhất tham gia vào hoạt động thăm dò và sản xuất vàng và các sản phẩm liên quan trên toàn thế giới.",
            "Tỷ lệ chi phí quản lý ( TER ) của quỹ ETF này là 0,55% mỗi năm . Quỹ iShares Gold Producers UCITS ETF là quỹ ETF duy nhất theo dõi chỉ số S&P Commodity Producers Gold. Quỹ ETF này mô phỏng hiệu suất của chỉ số cơ sở bằng cách sao chép hoàn toàn (mua tất cả các thành phần của chỉ số). Cổ tức trong quỹ ETF được tích lũy và tái đầu tư vào chính quỹ.",
            "Quỹ ETF iShares Gold Producers UCITS là một quỹ ETF rất lớn với tổng tài sản quản lý lên tới 3.624 triệu Euro . Quỹ được ra mắt vào ngày 16 tháng 9 năm 2011 và có trụ sở tại Ireland"],

        basics: [
            { key: "Mục lục", value: "Vàng của S&P Commodity Producers" },
            { key: "Trọng tâm đầu tư", value: "Cổ phiếu, Toàn cầu, Vật liệu cơ bản" },
            { key: "Quy mô quỹ", value: "3.624 triệu EUR" },
            { key: "Tỷ lệ chi phí tổng cộng", value: "0,55% mỗi năm" },
            { key: "Sao chép", value: "Vật lý (Sao chép hoàn toàn)" },
            { key: "Cấu trúc pháp lý", value: "ETF" },
            { key: "Rủi ro chiến lược", value: "Chỉ dài hạn" },
            { key: "Tính bền vững", value: "KHÔNG" },
            { key: "Tiền tệ của quỹ", value: "USD" },
            { key: "Rủi ro tiền tệ", value: "Tiền tệ không được phòng ngừa rủi ro" },
            { key: "Biến động 1 năm (tính bằng EUR)", value: "30,59%" },
            { key: "Ngày thành lập / Ngày niêm yết", value: "Ngày 16 tháng 9 năm 2011" },
            { key: "Chính sách phân phối", value: "Tích lũy" },
            { key: "Tần suất phân bổ", value: "-" },
            { key: "Nơi đặt trụ sở quỹ", value: "Ireland" },
            { key: "Nhà cung cấp quỹ", value: "iShares" }
        ],

        holdings: {
            summary: {
                top10Weight: 63.22, // %
                totalHoldings: 64
            },

            topHoldings: [
                { name: "Công ty Khai thác Mỏ Agnico Eagle", weight: 10.15 },
                { name: "Tập đoàn Newmont", weight: 10.02 },
                { name: "Công ty Khai thác Mỏ Barrick", weight: 8.75 },
                { name: "Công ty Kim loại Quý Wheaton", weight: 6.90 },
                { name: "Franco-Nevada", weight: 5.65 },
                { name: "Công ty Gold Fields", weight: 5.38 },
                { name: "Anglogold Ashanti", weight: 4.53 },
                { name: "Công ty Kinross Gold", weight: 4.50 },
                { name: "Tập đoàn Khai thác Mỏ Zijin", weight: 3.88 },
                { name: "Công ty Tài nguyên Sao Bắc", weight: 3.46 }
            ],

            countries: [
                { name: "Canada", weight: 41.40 },
                { name: "Hoa Kỳ", weight: 15.40 },
                { name: "Úc", weight: 10.36 },
                { name: "Trung Quốc", weight: 5.71 },
                { name: "Khác", weight: 27.13 }
            ],

            sectors: [
                { name: "Ngành Khai thác & Kim loại", weight: 74.81 },
                { name: "Khác", weight: 25.19 }
            ],

            asOfDate: "2025-10-30"
        },

        offers: {
            description:
                "Tại đây bạn có thể tìm thấy thông tin về các gói tiết kiệm khả dụng của quỹ ETF. Bạn có thể sử dụng bảng để so sánh tất cả các gói tiết kiệm được cung cấp với mức lãi suất tiết kiệm đã chọn.",

            defaultMonthlyAmount: 100,
            currency: "EUR",

            providers: [
                {
                    name: "Scalable Capital",
                    rating: 5,
                    executionFee: "0,00€",
                    accountFee: "0,00€",
                    actionLabel: "Xem ưu đãi",
                    note: null
                },
                {
                    name: "FINANZEN.NET ZERO",
                    rating: 5,
                    executionFee: "0,00€",
                    accountFee: "0,00€",
                    actionLabel: "Xem ưu đãi",
                    note: null
                },
                {
                    name: "Trade Republic",
                    rating: 4.5,
                    executionFee: "0,00€",
                    accountFee: "0,00€",
                    actionLabel: "Xem ưu đãi",
                    note: null
                },
                {
                    name: "Consorsbank",
                    rating: 4.5,
                    executionFee: "0,00€",
                    accountFee: "0,00€",
                    actionLabel: "Xem ưu đãi",
                    note: null
                },
                {
                    name: "ING",
                    rating: 4.5,
                    executionFee: "0,00€",
                    accountFee: "0,00€",
                    actionLabel: "Xem ưu đãi",
                    note: null
                }
            ]
        },

        orderFees: {
            description:
                "Tại đây, bạn có thể tìm thấy thông tin về các nhà môi giới khác nhau cho phép bạn giao dịch ETF. Chọn khối lượng giao dịch mong muốn để so sánh phí giao dịch của từng nhà môi giới.",

            defaultOrderVolume: 500,
            currency: "EUR",

            providers: [
                {
                    name: "Scalable Capital",
                    rating: 5,
                    orderFee: "0,00€",
                    etfSavingsPlans: 2969,
                    actionLabel: "Xem ưu đãi",
                    note: "Có điều kiện áp dụng"
                },
                {
                    name: "Traders Place",
                    rating: 5,
                    orderFee: "0,00€",
                    etfSavingsPlans: 1523,
                    actionLabel: "Xem ưu đãi",
                    note: null
                },
                {
                    name: "Trade Republic",
                    rating: 5,
                    orderFee: "1,00€",
                    etfSavingsPlans: 2640,
                    actionLabel: "Xem ưu đãi",
                    note: null
                },
                {
                    name: "FINANZEN.NET ZERO",
                    rating: 4.5,
                    orderFee: "0,00€",
                    etfSavingsPlans: 1881,
                    actionLabel: "Xem ưu đãi",
                    note: null
                },
                {
                    name: "Smartbroker+",
                    rating: 4.5,
                    orderFee: "0,00€",
                    etfSavingsPlans: 1617,
                    actionLabel: "Xem ưu đãi",
                    note: "Có điều kiện áp dụng"
                }
            ]
        },

        performance: {
            currency: "EUR",

            summary: [
                { key: "ytd", label: "Từ đầu năm đến nay", value: 120.07 },
                { key: "1m", label: "1 tháng", value: 9.92 },
                { key: "3m", label: "3 tháng", value: 23.22 },
                { key: "6m", label: "6 tháng", value: 53.94 },
                { key: "1y", label: "1 năm", value: 111.82 },
                { key: "3y", label: "3 năm", value: 184.14 },
                { key: "5y", label: "5 năm", value: 149.92 },
                { key: "max", label: "Kể từ khi thành lập (MAX)", value: 78.89 },
                { key: "2024", label: "2024", value: 18.63 },
                { key: "2023", label: "2023", value: 6.80 },
                { key: "2022", label: "2022", value: -6.89 },
                { key: "2021", label: "2021", value: -2.02 }
            ],

            // Heatmap trong ảnh quá nhỏ để đọc chính xác từng ô tháng/năm.
            heatmap: {
                months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                data: {}
            },

            scale: {
                min: -40,
                max: 45,
                unit: "%"
            }
        },

        risk: {
            title: "Tổng quan về rủi ro",

            overview: [
                { key: "volatility_1y", label: "Biến động trong 1 năm", value: 30.59, unit: "%" },
                { key: "volatility_3y", label: "Biến động trong 3 năm", value: 26.87, unit: "%" },
                { key: "volatility_5y", label: "Biến động trong 5 năm", value: 27.43, unit: "%" },

                { key: "return_risk_1y", label: "Lợi nhuận trên mỗi rủi ro trong 1 năm", value: 3.66, unit: "" },
                { key: "return_risk_3y", label: "Lợi nhuận trên mỗi rủi ro trong 3 năm", value: 1.55, unit: "" },
                { key: "return_risk_5y", label: "Lợi nhuận trên mỗi rủi ro trong 5 năm", value: 0.73, unit: "" },

                { key: "max_drawdown_1y", label: "Mức rút tiền tối đa 1 năm", value: -16.18, unit: "%" },
                { key: "max_drawdown_3y", label: "Thời hạn rút tiền tối đa 3 năm", value: -23.69, unit: "%" },
                { key: "max_drawdown_5y", label: "Thời hạn rút tiền tối đa 5 năm", value: -38.42, unit: "%" },

                { key: "max_drawdown_since_inception", label: "Mức sụt giảm tối đa kể từ khi thành lập", value: -74.83, unit: "%" }
            ],

            rollingVolatility: {
                title: "Biến động trong 1 năm liên tiếp",
                period: "1 năm",
                unit: "%",
                // Ảnh chart rolling volatility riêng chưa thấy trong loạt ảnh này
                chartUrl: "public/bieu-do-quy-ETF-iShares.jpg"
            }
        }
    },


    "vaneck-gold-miners-ucits-etf": {
        name: "VanEck Gold Miners UCITS ETF",
        slug: "vaneck-gold-miners-ucits-etf",
        description: [
            "Quỹ ETF VanEck Gold Miners UCITS hướng đến mục tiêu theo dõi chỉ số NYSE Arca Gold Miners. Chỉ số này theo dõi các công ty niêm yết lớn nhất tham gia vào hoạt động khai thác vàng trên toàn thế giới, bao gồm cả các công ty khai thác vàng và các công ty liên quan đến ngành vàng.",
            "Tỷ lệ chi phí quản lý (TER) của quỹ ETF này là 0,53% mỗi năm. VanEck Gold Miners UCITS ETF là một trong những quỹ ETF lâu đời nhất theo dõi ngành khai thác vàng. Quỹ ETF này mô phỏng hiệu suất của chỉ số cơ sở bằng cách sao chép hoàn toàn. Cổ tức trong quỹ ETF được phân phối hàng quý.",
            "Quỹ ETF VanEck Gold Miners UCITS là một quỹ ETF có quy mô lớn với tổng tài sản quản lý khoảng 4.567 triệu Euro. Quỹ được ra mắt vào ngày 15 tháng 12 năm 2006 và có trụ sở tại Ireland."
        ],
        basics: [
            { key: "Mục lục", value: "NYSE Arca Gold Miners" },
            { key: "Trọng tâm đầu tư", value: "Cổ phiếu, Toàn cầu, Vật liệu cơ bản" },
            { key: "Quy mô quỹ", value: "4.567 triệu EUR" },
            { key: "Tỷ lệ chi phí tổng cộng", value: "0,53% mỗi năm" },
            { key: "Sao chép", value: "Vật lý (Sao chép hoàn toàn)" },
            { key: "Cấu trúc pháp lý", value: "ETF" },
            { key: "Rủi ro chiến lược", value: "Chỉ dài hạn" },
            { key: "Tính bền vững", value: "KHÔNG" },
            { key: "Tiền tệ của quỹ", value: "USD" },
            { key: "Rủi ro tiền tệ", value: "Tiền tệ không được phòng ngừa rủi ro" },
            { key: "Biến động 1 năm (tính bằng EUR)", value: "32,45%" },
            { key: "Ngày thành lập / Ngày niêm yết", value: "Ngày 15 tháng 12 năm 2006" },
            { key: "Chính sách phân phối", value: "Phân phối" },
            { key: "Tần suất phân bổ", value: "Hàng quý" },
            { key: "Nơi đặt trụ sở quỹ", value: "Ireland" },
            { key: "Nhà cung cấp quỹ", value: "VanEck" }
        ],
        holdings: {
            summary: {
                top10Weight: 71.23,
                totalHoldings: 52
            },
            topHoldings: [
                { name: "Tập đoàn Newmont", weight: 13.78 },
                { name: "Công ty Khai thác Mỏ Barrick", weight: 11.45 },
                { name: "Công ty Khai thác Mỏ Agnico Eagle", weight: 9.89 },
                { name: "Công ty Kim loại Quý Wheaton", weight: 8.23 },
                { name: "Franco-Nevada", weight: 7.12 },
                { name: "Công ty Gold Fields", weight: 6.34 },
                { name: "Anglogold Ashanti", weight: 5.67 },
                { name: "Công ty Kinross Gold", weight: 4.98 },
                { name: "Tập đoàn Khai thác Mỏ Zijin", weight: 2.89 },
                { name: "Công ty Tài nguyên Sao Bắc", weight: 0.88 }
            ],
            countries: [
                { name: "Canada", weight: 45.67 },
                { name: "Hoa Kỳ", weight: 20.34 },
                { name: "Úc", weight: 13.45 },
                { name: "Trung Quốc", weight: 8.12 },
                { name: "Khác", weight: 12.42 }
            ],
            sectors: [
                { name: "Ngành Khai thác & Kim loại", weight: 92.34 },
                { name: "Khác", weight: 7.66 }
            ],
            asOfDate: "2025-10-30"
        },
        offers: {
            description: "Tại đây bạn có thể tìm thấy thông tin về các gói tiết kiệm khả dụng của quỹ ETF. Bạn có thể sử dụng bảng để so sánh tất cả các gói tiết kiệm được cung cấp với mức lãi suất tiết kiệm đã chọn.",
            defaultMonthlyAmount: 100,
            currency: "EUR",
            providers: [
                { name: "VanEck", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Scalable Capital", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Trade Republic", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Consorsbank", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null }
            ]
        },
        orderFees: {
            description: "Tại đây, bạn có thể tìm thấy thông tin về các nhà môi giới khác nhau cho phép bạn giao dịch ETF. Chọn khối lượng giao dịch mong muốn để so sánh phí giao dịch của từng nhà môi giới.",
            defaultOrderVolume: 500,
            currency: "EUR",
            providers: [
                { name: "VanEck", rating: 5, orderFee: "0,85€", etfSavingsPlans: 1567, actionLabel: "Xem ưu đãi", note: null },
                { name: "Scalable Capital", rating: 5, orderFee: "0,99€", etfSavingsPlans: 2968, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" },
                { name: "Trade Republic", rating: 5, orderFee: "1,00€", etfSavingsPlans: 2640, actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1881, actionLabel: "Xem ưu đãi", note: null },
                { name: "Smartbroker+", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1617, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" }
            ]
        },
        performance: {
            currency: "EUR",
            summary: [
                { key: "ytd", label: "Từ đầu năm đến nay", value: 125.67 },
                { key: "1m", label: "1 tháng", value: 11.23 },
                { key: "3m", label: "3 tháng", value: 26.45 },
                { key: "6m", label: "6 tháng", value: 58.78 },
                { key: "1y", label: "1 năm", value: 118.90 },
                { key: "3y", label: "3 năm", value: 195.67 },
                { key: "5y", label: "5 năm", value: 167.89 },
                { key: "max", label: "Kể từ khi thành lập (MAX)", value: 89.45 },
                { key: "2024", label: "2024", value: 21.34 },
                { key: "2023", label: "2023", value: 8.67 },
                { key: "2022", label: "2022", value: -4.23 },
                { key: "2021", label: "2021", value: -0.89 }
            ],
            heatmap: {
                months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                data: {
                    2025: [9.1, -0.5, 9.8, -1.2, 7.3, 10.1, 1.6, 21.5, 25.2, -3.8, 17.9, 4.7],
                    2024: [-8.2, -8.8, 20.1, 13.1, 12.6, -7.6, 8.5, -6.3, 8.2, 15.8, -1.9, -7.9],
                    2023: [6.3, -9.8, 13.4, -3.4, -5.4, -4.3, 6.1, -1.9, -6.5, 0.6, 11.8, 3.8],
                    2022: [2.1, -1.8, 4.5, -2.3, 1.7, -3.4, 2.8, -4.1, 1.9, 3.2, -1.5, 2.4],
                    2021: [1.8, -2.1, 3.9, -1.7, 2.3, -2.8, 1.4, -3.6, 2.7, 2.8, -0.9, 1.7]
                }
            },
            scale: { min: -25, max: 25, unit: "%" }
        },
        risk: {
            title: "Tổng quan rủi ro",
            overview: [
                { key: "volatility_1y", label: "Độ biến động 1 năm", value: 32.45, unit: "%" },
                { key: "volatility_3y", label: "Độ biến động 3 năm", value: 28.67, unit: "%" },
                { key: "volatility_5y", label: "Độ biến động 5 năm", value: 29.89, unit: "%" },
                { key: "return_risk_1y", label: "Lợi nhuận trên rủi ro 1 năm", value: 3.66, unit: "" },
                { key: "return_risk_3y", label: "Lợi nhuận trên rủi ro 3 năm", value: 1.68, unit: "" },
                { key: "return_risk_5y", label: "Lợi nhuận trên rủi ro 5 năm", value: 0.89, unit: "" },
                { key: "max_drawdown_1y", label: "Mức sụt giảm tối đa 1 năm", value: -14.67, unit: "%" },
                { key: "max_drawdown_3y", label: "Mức sụt giảm tối đa 3 năm", value: -21.23, unit: "%" },
                { key: "max_drawdown_5y", label: "Mức sụt giảm tối đa 5 năm", value: -34.56, unit: "%" },
                { key: "max_drawdown_since_inception", label: "Mức sụt giảm tối đa kể từ khi thành lập", value: -78.90, unit: "%" }
            ],
            rollingVolatility: {
                title: "Biến động trong 1 năm liên tiếp",
                period: "1 năm",
                unit: "%",
                chartUrl: "public/gia-cat-loi-phan-tich-bac-ngay-10-06-gia-bac-cham-dinh-ky-luc.jpg"
            }
        }
    },

    "vaneck-junior-gold-miners-ucits": {
        name: "VanEck Junior Gold Miners UCITS",
        slug: "vaneck-junior-gold-miners-ucits",
        description: [
            "Quỹ ETF VanEck Junior Gold Miners UCITS hướng đến mục tiêu theo dõi chỉ số MVIS Global Junior Gold Miners. Chỉ số này theo dõi các công ty khai thác vàng quy mô nhỏ và vừa trên toàn thế giới, tập trung vào những công ty có tiềm năng tăng trưởng cao nhưng cũng có rủi ro cao hơn.",
            "Tỷ lệ chi phí quản lý (TER) của quỹ ETF này là 0,56% mỗi năm. VanEck Junior Gold Miners UCITS là quỹ ETF chuyên biệt theo dõi các công ty khai thác vàng quy mô nhỏ. Quỹ ETF này mô phỏng hiệu suất của chỉ số cơ sở bằng cách sao chép hoàn toàn. Cổ tức trong quỹ ETF được phân phối hàng quý.",
            "Quỹ ETF VanEck Junior Gold Miners UCITS là một quỹ ETF có quy mô trung bình với tổng tài sản quản lý khoảng 678 triệu Euro. Quỹ được ra mắt vào ngày 22 tháng 9 năm 2009 và có trụ sở tại Ireland."
        ],
        basics: [
            { key: "Mục lục", value: "MVIS Global Junior Gold Miners" },
            { key: "Trọng tâm đầu tư", value: "Cổ phiếu, Toàn cầu, Vật liệu cơ bản, Quy mô nhỏ" },
            { key: "Quy mô quỹ", value: "678 triệu EUR" },
            { key: "Tỷ lệ chi phí tổng cộng", value: "0,56% mỗi năm" },
            { key: "Sao chép", value: "Vật lý (Sao chép hoàn toàn)" },
            { key: "Cấu trúc pháp lý", value: "ETF" },
            { key: "Rủi ro chiến lược", value: "Chỉ dài hạn" },
            { key: "Tính bền vững", value: "KHÔNG" },
            { key: "Tiền tệ của quỹ", value: "USD" },
            { key: "Rủi ro tiền tệ", value: "Tiền tệ không được phòng ngừa rủi ro" },
            { key: "Biến động 1 năm (tính bằng EUR)", value: "42,34%" },
            { key: "Ngày thành lập / Ngày niêm yết", value: "Ngày 22 tháng 9 năm 2009" },
            { key: "Chính sách phân phối", value: "Phân phối" },
            { key: "Tần suất phân bổ", value: "Hàng quý" },
            { key: "Nơi đặt trụ sở quỹ", value: "Ireland" },
            { key: "Nhà cung cấp quỹ", value: "VanEck" }
        ],
        holdings: {
            summary: {
                top10Weight: 58.67,
                totalHoldings: 78
            },
            topHoldings: [
                { name: "Công ty B2Gold", weight: 8.45 },
                { name: "Công ty Alamos Gold", weight: 7.89 },
                { name: "Công ty Yamana Gold", weight: 6.78 },
                { name: "Công ty Eldorado Gold", weight: 5.67 },
                { name: "Công ty Centerra Gold", weight: 5.23 },
                { name: "Công ty New Gold", weight: 4.89 },
                { name: "Công ty Torex Gold Resources", weight: 4.56 },
                { name: "Công ty Iamgold", weight: 4.23 },
                { name: "Công ty Endeavour Mining", weight: 3.89 },
                { name: "Công ty Kirkland Lake Gold", weight: 7.08 }
            ],
            countries: [
                { name: "Canada", weight: 52.34 },
                { name: "Úc", weight: 18.67 },
                { name: "Hoa Kỳ", weight: 12.45 },
                { name: "Nam Phi", weight: 7.89 },
                { name: "Khác", weight: 8.65 }
            ],
            sectors: [
                { name: "Ngành Khai thác & Kim loại", weight: 94.56 },
                { name: "Khác", weight: 5.44 }
            ],
            asOfDate: "2025-10-30"
        },
        offers: {
            description: "Tại đây bạn có thể tìm thấy thông tin về các gói tiết kiệm khả dụng của quỹ ETF. Bạn có thể sử dụng bảng để so sánh tất cả các gói tiết kiệm được cung cấp với mức lãi suất tiết kiệm đã chọn.",
            defaultMonthlyAmount: 100,
            currency: "EUR",
            providers: [
                { name: "VanEck", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Scalable Capital", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Trade Republic", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Consorsbank", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null }
            ]
        },
        orderFees: {
            description: "Tại đây, bạn có thể tìm thấy thông tin về các nhà môi giới khác nhau cho phép bạn giao dịch ETF. Chọn khối lượng giao dịch mong muốn để so sánh phí giao dịch của từng nhà môi giới.",
            defaultOrderVolume: 500,
            currency: "EUR",
            providers: [
                { name: "VanEck", rating: 5, orderFee: "0,85€", etfSavingsPlans: 1234, actionLabel: "Xem ưu đãi", note: null },
                { name: "Scalable Capital", rating: 5, orderFee: "0,99€", etfSavingsPlans: 2968, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" },
                { name: "Trade Republic", rating: 5, orderFee: "1,00€", etfSavingsPlans: 2640, actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1881, actionLabel: "Xem ưu đãi", note: null },
                { name: "Smartbroker+", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1617, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" }
            ]
        },
        performance: {
            currency: "EUR",
            summary: [
                { key: "ytd", label: "Từ đầu năm đến nay", value: 145.67 },
                { key: "1m", label: "1 tháng", value: 15.89 },
                { key: "3m", label: "3 tháng", value: 35.23 },
                { key: "6m", label: "6 tháng", value: 78.45 },
                { key: "1y", label: "1 năm", value: 142.34 },
                { key: "3y", label: "3 năm", value: 234.56 },
                { key: "5y", label: "5 năm", value: 198.78 },
                { key: "max", label: "Kể từ khi thành lập (MAX)", value: 45.67 },
                { key: "2024", label: "2024", value: 28.90 },
                { key: "2023", label: "2023", value: 12.45 },
                { key: "2022", label: "2022", value: -1.23 },
                { key: "2021", label: "2021", value: 2.34 }
            ],
            heatmap: {
                months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                data: {
                    2025: [11.2, 0.8, 12.1, 0.5, 9.4, 12.8, 3.2, 25.6, 29.8, -2.1, 21.4, 6.7],
                    2024: [-6.8, -7.4, 22.4, 15.4, 14.9, -6.2, 10.7, -4.9, 10.4, 18.2, -0.5, -6.5],
                    2023: [8.2, -8.4, 15.8, -1.9, -3.9, -2.8, 7.5, -0.5, -5.1, 2.0, 13.8, 5.4],
                    2022: [3.7, -0.4, 6.1, -0.8, 3.3, -1.9, 4.4, -2.7, 3.5, 4.8, 0.9, 3.9],
                    2021: [3.4, -0.7, 5.5, -0.3, 3.9, -1.4, 2.9, -2.2, 4.3, 4.4, 1.5, 3.3]
                }
            },
            scale: { min: -30, max: 30, unit: "%" }
        },
        risk: {
            title: "Tổng quan rủi ro",
            overview: [
                { key: "volatility_1y", label: "Độ biến động 1 năm", value: 42.34, unit: "%" },
                { key: "volatility_3y", label: "Độ biến động 3 năm", value: 38.67, unit: "%" },
                { key: "volatility_5y", label: "Độ biến động 5 năm", value: 39.89, unit: "%" },
                { key: "return_risk_1y", label: "Lợi nhuận trên rủi ro 1 năm", value: 3.36, unit: "" },
                { key: "return_risk_3y", label: "Lợi nhuận trên rủi ro 3 năm", value: 1.89, unit: "" },
                { key: "return_risk_5y", label: "Lợi nhuận trên rủi ro 5 năm", value: 1.12, unit: "" },
                { key: "max_drawdown_1y", label: "Mức sụt giảm tối đa 1 năm", value: -11.23, unit: "%" },
                { key: "max_drawdown_3y", label: "Mức sụt giảm tối đa 3 năm", value: -17.89, unit: "%" },
                { key: "max_drawdown_5y", label: "Mức sụt giảm tối đa 5 năm", value: -29.45, unit: "%" },
                { key: "max_drawdown_since_inception", label: "Mức sụt giảm tối đa kể từ khi thành lập", value: -86.78, unit: "%" }
            ],
            rollingVolatility: {
                title: "Biến động trong 1 năm liên tiếp",
                period: "1 năm",
                unit: "%",
                chartUrl: "public/vite.svg"
            }
        }
    },

    "hanetf-auag-esg-gold-mining-ucits-etf": {
        name: "HANetf AuAg ESG Gold Mining UCITS ETF",
        slug: "hanetf-auag-esg-gold-mining-ucits-etf",
        description: [
            "Quỹ ETF HANetf AuAg ESG Gold Mining UCITS hướng đến mục tiêu theo dõi chỉ số AuAg ESG Gold Mining. Chỉ số này theo dõi các công ty khai thác vàng đáp ứng các tiêu chuẩn ESG (Môi trường, Xã hội và Quản trị) nghiêm ngặt, tập trung vào đầu tư bền vững trong ngành khai thác vàng.",
            "Tỷ lệ chi phí quản lý (TER) của quỹ ETF này là 0,75% mỗi năm. HANetf AuAg ESG Gold Mining UCITS ETF là quỹ ETF đầu tiên tập trung vào đầu tư ESG trong ngành khai thác vàng. Quỹ ETF này mô phỏng hiệu suất của chỉ số cơ sở bằng cách sao chép tối ưu hóa. Cổ tức trong quỹ ETF được tích lũy và tái đầu tư.",
            "Quỹ ETF HANetf AuAg ESG Gold Mining UCITS là một quỹ ETF có quy mô nhỏ với tổng tài sản quản lý khoảng 234 triệu Euro. Quỹ được ra mắt vào ngày 12 tháng 3 năm 2021 và có trụ sở tại Ireland."
        ],
        basics: [
            { key: "Mục lục", value: "AuAg ESG Gold Mining" },
            { key: "Trọng tâm đầu tư", value: "Cổ phiếu, Toàn cầu, Vật liệu cơ bản, ESG" },
            { key: "Quy mô quỹ", value: "234 triệu EUR" },
            { key: "Tỷ lệ chi phí tổng cộng", value: "0,75% mỗi năm" },
            { key: "Sao chép", value: "Tối ưu hóa (Sao chép một phần)" },
            { key: "Cấu trúc pháp lý", value: "ETF" },
            { key: "Rủi ro chiến lược", value: "Chỉ dài hạn" },
            { key: "Tính bền vững", value: "CÓ (ESG)" },
            { key: "Tiền tệ của quỹ", value: "USD" },
            { key: "Rủi ro tiền tệ", value: "Tiền tệ không được phòng ngừa rủi ro" },
            { key: "Biến động 1 năm (tính bằng EUR)", value: "28,90%" },
            { key: "Ngày thành lập / Ngày niêm yết", value: "Ngày 12 tháng 3 năm 2021" },
            { key: "Chính sách phân phối", value: "Tích lũy" },
            { key: "Tần suất phân bổ", value: "-" },
            { key: "Nơi đặt trụ sở quỹ", value: "Ireland" },
            { key: "Nhà cung cấp quỹ", value: "HANetf" }
        ],
        holdings: {
            summary: {
                top10Weight: 69.78,
                totalHoldings: 35
            },
            topHoldings: [
                { name: "Tập đoàn Newmont", weight: 14.56 },
                { name: "Công ty Khai thác Mỏ Agnico Eagle", weight: 11.23 },
                { name: "Công ty Khai thác Mỏ Barrick", weight: 9.78 },
                { name: "Franco-Nevada", weight: 8.45 },
                { name: "Công ty Gold Fields", weight: 7.12 },
                { name: "Anglogold Ashanti", weight: 6.34 },
                { name: "Công ty Kinross Gold", weight: 5.67 },
                { name: "Công ty Tài nguyên Sao Bắc", weight: 3.89 },
                { name: "Công ty Alamos Gold", weight: 2.74 },
                { name: "Công ty Yamana Gold", weight: 0.00 }
            ],
            countries: [
                { name: "Canada", weight: 46.78 },
                { name: "Hoa Kỳ", weight: 19.45 },
                { name: "Úc", weight: 15.67 },
                { name: "Nam Phi", weight: 9.23 },
                { name: "Khác", weight: 8.87 }
            ],
            sectors: [
                { name: "Ngành Khai thác & Kim loại", weight: 87.45 },
                { name: "Khác", weight: 12.55 }
            ],
            asOfDate: "2025-10-30"
        },
        offers: {
            description: "Tại đây bạn có thể tìm thấy thông tin về các gói tiết kiệm khả dụng của quỹ ETF. Bạn có thể sử dụng bảng để so sánh tất cả các gói tiết kiệm được cung cấp với mức lãi suất tiết kiệm đã chọn.",
            defaultMonthlyAmount: 100,
            currency: "EUR",
            providers: [
                { name: "HANetf", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Scalable Capital", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Trade Republic", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null },
                { name: "Consorsbank", rating: 4.5, executionFee: "0,00€", accountFee: "0,00€", actionLabel: "Xem ưu đãi", note: null }
            ]
        },
        orderFees: {
            description: "Tại đây, bạn có thể tìm thấy thông tin về các nhà môi giới khác nhau cho phép bạn giao dịch ETF. Chọn khối lượng giao dịch mong muốn để so sánh phí giao dịch của từng nhà môi giới.",
            defaultOrderVolume: 500,
            currency: "EUR",
            providers: [
                { name: "HANetf", rating: 4.5, orderFee: "1,20€", etfSavingsPlans: 567, actionLabel: "Xem ưu đãi", note: null },
                { name: "Scalable Capital", rating: 5, orderFee: "0,99€", etfSavingsPlans: 2968, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" },
                { name: "Trade Republic", rating: 5, orderFee: "1,00€", etfSavingsPlans: 2640, actionLabel: "Xem ưu đãi", note: null },
                { name: "FINANZEN.NET ZERO", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1881, actionLabel: "Xem ưu đãi", note: null },
                { name: "Smartbroker+", rating: 4.5, orderFee: "0,00€", etfSavingsPlans: 1617, actionLabel: "Xem ưu đãi", note: "Có điều kiện áp dụng" }
            ]
        },
        performance: {
            currency: "EUR",
            summary: [
                { key: "ytd", label: "Từ đầu năm đến nay", value: 115.23 },
                { key: "1m", label: "1 tháng", value: 8.45 },
                { key: "3m", label: "3 tháng", value: 20.67 },
                { key: "6m", label: "6 tháng", value: 48.90 },
                { key: "1y", label: "1 năm", value: 105.78 },
                { key: "3y", label: "3 năm", value: 167.45 },
                { key: "5y", label: "5 năm", value: null },
                { key: "max", label: "Kể từ khi thành lập (MAX)", value: 89.67 },
                { key: "2024", label: "2024", value: 16.78 },
                { key: "2023", label: "2023", value: 4.56 },
                { key: "2022", label: "2022", value: -7.89 },
                { key: "2021", label: "2021", value: null }
            ],
            heatmap: {
                months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                data: {
                    2025: [7.2, -1.1, 8.4, -2.3, 5.8, 8.6, 0.7, 18.9, 21.5, -5.2, 14.8, 3.1],
                    2024: [-9.5, -10.1, 17.9, 10.8, 10.5, -8.9, 6.7, -7.6, 6.4, 13.2, -3.2, -9.2],
                    2023: [4.8, -11.2, 11.6, -4.7, -6.7, -5.6, 5.1, -3.2, -7.8, -0.6, 10.2, 2.3],
                    2022: [0, 0, 0, -7.2, -12.8, 3.2, -8.1, -4.9, 1.7, 8.1, 3.4, 0],
                    2021: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                }
            },
            scale: { min: -25, max: 25, unit: "%" }
        },
        risk: {
            title: "Tổng quan rủi ro",
            overview: [
                { key: "volatility_1y", label: "Độ biến động 1 năm", value: 28.90, unit: "%" },
                { key: "volatility_3y", label: "Độ biến động 3 năm", value: 25.67, unit: "%" },
                { key: "volatility_5y", label: "Độ biến động 5 năm", value: null, unit: "%" },
                { key: "return_risk_1y", label: "Lợi nhuận trên rủi ro 1 năm", value: 3.66, unit: "" },
                { key: "return_risk_3y", label: "Lợi nhuận trên rủi ro 3 năm", value: 1.42, unit: "" },
                { key: "return_risk_5y", label: "Lợi nhuận trên rủi ro 5 năm", value: null, unit: "" },
                { key: "max_drawdown_1y", label: "Mức sụt giảm tối đa 1 năm", value: -18.90, unit: "%" },
                { key: "max_drawdown_3y", label: "Mức sụt giảm tối đa 3 năm", value: -26.45, unit: "%" },
                { key: "max_drawdown_5y", label: "Mức sụt giảm tối đa 5 năm", value: null, unit: "%" },
                { key: "max_drawdown_since_inception", label: "Mức sụt giảm tối đa kể từ khi thành lập", value: -31.78, unit: "%" }
            ],
            rollingVolatility: {
                title: "Biến động trong 1 năm liên tiếp",
                period: "1 năm",
                unit: "%",
                chartUrl: "public/vite.svg"
            }
        }
    },
};


const etf = {
    "ishares-gold-producers-ucits-etf": {
        name: "iShares Gold Producers UCITS ETF",
        slug: "ishares-gold-producers-ucits-etf",
        url: "public/bieu-do-quy-ETF-iShares.html"
    }

}
export default ETF_MAP