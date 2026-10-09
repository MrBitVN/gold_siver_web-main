import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ProfitLossDetail.css";
import { logUserInfo } from "../utils/logUserInfo";
import { useTranslation } from "react-i18next";
const ProfitLossDetail = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { username } = useParams();
    const [activeTab, setActiveTab] = useState("VANG");
    const [accountInfo, setAccountInfo] = useState(null);
    const [profitLossData, setProfitLossData] = useState([]);
    const [totalProfit, setTotalProfit] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // số dòng mỗi trang (bạn đổi 10 → 20 nếu muốn)
    const [showProfitLoss, setShowProfitLoss] = useState(false);
    const [displayUnit, setDisplayUnit] = useState("luong"); // "luong" hoặc "kg"
    // Memoized computations
    // const totalInvested = useMemo(() => {
    //     return profitLossData.reduce((sum, item) => {
    //         return sum + (Number(item.gia_mua) * Number(item.soluong));
    //     }, 0);
    // }, [profitLossData]);

    const totalPages = useMemo(() => Math.ceil(profitLossData.length / itemsPerPage), [profitLossData.length, itemsPerPage]);

    const paginatedData = useMemo(() => {
        return profitLossData.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [profitLossData, currentPage, itemsPerPage]);
    const paginationBtnStyle = {
        padding: "6px 10px",        // nhỏ gọn
        border: "1.5px solid #FFD700",
        borderRadius: "6px",
        background: "none",
        color: "#FFD700",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.25s ease",
    }
    const parseOS = (ua) => {
        ua = ua.toLowerCase();
        if (ua.includes("windows nt")) return "Windows";
        if (ua.includes("mac os x") && !ua.includes("iphone")) return "MacOS";
        if (ua.includes("iphone") || ua.includes("ipad")) return "iOS";
        if (ua.includes("android")) return "Android";
        if (ua.includes("linux")) return "Linux";
        return "Unknown";
    };

    const parseBrowser = (ua) => {
        ua = ua.toLowerCase();
        if (ua.includes("edg")) return "Edge";
        if (ua.includes("chrome")) return "Chrome";
        if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
        if (ua.includes("firefox")) return "Firefox";
        if (ua.includes("opera") || ua.includes("opr")) return "Opera";
        return "Unknown";
    };

    // ================= PASSWORD MODAL =================
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    // ================= TRANSACTION HISTORY DROPDOWN =================
    const [showTransactionHistory, setShowTransactionHistory] = useState(false);
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [transactionLoading, setTransactionLoading] = useState(false);

    useEffect(() => {
        try {
            const ua = navigator.userAgent;
            const os = parseOS(ua);
            const browser = parseBrowser(ua);

            logUserInfo("Trang thông tin ví - ProfitLossDetail.jsx", {
                os,
                browser,
            });
        } catch (err) {
            console.error("❌ logUserInfo error:", err);
        }
    }, []);

    /* ================= FETCH DATA ================= */
    useEffect(() => {
        const fetchProfitLossData = async () => {
            try {
                setLoading(true);
                setError("");
                setProfitLossData([]);
                setTotalProfit(0);

                // Lấy thông tin từ localStorage
                const stored = localStorage.getItem("accountInfo");
                if (!stored) {
                    // Nếu không có trong localStorage nhưng có username từ URL, yêu cầu nhập password
                    if (username) {
                        setShowPasswordModal(true);
                        setLoading(false);
                        return;
                    }
                    // Nếu không có cả hai, navigate sang trang đăng ký
                    navigate("/dang-ky-tai-khoan");
                    return;
                }

                const info = JSON.parse(stored);

                // Kiểm tra xem username từ URL có khớp với username trong localStorage không
                if (username && info.username !== username) {
                    console.warn(`Username mismatch: URL=${username}, localStorage=${info.username}`);
                    // Nếu không khớp, yêu cầu nhập password
                    setShowPasswordModal(true);
                    setLoading(false);
                    return;
                }

                setAccountInfo(info);

                // Kiểm tra password
                if (!info.password) {
                    setError("❌ Lỗi: Mật khẩu không được lưu. Vui lòng đăng nhập lại.");
                    setLoading(false);
                    return;
                }

                await performFetch(info);
            } catch (err) {
                setError("Có lỗi xảy ra khi tải dữ liệu");
                setLoading(false);
            }
        };

        fetchProfitLossData();
    }, [navigate, username, activeTab]);

    // ================= PERFORM FETCH =================
    const handleCalculateProfitLoss = async () => {
        if (!accountInfo) {
            setError("Chưa có thông tin tài khoản");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const formData = new FormData();
            formData.append("id_thongke_taikhoan", accountInfo.id_thongke_taikhoan);
            formData.append("id_taikhoan", accountInfo.id_taikhoan);
            formData.append("password", accountInfo.password);
            formData.append("loai", activeTab);   // vẫn gửi để sau này API có thể hỗ trợ

            const res = await fetch("https://api_gold.thinkdiff.us/api/vi/lai-lo", {
                method: "POST",
                body: formData
            });

            const responseData = await res.json();

            if (responseData.status === "success") {
                // ===== LỌC THEO TAB HIỆN TẠI =====
                const filteredData = (responseData.data || []).filter(item => {
                    const itemType = (item.loai || "").toUpperCase().trim();
                    return itemType === activeTab;
                });

                // ===== XỬ LÝ DỮ LIỆU =====
                const txKey = `transactions_${accountInfo.username}`;
                const localTx = JSON.parse(localStorage.getItem(txKey)) || [];

                const processedData = filteredData.map(item => {
                    const found = localTx.find(tx => tx.vi_id === (item.vi_id || item.id));

                    return {
                        vi_id: item.vi_id || item.id,
                        chung_loai: item.chung_loai || "N/A",
                        loai: item.loai || activeTab,
                        gia_mua: Number(item.gia_mua) || 0,
                        gia_hien_tai: Number(item.gia_hien_tai) || 0,
                        soluong: Number(item.soluong) || 0,
                        ngay_mua: item.ngay_mua || item.ngaymua,

                        donvi: found?.donvi || "luong",   // ✅ FIX CHÍNH Ở ĐÂY

                        lai_lo_1_don_vi: Number(item.lai_lo_1_don_vi) || 0,
                        tong_lai_lo: Number(item.tong_lai_lo) || 0,
                    };
                });

                setProfitLossData(processedData);
                setTotalProfit(Number(responseData.tong_loi_nhuan) || 0);
                setShowProfitLoss(true);
                setCurrentPage(1);

                // Debug
                console.log(`✅ Đã lọc ${activeTab}:`, processedData.length, "khoản");
                console.log("Tổng lợi nhuận từ API:", responseData.tong_loi_nhuan);
            } else {
                setError(responseData.message || "Không tính được lãi lỗ");
                setProfitLossData([]);
            }
        } catch (err) {
            console.error(err);
            setError("Lỗi kết nối khi tính lãi lỗ");
            setProfitLossData([]);
        } finally {
            setLoading(false);
        }
    };
    const performFetch = async (info) => {
        try {
            setLoading(true);

            const type = activeTab; // VANG hoặc BAC

            const url = `https://api_gold.thinkdiff.us/api/vi/${info.id_thongke_taikhoan}/${type}?password=${info.password}`;

            const response = await fetch(url);

            if (!response.ok) {
                setError(`Lỗi API: ${response.status}`);
                return;
            }

            const data = await response.json();

            if (data.status === "success" && data.data) {
                const txKey = `transactions_${info.username}`;
                const localTx = JSON.parse(localStorage.getItem(txKey)) || [];

                const normalized = data.data.map(item => {
                    const found = localTx.find(tx => tx.vi_id === item.id);

                    return {
                        vi_id: item.id,
                        chung_loai: item.id_chungloai,
                        loai: item.loai_san_pham,
                        gia_mua: item.gia_mua,
                        gia_hien_tai: 0,
                        soluong: item.soluong,
                        ngay_mua: item.ngaymua,

                        donvi: found?.donvi || "luong",   // ✅ FIX

                        lai_lo_1_don_vi: 0,
                        tong_lai_lo: 0,
                    };
                });

                setProfitLossData(normalized);
                setTotalProfit(0);
            } else {
                setError("Không có dữ liệu");
            }
        } catch (err) {
            setError("Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        setShowProfitLoss(false); // 👈 reset
    }, [activeTab]);
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);
    // ================= HANDLE PASSWORD CONFIRMATION =================
    const handlePasswordConfirm = async () => {
        if (!passwordInput.trim()) {
            setPasswordError(t("profitLoss.passwordModal.empty"));
            return;
        }

        setPasswordLoading(true);
        try {
            const formData = new FormData();
            formData.append("id_taikhoan", username);
            formData.append("password", passwordInput);

            const response = await fetch(
                "https://api_gold.thinkdiff.us/api/vi/lai-lo",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (response.ok) {
                // Lưu thông tin vào localStorage
                const accountData = {
                    email: "",
                    username: username,
                    id_taikhoan: username,
                    id_thongke_taikhoan: username,
                    password: passwordInput,
                    ip_address: "",
                };
                localStorage.setItem("accountInfo", JSON.stringify(accountData));
                setAccountInfo(accountData);

                // Đóng modal
                setShowPasswordModal(false);
                setPasswordInput("");
                setPasswordError("");

                // Fetch data
                await performFetch(accountData);
            } else {
                setPasswordError(t("profitLoss.passwordModal.wrong"));
            }
        } catch (err) {
            setPasswordError(t("profitLoss.passwordModal.error"));
        } finally {
            setPasswordLoading(false);
        }
    };
    const handleDelete = async (vi_id) => {
        if (!window.confirm("Bạn có chắc muốn xóa giao dịch này?")) return;

        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("id_thongke_taikhoan", accountInfo.id_thongke_taikhoan);
            formData.append("password", accountInfo.password);
            formData.append("vi_id", vi_id); // 👈 QUAN TRỌNG

            const res = await fetch("https://api_gold.thinkdiff.us/api/vi/xoa", {
                method: "DELETE",
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                // ✅ Xóa thành công → cập nhật UI
                const updated = profitLossData.filter(item => item.vi_id !== vi_id);
                setProfitLossData(updated);

                alert("✅ Xóa thành công");
            } else {
                alert(data.message || "❌ Xóa thất bại");
            }
        } catch (err) {
            console.error(err);
            alert("❌ Lỗi khi xóa");
        } finally {
            setLoading(false);
        }
    };

    /* ================= FETCH TRANSACTION HISTORY ================= */
    const fetchTransactionHistory = async () => {
        if (!accountInfo) return;

        setTransactionLoading(true);
        try {
            const url = `https://api_gold.thinkdiff.us/api/vi/lich_su_giao_dich/${accountInfo.id_thongke_taikhoan}?password=${accountInfo.password}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.status === "success" && data.data) {
                setTransactionHistory(Array.isArray(data.data) ? data.data : []);
                setShowTransactionHistory(true);
            } else {
                alert("Không tìm thấy lịch sử giao dịch");
                setTransactionHistory([]);
            }
        } catch (err) {
            console.error("Error fetching transaction history:", err);
            alert("Lỗi khi tải lịch sử giao dịch");
            setTransactionHistory([]);
        } finally {
            setTransactionLoading(false);
        }
    };

    /* ================= HELPER ================= */
    const formatCurrency = (value) =>
        Number(value).toLocaleString("vi-VN");

    const getStatusColor = (value) => {
        if (value > 0) return "green";
        if (value < 0) return "red";
        return "gray";
    };

    const getStatusLabel = (value) => {
        if (value > 0) return t("profitLoss.status.profit");
        if (value < 0) return t("profitLoss.status.loss");
        return t("profitLoss.status.neutral");
    };
    const convertQuantity = (soluong, fromUnit, toUnit) => {
        if (!soluong || soluong === 0) return 0;

        const num = Number(soluong);

        if (fromUnit === toUnit) return num;

        if (fromUnit === "luong" && toUnit === "kg") {
            return (num * 0.0375).toFixed(4);     // 1 lượng = 0.0375 kg
        }
        if (fromUnit === "kg" && toUnit === "luong") {
            return (num / 0.0375).toFixed(4);     // 1 kg ≈ 26.6667 lượng
        }
        return num;
    };


    /* ================= UI ================= */
    if (loading) {
        return (
            <div className="profit-loss-container">
                <div className="profit-loss-card">
                    <p style={{ textAlign: "center", padding: 30, color: "white" }}>
                        {t("profitLoss.loading")}
                    </p>
                </div>
            </div>
        );
    }


    return (
        <div className="profit-loss-container">
            <div className="profit-loss-card">
                <div className="profit-loss-header">
                    <div className="header-top">
                        <div className="header-left">
                            <button className="back-btn" onClick={() => navigate("/danh-sach-vi")}>
                                {t("profitLoss.back")}
                            </button>
                        </div>

                        <div className="header-center">
                            <h1>{t("profitLoss.title")}</h1>
                        </div>

                        <div className="header-right">  <button
                            className="action-btn"
                            onClick={() => navigate("/wallet-buy")}
                        >
                            {t("profitLoss.addWallet")}
                        </button></div>
                    </div>
                    <div className="account-info">
                        <span>👤 {accountInfo?.username}</span>
                        {/* <span>📧 {accountInfo?.email}</span> */}
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        <p>⚠️ {error}</p>
                        {error.includes("Xác thực") && (
                            <button
                                className="retry-login-btn"
                                onClick={() => navigate(`/danh-sach-vi/${username}`)}
                                style={{
                                    marginTop: "12px",
                                    padding: "10px 20px",
                                    background: "#667eea",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    transition: "all 0.3s",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = "#764ba2";
                                    e.target.style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = "#667eea";
                                    e.target.style.transform = "translateY(0)";
                                }}
                            >
                                {t("profitLoss.error.retryLogin")}
                            </button>
                        )}
                    </div>
                )}
                {/* Tổng lợi nhuận */}
                {showProfitLoss && (
                    <div className="total-profit-section">
                        <div
                            className={`total-profit-box ${totalProfit > 0
                                ? "profit"
                                : totalProfit < 0
                                    ? "loss"
                                    : "neutral"
                                }`}
                        >
                            <h3>{t("profitLoss.summary.totalProfit")}</h3>
                            <p className="total-value">
                                {formatCurrency(totalProfit)} VND
                            </p>
                            <span className="status-label">
                                {getStatusLabel(totalProfit)}
                            </span>
                        </div>

                        {/* <div className="total-profit-box invested">
                            <h3>{t("profitLoss.summary.totalInvested")}</h3>
                            <p className="total-value">
                                {formatCurrency(totalInvested)} VND
                            </p>
                        </div> */}
                    </div>
                )}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px"
                    }}
                >
                    {/* LEFT: Tabs */}
                    <div style={{ display: "flex", gap: "10px" }}>
                        <button
                            onClick={() => setActiveTab("VANG")}
                            style={{
                                padding: "10px 20px",
                                background: activeTab === "VANG" ? "#FFD700" : "#333",
                                color: activeTab === "VANG" ? "#000" : "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer"
                            }}
                        >
                            {t("profitLoss.gold")}
                        </button>

                        <button
                            onClick={() => setActiveTab("BAC")}
                            style={{
                                padding: "10px 20px",
                                background: activeTab === "BAC" ? "#FFD700" : "#333",
                                color: activeTab === "BAC" ? "#000" : "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer"
                            }}
                        >
                            {t("profitLoss.silver")}
                        </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1a1a1a", padding: "6px", borderRadius: "8px" }}>
                        <button
                            onClick={() => setDisplayUnit("luong")}
                            style={{
                                padding: "8px 16px",
                                border: "none",
                                borderRadius: "6px",
                                background: displayUnit === "luong" ? "#FFD700" : "transparent",
                                color: displayUnit === "luong" ? "#000" : "#fff",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            Lượng
                        </button>
                        <button
                            onClick={() => setDisplayUnit("kg")}
                            style={{
                                padding: "8px 16px",
                                border: "none",
                                borderRadius: "6px",
                                background: displayUnit === "kg" ? "#FFD700" : "transparent",
                                color: displayUnit === "kg" ? "#000" : "#fff",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            Kilogram (kg)
                        </button>
                    </div>
                    {/* RIGHT: Button */}
                    {/* RIGHT: Buttons */}
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>

                        {/* Nút lịch sử giao dịch */}
                        <button
                            onClick={fetchTransactionHistory}
                            disabled={transactionLoading}
                            style={{
                                padding: "10px 16px",
                                background: "#0ea5e9",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "600"
                            }}
                        >
                            {transactionLoading ? "Đang tải..." : "📜 Lịch sử GD"}
                        </button>
                        {showTransactionHistory && (
                            <div
                                className="modal-overlay"
                                onClick={() => setShowTransactionHistory(false)}
                                style={{
                                    position: "fixed",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: "rgba(0,0,0,0.7)",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    zIndex: 2000
                                }}
                            >
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        width: "90%",
                                        maxWidth: "900px",
                                        maxHeight: "80vh",
                                        background: "#020617",
                                        borderRadius: "14px",
                                        border: "2px solid #FFD700",
                                        display: "flex",
                                        flexDirection: "column",
                                        overflow: "hidden"
                                    }}
                                >
                                    {/* HEADER */}
                                    <div style={{
                                        padding: "16px 20px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        borderBottom: "1px solid #333",
                                        background: "#111827"
                                    }}>
                                        <h3 style={{ color: "#FFD700", margin: 0 }}>
                                            📜 Lịch sử giao dịch
                                        </h3>

                                        <button
                                            onClick={() => setShowTransactionHistory(false)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#FFD700",
                                                fontSize: "22px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* BODY */}
                                    <div style={{
                                        padding: "15px",
                                        overflowY: "auto",
                                        flex: 1
                                    }}>
                                        {transactionHistory.length === 0 ? (
                                            <p style={{ color: "#aaa", textAlign: "center" }}>
                                                Không có dữ liệu
                                            </p>
                                        ) : (
                                            <table className="transaction-table">
                                                <thead>
                                                    <tr>
                                                        <th>ID</th>
                                                        <th>Loại</th>
                                                        <th>Số lượng</th>
                                                        <th>Giá mua</th>
                                                        <th>Giá bán</th>
                                                        <th>Lãi/Lỗ</th>
                                                        <th>Thời gian</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {transactionHistory.map((tx, idx) => (
                                                        <tr key={idx}>
                                                            <td>{tx.vi_id}</td>
                                                            <td>{tx.loai_san_pham}</td>
                                                            <td>{tx.so_luong}</td>
                                                            <td>{formatCurrency(tx.gia_mua)} VND</td>
                                                            <td>{formatCurrency(tx.gia_ban)} VND</td>
                                                            <td style={{
                                                                color: tx.tong_lai_lo > 0 ? "#10b981" : "#ef4444",
                                                                fontWeight: "600"
                                                            }}>
                                                                {formatCurrency(tx.tong_lai_lo)} VND
                                                            </td>
                                                            <td>
                                                                {new Date(tx.thoi_gian_ban).toLocaleString("vi-VN")}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Nút tính lãi lỗ */}
                        <button
                            onClick={handleCalculateProfitLoss}
                            disabled={loading}
                            style={{
                                padding: "10px 20px",
                                background: loading ? "#666" : "#FFD700",
                                color: "#000",
                                border: "none",
                                borderRadius: "6px",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontWeight: "600"
                            }}
                        >
                            {loading ? "Đang tính..." : t("profitLoss.calculate")}
                        </button>
                    </div>
                </div>
                {/* Danh sách */}
                {paginatedData.length === 0 ? (
                    <p className="no-data">{t("profitLoss.table.empty")}</p>
                ) : (
                    <div className="profit-loss-table-wrapper">
                        <table className="profit-loss-table">
                            <thead>
                                <tr>
                                    <th>{t("profitLoss.table.shop")}</th>
                                    <th>{t("profitLoss.table.walletId")}</th>
                                    <th>{t("profitLoss.table.buyPrice")}</th>
                                    {showProfitLoss && <th>{t("profitLoss.table.currentPrice")}</th>}

                                    <th>{t("profitLoss.table.quantity")}</th>
                                    <th>Đơn vị</th>                          {/* ← THÊM DÒNG NÀY */}

                                    <th>{t("profitLoss.table.type")}</th>
                                    <th>{t("profitLoss.table.date")}</th>

                                    {showProfitLoss && <th>{t("profitLoss.table.unitProfit")}</th>}
                                    {showProfitLoss && <th>{t("profitLoss.table.totalProfit")}</th>}
                                    {showProfitLoss && <th>{t("profitLoss.table.status")}</th>}
                                    <th>{t("profitLoss.table.edit")}</th>
                                    <th>Xóa</th>
                                    <th>💰 Bán chốt lời</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((item, index) => (
                                    <tr key={index}>
                                        <td><strong>{item.chung_loai}</strong></td>
                                        <td>{item.vi_id ?? "null"}</td>
                                        <td>{formatCurrency(item.gia_mua)} VND</td>
                                        {showProfitLoss && (
                                            <td>
                                                {formatCurrency(item.gia_hien_tai)} VND
                                            </td>
                                        )}
                                        <td>
                                            <strong>
                                                {convertQuantity(item.soluong, item.donvi || "luong", displayUnit)}
                                            </strong>
                                        </td>

                                        {/* Đơn vị hiện tại */}
                                        <td>
                                            <span style={{
                                                padding: "5px 12px",
                                                borderRadius: "6px",
                                                backgroundColor: "#333",
                                                color: "#FFD700",
                                                fontWeight: "600",
                                                fontSize: "13px",
                                                display: "inline-block"
                                            }}>
                                                {displayUnit === "kg" ? "Kilogram (kg)" : "Lượng"}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={`type-badge ${activeTab.toLowerCase()}`}>
                                                {item.loai || activeTab}
                                            </span>
                                        </td>
                                        <td>
                                            {new Date(item.ngay_mua).toLocaleDateString("vi-VN")}
                                        </td>
                                        {showProfitLoss && (
                                            <td className={`${getStatusColor(item.lai_lo_1_don_vi)}-text`}>
                                                {formatCurrency(item.lai_lo_1_don_vi)} VND
                                            </td>
                                        )}

                                        {showProfitLoss && (
                                            <td className={`${getStatusColor(item.tong_lai_lo)}-text`}>
                                                <strong>
                                                    {formatCurrency(item.tong_lai_lo)} VND
                                                </strong>
                                            </td>
                                        )}
                                        {showProfitLoss && (
                                            <td>
                                                <span className={`status-badge ${getStatusColor(item.tong_lai_lo)}`}>
                                                    {getStatusLabel(item.tong_lai_lo)}
                                                </span>
                                            </td>
                                        )}
                                        <td>
                                            {item.vi_id ? (
                                                <button
                                                    className="action-btn"
                                                    onClick={() => {
                                                        navigate(
                                                            `/vi/${accountInfo?.username || username}/sua?vi_id=${item.vi_id}`,
                                                            {
                                                                state: {
                                                                    id_chungloai: item.chung_loai,
                                                                    loai_san_pham: item.loai,
                                                                    gia_mua: item.gia_mua,
                                                                    soluong: item.soluong,
                                                                    ngaymua: item.ngay_mua,
                                                                },
                                                            }
                                                        );
                                                    }}
                                                >
                                                    {t("profitLoss.table.edit")}
                                                </button>
                                            ) : (
                                                <span style={{ color: "#aaa" }}>{t("profitLoss.table.na")}</span>
                                            )}
                                        </td>
                                        <td>
                                            {item.vi_id ? (
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(item.vi_id)}
                                                >
                                                    {t("profitLoss.table.delete")}
                                                </button>
                                            ) : (
                                                <span style={{ color: "#aaa" }}>N/A</span>
                                            )}
                                        </td>
                                        <td>
                                            {item.vi_id ? (
                                                <button
                                                    className="action-btn"
                                                    onClick={() => {
                                                        navigate(
                                                            `/wallet-sell/${accountInfo?.username || username}/bcl?id=${item.vi_id}&type=${activeTab}`
                                                        );
                                                    }}
                                                    style={{
                                                        background: "#10b981",
                                                        color: "white"
                                                    }}
                                                >
                                                    💰 Bán
                                                </button>
                                            ) : (
                                                <span style={{ color: "#aaa" }}>N/A</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="pagination" style={{
                            marginTop: "20px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                            paddingBottom: "20px",
                        }}>
                            <button
                                style={paginationBtnStyle}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                onMouseEnter={(e) => {
                                    e.target.style.background = "#FFD700";
                                    e.target.style.color = "#000";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = "none";
                                    e.target.style.color = "#FFD700";
                                }}
                                disabled={currentPage === 1}
                            >
                                {t("profitLoss.pagination.prev")}
                            </button>

                            {[...Array(totalPages)].map((_, index) => {
                                const page = index + 1;
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        style={{
                                            fontWeight: currentPage === page ? "bold" : "normal",
                                            background: currentPage === page ? "#FFD700" : "#333",
                                            color: currentPage === page ? "#000" : "#fff",
                                            borderRadius: "6px",
                                            padding: "6px 10px",
                                            border: "none",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                            <button
                                style={paginationBtnStyle}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                onMouseEnter={(e) => {
                                    e.target.style.background = "#FFD700";
                                    e.target.style.color = "#000";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = "none";
                                    e.target.style.color = "#FFD700";
                                }}
                                disabled={currentPage === totalPages}
                            >
                                {t("profitLoss.pagination.next")}
                            </button>
                        </div>

                    </div>
                )}
            </div>

            {
                showPasswordModal && (
                    <div className="modal-overlay" style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0, 0, 0, 0.6)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                    }} onClick={() => setShowPasswordModal(false)}>
                        <div className="modal-content" style={{
                            background: "#FFD700",
                            borderRadius: "12px",
                            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                            maxWidth: "400px",
                            width: "90%",
                            overflow: "hidden",
                        }} onClick={(e) => e.stopPropagation()}>
                            <div style={{
                                background: "#FFD700",
                                color: "white",
                                padding: "20px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}>
                                <h3 style={{ margin: 0, fontSize: "18px", color: "#333", fontWeight: "600" }}>{t("profitLoss.passwordModal.title")}</h3>
                                <button
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#333",
                                        fontSize: "24px",
                                        cursor: "pointer",
                                        padding: 0,
                                        textAlign: "right",
                                    }}
                                    onClick={() => setShowPasswordModal(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div style={{
                                padding: "30px",
                                background: "#1a1a1a",
                            }}>
                                <p style={{
                                    margin: "0 0 20px 0",
                                    color: "#FFD700",
                                    fontSize: "14px",
                                }}>
                                    {t("profitLoss.account")}: <strong>{username}</strong>
                                </p>

                                <input
                                    type="password"
                                    style={{
                                        width: "100%",
                                        padding: "12px 15px",
                                        border: "2px solid #FFD700",
                                        borderRadius: "8px",
                                        fontSize: "16px",
                                        boxSizing: "border-box",
                                        marginBottom: "10px",
                                        background: "#2a2a2a",
                                        color: "#FFD700",
                                    }}
                                    placeholder={t("profitLoss.passwordModal.placeholder")}
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            handlePasswordConfirm();
                                        }
                                    }}
                                    disabled={passwordLoading}
                                    autoFocus
                                />
                                {passwordError && (
                                    <p style={{
                                        color: "#ff6b6b",
                                        fontSize: "13px",
                                        margin: "0",
                                        textAlign: "center",
                                        marginBottom: "10px",
                                    }}>
                                        {passwordError}
                                    </p>
                                )}
                            </div>

                            <div style={{
                                padding: "20px",
                                display: "flex",
                                gap: "10px",
                                background: "#FFD700",
                            }}>
                                <button
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        background: "#ffffff",
                                        color: "#333",
                                        transition: "all 0.3s",
                                    }}
                                    onClick={() => setShowPasswordModal(false)}
                                    disabled={passwordLoading}
                                >
                                    {t("profitLoss.passwordModal.cancel")}
                                </button>
                                <button
                                    style={{
                                        flex: 1,
                                        padding: "12px",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        background: "#333",
                                        color: "#FFD700",
                                        transition: "all 0.3s",
                                        opacity: passwordLoading ? 0.6 : 1,
                                    }}
                                    onClick={handlePasswordConfirm}
                                    disabled={passwordLoading}
                                >
                                    {passwordLoading ? "⏳ Đang xử lý..." : "✓ Xác nhận"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ProfitLossDetail;
