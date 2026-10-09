import React from "react";
import "./XauxagDetail.css";

const XauxagDetail = () => {
    return (
        <div className="article-container">

            {/* Back button */}
            <button className="back-btn" onClick={() => window.history.back()}>
                ← Quay lại
            </button>

            {/* Header */}
            <h1 className="article-title">
                💎 Tỷ lệ Vàng / Bạc (Gold–Silver Ratio)
            </h1>

            <p className="article-lead">
                Tỷ lệ vàng/bạc là một thước đo quan trọng trong đầu tư kim loại quý.
                Nó cho thấy cần bao nhiêu ounce bạc để mua 1 ounce vàng.
            </p>

            {/* Section 1 */}
            <section>
                <h2>📌 Tầm quan trọng của tỷ lệ</h2>
                <p>
                    Trong lịch sử, tỷ lệ vàng/bạc dao động chủ yếu trong khoảng
                    <span className="stat-highlight"> 50:1 → 80:1</span>.
                    Khi tỷ lệ đi quá xa vùng này, thị trường thường phản ánh sự
                    định giá lệch giữa vàng và bạc.
                </p>

                <div className="info-box">
                    <b>⚠️ Ngưỡng quan trọng:</b>
                    <ul>
                        <li>
                            <span className="stat-highlight">Tỷ lệ &gt; 90:1</span> → Vàng bị định giá quá cao
                            hoặc bạc rẻ.
                        </li>
                        <li>
                            <span className="stat-highlight">Tỷ lệ &lt; 50:1</span> → Bạc đắt hoặc vàng rẻ.
                        </li>
                    </ul>
                </div>

                <blockquote className="quote">
                    👉 Khi tỷ lệ quá cao: thường bán vàng / mua bạc.
                    👉 Khi tỷ lệ quá thấp: thường mua vàng.
                </blockquote>
            </section>

            {/* Section 2 */}
            <section>
                <h2>📊 Tỷ lệ hiện tại & tâm lý thị trường</h2>
                <p>
                    Tính đến tháng 5 năm 2025, tỷ lệ đạt
                    <span className="stat-highlight"> 99.7</span>,
                    cao hơn khoảng 30% so với trung bình 12 tháng trước (đã từng chạm 73).
                </p>

                <p>
                    Một động lực chính đẩy tỷ lệ tăng là chính sách thuế quan leo thang của Mỹ đối
                    với nhiều cường quốc, trong một số trường hợp vượt quá <b>100%</b>.
                    Điều này khiến vàng trở thành nơi trú ẩn, tăng đột biến từ đầu 2024 → đạt đỉnh
                    lịch sử vào 4/2025.
                </p>
            </section>

            {/* Section 3 */}
            <section>
                <h2>🥈 Vì sao bạc tăng chậm hơn vàng?</h2>

                <div className="card-grid">
                    <ApplicationCard
                        title="👉 Kim loại công nghiệp"
                        content="Bạc được sử dụng nhiều trong điện tử, pin, PV — khiến nó bị nhìn nhận thiên về ‘kim loại công nghiệp’ hơn là tài sản trú ẩn."
                    />
                    <ApplicationCard
                        title="👉 Lưu trữ khó"
                        content="1kg vàng có thể cất gọn, nhưng bạc tương đương phải dùng két ngân hàng."
                    />
                    <ApplicationCard
                        title="👉 Biến động mạnh"
                        content="Bạc có thể tăng/giảm nhiều % chỉ trong vài tuần — không hợp với nhà đầu tư an toàn."
                    />
                </div>
            </section>

            {/* Section 4 */}
            <section>
                <h2>📈 Hiệu suất lịch sử 5 năm</h2>

                <FactorCard
                    number="11/08/2020 — 68.47"
                    title="Sau đỉnh COVID"
                    color="green"
                    content="Bạc tăng mạnh cuối 2020 trong khi vàng chững → thu hẹp tỷ lệ."
                />

                <FactorCard
                    number="01/02/2021 — 63.13"
                    title="Mức thấp nhất 5 năm"
                    color="green"
                    content="Vàng suy yếu, bạc phục hồi → tỷ lệ chạm đáy."
                />

                <FactorCard
                    number="08–09/2022 — ~95.8"
                    title="Đỉnh trung kỳ"
                    color="red"
                    content="Bạc lao dốc nhanh hơn vàng → tỷ lệ tăng."
                />

                <FactorCard
                    number="29/05/2024 — 73.07"
                    title="Lần giảm hiếm"
                    color="blue"
                    content="Một trong những vùng cân bằng nhất của thị trường."
                />
            </section>
        </div>
    );
};

const ApplicationCard = ({ title, content }) => (
    <div className="app-card">
        <h4>{title}</h4>
        <p>{content}</p>
    </div>
);

const FactorCard = ({ number, title, content, color }) => (
    <div className={`factor-card ${color}`}>
        <div className="factor-number">{number}</div>
        <div>
            <h4>{title}</h4>
            <p>{content}</p>
        </div>
    </div>
);

export default XauxagDetail;
