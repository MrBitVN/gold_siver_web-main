import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useMemo } from 'react';

function GlobalShark1DayChart({ rawData, isMini = true }) {
    const options = useMemo(() => {
        // 1. Kiểm tra dữ liệu đầu vào
        if (!rawData || rawData.length === 0) return {};

        // 2. Xử lý dữ liệu: 
        // Highcharts chạy mượt nhất khi x là Timestamp (số).
        // Chúng ta map qua mảng để convert x từ String/Date Object sang số.
        const processedData = rawData.map(item => ({
            x: new Date(item.x).getTime(), // Chuyển đổi ngày giờ sang timestamp
            y: item.y
        }));

        // 3. LẤY ĐỘNG GIÁ THAM CHIẾU (Dựa vào phần tử đầu tiên)
        const firstPoint = processedData[0];
        const referencePrice = firstPoint.y; // Ví dụ: 33.91

        return {
            chart: {
                type: 'area',
                width: isMini ? 170 : null,
                height: isMini ? 120 : null,
                backgroundColor: isMini ? 'transparent' : '#FFFFFF',
                // spacing: [10, 0, 10, 0],
                margin: isMini ? [0, 0, 0, 0] : undefined,
                spacing: isMini ? [0, 0, 0, 0] : [10, 10, 15, 10],
            },
            title: { text: '' },
            credits: { enabled: false },
            legend: { enabled: false },

            xAxis: {
                visible: !isMini,
                type: 'datetime', // Bắt buộc để hiển thị ngày giờ
                labels: {
                    format: '{value:%H:%M}', // Chỉ hiện Giờ:Phút
                    style: { color: '#999' }
                },
                lineWidth: 0,
                tickWidth: 0
            },

            yAxis: {
                visible: !isMini,
                title: { text: null },
                gridLineColor: '#eee',
                gridLineDashStyle: 'Dashed',
                // Đảm bảo trục Y luôn bao gồm giá tham chiếu
                softMin: referencePrice - 0.5,
                softMax: referencePrice + 0.5,

                // Vẽ đường kẻ ngang tại giá tham chiếu
                plotLines: [{
                    value: referencePrice,
                    color: '#666',
                    width: 1,
                    dashStyle: 'ShortDot',
                    zIndex: 5,
                    label: {
                        text: `Ref: ${referencePrice}`,
                        align: 'right',
                        style: { color: '#666', fontSize: '10px' }
                    }
                }]
            },

            tooltip: {
                enabled: !isMini
            },

            plotOptions: {
                area: {
                    marker: { enabled: false },
                    lineWidth: 2,
                    states: { hover: { enabled: true } }
                }
            },

            series: [
                {
                    name: 'Giá',
                    data: processedData, // Dùng dữ liệu đã xử lý

                    // --- CẤU HÌNH MÀU ĐỘNG ---
                    threshold: referencePrice, // Quan trọng: Set ngưỡng bằng giá đầu tiên

                    // Màu khi giá > tham chiếu (Xanh)
                    color: 'rgba(34, 197, 94, 0.7)',
                    lineColor: '#16a34a',

                    // Màu khi giá < tham chiếu (Đỏ)
                    negativeColor: 'rgba(239, 68, 68, 0.7)',
                    negativeFillColor: 'rgba(239, 68, 68, 0.7)',
                    // --------------------------
                },
            ],
        };
    }, [rawData]);

    return (
        <div style={{ border: isMini ? '1px solid #e5e7eb' : '', borderRadius: isMini ? '12px' : '0px', width: isMini ? '170px' : "100%", height: isMini ? '120px' : '100%', overflow: isMini ? 'hidden' : 'none' }}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
}

export default GlobalShark1DayChart;