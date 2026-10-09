import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logUserInfo } from "../utils/logUserInfo";

export const DetailSharkGlobal = () => {
    const navigate = useNavigate();
    useEffect(() => {
        (async () => {
            await logUserInfo("Màn hình DetailSharkGlobal.jsx")
        })();
    }, []);
    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999
            }}
            onClick={() => navigate('/shark-global')}
        >
            <div
                style={{
                    backgroundColor: "rgba(0,0,0,0.95)",
                    padding: 30,
                    borderRadius: 12,
                    width: "95%",
                    height: "90%",
                    position: "relative",
                    overflowY: "auto",
                    boxShadow: "0 0 20px rgba(255, 215, 0, 0.5)"
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => navigate('/shark-global')}
                    style={{
                        position: "absolute",
                        top: 20,
                        right: 20,
                        padding: "6px 12px",
                        borderRadius: 6,
                        background: "#ff3b30",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}
                >
                    Close
                </button>

                <h2 style={{ color: "#ffd700", marginBottom: 20, textAlign: "center", fontSize: 28 }}>
                    Global X Silver Miners UCITS ETF
                </h2>

                <div style={{ color: "#f5f5f5", fontSize: 18, lineHeight: 1.8 }}>
                    <p><span style={{ color: "#ffcc00", fontWeight: "bold" }}>Giới thiệu:</span> Global X Silver Miners UCITS ETF là một quỹ ETF cung cấp cho nhà đầu tư quyền tiếp cận các công ty khai thác bạc trên toàn cầu. Quỹ này giao dịch như cổ phiếu và cho phép đầu tư đa dạng thay vì mua từng cổ phiếu riêng lẻ.</p>

                    <p><span style={{ color: "#ffcc00", fontWeight: "bold" }}>ETF là gì:</span> ETF (Quỹ Giao dịch hoán đổi danh mục) là quỹ nắm giữ một rổ tài sản như cổ phiếu, trái phiếu, hàng hóa và được giao dịch trên sàn chứng khoán như cổ phiếu.</p>

                    <p><span style={{ color: "#ffcc00", fontWeight: "bold" }}>Mục tiêu:</span> Tập trung vào các công ty có hoạt động chính trong ngành khai thác bạc.</p>

                    <p><span style={{ color: "#ffcc00", fontWeight: "bold" }}>Lợi ích:</span> Đầu tư vào ETF này giúp đa dạng hóa danh mục và giảm rủi ro so với đầu tư vào từng công ty riêng lẻ.</p>

                    <p><span style={{ color: "#ffcc00", fontWeight: "bold" }}>Cách giao dịch:</span> Mua và bán chứng chỉ quỹ trên sàn chứng khoán trong thời gian giao dịch, giống như cổ phiếu.</p>

                    <p><span style={{ color: "#ffcc00", fontWeight: "bold" }}>Thông số biểu đồ:</span> Theo dõi chỉ số Solactive Global Silver Miners, mô phỏng hiệu suất toàn bộ các thành phần, cổ tức tích lũy và tái đầu tư. Tỷ lệ chi phí tổng thể (TER): 0,65%/năm.</p>

                    <p><span style={{ color: "#ffcc00", fontWeight: "bold" }}>Quỹ hiện tại:</span> 882 triệu Euro tài sản được quản lý, ra mắt 04/05/2022 tại Ireland.</p>
                </div>
            </div>

        </div>
    );
}